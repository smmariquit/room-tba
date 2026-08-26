<script lang="ts">
  import X from "@lucide/svelte/icons/x";

  type Props = {
    ariaLabel: string;
    title?: string;
    onclick: () => void;
  };

  let { ariaLabel, title = ariaLabel, onclick }: Props = $props();
</script>

<button
  type="button"
  class="entity-panel-close"
  aria-label={ariaLabel}
  {title}
  {onclick}
>
  <X size={16} aria-hidden="true" />
  <span>Close</span>
</button>

<style>
  @import "./entity-detail.css";

  /* Mobile sheets already close via the drawer handle, swipe, and scrim taps;
     a second Close button reads as a duplicate affordance. Desktop keeps it —
     the pinned drawer has no swipe gesture. */
  :global(.app-layout:not(.redesign-desktop)) .entity-panel-close {
    display: none;
  }
</style>
