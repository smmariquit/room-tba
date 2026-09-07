/**
 * Regenerate road-following geometry for the transit routes in
 * `src/constants/jeepney-geometries.json`.
 *
 * Two sources, in fidelity order:
 *
 * 1. `osm-relation` — an OSM `type=route` relation that IS this service. Its
 *    member ways are the path the vehicle actually takes, so it beats routing.
 *    The relation ids below were matched by hand (name, operator, direction,
 *    endpoints) and each is re-verified on every run: the script refuses a
 *    relation whose stitched line does not start/end near this route's
 *    terminals.
 * 2. `routed` — OSRM car routing over the OSM network between consecutive
 *    stops. Follows real roads but cannot know the service pattern, so it is a
 *    *plausible* path, not a sourced one. Surfaced as such in the UI.
 *
 * Routes with neither stay out of the file entirely and the map falls back to a
 * dashed stops-only line rather than a confident wrong path.
 *
 * Upstream is other people's infrastructure: responses are cached under
 * `data/transit-geometry-cache/` (gitignored) and requests are serialised with
 * a delay, so a re-run costs nothing. Delete the cache dir to refetch.
 *
 * Usage:
 *   DATABASE_URL=... bun run scripts/generate-transit-geometry.ts
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import pg from "pg";
import { loadEnv } from "./load-env";

loadEnv();

const OUT_FILE = "src/constants/jeepney-geometries.json";
const CACHE_DIR = "data/transit-geometry-cache";
const USER_AGENT =
  "room-tba-transit-geometry/1.0 (https://github.com/uplbtools/room-tba)";
const OVERPASS = "https://overpass-api.de/api/interpreter";
const OSRM = "https://routing.openstreetmap.de/routed-car/route/v1/driving";
/** Coordinate precision: 5 dp ≈ 1.1 m, plenty for a route line. */
const PRECISION = 5;
/** A relation is rejected if either terminal is further than this from it. */
const TERMINAL_TOLERANCE_M = 1500;
/** Max deviation allowed when thinning the line; narrower than one lane. */
const SIMPLIFY_TOLERANCE_M = 3;

/**
 * OSM maps the DLTB campus shuttle down SLEX/C-5/Katipunan, while the
 * university's own announcements describe Skyway and Quezon Ave. Both are
 * plausible and we cannot settle it, so the line ships as mapped and the
 * disagreement is disclosed rather than silently resolved.
 */
const DLTB_CAVEAT =
  "OSM maps this bus via SLEX, C-5 and Katipunan; UPLB's announcements describe a Skyway and Quezon Ave. routing. The drawn line follows the OSM version, so the Metro Manila stretch may differ.";

/**
 * These relations are the full Calamba-origin corridor; our route is the Los
 * Baños tail of it, so the shape is sourced but the service boundary is ours.
 */
const TRIMMED_CORRIDOR_CAVEAT =
  "Traced from the mapped Calamba-origin jeepney corridor and cut at this route's own end points, so the ends are approximate.";

type Pt = [number, number]; // [lon, lat]
type Stop = { name: string; lat: number; lon: number };
type OverpassMember = {
  type: string;
  role?: string;
  geometry?: { lat: number; lon: number }[];
};

type Plan =
  /** Keep whatever is already in the JSON (verified good, do not refetch). */
  | { kind: "keep"; note: string; caveat?: string }
  /** Trace an OSM route relation; `trim` clips a longer corridor to our stops. */
  | {
      kind: "osm-relation";
      relation: number;
      /** Clip a longer corridor down to the segment between our terminals. */
      trim: boolean;
      /** Only the opposite direction is mapped; flip it and say so. */
      reverse?: boolean;
      note: string;
      /** Shown to riders when a sourced line is still not the whole truth. */
      caveat?: string;
    }
  /** Road-route between consecutive stops. */
  | { kind: "routed"; note: string; caveat?: string };

const PLANS: Record<string, Plan> = {
  // Campus loops: already road-snapped by the original OSRM pass over every
  // stop, and rendering correctly. OSM does have campus relations (337589
  // Kaliwa / 337590 Kanan) but they stop at the campus boundary, so adopting
  // them would drop the Olivarez Plaza / Robinsons town leg these jeeps run —
  // a regression on the one route that already worked. Left alone deliberately.
  "kaliwa-kanan": {
    kind: "keep",
    note: "OSRM car routing over all 20 stops. OSM relations 337589/337590 map only the in-campus segment, so they were not adopted.",
  },
  forestry: {
    kind: "routed",
    note: "OSRM car routing over the 14 stops through CPAf, Makiling Botanic Gardens, CFNR, and the residence halls. OSM relations 1954831/1954832 are tagged disused: with 2020 data and predate the residence-hall extension.",
  },

  "up-rural": {
    kind: "routed",
    note: "OSRM car routing over the 10 stops out Pili Drive to Jubileeville, Bay. No OSM relation found for this service.",
  },

  // DLTB commuter bus, mapped end to end in OSM under the operator's own name.
  "uplb-to-upd": {
    kind: "osm-relation",
    relation: 17932247,
    trim: false,
    note: "OSM route relation 17932247 — Del Monte Land Transport (DLTB) UP Los Baños → UP Diliman.",
    caveat: DLTB_CAVEAT,
  },
  "upd-to-uplb": {
    kind: "osm-relation",
    relation: 17932246,
    trim: false,
    note: "OSM route relation 17932246 — Del Monte Land Transport (DLTB) UP Diliman → UP Los Baños.",
    caveat: DLTB_CAVEAT,
  },

  // The Los Baños legs of two LTFRB-registered PUJ corridors that begin in
  // Calamba and run through Los Baños; trimmed to start at our first stop.
  "lb-to-sta-cruz": {
    kind: "osm-relation",
    relation: 2582682,
    trim: true,
    note: "OSM route relation 2582682 — PUJ Calamba → Santa Cruz, trimmed to the Los Baños leg.",
    caveat: TRIMMED_CORRIDOR_CAVEAT,
  },
  "lb-to-san-pablo": {
    kind: "osm-relation",
    relation: 1856207,
    trim: true,
    note: "OSM route relation 1856207 — PUJ Calamba → San Pablo, trimmed to the Los Baños leg.",
    caveat: TRIMMED_CORRIDOR_CAVEAT,
  },

  // Only the Calamba → Los Baños direction is mapped (1856209); the return
  // relation 1856216 is tagged disused. Flipping the mapped corridor beats
  // routing a car through it, but the flip is disclosed to riders.
  "lb-to-calamba": {
    kind: "osm-relation",
    relation: 1856209,
    trim: true,
    reverse: true,
    note: "OSM route relation 1856209 — PUJ Calamba → UP Los Baños, reversed (the return relation 1856216 is tagged disused).",
    caveat:
      "Only the opposite direction of this jeepney is mapped, so the line is the return trip drawn backwards. One-way streets near the terminals may differ in practice.",
  },
  // No OSM relation covers the Los Baños ↔ Buendia provincial buses in either
  // direction, so these are the only fully inferred lines in the file.
  "lb-to-buendia": {
    kind: "routed",
    note: "OSRM car routing between stops; no OSM route relation covers this service.",
  },
  "buendia-to-lb": {
    kind: "routed",
    note: "OSRM car routing between stops; no OSM route relation covers this service.",
  },
};

function haversine(a: Pt, b: Pt) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function nearestIndex(line: Pt[], target: Pt) {
  let best = Infinity;
  let index = 0;
  line.forEach((p, i) => {
    const d = haversine(p, target);
    if (d < best) {
      best = d;
      index = i;
    }
  });
  return { index, distance: best };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch once, then serve from disk. Keeps re-runs off other people's servers. */
async function cachedFetch(key: string, run: () => Promise<string>) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const path = `${CACHE_DIR}/${key}.json`;
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  await sleep(1500);
  const body = await run();
  const parsed = JSON.parse(body);
  writeFileSync(path, body);
  return parsed;
}

async function fetchRelation(id: number) {
  return cachedFetch(`relation-${id}`, async () => {
    const query = `[out:json][timeout:180];relation(id:${id});out body geom;`;
    for (let attempt = 1; attempt <= 5; attempt++) {
      const res = await fetch(OVERPASS, {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ data: query }),
      });
      const text = await res.text();
      if (res.ok && text.startsWith("{")) return text;
      console.warn(`  overpass busy (attempt ${attempt}); backing off`);
      await sleep(attempt * 20_000);
    }
    throw new Error(`Overpass would not serve relation ${id}`);
  });
}

/**
 * Chain a relation's member ways into one polyline. Members are ordered but
 * individual ways are stored in their own direction, so each is flipped when
 * its far end is the one that continues the chain.
 */
function stitchRelation(members: OverpassMember[]) {
  const ways = members
    .filter(
      (m) =>
        m.type === "way" &&
        Array.isArray(m.geometry) &&
        m.role !== "stop" &&
        m.role !== "platform",
    )
    .map((m) => (m.geometry ?? []).map((g) => [g.lon, g.lat] as Pt));
  if (ways.length === 0) return [];

  const line: Pt[] = [...ways[0]];
  for (const way of ways.slice(1)) {
    const tail = line[line.length - 1];
    const toHead = haversine(tail, way[0]);
    const toTail = haversine(tail, way[way.length - 1]);
    const segment = toTail < toHead ? [...way].reverse() : way;
    line.push(...(Math.min(toHead, toTail) < 1 ? segment.slice(1) : segment));
  }
  return line;
}

async function routeThroughStops(stops: Stop[]) {
  const coords = stops.map((s) => `${s.lon},${s.lat}`).join(";");
  const data = await cachedFetch(
    `osrm-${Buffer.from(coords).toString("base64url").slice(0, 60)}`,
    async () => {
      const res = await fetch(
        `${OSRM}/${coords}?overview=full&geometries=geojson`,
        { headers: { "User-Agent": USER_AGENT } },
      );
      if (!res.ok) throw new Error(`OSRM ${res.status}`);
      return res.text();
    },
  );
  const coordinates = data.routes?.[0]?.geometry?.coordinates as
    | Pt[]
    | undefined;
  if (!coordinates?.length) throw new Error("OSRM returned no geometry");
  return coordinates;
}

/**
 * Ramer-Douglas-Peucker. The raw OSM/OSRM lines are ~7.6k points across nine
 * routes; this file is `import`ed straight into the map bundle, so keeping
 * every node would cost the PWA precache more than the detail is worth.
 * `SIMPLIFY_TOLERANCE_M` is well under a road's width, so the drawn line still
 * sits on the carriageway at max zoom.
 */
function simplify(line: Pt[], tolerance = SIMPLIFY_TOLERANCE_M): Pt[] {
  if (line.length < 3) return line;
  const [start, end] = [line[0], line[line.length - 1]];
  let worst = 0;
  let worstIndex = 0;
  for (let i = 1; i < line.length - 1; i++) {
    const d = perpendicularDistance(line[i], start, end);
    if (d > worst) {
      worst = d;
      worstIndex = i;
    }
  }
  if (worst <= tolerance) return [start, end];
  return [
    ...simplify(line.slice(0, worstIndex + 1), tolerance).slice(0, -1),
    ...simplify(line.slice(worstIndex), tolerance),
  ];
}

/** Metres from `p` to segment `a`-`b`, flat-earth (fine at these distances). */
function perpendicularDistance(p: Pt, a: Pt, b: Pt) {
  const mPerDegLat = 111_320;
  const mPerDegLon = mPerDegLat * Math.cos((p[1] * Math.PI) / 180);
  const px = (p[0] - a[0]) * mPerDegLon;
  const py = (p[1] - a[1]) * mPerDegLat;
  const bx = (b[0] - a[0]) * mPerDegLon;
  const by = (b[1] - a[1]) * mPerDegLat;
  const lenSq = bx * bx + by * by;
  if (lenSq === 0) return Math.hypot(px, py);
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / lenSq));
  return Math.hypot(px - t * bx, py - t * by);
}

function round(line: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const [lon, lat] of line) {
    const p: Pt = [
      Number(lon.toFixed(PRECISION)),
      Number(lat.toFixed(PRECISION)),
    ];
    const prev = out[out.length - 1];
    if (!prev || prev[0] !== p[0] || prev[1] !== p[1]) out.push(p);
  }
  return out;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const client = new pg.Client({ connectionString });
  await client.connect();
  const { rows } = await client.query<{
    route_id: string;
    name: string;
    lat: number;
    lon: number;
  }>(
    `SELECT route_id, name, lat, lon FROM jeepney_stops
     WHERE is_active ORDER BY route_id, sort_order`,
  );
  await client.end();

  const stopsByRoute = new Map<string, Stop[]>();
  for (const row of rows) {
    const list = stopsByRoute.get(row.route_id) ?? [];
    list.push({ name: row.name, lat: row.lat, lon: row.lon });
    stopsByRoute.set(row.route_id, list);
  }

  const existing = JSON.parse(readFileSync(OUT_FILE, "utf8")) as Record<
    string,
    // Either the current shape or the pre-provenance `LineString` shape.
    { source?: string; note?: string; geometry?: { coordinates: Pt[] } } & {
      coordinates?: Pt[];
    }
  >;
  const out: Record<string, unknown> = {};

  for (const [routeId, plan] of Object.entries(PLANS)) {
    const stops = stopsByRoute.get(routeId);
    if (!stops || stops.length < 2) {
      // A database without this route (a local one holds only the campus
      // routes) must not erase geometry another run already produced.
      if (existing[routeId]) {
        out[routeId] = existing[routeId];
        console.warn(
          `carry ${routeId}: fewer than two stops in the database, kept the existing entry`,
        );
      } else {
        console.warn(`skip  ${routeId}: fewer than two stops in the database`);
      }
      continue;
    }

    if (plan.kind === "keep") {
      const kept = existing[routeId];
      // Tolerate the pre-provenance shape so the first run upgrades it in place
      // instead of re-routing geometry that is already correct.
      const coordinates = kept?.geometry?.coordinates ?? kept?.coordinates;
      if (!coordinates?.length) {
        console.warn(`skip  ${routeId}: nothing to keep`);
        continue;
      }
      out[routeId] = {
        source: kept.source ?? "routed",
        note: plan.note,
        ...(plan.caveat ? { caveat: plan.caveat } : {}),
        geometry: { type: "LineString", coordinates },
      };
      console.log(`keep  ${routeId} (${coordinates.length} pts)`);
      continue;
    }

    let line: Pt[];
    if (plan.kind === "osm-relation") {
      const data = await fetchRelation(plan.relation);
      line = stitchRelation(data.elements?.[0]?.members ?? []);
      if (line.length < 2) {
        throw new Error(`relation ${plan.relation} stitched to nothing`);
      }
      const first = nearestIndex(line, [stops[0].lon, stops[0].lat]);
      const last = nearestIndex(line, [
        stops[stops.length - 1].lon,
        stops[stops.length - 1].lat,
      ]);
      // Guard the hand-picked pairing: a relation that does not reach this
      // route's terminals is the wrong relation, and shipping it would be the
      // same confident-wrong-line bug in a nicer costume.
      const worst = Math.max(first.distance, last.distance);
      if (worst > TERMINAL_TOLERANCE_M) {
        throw new Error(
          `relation ${plan.relation} misses a terminal of ${routeId} by ${Math.round(worst)} m`,
        );
      }
      // Relations are stored in their own direction; ours may be the opposite.
      const isReversed = first.index > last.index;
      if (isReversed !== Boolean(plan.reverse)) {
        // `reverse` records which way the mapped relation runs relative to this
        // route. If reality stops matching, the pairing was re-tagged upstream
        // and the geometry needs re-checking, not silently re-oriented.
        throw new Error(
          `relation ${plan.relation} runs ${isReversed ? "opposite to" : "with"} ${routeId}, which contradicts reverse: ${Boolean(plan.reverse)}`,
        );
      }
      if (isReversed) line.reverse();
      if (plan.trim) {
        const a = nearestIndex(line, [stops[0].lon, stops[0].lat]).index;
        const b = nearestIndex(line, [
          stops[stops.length - 1].lon,
          stops[stops.length - 1].lat,
        ]).index;
        line = line.slice(Math.min(a, b), Math.max(a, b) + 1);
      }
    } else {
      line = await routeThroughStops(stops);
    }

    const coordinates = simplify(round(line));
    out[routeId] = {
      source: plan.kind,
      note: plan.note,
      ...(plan.caveat ? { caveat: plan.caveat } : {}),
      geometry: { type: "LineString", coordinates },
    };
    console.log(
      `${plan.kind === "osm-relation" ? "osm  " : "route"} ${routeId} (${coordinates.length} pts)`,
    );
  }

  // One compact line per route: pretty-printing coordinate pairs quadruples the
  // file (466 KB vs 118 KB) for no readability gain, and this line-per-route
  // shape still keeps diffs scoped to the route that changed.
  const body = Object.entries(out)
    .map(([id, value]) => `  ${JSON.stringify(id)}: ${JSON.stringify(value)}`)
    .join(",\n");
  writeFileSync(OUT_FILE, `{\n${body}\n}\n`);
  console.log(`\nwrote ${OUT_FILE} (${Object.keys(out).length} routes)`);
}

await main();
