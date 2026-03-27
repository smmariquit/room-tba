<script lang="ts">
  import type { QueryStoreState } from "../../lib/store.svelte";

  const suggestion: {
    value: string;
    category: Exclude<QueryStoreState["category"], null>;
  } = $props();
</script>

<div class="suggestion">
  <div>{suggestion.value}</div>
</div>

<style>
  .suggestion {
    padding: 0.5rem 1rem;
    &:hover {
      background-color: hsl(0, 0%, 90%);
      border-radius: 0.75rem;
    }
  }
</style>
