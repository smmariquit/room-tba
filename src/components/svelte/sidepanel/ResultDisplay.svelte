<script lang="ts">
  import { getAppData } from "../../../lib/context";
  import type { RoomData } from "../../../lib/types";
  import RoomDisplay from "./RoomDisplay.svelte";

  const MAX_DISPLAY_RESULT = 12;
  const { classesMap } = getAppData();
  let paginateOffset = $state(0);

  interface Props {
    filteredRooms: RoomData[];
  }
  const { filteredRooms }: Props = $props();

  const paginatedRooms = $derived(
    filteredRooms.slice(
      paginateOffset * MAX_DISPLAY_RESULT,
      (paginateOffset + 1) * MAX_DISPLAY_RESULT,
    ),
  );
  const maxPaginateOffset = $derived(
    Math.max(1, Math.ceil(filteredRooms.length / MAX_DISPLAY_RESULT)),
  );
</script>

<div class="rooms-section">
  <h3 class="rooms-subtitle">Rooms in the building</h3>
  <div class="room-list">
    {#each paginatedRooms as room (room.id)}
      <RoomDisplay
        {room}
        searchInput=""
        classes={classesMap.get(room.code) || []}
      />
    {/each}

    {#if filteredRooms.length === 0}
      <div class="no-results">No rooms found for this building.</div>
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

<style>
  .rooms-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem; /* 8px gap */
    flex: 1 1 0;
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
    flex: 1 0 0;
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
    background-color: #7b1113;
    border: 1px solid #7b1113;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.125s;
    color: white;
  }

  .pagination-btn:hover:not(:disabled) {
    background-color: #9a1517;
    border-color: #9a1517;
  }

  .pagination-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-info {
    font-size: 0.875rem;
    color: #666;
  }
</style>
