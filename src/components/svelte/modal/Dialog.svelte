<script lang="ts">
  import type { Snippet } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { MediaQuery } from "svelte/reactivity";
  import X from "@lucide/svelte/icons/x";
  import IconButton from "@ui/IconButton.svelte";
  import { trapFocus } from "@lib/focus-trap";
  import {
    modalContentDismiss,
    modalContentReveal,
    overlayFade,
  } from "@lib/motion";

  /**
   * The one dialog shell. Every modal surface in the app renders through
   * this: overlay, focus trap, escape, motion, sizing, and a single close
   * button live here and nowhere else. Before this existed each of the
   * fifteen modal branches hand-rolled its own close button and picked a
   * width through a nested ternary, which is how they drifted apart.
   *
   * Sizes are intents, not pixel values:
   *   compact   a short list or summary
   *   reading   prose and forms, capped at a readable measure
   *   default   general content
   *   large     task surfaces (review queue, changelog)
   *   showcase  self-chrome content that paints to the edges (landing)
   */
  export type DialogSize =
    | "compact"
    | "reading"
    | "default"
    | "large"
    | "showcase";

  type Props = {
    open: boolean;
    onclose: () => void;
    size?: DialogSize;
    /** Accessible name. Omit when the content supplies `labelledBy`. */
    ariaLabel?: string;
    /** Id of a heading the content renders itself. */
    labelledBy?: string;
    /** Close button label, e.g. "Close settings". */
    closeLabel?: string;
    showClose?: boolean;
    children: Snippet;
  };

  let {
    open,
    onclose,
    size = "default",
    ariaLabel,
    labelledBy,
    closeLabel = "Close dialog",
    showClose = true,
    children,
  }: Props = $props();

  const reducedMotion = new MediaQuery("(prefers-reduced-motion: reduce)");

  let contentEl = $state<HTMLDivElement | null>(null);
  let overlayCloseReady = $state(false);

  // A click that opened the dialog must not also close it on the same
  // gesture, so the overlay only arms after the first frame.
  $effect(() => {
    if (!open) {
      overlayCloseReady = false;
      return;
    }
    overlayCloseReady = false;
    const frame = requestAnimationFrame(() => {
      overlayCloseReady = true;
    });
    return () => cancelAnimationFrame(frame);
  });

  $effect(() => {
    if (!open || !contentEl) return;
    return trapFocus(contentEl, { onEscape: onclose });
  });

  function handleOverlayClick() {
    if (!overlayCloseReady) return;
    onclose();
  }
</script>

{#if open}
  <div class="modal-set">
    <button
      type="button"
      class="overlay"
      aria-label="Close dialog"
      onclick={handleOverlayClick}
      transition:fade={overlayFade(reducedMotion.current)}
    ></button>
    <div
      bind:this={contentEl}
      id="modal-content"
      class="modal-content modal-content--{size}"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      in:fly={modalContentReveal(reducedMotion.current)}
      out:fly={modalContentDismiss(reducedMotion.current)}
    >
      {#if showClose}
        <IconButton
          class="modal-content__close-icon"
          label={closeLabel}
          onclick={onclose}
        >
          <X size={20} aria-hidden="true" />
        </IconButton>
      {/if}
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .modal-set {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    padding: 0.75rem;
    width: 100%;
    height: 100dvh;
    z-index: var(--z-modal, 100);
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    pointer-events: auto;
  }

  .modal-content {
    position: relative;
    flex: 0 1 64rem;
    max-height: 90dvh;
    min-height: 0;
    background-color: #fff;
    z-index: inherit;
    border-radius: 1rem;
    padding: 0.5rem;
    display: flex;
    flex-flow: column nowrap;
    overflow: hidden;

    :global(.modal-content__close-icon) {
      position: absolute;
      right: 0.25rem;
      top: 0.25rem;
      z-index: 1;
      background-color: #fff;
    }
  }

  .modal-content--compact {
    flex: 0 1 32rem;
  }

  /* Prose and forms cap at a readable measure so lines stay short. */
  .modal-content--reading {
    flex: 0 1 38rem;
  }

  /* Task surfaces take most of the screen. */
  .modal-content--large {
    flex: 0 1 72rem;
    width: 100%;
    height: min(90dvh, 56rem);
  }

  .modal-content--showcase {
    flex: 0 1 48rem;
    width: 100%;
    max-height: min(92dvh, 52rem);
    padding: 0;
  }

  @media only screen and (max-width: 31.25rem) {
    .modal-content {
      padding: 0.25rem;
    }

    .modal-content--showcase {
      padding: 0;
    }
  }

  .overlay {
    all: unset;
    width: 100%;
    height: 100%;
    inset: 0;
    position: absolute;
    /* No backdrop-filter: blurring the full-viewport WebGL map stalls the
       compositor for seconds (30s+ seen in prod), so the dialog mounts,
       blocks input, and never paints. Dim only. */
    background-color: hsla(0, 0%, 8%, 0.48);
    cursor: pointer;
  }

  .overlay:focus-visible {
    outline: 2px solid #fff;
    outline-offset: -4px;
  }
</style>
