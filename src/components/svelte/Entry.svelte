<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { MapLibre, Marker, FillExtrusionLayer } from "svelte-maplibre";
  import * as maplibre from "maplibre-gl";
  import type {
    BuildingData,
    ClassMapValue,
    CollegeData,
    DivisionData,
    RoomData,
  } from "../../lib/types";
  import {
    filterStore,
    modalStore,
    currentRoomStore,
  } from "../../lib/store.svelte";
  import Banner from "./Banner.svelte";
  import Modal from "./Modal.svelte";
  import SidePanel from "./SidePanel.svelte";
  import { getAppData } from "../../lib/context";

  const { rooms, classesMap, buildings, divisions, colleges } = getAppData();

  let mapInstance: maplibre.MapLibreMap | undefined = $state();

  onMount(() => {
    filterStore.setData([buildings, colleges, divisions]);
  });

  $effect(() => {
    if (currentRoomStore.roomData?.building) {
      const lat = currentRoomStore.roomData.building.lat;
      const lon = currentRoomStore.roomData.building.lon;
      if (lat && lon && mapInstance) {
        untrack(() => {
          mapInstance?.flyTo({ center: [lon, lat], zoom: 19, duration: 1500 });
        });
      }
    }
  });

  function handleMarkerClick(
    buildingName: string,
    lat: number | null,
    lon: number | null,
  ) {
    filterStore.setFilter("building", buildingName);
    modalStore.closeModal();
    if (mapInstance && lat && lon) {
      mapInstance.flyTo({ center: [lon, lat], zoom: 18, duration: 1500 });
    }
  }
</script>

<div class="app-layout">
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
            onclick={() =>
              handleMarkerClick(
                building.building_name,
                building.lat,
                building.lon,
              )}
          >
            <div class="pin" title={building.building_name}></div>
          </Marker>
        {/if}
      {/each}
    </MapLibre>
  </div>

  <div class="ui-layer">
    <Banner
      >⚠️ <strong>This app is in active development.</strong> There might be
      mistakes in room locations and building information. Please
      <a href="https://forms.gle/nVUMuuZgfW1HgXc98"
        ><strong>report any errors!</strong></a
      >
    </Banner>

    <header class="top-header">
      <h2>Room TBA</h2>
    </header>

    <SidePanel {rooms} {classesMap} />
  </div>

  {#if modalStore.open}
    <Modal />
  {/if}
</div>

<style>
  .app-layout {
    position: relative;
    width: 100%;
    height: 100dvh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family:
      "DM Sans",
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
  }

  .map-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  :global(.map) {
    width: 100%;
    height: 100%;
  }

  .ui-layer {
    position: relative;
    z-index: 10;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .ui-layer > * {
    pointer-events: auto;
  }

  .top-header {
    background-color: white;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    box-shadow: 0 2px 0.25rem rgba(0, 0, 0, 0.1);
  }

  .top-header h2 {
    font-weight: bold;
    font-size: 0.9375rem;
    margin: 0;
    color: black;
  }

  .pin {
    width: 1.25rem;
    height: 1.25rem;
    background-color: hsl(5, 53%, 32%);
    border: 2px solid white;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 0.25rem rgba(0, 0, 0, 0.3);
    transition: transform 0.2s;
  }

  .pin:hover {
    transform: scale(1.2);
    background-color: hsl(5, 53%, 40%);
  }

  :global(*) {
    margin: unset;
    box-sizing: border-box;
  }
</style>
