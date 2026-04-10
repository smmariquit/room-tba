<script lang="ts">
  import Search from "../search/Search.svelte";
  import { queryStore } from "../../../lib/store.svelte";
  import BuildingResult from "./BuildingResult.svelte";
  import CollegeResult from "./CollegeResult.svelte";
  import DivisionResult from "./DivisionResult.svelte";
  import RoomResult from "../room/RoomResult.svelte";
  import ClassQuery from "./ClassQuery.svelte";
</script>

<div class="side-panel-wrapper">
  <Search />
  {#if queryStore.category !== null}
    <div class="side-panel-content">
      {#if queryStore.category === "building"}
        <BuildingResult />
      {:else if queryStore.category === "college"}
        <CollegeResult />
      {:else if queryStore.category === "division"}
        <DivisionResult />
      {:else if queryStore.category === "room"}
        <RoomResult />
      {:else if queryStore.category === "class"}
        <ClassQuery />
      {/if}
    </div>
  {/if}
</div>

<style>
  .side-panel-wrapper {
    position: relative;
    width: min(25.75rem, calc(50% - 4rem));
    max-width: calc(100% - 2.625rem);
    display: flex;
    flex-direction: column;
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
    flex: 1 1 0;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.25);
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

    .side-panel-content {
      flex: none;
      margin-top: auto;
      max-height: 45vh;
      box-shadow: 0px -4px 12px rgba(0, 0, 0, 0.1);
    }
  }
</style>
