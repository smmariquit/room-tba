<script lang="ts">
  import {
    queryStore,
    locationStore,
    building3DStore,
  } from "../../../lib/store.svelte";
  import { getAppData } from "../../../lib/context";
  import ResultDisplay from "./ResultDisplay.svelte";
  import { Box, CornerRightUp } from "@lucide/svelte";

  const { rooms, buildings } = getAppData();

  const building = $derived(
    buildings.find((b) => b.building_name === queryStore.queryValue),
  );

  const buildingRooms = $derived(
    rooms.filter((room) => room.building?.name === queryStore.queryValue),
  );
</script>

<div class="building-query-wrapper">
  {#if building}
    <div class="building-header">
      <h2 class="building-title">{building.building_name}</h2>
      {#if building.directions}
        <p class="building-desc">{building.directions}</p>
      {/if}
      {#if building.lon && building.lat}
        <div class="building-actions">
          <button
            class="get-directions-btn"
            onclick={() => {
              locationStore.requestLocation();
              locationStore.setDestination([
                building.lon ?? 0,
                building.lat ?? 0,
              ]);
            }}
          >
            Get Directions
            <CornerRightUp size={18} />
          </button>
          <button
            class="view-3d-btn"
            onclick={() => building3DStore.open(building.building_name)}
          >
            View in 3D
            <Box size={18} />
          </button>
        </div>
      {/if}
    </div>
  {/if}
  <ResultDisplay filteredRooms={buildingRooms} />
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

  .building-desc {
    font-size: 0.75rem; /* 12px */
    color: #4f4f4f;
    margin: 0;
    line-height: 1.5;
  }

  .building-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .get-directions-btn,
  .view-3d-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    width: max-content;
  }

  .get-directions-btn {
    background-color: #7b1113;
    color: white;
  }

  .get-directions-btn:hover {
    background-color: #9a1517;
  }

  .view-3d-btn {
    background-color: white;
    color: #7b1113;
    border: 1px solid #d8b9ba;
  }

  .view-3d-btn:hover {
    background-color: #fdf3f3;
  }
</style>
