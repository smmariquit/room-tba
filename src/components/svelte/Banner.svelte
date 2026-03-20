<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props {
    children: Snippet;
  }
  const props = $props();
</script>

<div>
  {@render props.children()}
</div>

<style>
  div {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    background-color: hsla(45, 100%, 51%, 0.901);
    color: hsl(45, 94%, 27%);
    text-align: center;
  }
</style>
