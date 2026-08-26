/**
 * Serve maplibre's real worker at the path its built-in fallback resolves to.
 *
 * MapLibre 6's last-resort worker URL is `new URL("maplibre-gl-worker.mjs",
 * import.meta.url)` relative to whatever chunk its main-thread code landed
 * in (public/_astro/dist.*.js → /_astro/maplibre-gl-worker.mjs). When
 * setWorkerUrl is ineffective — chunk-split builds can duplicate maplibre's
 * config object, so one copy's setter never reaches the other's worker pool —
 * that fallback 404s and the basemap dies under working pins.
 *
 * Copying the package's own worker + shared core into public/_astro makes the
 * fallback a real, working worker. Running at build time keeps the copies in
 * lockstep with the installed maplibre-gl version (no drift on dependabot
 * bumps). Idempotent; costs ~2 MB of static output.
 */

import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("maplibre-gl/package.json"));
const dist = join(pkgDir, "dist");
const out = join(root, "public", "_astro");

mkdirSync(out, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
	copyFileSync(join(dist, file), join(out, file));
	console.log(`copied ${file} → public/_astro/`);
}
