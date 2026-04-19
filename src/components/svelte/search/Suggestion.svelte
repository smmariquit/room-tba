<script lang="ts">
  import { queryStore, type QueryStoreState } from "../../../lib/store.svelte";
  // import {
  //   ArrowUpRight,
  //   BookText,
  //   Building,
  //   DoorClosed,
  //   GraduationCap,
  //   School,
  //   University,
  // } from "@lucide/svelte/icons";
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
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        width="20"
        height="20"
      >
        <circle cx="12" cy="10" r="3" />
        <path
          d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"
        />
      </svg>
    {:else if type === "division"}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        width="20"
        height="20"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    {:else if type === "college"}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        width="20"
        height="20"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="m6 12 8 4 8-4" />
        <path d="M6 10v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-8" />
      </svg>
    {:else if type === "room"}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        width="20"
        height="20"
      >
        <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
        <path d="M2 20h20" />
        <path d="M14 12v.01" />
      </svg>
    {:else if type === "class"}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        width="20"
        height="20"
      >
        <path
          d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
        />
      </svg>
    {/if}
  </span>
{/snippet}

<button class="suggestion" onclick={handleSuggestionClick}>
  {@render icon(category)}
  <div class="text">{@html highlightSearch(value, pattern)}</div>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    width="20"
    height="20"
    style="margin-left:auto"
  >
    <path d="M7 17 17 7" />
    <polyline points="7,7 17,7 17,17" />
  </svg>
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
  @media (max-width: 425px) {
    .suggestion {
      padding: 0.5rem;
    }
  }
</style>
