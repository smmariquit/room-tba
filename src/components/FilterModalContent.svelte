<script lang="ts">
  import { filterStore } from "../lib/store.svelte";

  const { buildings, colleges, divisions } = filterStore.getData();
  let type: "buildings" | "colleges" | "divisions" = $state("buildings");
  $inspect(filterStore.filterData.filter);
</script>

<div class="filters-wrap">
  <button onclick={() => (type = "buildings")}>Buildings</button>
  <button onclick={() => (type = "colleges")}>Colleges</button>
  <button onclick={() => (type = "divisions")}>Divisions</button>
  {#if type === "buildings"}
    <h2>Buildings</h2>
    <div class="filters">
      {#each buildings as { building_name }}
        <div>{building_name.replace(" Building", "")}</div>
      {/each}
    </div>
  {:else if type === "colleges"}
    <h2>Colleges</h2>
    <div class="filters">
      {#each colleges as { college_name }}
        <div>{college_name.replace("College of ", "")}</div>
      {/each}
    </div>
  {:else}
    <h2>Divisions</h2>
    <div class="filters">
      {#each divisions as { division_name }}
        <button
          onclick={() => filterStore.setFilter("division", division_name)}
        >
          {division_name.replace(/(Department\ of |Institute\ of)/, "")}
        </button>
      {/each}
    </div>
  {/if}
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
