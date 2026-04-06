<script>
  import { getAppData } from "../../../lib/context";
  import { queryStore } from "../../../lib/store.svelte";
  import ScheduleRender from "../room/ScheduleRender.svelte";
  const { classesMap } = getAppData();
  const classes = $derived(classesMap.get(queryStore.value) ?? []);
</script>

{#if queryStore.category === "room" && queryStore.type === "result"}
  <ScheduleRender roomCode={queryStore.value} {classes} />
{/if}
