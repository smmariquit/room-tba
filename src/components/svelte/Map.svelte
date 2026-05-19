<script lang="ts">
  import { MapLibre, Marker } from "svelte-maplibre";
  import { getAppData } from "../../lib/context";
  import {
    queryStore,
    locationStore,
    mapStore,
    jeepneyStore,
    dormFilter,
  } from "../../lib/store.svelte";
  import { untrack } from "svelte";
  import { fade } from "svelte/transition";
  import MapLibreGlDirections from "@maplibre/maplibre-gl-directions";
  import { University, Home } from "@lucide/svelte";
  import { MediaQuery } from "svelte/reactivity";
  import * as mapGl from "maplibre-gl";
  import {
    JEEPNEY_ROUTES,
    type JeepneyRoute,
    type JeepneyStop,
  } from "../../constants/jeepney-routes";
  const { buildings, rooms, dorms } = getAppData();
  const filteredDorms = $derived(
    dormFilter.value === "all"
      ? dorms
      : dormFilter.value === "up"
        ? dorms.filter((d) => d.is_up_managed)
        : dorms.filter((d) => !d.is_up_managed),
  );
  let directions: MapLibreGlDirections | undefined = $state.raw();

  const JEEPNEY_ROUTE_SOURCE_ID = "jeepney-route-line";
  const JEEPNEY_ROUTE_LAYER_ID = "jeepney-route-line";
  const JEEPNEY_ROUTE_LAYER_CASING_ID = "jeepney-route-line-casing";

  let activeRouteId = $state<string | null>(null);
  let activeRouteStops = $state<JeepneyStop[]>([]);
  let activeRouteColor = $state<string>("#dc2626");

  async function fetchRouteGeometry(
    route: JeepneyRoute,
  ): Promise<GeoJSON.LineString | null> {
    if (route.stops.length < 2) return null;
    const coordsParam = route.stops
      .map((stop) => `${stop.lon},${stop.lat}`)
      .join(";");
    const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        routes?: { geometry?: GeoJSON.LineString }[];
      };
      const geometry = data.routes?.[0]?.geometry;
      if (!geometry || geometry.type !== "LineString") return null;
      return geometry;
    } catch {
      return null;
    }
  }

  function buildStraightLineGeometry(
    route: JeepneyRoute,
  ): GeoJSON.LineString {
    return {
      type: "LineString",
      coordinates: route.stops.map((stop) => [stop.lon, stop.lat]),
    };
  }

  function ensureJeepneyRouteLayers(map: mapGl.MapLibreMap, color: string) {
    if (!map.getSource(JEEPNEY_ROUTE_SOURCE_ID)) {
      map.addSource(JEEPNEY_ROUTE_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
    }

    if (!map.getLayer(JEEPNEY_ROUTE_LAYER_CASING_ID)) {
      map.addLayer({
        id: JEEPNEY_ROUTE_LAYER_CASING_ID,
        type: "line",
        source: JEEPNEY_ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 8,
          "line-opacity": 0.95,
        },
      });
    }

    if (!map.getLayer(JEEPNEY_ROUTE_LAYER_ID)) {
      map.addLayer({
        id: JEEPNEY_ROUTE_LAYER_ID,
        type: "line",
        source: JEEPNEY_ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": color,
          "line-width": 5,
          "line-opacity": 0.95,
        },
      });
    } else {
      map.setPaintProperty(JEEPNEY_ROUTE_LAYER_ID, "line-color", color);
    }
  }

  function clearJeepneyRouteLayers(map: mapGl.MapLibreMap) {
    if (map.getLayer(JEEPNEY_ROUTE_LAYER_ID)) {
      map.removeLayer(JEEPNEY_ROUTE_LAYER_ID);
    }
    if (map.getLayer(JEEPNEY_ROUTE_LAYER_CASING_ID)) {
      map.removeLayer(JEEPNEY_ROUTE_LAYER_CASING_ID);
    }
    if (map.getSource(JEEPNEY_ROUTE_SOURCE_ID)) {
      map.removeSource(JEEPNEY_ROUTE_SOURCE_ID);
    }
  }

  function fitMapToRoute(map: mapGl.MapLibreMap, route: JeepneyRoute) {
    if (route.stops.length === 0) return;
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const stop of route.stops) {
      if (stop.lon < minLng) minLng = stop.lon;
      if (stop.lon > maxLng) maxLng = stop.lon;
      if (stop.lat < minLat) minLat = stop.lat;
      if (stop.lat > maxLat) maxLat = stop.lat;
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        duration: 1200,
        pitch: 30,
      },
    );
  }

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

    // Also highlight dorm buildings on the 3D map
    for (const dorm of dorms) {
      if (dorm.lat === null || dorm.lon === null) continue;

      const feature = findBuildingFeatureAt(map, dorm.lon, dorm.lat);
      if (!feature) continue;
      if (
        feature.geometry.type !== "Polygon" &&
        feature.geometry.type !== "MultiPolygon"
      ) {
        continue;
      }

      const matchedPolygon = pickPolygonContainingPoint(
        feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        dorm.lon,
        dorm.lat,
      );
      if (!matchedPolygon) continue;

      const key = `dorm:${getFeatureKey(feature)}|${dorm.lon.toFixed(6)},${dorm.lat.toFixed(6)}`;
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
    const selectedId = jeepneyStore.selectedRouteId;
    const map = mapStore.mapInstance;
    if (!map) return;

    let cancelled = false;

    const apply = async () => {
      const route = selectedId
        ? (JEEPNEY_ROUTES.find((r) => r.id === selectedId) ?? null)
        : null;

      if (!route) {
        clearJeepneyRouteLayers(map);
        activeRouteId = null;
        activeRouteStops = [];
        return;
      }

      activeRouteId = route.id;
      activeRouteStops = route.stops;
      activeRouteColor = route.color;

      const ensureLayersAndPaint = (geometry: GeoJSON.LineString) => {
        if (cancelled) return;
        ensureJeepneyRouteLayers(map, route.color);
        const source = map.getSource(JEEPNEY_ROUTE_SOURCE_ID) as
          | mapGl.GeoJSONSource
          | undefined;
        const featureCollection: GeoJSON.FeatureCollection<GeoJSON.LineString> =
          {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry,
                properties: { routeId: route.id },
              },
            ],
          };
        source?.setData(featureCollection);
      };

      const drawWhenReady = (action: () => void) => {
        if (map.isStyleLoaded()) action();
        else map.once("load", action);
      };

      drawWhenReady(() => {
        ensureJeepneyRouteLayers(map, route.color);
        ensureLayersAndPaint(buildStraightLineGeometry(route));
        fitMapToRoute(map, route);
      });

      const snapped = await fetchRouteGeometry(route);
      if (!cancelled && snapped) {
        drawWhenReady(() => ensureLayersAndPaint(snapped));
      }
    };

    apply();

    return () => {
      cancelled = true;
    };
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
      } else if (category === "dorm") {
        const currentDorm = dorms.find(
          (dorm) => dorm.dorm_name === value,
        );
        if (currentDorm && currentDorm.lon && currentDorm.lat) {
          map.flyTo({
            center: [currentDorm.lon, currentDorm.lat],
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

  function handleDormMarkerClick(dormName: string) {
    if (dormName === queryStore.inputValue) return;
    queryStore.updateQuery({
      category: "dorm",
      type: "result",
      value: dormName,
    });
    queryStore.inputValue = dormName;
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

  let activeDormName = $derived.by(() => {
    if (queryStore.category === "dorm" && queryStore.type === "result") {
      return queryStore.inputValue;
    }
    return null;
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
    {#if activeRouteId}
      {#each activeRouteStops as stop, i (`${activeRouteId}-${i}-${stop.name}`)}
        <Marker lngLat={[stop.lon, stop.lat]}>
          <div
            class="jeepney-stop-pin"
            style:--stop-color={activeRouteColor}
            title={stop.name}
          >
            <span class="stop-index">{i + 1}</span>
            <span class="stop-label" transition:fade>{stop.name}</span>
          </div>
        </Marker>
      {/each}
    {/if}
    {#each filteredDorms as dorm}
      {#if dorm.lat && dorm.lon}
        <Marker
          lngLat={[dorm.lon, dorm.lat]}
          onclick={() => handleDormMarkerClick(dorm.dorm_name)}
        >
          <div
            class="dorm-pin"
            class:active={activeDormName === dorm.dorm_name}
            class:private={!dorm.is_up_managed}
            title={dorm.dorm_name}
          >
            <Home size="18" />
            <div
              class="pin-label"
              class:active={zoomLevel >= 17}
              transition:fade
            >
              {dorm.dorm_name}
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

  .jeepney-stop-pin {
    --stop-color: #dc2626;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    background-color: var(--stop-color);
    border: 2px solid white;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
    cursor: default;
    position: relative;
    z-index: 50;
  }
  .jeepney-stop-pin .stop-index {
    pointer-events: none;
  }
  .jeepney-stop-pin .stop-label {
    position: absolute;
    bottom: calc(100% + 0.4rem);
    left: 50%;
    translate: -50% 0;
    background-color: white;
    color: hsl(0, 0%, 15%);
    border-radius: 0.5rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
  }
  .jeepney-stop-pin:hover .stop-label {
    opacity: 1;
  }

  .dorm-pin {
    line-height: 0;
    padding: 0.25rem;
    color: white;
    background-color: hsl(170, 50%, 35%);
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
        outline: 0.125rem solid hsl(170, 50%, 45%);
        outline-offset: 0.125rem;
      }
      .pin-label {
        background-color: hsl(170, 50%, 35%);
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

  .dorm-pin:hover {
    background-color: hsl(170, 50%, 45%);

    .pin-label {
      opacity: 1;
    }
  }

  .dorm-pin.private {
    background-color: hsl(25, 70%, 50%);

    &.active {
      &::before {
        outline-color: hsl(25, 70%, 60%);
      }
      .pin-label {
        background-color: hsl(25, 70%, 50%);
      }
    }
  }

  .dorm-pin.private:hover {
    background-color: hsl(25, 70%, 60%);
  }
</style>
