<script lang="ts">
  import { queryStore } from "../../../lib/store.svelte";
  import { getAppData } from "../../../lib/context";
  import ResultDisplay from "./ResultDisplay.svelte";

  const { rooms, colleges } = getAppData();

  const college = $derived(
    colleges.find((c) => c.college_name === queryStore.queryValue),
  );

  const collegeRooms = $derived(
    rooms.filter((room) => room.collegeName === queryStore.queryValue),
  );
</script>

<div class="college-query-wrapper">
  {#if college}
    <div class="college-header">
      <h2 class="college-title">{college.college_name}</h2>
    </div>
  {/if}

  <ResultDisplay filteredRooms={collegeRooms} />
</div>

<style>
  .college-query-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* 12px gap from design */
    width: 100%;
    flex: 1 1 0;
    overflow-y: auto;
  }

  .college-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem; /* 4px gap */
    width: 100%;
    flex-shrink: 0;
  }

  .college-title {
    font-size: 1.125rem; /* 18px */
    font-weight: bold;
    color: black;
    margin: 0;
    line-height: 1.25rem; /* 20px */
  }
</style>
