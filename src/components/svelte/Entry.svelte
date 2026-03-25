<script lang="ts">
  import { onMount, untrack } from "svelte";
  import * as maplibre from "maplibre-gl";
  import {
    filterStore,
    modalStore,
    currentRoomStore,
  } from "../../lib/store.svelte";
  import Modal from "./Modal.svelte";
  import SidePanel from "./SidePanel.svelte";
  import { getAppData } from "../../lib/context";
  import Map from "./Map.svelte";

  const { rooms, classesMap, buildings, divisions, colleges } = getAppData();

  onMount(() => {
    filterStore.setData([buildings, colleges, divisions]);
  });
</script>

<div class="app-layout">
  <Map />
  <div class="ui-layer">
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

  :global(*) {
    margin: unset;
    box-sizing: border-box;
  }
</style>
