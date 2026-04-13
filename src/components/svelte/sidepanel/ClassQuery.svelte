<script lang="ts">
  import { getAppData } from "../../../lib/context";
  import { queryStore } from "../../../lib/store.svelte";
  import RoomDisplay from "./RoomDisplay.svelte";

  const { classesMap, rooms } = getAppData();

  const filteredRooms = $derived(
    rooms
      .filter((room) =>
        classesMap
          .get(room.code)
          ?.some((classItem) =>
            classItem.courseCode
              ?.toLowerCase()
              .includes(queryStore.queryValue.toLowerCase()),
          ),
      )
      .map((room) => ({
        room,
        classes: classesMap.get(room.code) || [],
      })),
  );
</script>

<div class="class-query-container">
  <div class="header">
    <h2 class="title">Rooms with classes for</h2>
    <span class="search-term">"{queryStore.queryValue}"</span>
  </div>

  <div class="results-list">
    {#if filteredRooms.length > 0}
      {#each filteredRooms as { room, classes }}
        <RoomDisplay {room} searchInput={queryStore.queryValue} {classes} />
      {/each}
    {:else}
      <div class="no-results">
        <p>No rooms found with classes matching this course code.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .class-query-container {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    gap: 1rem;
    height: 100%;
    overflow: auto;
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .title {
    font-size: 0.875rem;
    color: #666;
    margin: 0;
    font-weight: 500;
  }

  .search-term {
    font-size: 1.25rem;
    font-weight: 600;
    color: #7b1113; /* UP Maroon */
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    overflow-y: auto;
    padding-right: 0.25rem;
    flex: 1;
  }

  /* Custom scrollbar for better look */
  .results-list::-webkit-scrollbar {
    width: 4px;
  }

  .results-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .results-list::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 10px;
  }

  .no-results {
    padding: 2rem 1rem;
    text-align: center;
    color: #969696;
    font-size: 0.875rem;
  }
</style>
