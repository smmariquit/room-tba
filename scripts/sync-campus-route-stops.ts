/**
 * Mirror the campus routes' stops in `src/constants/jeepney-routes.ts` into
 * `jeepney_stops`, which is what `/api/transit` actually serves. The constants
 * are the maintained source for campus-internal routes (see
 * seed-transit-routes.ts for the scope split), so after editing them run this
 * to push the change to a database, then regenerate geometry:
 *
 *   bun run scripts/sync-campus-route-stops.ts --dry-run
 *   DATABASE_URL=... bun run scripts/sync-campus-route-stops.ts
 *   DATABASE_URL=... bun run scripts/generate-transit-geometry.ts
 *
 * Per route: rows are matched by sort_order; changed rows are updated with a
 * version bump, missing rows appended, surplus rows deactivated (never
 * deleted, so editor history keeps valid stop ids). The jeepney_routes sync
 * key is refreshed so clients drop their local cache.
 */

import { randomUUID } from "node:crypto";
import pg from "pg";
import { JEEPNEY_ROUTES } from "../src/constants/jeepney-routes";
import { loadEnv } from "./load-env";

loadEnv();

const DRY_RUN = process.argv.includes("--dry-run");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  await client.query("BEGIN");
  for (const route of JEEPNEY_ROUTES) {
    const { rows: existing } = await client.query<{
      id: number;
      name: string;
      description: string;
      lat: number;
      lon: number;
      sort_order: number;
    }>(
      `SELECT id, name, description, lat, lon, sort_order FROM jeepney_stops
       WHERE route_id = $1 AND is_active ORDER BY sort_order`,
      [route.id],
    );
    const { rows: routeMeta } = await client.query<{
      name: string;
      description: string;
      direction_note: string | null;
      color: string;
    }>(
      `SELECT name, description, direction_note, color FROM jeepney_routes
       WHERE id = $1 AND is_active`,
      [route.id],
    );
    const meta = routeMeta[0];
    if (
      meta &&
      (meta.name !== route.name ||
        meta.description !== route.description ||
        meta.direction_note !== (route.directionNote ?? null) ||
        meta.color !== route.color)
    ) {
      console.log(`meta  ${route.id}: updating route fields`);
      if (!DRY_RUN) {
        await client.query(
          `UPDATE jeepney_routes
           SET name = $2, description = $3, direction_note = $4, color = $5,
               version = version + 1, updated_at = now()
           WHERE id = $1`,
          [
            route.id,
            route.name,
            route.description,
            route.directionNote ?? null,
            route.color,
          ],
        );
      }
    }

    if (existing.length === 0) {
      const { rows: routeRows } = await client.query(
        "SELECT 1 FROM jeepney_routes WHERE id = $1",
        [route.id],
      );
      if (routeRows.length === 0) {
        console.log(
          `new   ${route.id}: inserting route + ${route.stops.length} stops`,
        );
        if (!DRY_RUN) {
          await client.query(
            `INSERT INTO jeepney_routes
               (id, name, description, direction_note, color, fare_regular, fare_discounted)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              route.id,
              route.name,
              route.description,
              route.directionNote ?? null,
              route.color,
              route.fare.regular,
              route.fare.discounted,
            ],
          );
          for (const [i, stop] of route.stops.entries()) {
            await client.query(
              `INSERT INTO jeepney_stops
                 (route_id, name, description, lat, lon, sort_order, is_active, version, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, true, 1, now())`,
              [
                route.id,
                stop.name,
                stop.description,
                stop.lat,
                stop.lon,
                i + 1,
              ],
            );
          }
        }
      } else {
        console.log(`skip  ${route.id}: route exists but has no active stops`);
      }
      continue;
    }

    for (const [i, stop] of route.stops.entries()) {
      const row = existing[i];
      if (!row) {
        console.log(`add   ${route.id} #${i + 1} ${stop.name}`);
        if (!DRY_RUN) {
          await client.query(
            `INSERT INTO jeepney_stops
               (route_id, name, description, lat, lon, sort_order, is_active, version, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, true, 1, now())`,
            [route.id, stop.name, stop.description, stop.lat, stop.lon, i + 1],
          );
        }
        continue;
      }
      // Postgres serializes double precision to fewer digits than the
      // constants carry; anything under ~1e-9 degrees (sub-millimeter) is the
      // same coordinate, not an edit.
      const EPS = 1e-9;
      const changed =
        row.name !== stop.name ||
        row.description !== stop.description ||
        Math.abs(Number(row.lat) - stop.lat) > EPS ||
        Math.abs(Number(row.lon) - stop.lon) > EPS;
      if (!changed) continue;
      console.log(`edit  ${route.id} #${i + 1} ${row.name} -> ${stop.name}`);
      if (!DRY_RUN) {
        await client.query(
          `UPDATE jeepney_stops
           SET name = $2, description = $3, lat = $4, lon = $5,
               version = version + 1, updated_at = now()
           WHERE id = $1`,
          [row.id, stop.name, stop.description, stop.lat, stop.lon],
        );
      }
    }

    for (const row of existing.slice(route.stops.length)) {
      console.log(`drop  ${route.id} #${row.sort_order} ${row.name}`);
      if (!DRY_RUN) {
        await client.query(
          `UPDATE jeepney_stops
           SET is_active = false, version = version + 1, updated_at = now()
           WHERE id = $1`,
          [row.id],
        );
      }
    }
  }

  if (DRY_RUN) {
    await client.query("ROLLBACK");
    console.log("dry run: rolled back");
  } else {
    await client.query(
      `UPDATE "update" SET sync_key = $1 WHERE table_name = 'jeepney_routes'`,
      [randomUUID()],
    );
    await client.query("COMMIT");
    console.log("committed and refreshed jeepney_routes sync key");
  }
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}
