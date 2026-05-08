<script lang="ts">
  import { MapLibre, Marker } from "svelte-maplibre";
  import { getAppData } from "../../lib/context";
  import { queryStore, locationStore, mapStore } from "../../lib/store.svelte";
  import { untrack } from "svelte";
  import { fade } from "svelte/transition";
  import MapLibreGlDirections from "@maplibre/maplibre-gl-directions";
  import { University } from "@lucide/svelte";
  import { MediaQuery } from "svelte/reactivity";
  import * as mapGl from "maplibre-gl";
  const { buildings, rooms } = getAppData();
  let directions: MapLibreGlDirections | undefined = $state.raw();

  let animationFrameId: number | null = $state(null);

  let isRotating = $state(false);
  let lastTimestamp = $state(0);
  let currentRotation = $state(0);
  let zoomLevel = $state(0);
  const SIDEPANEL_WIDTH = 25.75 * 16;
  const md = new MediaQuery("max-width:48rem");

  const BUILDING_LAYER_ID = "building-3d";
  const BUILDING_SOURCE_ID = "openmaptiles";
  const BUILDING_SOURCE_LAYER = "building";
  const BUILDING_DEFAULT_COLOR = "rgba(247, 242, 235, 1)";
  const HIGHLIGHT_SOURCE_ID = "room-tba-highlighted-buildings";
  const HIGHLIGHT_LAYER_ID = "room-tba-highlighted-buildings-3d";
  const BUILDING_HIGHLIGHT_COLOR = "#facc15";
  const HIGHLIGHT_HEIGHT_OFFSET = 0.5;
  const HIGHLIGHT_POLYGON_INFLATE = 1.02;
  let baseLayerCleanupDone = false;

  function ensureBaseLayerClean() {
    const map = mapStore.mapInstance;
    if (!map || baseLayerCleanupDone) return;
    if (!map.getLayer(BUILDING_LAYER_ID)) return;

    map.setPaintProperty(
      BUILDING_LAYER_ID,
      "fill-extrusion-color",
      BUILDING_DEFAULT_COLOR,
    );
    map.removeFeatureState({
      source: BUILDING_SOURCE_ID,
      sourceLayer: BUILDING_SOURCE_LAYER,
    });
    baseLayerCleanupDone = true;
  }

  type HighlightFeature = GeoJSON.Feature<
    GeoJSON.Polygon | GeoJSON.MultiPolygon,
    { render_height: number; render_min_height: number }
  >;

  const highlightFeatureCache = new Map<string, HighlightFeature>();

  function getFeatureKey(feature: mapGl.MapGeoJSONFeature): string {
    if (feature.id !== undefined && feature.id !== null) {
      return `id:${String(feature.id)}`;
    }
    return `geom:${JSON.stringify(feature.geometry)}`;
  }

  function pointInRing(point: [number, number], ring: number[][]): boolean {
    let inside = false;
    const [x, y] = point;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const ringI = ring[i];
      const ringJ = ring[j];
      if (!ringI || !ringJ) continue;
      const [xi, yi] = ringI;
      const [xj, yj] = ringJ;
      const intersects =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function pickPolygonContainingPoint(
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
    lng: number,
    lat: number,
  ): GeoJSON.Polygon | null {
    if (geometry.type === "Polygon") {
      const outer = geometry.coordinates[0];
      if (outer && pointInRing([lng, lat], outer)) return geometry;
      return null;
    }
    for (const polyCoords of geometry.coordinates) {
      const outer = polyCoords[0];
      if (outer && pointInRing([lng, lat], outer)) {
        return { type: "Polygon", coordinates: polyCoords };
      }
    }
    return null;
  }

  function inflateRing(ring: number[][], scale: number): number[][] {
    if (ring.length === 0) return ring;
    let cx = 0;
    let cy = 0;
    for (const [x, y] of ring) {
      cx += x;
      cy += y;
    }
    cx /= ring.length;
    cy /= ring.length;
    return ring.map(([x, y]) => [
      cx + (x - cx) * scale,
      cy + (y - cy) * scale,
    ]);
  }

  function inflateGeometry(
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
    scale = HIGHLIGHT_POLYGON_INFLATE,
  ): GeoJSON.Polygon | GeoJSON.MultiPolygon {
    if (geometry.type === "Polygon") {
      return {
        type: "Polygon",
        coordinates: geometry.coordinates.map((ring) =>
          inflateRing(ring, scale),
        ),
      };
    }
    return {
      type: "MultiPolygon",
      coordinates: geometry.coordinates.map((polygon) =>
        polygon.map((ring) => inflateRing(ring, scale)),
      ),
    };
  }

  function findBuildingFeatureAt(
    map: mapGl.MapLibreMap,
    lng: number,
    lat: number,
  ): mapGl.MapGeoJSONFeature | null {
    const point = map.project([lng, lat]);
    const exact = map.queryRenderedFeatures(point, {
      layers: [BUILDING_LAYER_ID],
    });
    return (exact[0] as mapGl.MapGeoJSONFeature | undefined) ?? null;
  }

  function highlightDatasetBuildings() {
    const map = mapStore.mapInstance;
    if (!map || !map.isStyleLoaded() || map.getZoom() < 14) return;

    ensureBaseLayerClean();

    let cacheChanged = false;

    for (const building of buildings) {
      if (building.lat === null || building.lon === null) continue;

      const feature = findBuildingFeatureAt(map, building.lon, building.lat);
      if (!feature) continue;
      if (
        feature.geometry.type !== "Polygon" &&
        feature.geometry.type !== "MultiPolygon"
      ) {
        continue;
      }

      const matchedPolygon = pickPolygonContainingPoint(
        feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        building.lon,
        building.lat,
      );
      if (!matchedPolygon) continue;

      const key = `${getFeatureKey(feature)}|${building.lon.toFixed(6)},${building.lat.toFixed(6)}`;
      if (highlightFeatureCache.has(key)) continue;

      const inflated = inflateGeometry(matchedPolygon);

      highlightFeatureCache.set(key, {
        type: "Feature",
        geometry: inflated,
        properties: {
          render_height:
            (feature.properties?.render_height ?? 12) + HIGHLIGHT_HEIGHT_OFFSET,
          render_min_height: Math.max(
            (feature.properties?.render_min_height ?? 0) -
              HIGHLIGHT_HEIGHT_OFFSET,
            0,
          ),
        },
      });
      cacheChanged = true;
    }

    if (!cacheChanged && map.getSource(HIGHLIGHT_SOURCE_ID)) return;

    const featureCollection: GeoJSON.FeatureCollection<
      GeoJSON.Polygon | GeoJSON.MultiPolygon
    > = {
      type: "FeatureCollection",
      features: Array.from(highlightFeatureCache.values()),
    };

    const existingSource = map.getSource(HIGHLIGHT_SOURCE_ID) as
      | mapGl.GeoJSONSource
      | undefined;

    if (existingSource) {
      existingSource.setData(featureCollection);
    } else {
      map.addSource(HIGHLIGHT_SOURCE_ID, {
        type: "geojson",
        data: featureCollection,
      });
    }

    if (!map.getLayer(HIGHLIGHT_LAYER_ID)) {
      map.addLayer({
        id: HIGHLIGHT_LAYER_ID,
        type: "fill-extrusion",
        source: HIGHLIGHT_SOURCE_ID,
        paint: {
          "fill-extrusion-color": BUILDING_HIGHLIGHT_COLOR,
          "fill-extrusion-height": ["get", "render_height"],
          "fill-extrusion-base": ["get", "render_min_height"],
          "fill-extrusion-opacity": 0.95,
        },
      });
    }
  }



  const calculatePadding = (md: boolean): mapGl.PaddingOptions => {
    if (md) {
      return {
        bottom: window.innerWidth / 2,
        left: 0,
      };
    }
    return {
      left: SIDEPANEL_WIDTH,
      bottom: 0,
    };
  };

  function rotateCamera(timestamp: number) {
    if (!mapStore.mapInstance || !isRotating) return;

    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    currentRotation = (currentRotation + delta / 150) % 360;
    mapStore.mapInstance.rotateTo(currentRotation, {
      duration: 0,
      padding: calculatePadding(untrack(() => md.current)),
    });

    animationFrameId = requestAnimationFrame(rotateCamera);
  }

  function startRotation() {
    stopRotation();
    if (!mapStore.mapInstance) return;
    isRotating = true;
    lastTimestamp = 0;
    currentRotation = mapStore.mapInstance.getBearing();
    animationFrameId = requestAnimationFrame(rotateCamera);
  }

  function stopRotation() {
    isRotating = false;
    lastTimestamp = 0;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function handleZoom() {
    if (!mapStore.mapInstance) return;
    zoomLevel = mapStore.mapInstance.getZoom();
  }

  $effect(() => {
    if (mapStore.mapInstance) {
      const map = mapStore.mapInstance;
      map.on("mousedown", stopRotation);
      map.on("touchstart", stopRotation);
      map.on("wheel", stopRotation);
      map.on("zoom", handleZoom);
      return () => {
        map.off("mousedown", stopRotation);
        map.off("touchstart", stopRotation);
        map.off("wheel", stopRotation);
        map.off("zoom", handleZoom);
      };
    }
  });

  $effect(() => {
    if (mapStore.mapInstance && !directions) {
      const initDirections = () => {
        if (!directions && mapStore.mapInstance) {
          directions = new MapLibreGlDirections(mapStore.mapInstance, {
            api: "https://routing.openstreetmap.de/routed-foot/route/v1",
            profile: "foot",
          });
        }
      };

      if (mapStore.mapInstance.isStyleLoaded()) {
        initDirections();
      } else {
        mapStore.mapInstance.once("load", initDirections);
      }
    }
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    if (!map) return;

    highlightFeatureCache.clear();
    baseLayerCleanupDone = false;

    if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
      map.removeLayer(HIGHLIGHT_LAYER_ID);
    }
    if (map.getSource(HIGHLIGHT_SOURCE_ID)) {
      map.removeSource(HIGHLIGHT_SOURCE_ID);
    }

    const refresh = () => {
      highlightDatasetBuildings();
    };

    if (map.isStyleLoaded()) {
      refresh();
    } else {
      map.once("load", refresh);
    }

    map.on("idle", refresh);

    return () => {
      map.off("idle", refresh);
    };
  });

  $effect(() => {
    if (!directions) return;

    if (locationStore.routeOrigin && locationStore.destination) {
      directions.setWaypoints([
        locationStore.routeOrigin,
        locationStore.destination,
      ]);
    } else {
      directions.clear();
    }
  });

  $effect(() => {
    const category = queryStore.category;
    const type = queryStore.type;
    const value = queryStore.inputValue;
    const map = mapStore.mapInstance;

    if (!map) return;

    untrack(() => {
      stopRotation();
      map.off("moveend", startRotation);

      if (category === "building" && type === "result") {
        const currentBuilding = buildings.find(
          (building) => building.building_name === value,
        );

        if (currentBuilding && currentBuilding.lon && currentBuilding.lat) {
          map.flyTo({
            center: [currentBuilding.lon, currentBuilding.lat],
            zoom: 18,
            pitch: 60,
            padding: calculatePadding(md.current),
            duration: 1500,
          });
          map.once("moveend", startRotation);
        }
      } else if (category === null) {
        map.flyTo({
          center: [121.24125948460573, 14.16323736946326],
          zoom: 15.81,
          pitch: 60,
          bearing: -154.48,
          duration: 1500,
        });
        if (directions) directions.clear();
      } else if (category === "room") {
        const currentRoom = rooms.find((room) => room.code === value);
        if (
          currentRoom &&
          currentRoom.building &&
          currentRoom.building.lat &&
          currentRoom.building.lon
        ) {
          map.flyTo({
            center: [currentRoom.building.lon, currentRoom.building.lat],
            zoom: 18,
            pitch: 60,
            padding: calculatePadding(md.current),
            duration: 1500,
          });
          map.once("moveend", startRotation);
        }
      }
    });
  });

  function handleMarkerClick(buildingName: string) {
    if (buildingName === queryStore.inputValue) return;
    queryStore.updateQuery({
      category: "building",
      type: "result",
      value: buildingName,
    });
    queryStore.inputValue = buildingName;
  }

  let activeBuildingName = $derived.by(() => {
    if (!queryStore.category || queryStore.type !== "result") return null;
    switch (queryStore.category) {
      case "building":
        return queryStore.inputValue;
      case "room": {
        const currentRoom = rooms.find(
          (room) => room.code === queryStore.inputValue,
        );
        return currentRoom && currentRoom.building
          ? currentRoom.building.name
          : null;
      }
      default:
        return null;
    }
  });
</script>

<div class="map-container">
  <!-- <button
    onclick={() =>
      console.log(
        /**
         *
         * zoom 15.238803882144735 bearing -154.48049706309405
         * LAT 14.16283754850545 LONG 121.24224620509085
         */

        mapInstance?.getZoom(),
        mapInstance?.getBearing(),
        mapInstance?.getCenter(),
      )}
    style="position:fixed; left:50%; top:50%; z-index: 100;">log map</button
  > -->
  <MapLibre
    bind:map={mapStore.mapInstance}
    style="/liberty-customized.json"
    maxBounds={[
      [121.22951431520816, 14.143739048514412],
      [121.28117994803134, 14.18059150108623],
    ]}
    center={[121.24224620509085, 14.16283754850545]}
    zoom={15.24}
    pitch={20}
    bearing={-154.48}
    minZoom={13}
    class="map"
  >
    {#if locationStore.coords}
      <Marker lngLat={locationStore.coords}>
        <div class="user-location-pin"></div>
      </Marker>
    {/if}
    {#each buildings as building}
      {#if building.lat && building.lon}
        <Marker
          lngLat={[building.lon, building.lat]}
          onclick={() => handleMarkerClick(building.building_name)}
        >
          <div
            class="pin"
            class:active={activeBuildingName === building.building_name}
            title={building.building_name}
          >
            <University size="20" />
            <div
              class="pin-label"
              class:active={zoomLevel >= 17}
              transition:fade
            >
              {building.building_name}
            </div>
          </div>
        </Marker>
      {/if}
    {/each}
  </MapLibre>
</div>

<style>
  .map-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .user-location-pin {
    width: 1rem;
    height: 1rem;
    background-color: #4285f4;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 70;
  }
  .user-location-pin::after {
    content: "";
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border-radius: 50%;
    border: 2px solid #4285f4;
    animation: pulsate 2s ease-out infinite;
    opacity: 0;
  }
  @keyframes pulsate {
    0% {
      transform: scale(0.5);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  .pin {
    line-height: 0;
    padding: 0.25rem;
    color: white;
    background-color: hsl(5, 53%, 32%);
    border: 2px solid white;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    box-shadow: 0 2px 0.25rem rgba(0, 0, 0, 0.3);
    transition:
      transform 0.2s,
      scale 1.5s;

    &.active {
      z-index: 60;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        outline: 0.125rem solid hsl(5, 53%, 40%);
        outline-offset: 0.125rem;
      }
      .pin-label {
        background-color: hsl(5, 53%, 32%);
        color: white;
        opacity: 1;
      }
    }
    .pin-label {
      line-height: initial;
      color: black;
      position: absolute;
      bottom: calc(100% + 0.5rem);
      left: 50%;
      translate: -50% 0;
      background-color: white;
      border-radius: 0.5rem;
      padding: 0.25rem 0.75rem;
      width: max-content;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
      &.active {
        opacity: 1;
      }
    }
  }

  .pin:hover {
    background-color: hsl(5, 53%, 40%);

    .pin-label {
      opacity: 1;
    }
  }
</style>
