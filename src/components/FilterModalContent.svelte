<script lang="ts">
  import { filterStore } from "../lib/store.svelte";

  const { buildings, colleges, divisions } = filterStore.getData();
</script>

<div class="filters-wrap">
  <h2>Buildings</h2>
  <div class="filters">
    {#each buildings as { building_name }}
      <div>{building_name.replace(" Building", "")}</div>
    {/each}
  </div>
  <h2>Colleges</h2>
  <div class="filters">
    {#each colleges as { college_name }}
      <div>{college_name.replace("College of ", "")}</div>
    {/each}
  </div>
  <h2>Divisions</h2>
  <div class="filters">
    {#each divisions as { division_name }}
      <div>{division_name.replace(/(Department\ of |Institute\ of)/, "")}</div>
    {/each}
  </div>
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
  }
  .filters-wrap {
    overflow-y: auto;
  }
</style>
