import type maplibregl from "maplibre-gl";
import { hasConfiguredMaptilerKey, withMaptilerKey } from "./maptiler-key";

export const SATELLITE_SOURCE_ID = "satellite-basemap";
export const SATELLITE_LAYER_ID = "satellite-basemap";

/**
 * MapTiler satellite TileJSON — same source their own hybrid style uses.
 * The placeholder is swapped for PUBLIC_MAPTILER_KEY at runtime, matching
 * every other keyed URL in the app.
 */
const SATELLITE_TILEJSON_URL =
  "https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=__MAPTILER_KEY__";

const currentSourceUrls = new WeakMap<maplibregl.Map, string>();

/**
 * Show or hide satellite imagery under the app's own layers.
 *
 * The raster layer is inserted before the style's first symbol layer, so
 * road/place labels keep rendering on top (hybrid look) while fills and
 * land polygons are covered. App layers (pins, routes) are added after the
 * style and always sit above it. The source is added lazily on first use so
 * users who never toggle satellite never fetch imagery tiles. Idempotent.
 */
export function syncSatelliteLayer(
  map: maplibregl.Map,
  visible: boolean,
  historicalTileUrl?: string | null,
): void {
  // Without a key there is no imagery to point at, and building the URL
  // throws. Keyless deployments (E2E, forks on the fallback basemap) run
  // this on every map load with satellite off, so bail before touching it.
  if (!historicalTileUrl && !hasConfiguredMaptilerKey()) return;
  const sourceUrl =
    historicalTileUrl ?? withMaptilerKey(SATELLITE_TILEJSON_URL);
  if (
    map.getLayer(SATELLITE_LAYER_ID) &&
    currentSourceUrls.get(map) !== sourceUrl
  ) {
    map.removeLayer(SATELLITE_LAYER_ID);
    if (map.getSource(SATELLITE_SOURCE_ID))
      map.removeSource(SATELLITE_SOURCE_ID);
  }
  if (!map.getLayer(SATELLITE_LAYER_ID)) {
    if (!visible) return;
    if (!map.getSource(SATELLITE_SOURCE_ID)) {
      map.addSource(SATELLITE_SOURCE_ID, {
        type: "raster",
        ...(historicalTileUrl
          ? { tiles: [historicalTileUrl], tileSize: 256 }
          : { url: sourceUrl }),
      });
    }
    const firstSymbolId = map
      .getStyle()
      .layers.find((layer) => layer.type === "symbol")?.id;
    map.addLayer(
      { id: SATELLITE_LAYER_ID, type: "raster", source: SATELLITE_SOURCE_ID },
      firstSymbolId,
    );
    currentSourceUrls.set(map, sourceUrl);
  }
  map.setLayoutProperty(
    SATELLITE_LAYER_ID,
    "visibility",
    visible ? "visible" : "none",
  );
}
