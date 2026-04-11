<script lang="ts">
  import { FillExtrusionLayer, MapLibre, Marker } from "svelte-maplibre";
  import { getAppData } from "../../lib/context";
  import { queryStore, locationStore, mapStore } from "../../lib/store.svelte";
  import { untrack } from "svelte";
  import { fade } from "svelte/transition";
  import MapLibreGlDirections from "@maplibre/maplibre-gl-directions";
  const { buildings, rooms } = getAppData();
  let directions: MapLibreGlDirections | undefined = $state.raw();

  let animationFrameId: number | null = $state(null);

  let isRotating = $state(false);
  let lastTimestamp = $state(0);
  let currentRotation = $state(0);
  let zoomLevel = $state(0);

  function rotateCamera(timestamp: number) {
    if (!mapStore.mapInstance || !isRotating) return;

    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    currentRotation = (currentRotation + delta / 150) % 360;
    mapStore.mapInstance.rotateTo(currentRotation, { duration: 0 });

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
            offset: [0, -24],
            duration: 1500,
          });
          map.once("moveend", startRotation);
        }
      } else if (category === null) {
        map.flyTo({
          center: [121.24224620509085, 14.16283754850545],
          zoom: 15.24,
          pitch: 60,
          bearing: -154.48,
          duration: 1500,
        });
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
            offset: [0, -24],
            pitch: 60,
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
    style="https://tiles.openfreemap.org/styles/liberty"
    maxBounds={[
      [121.225963, 14.150106],
      [121.254638, 14.172678],
    ]}
    center={[121.24224620509085, 14.16283754850545]}
    zoom={15.24}
    pitch={20}
    bearing={-154.48}
    minZoom={15.5}
    class="map"
  >
    <FillExtrusionLayer
      sourceLayer="building"
      paint={{
        "fill-extrusion-color": "#aaa",
        "fill-extrusion-height": ["get", "render_height"],
        "fill-extrusion-base": ["get", "render_min_height"],
        "fill-extrusion-opacity": 0.6,
      }}
      filter={["==", "extrude", "true"]}
    />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path
                d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"
              /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path
                d="M10 6h4"
              /><path d="M10 10h4" /><path d="M10 14h4" /><path
                d="M10 18h4"
              /></svg
            >
            <!-- {zoomLevel} -->
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
        outline: 0.125rem dashed hsl(5, 53%, 40%);
        outline-offset: 0.25rem;
        animation: rotating 3s 1.5s linear infinite;
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
  @keyframes rotating {
    from {
      rotate: 0deg;
    }
    to {
      rotate: 360deg;
    }
  }

  .pin:hover {
    background-color: hsl(5, 53%, 40%);

    .pin-label {
      opacity: 1;
    }
  }
</style>
