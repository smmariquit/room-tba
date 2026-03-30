<script lang="ts">
  import { FillExtrusionLayer, MapLibre, Marker } from "svelte-maplibre";
  import * as maplibre from "maplibre-gl";
  import { getAppData } from "../../lib/context";
  import { queryStore } from "../../lib/store.svelte";
  import { untrack } from "svelte";

  const { buildings, rooms } = getAppData();
  let mapInstance: maplibre.MapLibreMap | undefined = $state.raw();

  $effect(() => {
    const category = queryStore.category;
    const type = queryStore.type;
    const value = queryStore.value;
    const map = mapInstance;

    if (!map) return;

    untrack(() => {
      if (category === "building" && type === "result") {
        const currentBuilding = buildings.find(
          (building) => building.building_name === value,
        );

        if (currentBuilding && currentBuilding.lon && currentBuilding.lat)
          map.flyTo({
            center: [currentBuilding.lon, currentBuilding.lat],
            zoom: 18,
            duration: 1500,
          });
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
            duration: 1500,
          });
        }
      }
    });
  });

  function handleMarkerClick(buildingName: string) {
    queryStore.updateQuery({
      category: "building",
      type: "result",
    });
    queryStore.value = buildingName;
  }

  let activeBuildingName = $derived.by(() => {
    if (!queryStore.category || queryStore.type !== "result") return null;
    switch (queryStore.category) {
      case "building":
        return queryStore.value;
      case "room": {
        const currentRoom = rooms.find(
          (room) => room.code === queryStore.value,
        );
        return currentRoom && currentRoom.building ? currentRoom.building.name : null;
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
    bind:map={mapInstance}
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
          ></div>
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

  .pin {
    width: 1.25rem;
    height: 1.25rem;
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
      scale: 1.75;
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
    transform: scale(1.2);
    background-color: hsl(5, 53%, 40%);
  }
</style>
