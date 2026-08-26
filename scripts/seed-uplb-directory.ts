/**
 * Seed UPLB organizations/offices/spots from data/uplb-directory.json into the
 * `organizations` and `places` tables. Entries were researched from
 * public university directories and OpenStreetMap (source URL per row).
 *
 * Idempotent: rows whose normalized name already exists in the target table
 * (or as a dorm/college/building for org-like entries) are skipped.
 *
 * Audit trail: every insert writes an `editor_history` create row (actor
 * "admin") in the same transaction, per docs/bulk-data-history.md. The run is
 * atomic — a failure leaves nothing half-seeded. Sync keys for touched tables
 * are bumped so clients re-fetch.
 *
 * Reversibility: `--revert` deletes exactly the rows this operation created
 * (matched through their `[bulk:seed-uplb-directory]` history entries) and
 * records compensating delete history under `unseed-uplb-directory`. It never
 * touches rows created outside this operation.
 *
 * Usage:
 *   DATABASE_URL=... bun run scripts/seed-uplb-directory.ts [--dry-run]
 *   DATABASE_URL=... bun run scripts/seed-uplb-directory.ts --revert [--dry-run]
 */

import { config } from "dotenv";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { TransactionRollbackError } from "drizzle-orm";
import { eq, like, and } from "drizzle-orm";
import {
  buildingsTable,
  collegesTable,
  dormsTable,
  editorHistoryTable,
  organizationsTable,
  placesTable,
} from "@drizzle/schema";
import { normalizeAlias } from "../src/lib/site";
import {
  recordBulkHistory,
  type BulkOperation,
} from "../src/lib/services/bulk-history";
import entries from "../data/uplb-directory.json";

config({ path: ".env" });

const dryRun = process.argv.includes("--dry-run");
const revert = process.argv.includes("--revert");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool);

type Entry = {
  name: string;
  type: string;
  building_or_area: string;
  description: string;
  lat: number | null;
  lng: number | null;
  source: string;
};

/** The per-request tx type drizzle hands the transaction callback. */
type Tx = Parameters<Parameters<NodePgDatabase["transaction"]>[0]>[0];

const OP_KEY = "seed-uplb-directory";
const REVERT_OP_KEY = "unseed-uplb-directory";
/** Actor for the audit rows, matching app-created editor writes. */
const ACTOR = "admin";

const ORG_TYPES = new Set([
  "office",
  "unit",
  "academic",
  "student-org",
  "college-org",
]);
const PLACE_TYPES = new Set(["food", "tourist-spot", "landmark", "transport"]);

/** Official pages are real websites; OSM element URLs are provenance only. */
function websiteLink(source: string): string | null {
  try {
    const host = new URL(source).hostname;
    const provenanceOnly = ["openstreetmap.org", "facebook.com"].some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );
    return provenanceOnly ? null : source;
  } catch {
    return null;
  }
}

/** Bump the client-visible sync keys so browsers re-fetch the tables. */
async function refreshSyncKeys(tx: Tx, tableNames: string[]): Promise<void> {
  if (tableNames.length === 0) return;
  await tx.execute(
    `UPDATE "update" SET sync_key = '${randomUUID()}' WHERE table_name IN (${tableNames.map((t) => `'${t}'`).join(",")})`,
  );
}

if (revert) {
  await db
    .transaction(async (tx) => {
      // Everything this operation ever created, per its audit entries.
      const seeded = await tx
        .select({
          entityType: editorHistoryTable.entityType,
          entityId: editorHistoryTable.entityId,
        })
        .from(editorHistoryTable)
        .where(
          and(
            like(editorHistoryTable.summary, `[bulk:${OP_KEY}]%`),
            eq(editorHistoryTable.action, "create"),
          ),
        );

      let deleted = 0;
      const undoOps: BulkOperation[] = [];
      const touchedTables = new Set<string>();

      for (const { entityType, entityId } of seeded) {
        const table =
          entityType === "organization"
            ? organizationsTable
            : entityType === "place"
              ? placesTable
              : null;
        if (!table) continue;

        const [existing] = await tx
          .select()
          .from(table)
          .where(eq(table.id, entityId));
        if (!existing) continue; // already gone (e.g. deleted via the app)

        await tx.delete(table).where(eq(table.id, entityId));
        touchedTables.add(
          entityType === "organization" ? "organizations" : "places",
        );
        undoOps.push({
          opKey: REVERT_OP_KEY,
          entityType,
          entityId,
          action: "delete",
          before: existing,
          reason: `reverse ${OP_KEY} create`,
          ...(entityType === "organization"
            ? {
                versionBefore: (existing as { version: number }).version,
                versionAfter: null,
              }
            : {}),
        });
        deleted++;
      }

      const result = await recordBulkHistory(tx as NodePgDatabase, undoOps, {
        actor: ACTOR,
        dryRun,
      });
      if (!dryRun) await refreshSyncKeys(tx, [...touchedTables]);

      console.log(
        `${dryRun ? "[dry-run]" : "[reverted]"} deletions: ${deleted}, compensating history: ${undoOps.length} (written ${result.written}, dup-skipped ${result.skipped}), sync keys${dryRun ? " would be" : ""} bumped: ${[...touchedTables].join(", ") || "none"}.`,
      );
      if (dryRun) throw new TransactionRollbackError();
    })
    .catch((e) => {
      if (!(e instanceof TransactionRollbackError)) throw e;
    });
} else {
  await db
    .transaction(async (tx) => {
      // Sequential awaits: one tx client must not run concurrent queries.
      const orgs = await tx
        .select({ name: organizationsTable.name })
        .from(organizationsTable);
      const places = await tx
        .select({ name: placesTable.name })
        .from(placesTable);
      const dorms = await tx
        .select({ name: dormsTable.dormName })
        .from(dormsTable);
      const colleges = await tx
        .select({ name: collegesTable.collegeName })
        .from(collegesTable);
      const buildings = await tx
        .select({ name: buildingsTable.buildingName })
        .from(buildingsTable);

      const norm = (rows: { name: string }[]) =>
        new Set(rows.map((r) => normalizeAlias(r.name)).filter(Boolean));
      const orgNames = norm(orgs);
      const placeNames = norm(places);
      // Colleges, dorms, and buildings already have their own pins — an org/place
      // row with the same name would double-pin the map.
      const otherEntityNames = new Set([
        ...norm(dorms),
        ...norm(colleges),
        ...norm(buildings),
      ]);

      /** "College of Arts and Sciences (CAS)" also matches without the acronym. */
      function nameKeys(name: string): string[] {
        const keys = [normalizeAlias(name)];
        const bare = name.replace(/\s*\([^)]*\)\s*$/, "");
        if (bare !== name) keys.push(normalizeAlias(bare));
        return keys.filter(Boolean);
      }

      let inserted = 0;
      let skipped = 0;
      const ops: BulkOperation[] = [];
      const touchedTables = new Set<string>();

      for (const entry of entries as Entry[]) {
        const keys = nameKeys(entry.name);
        // Residence halls live in the dorms table; UPOU is not a UPLB campus POI.
        const isDormRow = /residence hall/i.test(entry.name);
        const isOrg =
          ORG_TYPES.has(entry.type) ||
          (entry.type === "service" &&
            !isDormRow &&
            !/church|chapel/i.test(entry.name));
        const isPlace =
          PLACE_TYPES.has(entry.type) ||
          (entry.type === "service" && /church|chapel/i.test(entry.name));

        if (isDormRow || (!isOrg && !isPlace)) {
          skipped++;
          continue;
        }

        const existingNames = isOrg ? orgNames : placeNames;
        const collides =
          keys.some((k) => existingNames.has(k)) ||
          keys.some((k) => otherEntityNames.has(k));
        if (collides) {
          skipped++;
          continue;
        }

        const description = `${entry.description} Located at: ${entry.building_or_area}.`;
        const category = isOrg
          ? ORG_TYPES.has(entry.type)
            ? entry.type
            : "service"
          : PLACE_TYPES.has(entry.type)
            ? entry.type
            : "service";

        const values = {
          name: entry.name,
          category,
          lat: entry.lat,
          lon: entry.lng,
          description,
          websiteLink: websiteLink(entry.source),
        };

        if (isOrg) {
          const [row] = await tx
            .insert(organizationsTable)
            .values(values)
            .returning();
          ops.push({
            opKey: OP_KEY,
            entityType: "organization",
            entityId: row.id,
            action: "create",
            after: row,
            reason: `seed "${entry.name}" from uplb-directory.json (${entry.source})`,
            versionBefore: null,
            versionAfter: row.version,
          });
          orgNames.add(normalizeAlias(entry.name));
          touchedTables.add("organizations");
        } else {
          const [row] = await tx.insert(placesTable).values(values).returning();
          ops.push({
            opKey: OP_KEY,
            entityType: "place",
            entityId: row.id,
            action: "create",
            after: row,
            reason: `seed "${entry.name}" from uplb-directory.json (${entry.source})`,
          });
          placeNames.add(normalizeAlias(entry.name));
          touchedTables.add("places");
        }
        inserted++;
      }

      const result = await recordBulkHistory(tx as NodePgDatabase, ops, {
        actor: ACTOR,
        dryRun,
      });
      if (!dryRun) await refreshSyncKeys(tx, [...touchedTables]);

      console.log(
        `${dryRun ? "[dry-run]" : "[seeded]"} inserts: ${inserted}, skipped: ${skipped} (already present / covered by dorms, colleges, or buildings), history rows: ${ops.length} (written ${result.written}${dryRun ? " when live" : ""}, dup-skipped ${result.skipped}), sync keys${dryRun ? " would be" : ""} bumped: ${[...touchedTables].join(", ") || "none"}.`,
      );
      if (ops.length > 0) {
        console.log(
          `Inserted IDs: ${ops.map((o) => `${o.entityType}#${o.entityId}`).join(", ")}`,
        );
      }
      if (dryRun) throw new TransactionRollbackError();
    })
    .catch((e) => {
      if (!(e instanceof TransactionRollbackError)) throw e;
    });
}

await pool.end();
