<script lang="ts">
  import { getAppData } from "../../../lib/context";
  import { modalStore, queryStore } from "../../../lib/store.svelte";
  import type { QueryStoreState } from "../../../lib/store.svelte";

  const { buildings, colleges, divisions } = getAppData();
  let type: "buildings" | "colleges" | "divisions" = $state("buildings");

  function filterButtonClick(
    filter_type: Exclude<QueryStoreState["category"], "room" | null>,
    filter_name: string,
  ) {
    return () => {
      queryStore.updateQuery({ type: "result", category: filter_type }, filter_name);
      modalStore.closeModal();
    };
  }
</script>

<div class="filters-wrap">
  <div class="filter-controls">
    <button
      class:active={type === "buildings"}
      onclick={() => (type = "buildings")}
      id="building-button">Buildings</button
    >
    <button
      class:active={type === "colleges"}
      onclick={() => (type = "colleges")}>Colleges</button
    >
    <button
      class:active={type === "divisions"}
      onclick={() => (type = "divisions")}>Divisions</button
    >
  </div>
  <div class="filters">
    {#if type === "buildings"}
      {#each buildings as { building_name }}
        <button
          class="filter-button"
          onclick={filterButtonClick("building", building_name)}
          >{building_name.replace(" Building", "")}</button
        >
      {/each}
    {:else if type === "colleges"}
      {#each colleges as { college_name }}
        <button
          class="filter-button"
          onclick={filterButtonClick("college", college_name)}
          >{college_name.replace("College of ", "")}</button
        >
      {/each}
    {:else}
      {#each divisions as { division_name }}
        <button
          class="filter-button"
          onclick={filterButtonClick("division", division_name)}
        >
          {division_name.replace(/(Department\ of |Institute\ of)/, "")}
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .filter-controls {
    margin-bottom: 1rem;
    button.active {
      border-color: transparent;
      background-color: hsl(5, 53%, 32%);
      color: white;
    }
  }
  .filters-wrap {
    overflow-y: auto;
    button {
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      border: 1px solid hsl(0, 0%, 83%);
      transition: all 0.125s;
      &:hover:not(.active),
      &:focus-visible:not(.active) {
        border-color: hsl(5, 53%, 32%);
        color: hsl(5, 53%, 32%);
      }
    }
  }
</style>
