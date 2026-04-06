<script lang="ts">
  import { queryStore } from "../../../lib/store.svelte";
  import { getAppData } from "../../../lib/context";
  import RoomDisplay from "./RoomDisplay.svelte";

  const { rooms, classesMap, divisions } = getAppData();

  const MAX_DISPLAY_RESULT = 12;
  let paginateOffset = $state(0);

  const division = $derived(
    divisions.find((d) => d.division_name === queryStore.value),
  );

  const divisionRooms = $derived(
    rooms.filter((room) => room.divisionName === queryStore.value),
  );

  const paginatedRooms = $derived(
    divisionRooms.slice(
      paginateOffset * MAX_DISPLAY_RESULT,
      (paginateOffset + 1) * MAX_DISPLAY_RESULT,
    ),
  );

  const maxPaginateOffset = $derived(
    Math.max(1, Math.ceil(divisionRooms.length / MAX_DISPLAY_RESULT)),
  );

  $effect(() => {
    // Reset pagination when division changes
    queryStore.value;
    paginateOffset = 0;
  });
</script>

<div class="building-query-wrapper">
  {#if division}
    <div class="building-header">
      <h2 class="building-title">{division.division_name}</h2>
    </div>
  {/if}

  <div class="rooms-section">
    <h3 class="rooms-subtitle">Rooms in this division</h3>
    <div class="room-list">
      {#each paginatedRooms as room (room.id)}
        <RoomDisplay
          {room}
          searchInput=""
          classes={classesMap.get(room.code) || []}
        />
      {/each}

      {#if divisionRooms.length === 0}
        <div class="no-results">No rooms found for this division.</div>
      {/if}
    </div>
  </div>

  {#if maxPaginateOffset > 1}
    <div class="pagination">
      <button
        class="pagination-btn"
        disabled={paginateOffset === 0}
        onclick={() => (paginateOffset -= 1)}
      >
        Previous
      </button>
      <span class="page-info">
        {paginateOffset + 1} of {maxPaginateOffset}
      </span>
      <button
        class="pagination-btn"
        disabled={paginateOffset === maxPaginateOffset - 1}
        onclick={() => (paginateOffset += 1)}
      >
        Next
      </button>
    </div>
  {/if}
</div>

<style>
  .building-query-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* 12px gap from design */
    width: 100%;
    flex: 1;
    overflow: hidden;
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
