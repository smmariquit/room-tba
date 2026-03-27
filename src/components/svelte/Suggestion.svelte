<script lang="ts">
  import { queryStore, type QueryStoreState } from "../../lib/store.svelte";

  const suggestion: {
    value: string;
    category: Exclude<QueryStoreState["category"], null>;
  } = $props();
  const pattern = $derived(new RegExp(`(${queryStore.value.trim()})`, "gi"));
  function highlightSearch(original: string, pattern: RegExp): string {
    return queryStore.value.length < 2
      ? original
      : original.replaceAll(pattern, (substr) => `<strong>${substr}</strong>`);
  }

  function handleSuggestionClick(
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement },
  ) {
    queryStore.updateQuery({
      type: "result",
      category: suggestion.category,
    });
    queryStore.value = suggestion.value;
  }
</script>

<button class="suggestion" onclick={handleSuggestionClick}>
  <div>{@html highlightSearch(suggestion.value, pattern)}</div>
</button>

<style>
  .suggestion {
    all: unset;
    padding: 0.5rem 1rem;
    &:hover {
      background-color: hsl(0, 0%, 90%);
      border-radius: 0.75rem;
    }
  }
</style>
