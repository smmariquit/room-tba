<script lang="ts">
  import Modal from "./Modal.svelte";
  import SidePanel from "./SidePanel.svelte";
  import Map from "./Map.svelte";
</script>

<div class="app-layout">
  <Map />
  <div class="ui-layer">
    <header class="top-header">
      <h2>Room TBA</h2>
    </header>
    <SidePanel />
  </div>
  <Modal />
</div>

<style>
  .app-layout {
    width: 100%;
    height: 100dvh;
    overflow: hidden;
  }

  :global(.map) {
    width: 100%;
    height: 100%;
  }

  .ui-layer {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
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
