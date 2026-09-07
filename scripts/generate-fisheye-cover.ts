/**
 * Fetch satellite tiles around UPLB and stitch one big square PNG for the
 * workshop cover. Fisheye/tiny-planet variants are produced from the
 * stitched image with ImageMagick (commands printed at the end).
 *
 * Tiles: MapTiler satellite-v2 (PUBLIC_MAPTILER_KEY from .env), falling back
 * to Esri World Imagery if the key is rejected. Poster must credit the
 * imagery source ("© MapTiler © Maxar" or "© Esri").
 *
 * Cached under data/fisheye-cover/cache/ (delete to refetch).
 *
 * Usage: bun run scripts/generate-fisheye-cover.ts
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const KEY = process.env.PUBLIC_MAPTILER_KEY ?? "";
const Z = 17;
const GRID = 12; // 12x12 tiles ≈ 3.4 km square at z17
const CENTER = { lat: 14.1645, lon: 121.2405 }; // academic core, Oble/Main Library
const DIR = "data/fisheye-cover";
const CACHE = `${DIR}/cache`;

// slippy-map tile of the center point
const n = 2 ** Z;
const latR = (CENTER.lat * Math.PI) / 180;
const cx = Math.floor(((CENTER.lon + 180) / 360) * n);
const cy = Math.floor(
  ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n,
);
const x0 = cx - GRID / 2;
const y0 = cy - GRID / 2;

const maptilerUrl = (x: number, y: number) =>
  `https://api.maptiler.com/tiles/satellite-v2/${Z}/${x}/${y}.jpg?key=${KEY}`;
const esriUrl = (x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${Z}/${y}/${x}`;

mkdirSync(CACHE, { recursive: true });

// pick source: probe one MapTiler tile, fall back to Esri
let source: "maptiler" | "esri" = "maptiler";
if (KEY) {
  const probe = await fetch(maptilerUrl(cx, cy));
  if (!probe.ok) {
    console.log(`MapTiler probe failed (${probe.status}), using Esri`);
    source = "esri";
  }
} else {
  console.log("no PUBLIC_MAPTILER_KEY, using Esri");
  source = "esri";
}
const url = source === "maptiler" ? maptilerUrl : esriUrl;

const files: string[] = [];
const jobs: Array<() => Promise<void>> = [];
for (let ry = 0; ry < GRID; ry++) {
  for (let rx = 0; rx < GRID; rx++) {
    const x = x0 + rx;
    const y = y0 + ry;
    const path = `${CACHE}/${source}-${Z}-${y}-${x}.jpg`;
    files.push(path);
    if (existsSync(path)) continue;
    jobs.push(async () => {
      const res = await fetch(url(x, y));
      if (!res.ok) throw new Error(`tile ${Z}/${x}/${y}: ${res.status}`);
      writeFileSync(path, Buffer.from(await res.arrayBuffer()));
    });
  }
}

console.log(`${source}: fetching ${jobs.length} tiles (${files.length} total)`);
const POOL = 8;
for (let i = 0; i < jobs.length; i += POOL) {
  await Promise.all(jobs.slice(i, i + POOL).map((j) => j()));
  process.stdout.write(`\r${Math.min(i + POOL, jobs.length)}/${jobs.length}`);
}
console.log();

const out = `${DIR}/stitched.png`;
const res = spawnSync(
  "magick",
  ["montage", ...files, "-tile", `${GRID}x${GRID}`, "-geometry", "+0+0", out],
  { stdio: "inherit" },
);
if (res.status !== 0) throw new Error("magick montage failed");
console.log(`stitched: ${out}`);

// center the exact CENTER pixel before distorting (tile grid only centers
// to the nearest tile, ~280 m off at z17)
const T = 512;
const xf = ((CENTER.lon + 180) / 360) * n;
const yf =
  ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n;
const px = Math.round((xf - x0) * T);
const py = Math.round((yf - y0) * T);
const S = 2 * Math.min(px, py, GRID * T - px, GRID * T - py);
const crop = `${S}x${S}+${px - S / 2}+${py - S / 2}`;

console.log("fisheye:");
console.log(
  `  magick ${out} -crop ${crop} +repage -distort barrel "0.5 0 0 0.5" -background none -vignette 0x20 ${DIR}/cover-fisheye.png`,
);
