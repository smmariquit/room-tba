<script lang="ts">
  import { queryStore } from "../../lib/store.svelte";
  import { getAppData } from "../../lib/context";
  import RoomDisplay from "./RoomDisplay.svelte";

  const { rooms, classesMap } = getAppData();

  const MAX_DISPLAY_RESULT = 14;
  let paginateOffset = $state(0);

  const buildingRooms = $derived(
    rooms.filter((room) => room.building?.name === queryStore.value),
  );

  const paginatedRooms = $derived(
    buildingRooms.slice(
      paginateOffset * MAX_DISPLAY_RESULT,
      (paginateOffset + 1) * MAX_DISPLAY_RESULT,
    ),
  );

  const maxPaginateOffset = $derived(
    Math.max(1, Math.ceil(buildingRooms.length / MAX_DISPLAY_RESULT)),
  );

  $effect(() => {
    // Reset pagination when building changes
    queryStore.value;
    paginateOffset = 0;
  });
</script>

<div class="building-query-wrapper">
  <div class="room-list">
    {#each paginatedRooms as room (room.id)}
      <RoomDisplay
        {room}
        searchInput=""
        classes={classesMap.get(room.code) || []}
      />
    {/each}

    {#if buildingRooms.length === 0}
      <div class="no-results">No rooms found for this building.</div>
    {/if}
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
    gap: 1rem;
    width: 100%;
    flex: 1;
    overflow: hidden;
  }

  .room-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
