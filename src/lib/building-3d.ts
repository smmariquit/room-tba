import type { LngLat, OsmBuildingFootprint } from "./overpass";

export type LocalPolygon = {
  /** Polygon vertices in local meters (x = east, y = north), centered at origin. */
  points: { x: number; y: number }[];
  /** Width along x (east-west), meters. */
  widthMeters: number;
  /** Depth along y (north-south), meters. */
  depthMeters: number;
};

export type RoomPlacement = {
  code: string;
  /** 1-indexed floor (1 = ground). */
  floor: number;
  /** Local meters, relative to building centroid. */
  x: number;
  y: number;
};

const METERS_PER_DEGREE_LAT = 111_320;

/**
 * Project an OSM polygon (lng, lat) into local meters centered at the polygon's
 * centroid. Uses an equirectangular projection scaled to `cos(centroidLat)` for
 * the longitude direction, which is plenty accurate at building scale.
 */
export function footprintToLocalPolygon(
  footprint: OsmBuildingFootprint,
): LocalPolygon {
  const ring = footprint.outline;
  let cx = 0;
  let cy = 0;
  for (const [lon, lat] of ring) {
    cx += lon;
    cy += lat;
  }
  cx /= ring.length;
  cy /= ring.length;

  const lonScale = Math.cos((cy * Math.PI) / 180) * METERS_PER_DEGREE_LAT;
  const latScale = METERS_PER_DEGREE_LAT;

  const points: { x: number; y: number }[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < ring.length; i++) {
    const cur = ring[i] as LngLat;
    const next = ring[(i + 1) % ring.length] as LngLat;
    if (i === ring.length - 1 && cur[0] === ring[0]?.[0] && cur[1] === ring[0]?.[1]) {
      continue;
    }
    const x = (cur[0] - cx) * lonScale;
    const y = (cur[1] - cy) * latScale;
    points.push({ x, y });
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (next === cur) break;
  }

  return {
    points,
    widthMeters: maxX - minX,
    depthMeters: maxY - minY,
  };
}

function pointInPolygonLocal(
  point: { x: number; y: number },
  ring: { x: number; y: number }[],
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (!a || !b) continue;
    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x <
        ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y + 1e-12) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Mulberry32 — small deterministic PRNG seeded by string hash. */
function seededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Heuristic floor extraction from common UPLB room codes:
 * looks for the first multi-digit number; the leading digit is used as floor.
 * Examples:
 *   "PSCI 305" -> 3
 *   "Math 101" -> 1
 *   "Lab"      -> null
 */
function inferFloorFromCode(code: string): number | null {
  const match = code.match(/(\d{2,4})/);
  if (!match) return null;
  const head = match[1]?.[0];
  if (!head) return null;
  const f = parseInt(head, 10);
  if (!Number.isFinite(f) || f <= 0 || f > 12) return null;
  return f;
}

/**
 * Distribute room codes across floors and place each one at a stable mock
 * position inside the polygon. Positions are seeded by the room code so they
 * don't jump around between renders.
 */
export function placeRooms(
  codes: string[],
  polygon: LocalPolygon,
  floorCount: number,
): RoomPlacement[] {
  if (codes.length === 0 || polygon.points.length === 0) return [];

  const floors = Math.max(1, Math.floor(floorCount));
  const inferred: { code: string; floor: number | null }[] = codes.map(
    (code) => ({
      code,
      floor: inferFloorFromCode(code),
    }),
  );

  // Buckets per floor (1..floors). Codes whose inferred floor exceeds the known
  // floor count are clamped down. Codes without an inferred floor get
  // round-robined across floors so they're not all on floor 1.
  const buckets: string[][] = Array.from({ length: floors }, () => []);
  let rrIndex = 0;
  for (const item of inferred) {
    let floor: number;
    if (item.floor !== null) {
      floor = Math.min(item.floor, floors);
    } else {
      floor = (rrIndex % floors) + 1;
      rrIndex++;
    }
    const bucket = buckets[floor - 1];
    if (bucket) bucket.push(item.code);
  }

  // Compute polygon bounding box for sampling.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of polygon.points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const placements: RoomPlacement[] = [];

  for (let f = 1; f <= floors; f++) {
    const codesOnFloor = buckets[f - 1] ?? [];
    if (codesOnFloor.length === 0) continue;

    for (const code of codesOnFloor) {
      const rng = seededRng(`${code}|${f}`);
      let placed: { x: number; y: number } | null = null;
      // Try up to 20 samples to land inside the polygon.
      for (let attempt = 0; attempt < 20; attempt++) {
        const sx = minX + rng() * spanX;
        const sy = minY + rng() * spanY;
        if (pointInPolygonLocal({ x: sx, y: sy }, polygon.points)) {
          placed = { x: sx, y: sy };
          break;
        }
      }
      // Fallback to centroid if sampling failed.
      if (!placed) {
        const cx = polygon.points.reduce((s, p) => s + p.x, 0) /
          polygon.points.length;
        const cy = polygon.points.reduce((s, p) => s + p.y, 0) /
          polygon.points.length;
        placed = { x: cx, y: cy };
      }
      placements.push({ code, floor: f, x: placed.x, y: placed.y });
    }
  }

  return placements;
}

/** Decide a floor count if OSM didn't tell us. */
export function defaultFloorCount(
  footprint: OsmBuildingFootprint,
  inferredMax: number | null,
): number {
  if (footprint.levels && footprint.levels > 0) return footprint.levels;
  if (footprint.heightMeters) {
    return Math.max(1, Math.round(footprint.heightMeters / 3.5));
  }
  if (inferredMax && inferredMax > 0) return inferredMax;
  return 3;
}

/** Highest floor implied by the room codes (or null if none look numeric). */
export function maxInferredFloor(codes: string[]): number | null {
  let max: number | null = null;
  for (const code of codes) {
    const f = inferFloorFromCode(code);
    if (f === null) continue;
    if (max === null || f > max) max = f;
  }
  return max;
}
