import type { APIRoute } from "astro";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../lib/db";
import {
  buildingsTable,
  roomPositionsTable,
  roomsTable,
} from "../../../drizzle/schema";
import { isAdmin } from "../../lib/auth";

export const prerender = false;

type PositionDTO = {
  roomCode: string;
  floor: number;
  x: number;
  y: number;
};

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function jsonOk<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const GET: APIRoute = async ({ url }) => {
  const buildingName = url.searchParams.get("building");
  if (!buildingName) {
    return jsonError(400, "Missing required ?building= query param");
  }

  const rows = await db
    .select({
      roomCode: roomsTable.room_code,
      floor: roomPositionsTable.floor,
      x: roomPositionsTable.x,
      y: roomPositionsTable.y,
    })
    .from(roomPositionsTable)
    .innerJoin(roomsTable, eq(roomsTable.id, roomPositionsTable.room_id))
    .innerJoin(buildingsTable, eq(buildingsTable.id, roomsTable.building_id))
    .where(eq(buildingsTable.building_name, buildingName));

  return jsonOk({ positions: rows satisfies PositionDTO[] });
};

export const PUT: APIRoute = async ({ request, cookies, url }) => {
  if (!isAdmin(cookies)) return jsonError(401, "Not authorized");

  const buildingName = url.searchParams.get("building");
  if (!buildingName) {
    return jsonError(400, "Missing required ?building= query param");
  }

  let body: { positions?: PositionDTO[] };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const positions = Array.isArray(body.positions) ? body.positions : null;
  if (!positions) {
    return jsonError(400, "Body must be { positions: [...] }");
  }

  for (const p of positions) {
    if (
      typeof p.roomCode !== "string" ||
      typeof p.floor !== "number" ||
      typeof p.x !== "number" ||
      typeof p.y !== "number" ||
      !Number.isFinite(p.floor) ||
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y)
    ) {
      return jsonError(400, "Each position needs { roomCode, floor, x, y }");
    }
  }

  if (positions.length === 0) {
    return jsonOk({ saved: 0 });
  }

  // Resolve room codes -> ids, scoped to the building. This prevents an editor
  // from accidentally (or maliciously) writing positions for a room in a
  // different building by reusing a code.
  const codes = positions.map((p) => p.roomCode);
  const roomRows = await db
    .select({ id: roomsTable.id, code: roomsTable.room_code })
    .from(roomsTable)
    .innerJoin(buildingsTable, eq(buildingsTable.id, roomsTable.building_id))
    .where(eq(buildingsTable.building_name, buildingName));

  const codeToId = new Map<string, number>();
  for (const r of roomRows) codeToId.set(r.code, r.id);

  const now = Math.floor(Date.now() / 1000);
  const rows = positions
    .map((p) => {
      const id = codeToId.get(p.roomCode);
      if (id === undefined) return null;
      return {
        room_id: id,
        floor: Math.max(1, Math.floor(p.floor)),
        x: p.x,
        y: p.y,
        updated_at: now,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) {
    return jsonOk({ saved: 0, skipped: positions.length });
  }

  // SQLite upsert via Drizzle. better-sqlite3 transactions are synchronous —
  // the callback must not return a Promise — so we use .run() per statement.
  db.transaction((tx) => {
    for (const row of rows) {
      tx.insert(roomPositionsTable)
        .values(row)
        .onConflictDoUpdate({
          target: roomPositionsTable.room_id,
          set: {
            floor: row.floor,
            x: row.x,
            y: row.y,
            updated_at: row.updated_at,
          },
        })
        .run();
    }
  });

  return jsonOk({ saved: rows.length, skipped: positions.length - rows.length });
};

export const DELETE: APIRoute = async ({ cookies, url }) => {
  if (!isAdmin(cookies)) return jsonError(401, "Not authorized");

  const buildingName = url.searchParams.get("building");
  const roomCode = url.searchParams.get("room");
  if (!buildingName || !roomCode) {
    return jsonError(400, "Missing ?building= and/or ?room= query params");
  }

  const rooms = await db
    .select({ id: roomsTable.id })
    .from(roomsTable)
    .innerJoin(buildingsTable, eq(buildingsTable.id, roomsTable.building_id))
    .where(eq(buildingsTable.building_name, buildingName));

  const roomIds = rooms.map((r) => r.id);
  if (roomIds.length === 0) return jsonOk({ deleted: 0 });

  // Single-room delete in this building.
  const targets = await db
    .select({ id: roomsTable.id })
    .from(roomsTable)
    .where(eq(roomsTable.room_code, roomCode));
  const targetIds = targets
    .map((t) => t.id)
    .filter((id) => roomIds.includes(id));

  if (targetIds.length === 0) return jsonOk({ deleted: 0 });

  await db
    .delete(roomPositionsTable)
    .where(inArray(roomPositionsTable.room_id, targetIds));

  return jsonOk({ deleted: targetIds.length });
};
