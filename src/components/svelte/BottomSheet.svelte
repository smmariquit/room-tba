<script lang="ts">
  import type { Snippet } from "svelte";
  import { MediaQuery } from "svelte/reactivity";
  import {
    resolveBottomSheetRelease,
    sheetTranslateY,
    type BottomSheetSnap,
  } from "@lib/bottom-sheet-snap";

  let {
    open = false,
    snap = $bindable<"peek" | "expanded">("peek"),
    peekRatio = 0.48,
    expandedRatio = 0.92,
    topInset = "0px",
    bottomInset = "0px",
    onDismiss,
    children,
  }: {
    open?: boolean;
    snap?: BottomSheetSnap;
    /** Fraction of the available height used for peek (0–1). */
    peekRatio?: number;
    /** Fraction used when expanded — leave a map strip for tap-to-collapse. */
    expandedRatio?: number;
    topInset?: string;
    bottomInset?: string;
    onDismiss?: () => void;
    children: Snippet;
  } = $props();

  const reducedMotion = new MediaQuery("(prefers-reduced-motion: reduce)");

  const DRAG_THRESHOLD = 6;
  const FOLLOW_THRESHOLD = 40;
  const DISMISS_THRESHOLD = 80;
  const FLICK_VELOCITY = 0.55;

  let rootEl = $state<HTMLElement | null>(null);
  let sheetEl = $state<HTMLElement | null>(null);
  let contentEl = $state<HTMLElement | null>(null);

  let availableH = $state(0);
  let dragStartY: number | null = null;
  let dragStartTime = 0;
  let dragMoved = false;
  let dragFromHandle = false;
  let dragOffset = $state(0);

  const peekH = $derived(Math.round(availableH * peekRatio));
  const expandedH = $derived(Math.round(availableH * expandedRatio));
  const visibleH = $derived(snap === "expanded" ? expandedH : peekH);
  const baseTranslate = $derived(sheetTranslateY(visibleH, availableH));
  const liveTranslate = $derived(
    Math.min(
      availableH,
      Math.max(0, baseTranslate + dragOffset),
    ),
  );
  const isDragging = $derived(dragStartY !== null && dragMoved);

  function measure() {
    const el = rootEl;
    if (!el) return;
    availableH = Math.max(0, Math.round(el.getBoundingClientRect().height));
  }

  $effect(() => {
    if (!open) return;
    measure();
    const ro = new ResizeObserver(() => measure());
    if (rootEl) ro.observe(rootEl);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  });

  $effect(() => {
    if (open) return;
    dragStartY = null;
    dragMoved = false;
    dragOffset = 0;
  });

  function contentScrollTop(): number {
    return contentEl?.scrollTop ?? 0;
  }

  function shouldIgnoreDragTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return true;
    if (target.closest(".bottom-sheet__handle")) return false;
    return Boolean(
      // summary: native <details> disclosures (editor "More fields",
      // calendar term cards) toggle on click; capturing the pointer for a
      // sheet drag swallowed those taps entirely on mobile.
      target.closest(
        "button, a, input, textarea, select, label, summary, [role='button']",
      ),
    );
  }

  function beginDrag(event: PointerEvent, fromHandle: boolean) {
    if (!open) return;
    dragStartY = event.clientY;
    dragStartTime = performance.now();
    dragMoved = false;
    dragFromHandle = fromHandle;
    dragOffset = 0;
    sheetEl?.setPointerCapture?.(event.pointerId);
  }

  function onHandlePointerDown(event: PointerEvent) {
    event.stopPropagation();
    beginDrag(event, true);
  }

  function onSheetPointerDown(event: PointerEvent) {
    if (shouldIgnoreDragTarget(event.target)) return;
    beginDrag(event, false);
  }

  function onSheetPointerMove(event: PointerEvent) {
    if (dragStartY === null) return;
    const delta = event.clientY - dragStartY;
    if (Math.abs(delta) > DRAG_THRESHOLD) dragMoved = true;
    if (!dragMoved) return;

    if (
      !dragFromHandle &&
      snap === "expanded" &&
      contentScrollTop() > 0
    ) {
      dragStartY = null;
      dragMoved = false;
      dragOffset = 0;
      return;
    }

    dragOffset = delta;
  }

  function onSheetPointerUp(event: PointerEvent) {
    if (dragStartY === null) return;
    const elapsed = performance.now() - dragStartTime;
    const delta = event.clientY - dragStartY;
    const velocity = Math.abs(delta) / Math.max(elapsed, 1);
    const moved = dragMoved;
    const fromHandle = dragFromHandle;

    dragStartY = null;
    dragFromHandle = false;
    dragOffset = 0;

    if (!moved) {
      // setPointerCapture retargets the pointerup to the sheet, so the
      // browser never delivers a click to the handle button. Treat a
      // no-move press on the handle as the tap it is, or the handle can
      // only be dragged, never tapped.
      if (fromHandle) {
        snap = snap === "peek" ? "expanded" : "peek";
        pointerToggledAt = performance.now();
      }
      return;
    }

    const intent = resolveBottomSheetRelease({
      delta,
      velocity,
      snap,
      followThreshold: FOLLOW_THRESHOLD,
      dismissThreshold: DISMISS_THRESHOLD,
      flickVelocity: FLICK_VELOCITY,
    });

    if (intent === "expand") snap = "expanded";
    else if (intent === "peek") snap = "peek";
    else if (intent === "dismiss") onDismiss?.();
  }

  function onSheetPointerCancel() {
    dragStartY = null;
    dragMoved = false;
    dragFromHandle = false;
    dragOffset = 0;
  }

  // Keyboard activation (Enter/Space) still arrives as a click; a pointer
  // tap was already handled in onSheetPointerUp, so swallow its echo.
  let pointerToggledAt = 0;
  function onHandleClick() {
    if (performance.now() - pointerToggledAt < 400) return;
    if (dragMoved) {
      dragMoved = false;
      return;
    }
    snap = snap === "peek" ? "expanded" : "peek";
  }

  const transitionMs = $derived(reducedMotion.current ? 0 : 320);
</script>

{#if open}
  <div
    class="bottom-sheet-root"
    bind:this={rootEl}
    style:--bs-top={topInset}
    style:--bs-bottom={bottomInset}
    style:--bs-duration="{transitionMs}ms"
  >
    <!-- No scrim: the map strip above the sheet stays live, so panning,
         pinching and tapping pins keep working while details are open (GMaps).
         Dismissal is the drag-down past peek plus the search bar's
         "Close details" button. -->

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bottom-sheet"
      class:bottom-sheet--dragging={isDragging}
      bind:this={sheetEl}
      style:transform="translate3d(0, {liveTranslate}px, 0)"
      style:height="{availableH || 0}px"
      onpointerdown={onSheetPointerDown}
      onpointermove={onSheetPointerMove}
      onpointerup={onSheetPointerUp}
      onpointercancel={onSheetPointerCancel}
      onlostpointercapture={onSheetPointerCancel}
    >
      <button
        type="button"
        class="bottom-sheet__handle"
        aria-label={snap === "peek"
          ? "Expand details"
          : "Collapse details"}
        aria-expanded={snap === "expanded"}
        onclick={onHandleClick}
        onpointerdown={onHandlePointerDown}
      >
        <span class="bottom-sheet__grab" aria-hidden="true"></span>
      </button>

      <div class="bottom-sheet__body" bind:this={contentEl}>
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .bottom-sheet-root {
    /* Flush to the screen bottom (covers bottom nav); no side gutter. */
    position: fixed;
    top: var(--bs-top, 0px);
    right: 0;
    bottom: var(--bs-bottom, 0px);
    left: 0;
    /* Above map-tools + bottom nav so locate/3D/zoom never paint over it. */
    z-index: var(--z-mobile-sheet, 16);
    pointer-events: none;
  }

  .bottom-sheet {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--map-chrome-border, hsl(5 10% 68%));
    border-bottom: none;
    /* Grounded: round only the top; flush to the screen bottom edge. */
    border-radius: var(--map-chrome-radius, 1rem) var(--map-chrome-radius, 1rem)
      0 0;
    background: #fff;
    box-shadow: var(
      --shadow-results,
      0 2px 6px rgb(36 37 46 / 0.2)
    );
    pointer-events: auto;
    touch-action: none;
    will-change: transform;
    transition: transform var(--bs-duration, 320ms)
      var(--motion-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
  }

  .bottom-sheet--dragging {
    transition: none;
  }

  .bottom-sheet__handle {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 2rem;
    margin: 0;
    padding: 0.625rem 0 0.375rem;
    border: none;
    background: transparent;
    cursor: grab;
    touch-action: none;
  }

  .bottom-sheet__handle:active {
    cursor: grabbing;
  }

  .bottom-sheet__grab {
    display: block;
    width: 2.75rem;
    height: 0.25rem;
    border-radius: 999px;
    background: #d4d4d8;
  }

  .bottom-sheet__handle:hover .bottom-sheet__grab,
  .bottom-sheet__handle:focus-visible .bottom-sheet__grab {
    background: #a1a1aa;
  }

  .bottom-sheet__body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: clip;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0
      max(
        var(--map-search-inline-pad, 0.625rem),
        env(safe-area-inset-right, 0px)
      )
      max(1rem, env(safe-area-inset-bottom, 0px))
      max(
        var(--map-search-inline-pad, 0.625rem),
        env(safe-area-inset-left, 0px)
      );
    -webkit-overflow-scrolling: touch;
  }

  /* Keep "1–12 of 13" pinned to the visible sheet bottom while scrolling. */
  .bottom-sheet__body :global(.entity-pagination) {
    position: sticky;
    bottom: 0;
    z-index: 3;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-top: 1px solid #ececec;
    background: #fff;
  }

  @media (prefers-reduced-motion: reduce) {
    .bottom-sheet {
      transition: none;
    }
  }
</style>
