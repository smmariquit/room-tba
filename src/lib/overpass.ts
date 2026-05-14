/**
 * Minimal Overpass API helpers for fetching a building footprint near a coord.
 * We only need the closest building polygon and a couple of OSM tags.
 */

export type LngLat = [number, number];

export type OsmBuildingFootprint = {
  /** Outer ring as [lng, lat][], closed (first === last). */
  outline: LngLat[];
  /** Estimated number of floors above ground from OSM tags, or null if unknown. */
  levels: number | null;
  /** OSM-tag-derived height in meters, or null if unknown. */
  heightMeters: number | null;
  /** Building name from OSM (`name` tag), if present. */
  osmName: string | null;
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const cache = new Map<string, Promise<OsmBuildingFootprint | null>>();

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(5)},${lon.toFixed(5)}`;
}

type OverpassNode = { type: "node"; id: number; lat: number; lon: number };
type OverpassWay = {
  type: "way";
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
};
type OverpassElement = OverpassNode | OverpassWay;

function pointInRing(point: LngLat, ring: LngLat[]): boolean {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (!a || !b) continue;
    const [xi, yi] = a;
    const [xj, yj] = b;
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function ringCentroid(ring: LngLat[]): LngLat {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const [x, y] of ring) {
    sx += x;
    sy += y;
    n++;
  }
  return [sx / n, sy / n];
}

function distanceSquared(a: LngLat, b: LngLat): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function parseLevels(tags: Record<string, string> | undefined): number | null {
  if (!tags) return null;
  const raw =
    tags["building:levels"] ??
    tags["levels"] ??
    tags["building:levels:aboveground"];
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (Number.isFinite(n) && n > 0 && n < 100) return n;
  return null;
}

function parseHeight(tags: Record<string, string> | undefined): number | null {
  if (!tags) return null;
  const raw = tags["height"] ?? tags["building:height"];
  if (!raw) return null;
  const n = parseFloat(raw);
  if (Number.isFinite(n) && n > 0 && n < 500) return n;
  return null;
}

async function fetchOverpass(query: string): Promise<unknown | null> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: query,
      });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // try next endpoint
    }
  }
  return null;
}

/**
 * Returns the closest building polygon to (lat, lon) within `radius` meters,
 * along with level/height metadata if OSM provides it.
 */
export async function fetchBuildingFootprint(
  lat: number,
  lon: number,
  radius = 35,
): Promise<OsmBuildingFootprint | null> {
  const key = cacheKey(lat, lon);
  const existing = cache.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const query = `
      [out:json][timeout:25];
      (
        way["building"](around:${radius},${lat},${lon});
      );
      out;
      >;
      out skel qt;
    `;

    const data = (await fetchOverpass(query)) as
      | { elements?: OverpassElement[] }
      | null;
    if (!data?.elements?.length) return null;

    const nodes = new Map<number, OverpassNode>();
    const ways: OverpassWay[] = [];
    for (const el of data.elements) {
      if (el.type === "node") nodes.set(el.id, el);
      else if (el.type === "way") ways.push(el);
    }

    if (ways.length === 0) return null;

    const candidates = ways
      .map<{ way: OverpassWay; ring: LngLat[] } | null>((way) => {
        const ring: LngLat[] = [];
        for (const id of way.nodes) {
          const node = nodes.get(id);
          if (!node) return null;
          ring.push([node.lon, node.lat]);
        }
        if (ring.length < 4) return null;
        return { way, ring };
      })
      .filter((c): c is { way: OverpassWay; ring: LngLat[] } => c !== null);

    if (candidates.length === 0) return null;

    const target: LngLat = [lon, lat];

    const containing = candidates.find((c) => pointInRing(target, c.ring));
    const chosen =
      containing ??
      candidates.reduce((best, current) => {
        const bestD = distanceSquared(ringCentroid(best.ring), target);
        const curD = distanceSquared(ringCentroid(current.ring), target);
        return curD < bestD ? current : best;
      });

    return {
      outline: chosen.ring,
      levels: parseLevels(chosen.way.tags),
      heightMeters: parseHeight(chosen.way.tags),
      osmName: chosen.way.tags?.name ?? null,
    };
  })();

  cache.set(key, promise);
  return promise;
}
