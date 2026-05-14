/**
 * Tiny tile composite helper: given a center (lat, lon) and a desired
 * radius in meters, fetch enough Web Mercator raster tiles to cover that
 * area and return them as a single canvas plus the area's true extent in
 * local meters (so the caller can size a Three.js plane to match).
 *
 * Tiles come from MapTiler — same provider as the main MapLibre map, with a
 * publicly-exposed client key. Attribution must remain visible (OpenStreetMap
 * contributors + MapTiler).
 */

const MAPTILER_KEY = "B6m4DQknxd9wZ70DnDV4";
const TILE_URL = (z: number, x: number, y: number) =>
  `https://api.maptiler.com/maps/streets-v2/256/${z}/${x}/${y}.png?key=${MAPTILER_KEY}`;

const TILE_SIZE = 256;
const METERS_PER_DEGREE_LAT = 111_320;
const EARTH_CIRCUMFERENCE_M = 156_543.03;

function lonToTileX(lon: number, z: number): number {
  return ((lon + 180) / 360) * Math.pow(2, z);
}

function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, z)
  );
}

function loadTile(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Tile failed: ${url}`));
    img.src = url;
  });
}

export type Basemap = {
  /** Composited & cropped image of the area, ready to use as a CanvasTexture. */
  canvas: HTMLCanvasElement;
  /** Half-extent west↔east in local meters (canvas is centered on the building). */
  halfWidthMeters: number;
  /** Half-extent north↔south in local meters. */
  halfDepthMeters: number;
};

/**
 * Fetch a Web Mercator tile composite cropped to a square of approximately
 * `radiusMeters * 2` on a side, centered on (centerLat, centerLon).
 *
 * Returns null if any tile fails to load (network / rate-limit / CORS).
 */
export async function fetchBasemap(opts: {
  centerLat: number;
  centerLon: number;
  /** Half-side length of the desired square area, in meters. */
  radiusMeters: number;
  /** Tile zoom; 18 (~0.6 m/px at lat 14) is a good default for buildings. */
  zoom?: number;
}): Promise<Basemap | null> {
  const { centerLat, centerLon, radiusMeters } = opts;
  const zoom = opts.zoom ?? 18;

  const lonScale =
    Math.cos((centerLat * Math.PI) / 180) * METERS_PER_DEGREE_LAT;
  const dLon = radiusMeters / lonScale;
  const dLat = radiusMeters / METERS_PER_DEGREE_LAT;

  const west = centerLon - dLon;
  const east = centerLon + dLon;
  const north = centerLat + dLat;
  const south = centerLat - dLat;

  const xMinFrac = lonToTileX(west, zoom);
  const xMaxFrac = lonToTileX(east, zoom);
  const yMinFrac = latToTileY(north, zoom);
  const yMaxFrac = latToTileY(south, zoom);

  const xMin = Math.floor(xMinFrac);
  const xMax = Math.floor(xMaxFrac);
  const yMin = Math.floor(yMinFrac);
  const yMax = Math.floor(yMaxFrac);

  const cols = xMax - xMin + 1;
  const rows = yMax - yMin + 1;

  // Sanity guard — at z=18 even 200 m of radius should fit in <= 4 tiles.
  if (cols * rows > 64) {
    console.warn(
      "Basemap requested too many tiles; skipping",
      cols,
      "x",
      rows,
    );
    return null;
  }

  const fullWidth = cols * TILE_SIZE;
  const fullHeight = rows * TILE_SIZE;

  const composite = document.createElement("canvas");
  composite.width = fullWidth;
  composite.height = fullHeight;
  const cctx = composite.getContext("2d");
  if (!cctx) return null;

  const tilePromises: Promise<{
    img: HTMLImageElement;
    gx: number;
    gy: number;
  }>[] = [];
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const url = TILE_URL(zoom, xMin + gx, yMin + gy);
      tilePromises.push(loadTile(url).then((img) => ({ img, gx, gy })));
    }
  }

  let tiles: { img: HTMLImageElement; gx: number; gy: number }[];
  try {
    tiles = await Promise.all(tilePromises);
  } catch (err) {
    console.warn("Basemap tile fetch failed", err);
    return null;
  }

  for (const { img, gx, gy } of tiles) {
    cctx.drawImage(img, gx * TILE_SIZE, gy * TILE_SIZE);
  }

  // Pixel coords of the requested center within the full tile grid.
  const centerPxX = (lonToTileX(centerLon, zoom) - xMin) * TILE_SIZE;
  const centerPxY = (latToTileY(centerLat, zoom) - yMin) * TILE_SIZE;

  // Web Mercator: meters per pixel at this zoom and latitude.
  const metersPerPixel =
    (EARTH_CIRCUMFERENCE_M * Math.cos((centerLat * Math.PI) / 180)) /
    Math.pow(2, zoom);
  const halfPx = radiusMeters / metersPerPixel;

  const cropLeft = Math.max(0, Math.floor(centerPxX - halfPx));
  const cropTop = Math.max(0, Math.floor(centerPxY - halfPx));
  const cropRight = Math.min(fullWidth, Math.ceil(centerPxX + halfPx));
  const cropBottom = Math.min(fullHeight, Math.ceil(centerPxY + halfPx));
  const cropW = cropRight - cropLeft;
  const cropH = cropBottom - cropTop;
  if (cropW <= 0 || cropH <= 0) return null;

  const cropped = document.createElement("canvas");
  cropped.width = cropW;
  cropped.height = cropH;
  const ctx = cropped.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(composite, cropLeft, cropTop, cropW, cropH, 0, 0, cropW, cropH);

  return {
    canvas: cropped,
    halfWidthMeters: (cropW / 2) * metersPerPixel,
    halfDepthMeters: (cropH / 2) * metersPerPixel,
  };
}
