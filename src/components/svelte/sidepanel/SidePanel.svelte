<script lang="ts">
  import Search from "../search/Search.svelte";
  import { locationStore, queryStore } from "../../../lib/store.svelte";
  import BuildingResult from "./BuildingQuery.svelte";
  import CollegeResult from "./CollegeResult.svelte";
  import DivisionResult from "./DivisionResult.svelte";
  import RoomResult from "../room/RoomResult.svelte";
</script>

<div class="side-panel-wrapper">
  <Search />
  <div class="side-panel-controls">
    <button
      class="my-location-btn"
      onclick={() => locationStore.requestLocation()}
      title="My Location"
      aria-label="My Location"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="2" x2="5" y1="12" y2="12" />
        <line x1="19" x2="22" y1="12" y2="12" />
        <line x1="12" x2="12" y1="2" y2="5" />
        <line x1="12" x2="12" y1="19" y2="22" />
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
    {#if queryStore.type === "result"}
      <div class="side-panel-content">
        {#if queryStore.category === "building"}
          <BuildingResult />
        {:else if queryStore.category === "college"}
          <CollegeResult />
        {:else if queryStore.category === "division"}
          <DivisionResult />
        {:else}
          <RoomResult />
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .side-panel-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.75rem;
    flex: 1;
    pointer-events: none;
  }
  .side-panel-content {
    background-color: white;
    border-radius: 0.8125rem; /* 24px */
    padding: 1.125rem; /* 18px top/bottom, 24px left/right */
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    flex: 0 0 min(25.75rem, calc(50% - 4rem));

    box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.25);
  }
  .side-panel-controls {
    display: flex;
    /* flex-direction: column; */
    flex: 1;
    align-items: flex-end;
    flex-direction: row-reverse;
    justify-content: space-between;
    gap: 1rem;
  }

  /* Mobile responsiveness for side panel */
  @media screen and (max-width: 48rem) {
    .side-panel-wrapper {
      position: relative;
      margin: 0;
      width: 100%;
      max-width: 100%;
      flex: 1;
      pointer-events: none; /* Let clicks pass through empty space */
      display: flex;
      flex-direction: column;
      justify-content: space-between; /* Space between search top and panel bottom */
    }
    .side-panel-controls {
      flex-direction: column;
      justify-content: flex-end;
      /* align-items: flex-end; */
    }

    .side-panel-content {
      width: 100%;
      flex: 0 0 50%;
    }
    /* .side-panel-content {
      flex: none;
      margin-top: auto;
      max-height: 45vh;
      box-shadow: 0px -4px 12px rgba(0, 0, 0, 0.1);
    } */
  }
  .my-location-btn {
    pointer-events: auto;
    background-color: white;
    border: 1px solid #ececec;
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: hsl(5, 53%, 32%);
    transition:
      background-color 0.2s,
      transform 0.2s;

    &:hover {
      background-color: hsl(5, 53%, 98%);
      transform: scale(1.05);
    }
  }
</style>
