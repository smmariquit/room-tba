<script lang="ts">
  import { queryStore } from "../../../lib/store.svelte";
  import { getAppData } from "../../../lib/context";
  import ResultDisplay from "./ResultDisplay.svelte";

  const { rooms, divisions } = getAppData();

  const division = $derived(
    divisions.find((d) => d.division_name === queryStore.queryValue),
  );

  const divisionRooms = $derived(
    rooms.filter((room) => room.divisionName === queryStore.queryValue),
  );
</script>

<div class="division-query-wrapper">
  {#if division}
    <div class="division-header">
      <h2 class="division-title">{division.division_name}</h2>
    </div>
  {/if}

  <ResultDisplay filteredRooms={divisionRooms} />
</div>

<style>
  .division-query-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* 12px gap from design */
    width: 100%;
    flex: 1 1 0;
    overflow-y: auto;
  }

  .division-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem; /* 4px gap */
    width: 100%;
    flex-shrink: 0;
  }

  .division-title {
    font-size: 1.125rem; /* 18px */
    font-weight: bold;
    color: black;
    margin: 0;
    line-height: 1.25rem; /* 20px */
  }
</style>
