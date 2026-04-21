<script lang="ts">
  import { queryStore, type QueryStoreState } from "../../../lib/store.svelte";
  import {
    ArrowUpRight,
    BookText,
    DoorClosed,
    GraduationCap,
    School,
    University,
  } from "@lucide/svelte";
  let {
    value,
    category,
  }: {
    value: string;
    category: Exclude<QueryStoreState["category"], null>;
  } = $props();

  const pattern = $derived(
    new RegExp(`(${queryStore.inputValue.trim()})`, "gi"),
  );
  function highlightSearch(original: string, pattern: RegExp): string {
    return queryStore.inputValue.length < 2
      ? original
      : original.replaceAll(pattern, (substr) => `<strong>${substr}</strong>`);
  }

  function handleSuggestionClick() {
    queryStore.updateQuery({
      type: "result",
      category,
      value,
    });
    queryStore.inputValue = value;
  }
</script>

{#snippet icon(type: typeof category)}
  <span class="icon">
    {#if type === "building"}
      <University size={20} />
    {:else if type === "division"}
      <School size={20} />
    {:else if type === "college"}
      <GraduationCap size={20} />
    {:else if type === "room"}
      <DoorClosed size={20} />
    {:else if type === "class"}
      <BookText size={20} />
    {/if}
  </span>
{/snippet}

<button class="suggestion" onclick={handleSuggestionClick}>
  {@render icon(category)}
  <div class="text">{@html highlightSearch(value, pattern)}</div>
  <ArrowUpRight size={20} style={"margin-left:auto"} class="icon" />
</button>

<style>
  .suggestion {
    all: unset;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border-radius: 0.75rem;
    &:hover {
      background-color: hsl(0, 0%, 95%);
    }
  }

  :global(.icon) {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
    flex-shrink: 0;
  }

  .text {
    font-size: 0.875rem;
    color: #18181b; /* zinc-900 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (max-width: 425px) {
    .suggestion {
      padding: 0.5rem;
    }
  }
</style>
