<script lang="ts">
  import { getAppData } from "../../../lib/context";
  import { queryStore } from "../../../lib/store.svelte";

  // script code
  const { classesMap, rooms } = getAppData();
  const filteredRooms = rooms.filter((room) =>
    classesMap
      .get(room.code)
      ?.some((classItem) =>
        classItem.courseCode?.toLowerCase().includes(queryStore.inputValue),
      ),
  );
</script>

<div>
  <h3>Rooms that have classes for {queryStore.inputValue}</h3>
  {#each filteredRooms as room}
    <div>{room.code}</div>
  {/each}
</div>

<style>
  /* styling for website goes here */
</style>
