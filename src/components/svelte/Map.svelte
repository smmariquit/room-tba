<script lang="ts">
  import { FillExtrusionLayer, MapLibre, Marker } from "svelte-maplibre";
  import * as maplibre from "maplibre-gl";
  import { getAppData } from "../../lib/context";
  import { queryStore } from "../../lib/store.svelte";

  const { buildings } = getAppData();
  let mapInstance: maplibre.MapLibreMap | undefined = $state();

  $effect(() => {
    if (
      queryStore.category !== "building" ||
      queryStore.type !== "result" ||
      !mapInstance
    )
      return;

    const currentBuilding = buildings.find(
      (building) => building.building_name === queryStore.value,
    );

    if (
      typeof currentBuilding !== "undefined" &&
      currentBuilding.lon &&
      currentBuilding.lat
    )
      mapInstance.flyTo({
        center: [currentBuilding.lon, currentBuilding.lat],
        zoom: 18,
        duration: 1500,
      });
  });

  function handleMarkerClick(buildingName: string) {
    queryStore.updateQuery({
      category: "building",
      type: "result",
    });
    queryStore.value = buildingName;
  }
</script>

<div class="map-container">
  <MapLibre
    bind:map={mapInstance}
    style="https://tiles.openfreemap.org/styles/liberty"
    center={[121.2414408, 14.165158]}
    zoom={17}
    minZoom={16}
    pitch={60}
    maxBounds={[
      [121.225963, 14.150106],
      [121.254638, 14.172678],
    ]}
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
            class:active={queryStore.category === "building" &&
              queryStore.value === building.building_name}
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
