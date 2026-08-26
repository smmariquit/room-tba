/**
 * Configure MapLibre's worker URL before any component can create a Map.
 *
 * `setWorkerUrl` used to live at module scope inside Map.svelte and
 * ForkWizard.svelte, but on production the worker pool initialized before
 * those components mounted, so maplibre fell back to an import.meta.url-
 * relative worker path that 404s in the built output — blank basemap under
 * working pins (#1003 regression, 2026-08-25). Importing this module first
 * from the app entry removes the ordering hazard: the URL is set during
 * boot, before any island hydrates.
 */
import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

let configured = false;

export function configureMaplibreWorker(): void {
  if (configured) return;
  configured = true;
  maplibregl.setWorkerUrl(maplibreWorkerUrl);
}

configureMaplibreWorker();
