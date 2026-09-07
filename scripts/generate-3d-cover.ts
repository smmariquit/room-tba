/**
 * Render UPLB as extruded 3D buildings over real Makiling terrain, no satellite
 * imagery, for the workshop cover. MapLibre GL runs headless in Playwright
 * against MapTiler vector + terrain tiles; frames come out square so a barrel
 * distort turns them into a GoPro-style fisheye.
 *
 * Poster must credit "© MapTiler © OpenStreetMap contributors".
 *
 * Usage:
 *   bun run scripts/generate-3d-cover.ts            # one still
 *   bun run scripts/generate-3d-cover.ts --frames 72  # spin sequence
 */

import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const KEY = process.env.PUBLIC_MAPTILER_KEY ?? "";
if (!KEY) throw new Error("PUBLIC_MAPTILER_KEY missing");

const CENTER = [121.2405, 14.1645]; // academic core
const OUT = "data/fisheye-cover/3d";

const arg = (name: string, fallback: number) => {
  const i = process.argv.indexOf(`--${name}`);
  const v = Number(process.argv[i + 1]);
  return i === -1 || !Number.isFinite(v) ? fallback : v;
};
const frames = process.argv.includes("--frames") ? arg("frames", 72) : 1;
const SIZE = arg("size", 1800);
const ZOOM = arg("zoom", 15.4);
const PITCH = arg("pitch", 72);
const BEARING = arg("bearing", 0);
const tagIdx = process.argv.indexOf("--tag");
const TAG = tagIdx === -1 ? "still" : process.argv[tagIdx + 1];

// lat/lon grid draped over the terrain, the SUPERHOT floor
const STEP = 0.00085; // ~95 m
const SPAN = 0.045;
const gridLine = (fixed: number, axis: "lon" | "lat") => {
  const pts: number[][] = [];
  const base = axis === "lon" ? CENTER[1] : CENTER[0];
  for (let i = 0; i <= 40; i++) {
    const v = base - SPAN + (SPAN * 2 * i) / 40;
    pts.push(axis === "lon" ? [fixed, v] : [v, fixed]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: pts } };
};
const grid = { type: "FeatureCollection", features: [] as unknown[] };
for (let i = -Math.round(SPAN / STEP); i <= Math.round(SPAN / STEP); i++) {
  grid.features.push(gridLine(CENTER[0] + i * STEP, "lon"));
  grid.features.push(gridLine(CENTER[1] + i * STEP, "lat"));
}

const style = {
  version: 8,
  glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${KEY}`,
  sources: {
    v3: { type: "vector", url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${KEY}` },
    terrain: {
      type: "raster-dem",
      url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${KEY}`,
    },
    grid: { type: "geojson", data: grid },
  },
  terrain: { source: "terrain", exaggeration: 1.4 },
  // hard low sun: white tops, grey sides, the SUPERHOT read
  light: { anchor: "viewport", color: "#ffffff", intensity: 0.8, position: [1.5, 205, 40] },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#ffffff" } },
    {
      id: "water",
      type: "fill",
      source: "v3",
      "source-layer": "water",
      paint: { "fill-color": "#e8e8e8" },
    },
    {
      id: "grid",
      type: "line",
      source: "grid",
      paint: { "line-color": "#000000", "line-opacity": 0.5, "line-width": 1.1 },
    },
    {
      id: "roads",
      type: "line",
      source: "v3",
      "source-layer": "transportation",
      filter: ["!=", ["get", "class"], "path"],
      paint: {
        "line-color": "#000000",
        "line-opacity": 0.9,
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.6, 17, 3],
      },
    },
    {
      id: "building-outline",
      type: "line",
      source: "v3",
      "source-layer": "building",
      paint: { "line-color": "#000000", "line-opacity": 0.95, "line-width": 1.4 },
    },
    {
      id: "buildings",
      type: "fill-extrusion",
      source: "v3",
      "source-layer": "building",
      paint: {
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], 9],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 1,
        "fill-extrusion-color": "#fbfbfb",
        "fill-extrusion-vertical-gradient": true,
      },
    },
  ],
};

const html = `<!doctype html><meta charset=utf-8>
<link rel=stylesheet href=/maplibre-gl.css>
<style>html,body,#m{margin:0;width:${SIZE}px;height:${SIZE}px;background:#ffffff}</style>
<div id=m></div><script type=module>
import * as maplibregl from '/maplibre-gl.mjs';
const map = new maplibregl.Map({
  container: 'm', style: ${JSON.stringify(style)},
  center: ${JSON.stringify(CENTER)}, zoom: ${ZOOM}, pitch: ${PITCH}, bearing: ${BEARING},
  attributionControl: false, fadeDuration: 0,
});
window.setBearing = (b) => new Promise(r => {
  map.setBearing(b);
  map.once('idle', () => requestAnimationFrame(() => requestAnimationFrame(r)));
});
window.ready = new Promise(r => map.once('idle', () => setTimeout(r, 2500)));
</script>`;

mkdirSync(OUT, { recursive: true });

const dist = "node_modules/maplibre-gl/dist";
const server = Bun.serve({
  port: 0,
  fetch(req) {
    const p = new URL(req.url).pathname;
    if (p.endsWith(".mjs") || p.endsWith(".css") || p.endsWith(".map")) {
      const type = p.endsWith(".css") ? "text/css" : "text/javascript";
      return new Response(Bun.file(`${dist}${p}`), { headers: { "content-type": type } });
    }
    return new Response(html, { headers: { "content-type": "text/html" } });
  },
});

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
page.on("console", (m) => m.type() === "error" && console.log("page error:", m.text()));
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.goto(`http://localhost:${server.port}/`);
await page.waitForFunction("window.ready !== undefined");
await page.evaluate("window.ready");

for (let f = 0; f < frames; f++) {
  const bearing = BEARING + (360 / frames) * f;
  if (frames > 1) await page.evaluate(`window.setBearing(${bearing})`);
  const name = frames > 1 ? `frame_${String(f).padStart(3, "0")}.png` : `${TAG}.png`;
  await page.locator("#m").screenshot({ path: `${OUT}/${name}` });
  process.stdout.write(`\r${f + 1}/${frames}`);
}
console.log();

await browser.close();
server.stop();
console.log(`wrote ${OUT}`);
