<script lang="ts">
  import { queryStore, type QueryStoreState } from "../../../lib/store.svelte";

  let {
    value,
    category,
  }: {
    value: string;
    category: Exclude<QueryStoreState["category"], null>;
  } = $props();

  const pattern = $derived(new RegExp(`(${queryStore.value.trim()})`, "gi"));
  function highlightSearch(original: string, pattern: RegExp): string {
    return queryStore.value.length < 2
      ? original
      : original.replaceAll(pattern, (substr) => `<strong>${substr}</strong>`);
  }

  function handleSuggestionClick() {
    queryStore.updateQuery(
      {
        type: "result",
        category,
      },
      value,
    );
  }
</script>

{#snippet icon(type: typeof category)}
  <span class="icon">
    {#if type === "building"}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path
          d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"
        /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path
          d="M10 6h4"
        /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg
      >
    {:else if type === "division"}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path
          d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
        /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path
          d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
        /></svg
      >
    {:else if type === "college"}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path
          d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
        /><path d="M6 13.5V20c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-6.5" /></svg
      >
    {:else if type === "room"}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path d="M13 4h3a2 2 0 0 1 2 2v14" /><path d="M2 20h3" /><path
          d="M13 20h9"
        /><path d="M10 12v.01" /><path d="M13 4H4a2 2 0 0 0-2 2v14h11V4z" /></svg
      >
    {/if}
  </span>
{/snippet}

<button class="suggestion" onclick={handleSuggestionClick}>
  {@render icon(category)}
  <div class="text">{@html highlightSearch(value, pattern)}</div>
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
    &:hover {
      background-color: hsl(0, 0%, 95%);
      border-radius: 0.75rem;
    }
  }

  .icon {
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
</style>
