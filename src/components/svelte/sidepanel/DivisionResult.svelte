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

<div class="building-query-wrapper">
  {#if division}
    <div class="building-header">
      <h2 class="building-title">{division.division_name}</h2>
    </div>
  {/if}

  <ResultDisplay filteredRooms={divisionRooms} />
</div>

<style>
  .building-query-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* 12px gap from design */
    width: 100%;
    flex: 1 1 0;
    overflow-y: auto;
  }

  .building-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem; /* 4px gap */
    width: 100%;
    flex-shrink: 0;
  }

  .building-title {
    font-size: 1.125rem; /* 18px */
    font-weight: bold;
    color: black;
    margin: 0;
    line-height: 1.25rem; /* 20px */
  }

  .rooms-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem; /* 8px gap */
    flex: 1;
    overflow: hidden;
    flex-shrink: 1;
  }

  .rooms-subtitle {
    font-size: 0.875rem; /* 14px */
    font-weight: bold;
    color: #4c4c4c;
    margin: 0;
    line-height: normal;
    flex-shrink: 0;
  }

  .room-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem; /* 4px gap */
    flex: 1;
    overflow-y: auto;
  }

  .no-results {
    color: #666;
    font-size: 0.875rem;
    text-align: center;
    padding: 1rem 0;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-top: 1px solid #ececec;
    flex-shrink: 0;
  }

  .pagination-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    background-color: white;
    border: 1px solid #ececec;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.125s;
    color: black;
  }

  .pagination-btn:hover:not(:disabled) {
    border-color: hsl(5, 53%, 32%);
    background-color: hsl(5, 53%, 98%);
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-info {
    font-size: 0.875rem;
    color: #666;
  }
</style>
