<script lang="ts">
  import { onMount } from "svelte";
  import { debounce } from "es-toolkit";
  import { fade } from "svelte/transition";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import { getAppData } from "@lib/context";
  import { getMapChromeVisibility } from "@lib/map-chrome";
  import {
    adminAuthStore,
    directionsStore,
    editorChromeStore,
    mapEditStore,
    MAX_DIRECTIONS_WAYPOINTS,
    modalStore,
    proposalsStore,
    queryStore,
    sidePanelStore,
  } from "@lib/store.svelte";
  import Suggestions from "./Suggestions.svelte";
  import DirectionsRouteChips from "@ui/directions/DirectionsRouteChips.svelte";
  import MapFilterChips from "@ui/map-chrome/MapFilterChips.svelte";
  import { observeBlockHeight } from "@lib/layout-css-vars";
  import { registerSearchFocus } from "@lib/search-focus";
  import { registerEphemeralOverlayDismisser } from "@lib/overlay-stack";
  import { dropdownFadeIn, dropdownFadeOut } from "@lib/motion";
  import { MediaQuery } from "svelte/reactivity";
  import SearchIcon from "@lucide/svelte/icons/search";
  import MapPinPlus from "@lucide/svelte/icons/map-pin-plus";
  import Plus from "@lucide/svelte/icons/plus";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";

  let searchElement = $state<HTMLInputElement | null>(null);
  let shellMainEl = $state<HTMLDivElement | null>(null);
  let chromeEl = $state<HTMLDivElement | null>(null);
  let draftInput = $state("");
  let searchFocused = $state(false);
  const mobile = new MediaQuery("max-width:48rem");
  const reducedMotion = new MediaQuery("(prefers-reduced-motion: reduce)");

  const appData = getAppData();
  const { loaded } = $derived(appData());
  const chrome = $derived(getMapChromeVisibility());

  $effect(() => {
    const el = mobile.current ? shellMainEl : chromeEl;
    if (!el) return;
    return observeBlockHeight(el, "--search-block-height");
  });

  onMount(() => {
    const unregisterFocus = registerSearchFocus(() => {
      searchElement?.focus();
      searchElement?.select();
    });
    const unregisterDismiss = registerEphemeralOverlayDismisser(() => {
      searchFocused = false;
      searchElement?.blur();
    });
    return () => {
      unregisterFocus();
      unregisterDismiss();
    };
  });

  const commitSearchInput = debounce((searchInput: string) => {
    queryStore.inputValue = searchInput;
    queryStore.setType("query");
  }, 200);

  $effect(() => {
    if (queryStore.type === "result" || queryStore.category !== null) {
      draftInput = queryStore.inputValue;
      return;
    }
    if (queryStore.inputValue === "") {
      draftInput = "";
    }
  });

  function handleInput(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    if (queryStore.type === "result" || queryStore.category !== null) {
      queryStore.exitResultMode();
    }
    draftInput = event.currentTarget.value;
    commitSearchInput(draftInput);
  }

  function closeSearchContext() {
    commitSearchInput.cancel();
    queryStore.clearQuery();
    draftInput = "";
    searchElement?.focus();
    // `openPanel()` metadata outranks the query in resolvePanelContent, so
    // clearing the query alone would leave a stale panel on screen.
    sidePanelStore.closePanel();
  }

  function dismissMobileSearch() {
    searchFocused = false;
    searchElement?.blur();
  }

  const mobileSearchActive = $derived(mobile.current && searchFocused);

  const clearSelectionLabel = $derived(
    queryStore.type === "result" && queryStore.category !== null
      ? "Close details"
      : "Clear search",
  );

  function openEditorTools() {
    searchFocused = false;
    searchElement?.blur();
    modalStore.openModal("editor-tools");
  }

  const showEditorChrome = $derived(
    chrome.showEditorShelf &&
      (adminAuthStore.canPublish || adminAuthStore.canReview),
  );

  const editorChipLabel = $derived(mapEditStore.enabled ? "Editing" : "Editor");
  const editorOpenLabel = $derived(
    proposalsStore.pendingCount > 0
      ? `Open editor tools, ${proposalsStore.pendingCount} pending`
      : "Open editor tools",
  );

  const showSearchDropdown = $derived(
    chrome.showSearchSuggestions && searchFocused,
  );

  const directionsSearchActive = $derived(
    directionsStore.active && !directionsStore.navigating,
  );

  const canAddDirectionsStop = $derived(
    directionsSearchActive &&
      directionsStore.waypoints.length < MAX_DIRECTIONS_WAYPOINTS,
  );

  const searchPlaceholder = $derived(
    directionsStore.addingStop
      ? "Search a place to add as a stop"
      : directionsSearchActive
        ? "Search to add a stop"
        : "ex. Institute of Computer Science",
  );

  function toggleDirectionsAddStop() {
    if (!canAddDirectionsStop) return;
    if (directionsStore.addingStop) {
      directionsStore.cancelAddStop();
    } else {
      directionsStore.beginAddStop();
    }
    searchFocused = true;
    searchElement?.focus();
  }

  $effect(() => {
    if (queryStore.category !== null && queryStore.type === "result") {
      // Keep the search open while adding multiple directions stops.
      if (directionsSearchActive) return;
      searchElement?.blur();
    }
  });
</script>

<div
  class="search-root"
  class:mobile-shell={mobile.current}
  class:search-input-focused={searchFocused}
  class:search-mobile-active={mobileSearchActive}
  class:search-suggestions-open={showSearchDropdown}
  class:search-query-active={draftInput.trim() !== ""}
>
  <div class="search-shell-main" bind:this={shellMainEl}>
    <div
      bind:this={chromeEl}
      class="map-search-chrome"
      class:map-search-chrome--redesign={!mobile.current}
      class:map-search-chrome--mobile-redesign={mobile.current}
    >
      <div class="map-search-chrome__bar">
        <div class="map-search-chrome__bar-row">
          {#if mobile.current}
            <button
              type="button"
              class="map-search-chrome__back"
              class:map-search-chrome__back--visible={mobileSearchActive}
              aria-label="Close search"
              tabindex={mobileSearchActive ? 0 : -1}
              onmousedown={(event) => {
                event.preventDefault();
                dismissMobileSearch();
              }}
            >
              <ArrowLeft size={22} aria-hidden="true" />
            </button>
          {/if}
          <div class="map-search-chrome__pill-wrap">
            <div class="map-search-chrome__pill">
              <span
                class="search-icon"
                class:search-icon--hidden={mobileSearchActive}
                aria-hidden="true"
              >
                <SearchIcon size={20} />
              </span>
              <label class="sr-only" for="search">Search campus</label>
              <input
                type="text"
                role="searchbox"
                enterkeyhint="search"
                id="search"
                autocomplete="off"
                value={draftInput}
                bind:this={searchElement}
                oninput={handleInput}
                onfocus={() => {
                  searchFocused = true;
                }}
                onblur={() => {
                  searchFocused = false;
                }}
                aria-controls="search-suggestions"
                aria-autocomplete="list"
                aria-haspopup="listbox"
                placeholder={searchPlaceholder}
              />
              {#if draftInput !== "" || queryStore.category !== null}
                <button
                  onclick={closeSearchContext}
                  type="button"
                  class="clear-btn"
                  class:clear-btn--hidden={mobileSearchActive}
                  aria-label={clearSelectionLabel}
                  title={clearSelectionLabel}
                  tabindex={mobileSearchActive ? -1 : 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    ><line x1="18" y1="6" x2="6" y2="18"></line><line
                      x1="6"
                      y1="6"
                      x2="18"
                      y2="18"
                    ></line></svg
                  >
                </button>
              {/if}
              {#if canAddDirectionsStop}
                <button
                  type="button"
                  class="map-search-chrome__add map-search-chrome__add-stop"
                  class:map-search-chrome__add-stop--armed={directionsStore.addingStop}
                  aria-pressed={directionsStore.addingStop}
                  aria-label={directionsStore.addingStop
                    ? "Cancel adding a stop"
                    : "Add a stop from search or the map"}
                  title={directionsStore.addingStop
                    ? "Cancel add stop"
                    : "Add stop"}
                  onmousedown={(event) => event.preventDefault()}
                  onclick={toggleDirectionsAddStop}
                >
                  <Plus size={14} aria-hidden="true" />
                  <span class="map-search-chrome__add-stop-text">Add stop</span>
                </button>
              {:else if !mobile.current && !directionsSearchActive}
                <button
                  type="button"
                  class="map-search-chrome__add"
                  aria-label="Add something to the map"
                  onclick={() => editorChromeStore.openAdditionModal()}
                >
                  <MapPinPlus size={14} aria-hidden="true" />
                  <span>Add</span>
                </button>
              {/if}
            </div>
          </div>

          {#if !mobile.current && !searchFocused && !directionsSearchActive}
            <MapFilterChips />
          {/if}

          {#if showEditorChrome}
            <button
              type="button"
              class="map-search-chrome__editor-btn"
              class:map-search-chrome__editor-btn--editing={mapEditStore.enabled}
              aria-haspopup="dialog"
              aria-label={editorOpenLabel}
              title={editorChipLabel}
              onclick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openEditorTools();
              }}
            >
              <ShieldCheck size={18} aria-hidden="true" />
              {#if proposalsStore.pendingCount > 0}
                <span class="map-search-chrome__editor-badge" aria-hidden="true"
                  >{proposalsStore.pendingCount}</span
                >
              {/if}
            </button>
          {/if}
        </div>
        {#if directionsSearchActive}
          <DirectionsRouteChips />
        {/if}
      </div>

      {#if mobile.current && !searchFocused && !directionsSearchActive}
        <div class="map-search-chrome__mobile-chips">
          <MapFilterChips />
        </div>
      {/if}

      {#if showSearchDropdown}
        <!-- svelte-ignore a11y_interactive_supports_focus -->
        <div
          id="search-suggestions"
          class="map-search-chrome__suggestions"
          role="listbox"
          aria-label="Search suggestions"
          onmousedown={(event) => event.preventDefault()}
          in:fade={dropdownFadeIn(reducedMotion.current)}
          out:fade={dropdownFadeOut(reducedMotion.current)}
        >
          <Suggestions />
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .search-root {
    display: contents;
    margin-top:.25rem;
  }

  .search-root.mobile-shell {
    /* Full viewport under staging banner always — idle is transparent so
       map/nav stay clickable; active fades white in (no layout jump). */
    position: fixed;
    top: var(--staging-banner-height, 0px);
    right: 0;
    bottom: 0;
    left: 0;
    z-index: var(--z-search-elevated, 18);
    display: flex;
    flex-direction: column;
    width: 100%;
    background: transparent;
    pointer-events: none;
    transition: background-color var(--motion-duration-micro, 200ms)
      var(--motion-ease-out, ease);
  }

  .search-shell-main {
    min-width: 0;
    max-width: 100%;
  }

  .search-root:not(.mobile-shell) .search-shell-main {
    width: fit-content;
    max-width: 100%;
  }

  /* Mobile redesign (393): search + filters only (Add is bottom-nav FAB). */
  .search-root.mobile-shell .search-shell-main {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    margin: 0;
    padding: var(--staging-banner-gap, 0.5rem)
      max(1rem, env(safe-area-inset-right, 0px))
      0.5rem
      max(1rem, env(safe-area-inset-left, 0px));
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
    pointer-events: auto;
    transition: padding var(--motion-duration-micro, 200ms)
      var(--motion-ease-out, ease);
  }

  .search-root.mobile-shell .map-search-chrome--mobile-redesign {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    width: 100%;
    min-height: 0;
    border: none;
    background: transparent;
    box-shadow: none;
    transition: gap var(--motion-duration-micro, 200ms)
      var(--motion-ease-out, ease);
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    .map-search-chrome__bar {
    padding: 0;
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    .map-search-chrome__bar-row {
    align-items: center;
    min-width: 0;
    gap: 0;
    transition: gap var(--motion-duration-micro, 200ms)
      var(--motion-ease-out, ease);
  }

  .search-root.mobile-shell .map-search-chrome__back {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 0;
    height: 2.25rem;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: #111;
    opacity: 0;
    pointer-events: none;
    cursor: pointer;
    transition:
      width var(--motion-duration-micro, 200ms) var(--motion-ease-out, ease),
      opacity var(--motion-duration-fast, 150ms) ease,
      margin var(--motion-duration-micro, 200ms) var(--motion-ease-out, ease);
  }

  .search-root.mobile-shell .map-search-chrome__back--visible {
    width: 2.25rem;
    margin-right: 0.5rem;
    opacity: 1;
    pointer-events: auto;
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    .map-search-chrome__pill-wrap {
    width: 100%;
    min-width: 0;
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    .map-search-chrome__pill {
    box-sizing: border-box;
    width: 100%;
    min-height: 3rem;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border: 1.5px solid transparent;
    border-radius: 999px;
    background: #fff;
    box-shadow: var(--shadow-search, 0 1px 3.5px rgb(58 58 71 / 0.2));
    transition:
      border-color var(--motion-duration-micro, 200ms) ease,
      box-shadow var(--motion-duration-micro, 200ms) ease,
      min-height var(--motion-duration-micro, 200ms) ease,
      padding var(--motion-duration-micro, 200ms) ease,
      gap var(--motion-duration-micro, 200ms) ease;
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    .map-search-chrome__pill
    input {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111;
    transition: font-size var(--motion-duration-micro, 200ms) ease;
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    .map-search-chrome__pill
    input::placeholder {
    color: #bcbcc8;
    font-weight: 500;
    opacity: 1;
  }

  .search-root.mobile-shell .search-icon {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    overflow: hidden;
    opacity: 1;
    transition:
      width var(--motion-duration-fast, 150ms) ease,
      opacity var(--motion-duration-fast, 150ms) ease,
      margin var(--motion-duration-fast, 150ms) ease;
  }

  .search-root.mobile-shell .search-icon--hidden {
    width: 0;
    margin: 0;
    opacity: 0;
  }

  .search-root.mobile-shell .clear-btn--hidden {
    width: 0 !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    .map-search-chrome__mobile-chips {
    min-width: 0;
    width: 100%;
    padding-right: 0.125rem;
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    :global(.map-filter-chips) {
    height: auto;
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    :global(.map-filter-chips__chip) {
    /* 44px touch target. This rule outranks the chip component's own
       `height: var(--map-chip-height)`, so setting that token alone does
       nothing here: the mobile shell hardcoded 2.125rem (34px) and won on
       specificity. These chips are the only route to browse on mobile since
       the rail was retired, so they are worth the height. */
    height: 2.75rem;
    padding: 0 0.7rem;
    border-radius: 999px;
    font-size: 0.8125rem;
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    :global(.map-filter-chips__more) {
    /* Square, and the same 44px as the chips it scrolls. */
    width: 2.75rem;
    height: 2.75rem;
    margin-right: 0.125rem;
    border-radius: 999px;
  }

  .search-root.mobile-shell
    .map-search-chrome--mobile-redesign
    .map-search-chrome__suggestions {
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
    margin: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    overflow: auto;
    overscroll-behavior: contain;
  }

  .search-root.mobile-shell.search-mobile-active {
    background: #fff;
    pointer-events: auto;
  }

  .search-root.mobile-shell.search-mobile-active .search-shell-main {
    flex: 1 1 auto;
    height: 100%;
    min-height: 100%;
    padding-top: 0.75rem;
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0px));
  }

  .search-root.mobile-shell.search-mobile-active
    .map-search-chrome--mobile-redesign {
    flex: 1 1 auto;
    gap: 0.75rem;
  }

  .search-root.mobile-shell.search-mobile-active
    .map-search-chrome__bar-row {
    gap: 0;
  }

  .search-root.mobile-shell.search-mobile-active .map-search-chrome__pill {
    min-height: 2.75rem;
    padding: 0.625rem 1rem;
    border-color: #d34825;
    box-shadow: none;
  }

  .search-root.mobile-shell.search-mobile-active
    .map-search-chrome__pill
    input {
    min-width: 0;
    font-size: 0.9375rem;
  }

  .search-root.mobile-shell.search-mobile-active
    .map-search-chrome__suggestions
    :global(.suggestions-container) {
    max-height: none;
    padding: 0.25rem 0 1rem;
    border-top: none;
    gap: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .search-root.mobile-shell,
    .search-root.mobile-shell .search-shell-main,
    .search-root.mobile-shell .map-search-chrome--mobile-redesign,
    .search-root.mobile-shell .map-search-chrome__bar-row,
    .search-root.mobile-shell .map-search-chrome__back,
    .search-root.mobile-shell .map-search-chrome__pill,
    .search-root.mobile-shell .map-search-chrome__pill input,
    .search-root.mobile-shell .search-icon,
    .search-root.mobile-shell .map-search-chrome__suggestions {
      transition: none;
    }
  }

  .search-root:not(.mobile-shell) .map-search-chrome {
    width: var(--map-search-chrome-width, min(31rem, calc(100vw - 15rem)));
    max-width: 100%;
    min-width: min(22rem, 100%);
    border: 1px solid var(--map-chrome-border, hsl(5 10% 68%));
    border-radius: var(--map-chrome-radius, 1rem);
    background-color: var(--map-chrome-surface, hsl(5 20% 97%));
    box-shadow:
      0 1px 3px hsla(0, 0%, 0%, 0.12),
      0 4px 12px hsla(0, 0%, 0%, 0.16),
      0 10px 24px hsla(0, 0%, 0%, 0.1);
    overflow-x: clip;
    overflow-y: visible;
  }

  .map-search-chrome {
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-width: 100%;
    pointer-events: auto;
  }

  .map-search-chrome__bar {
    padding: 0.4375rem 0.625rem;
  }

  .map-search-chrome__bar-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
    max-width: 100%;
  }

  .search-root:not(.mobile-shell) .map-search-chrome__bar {
    padding: 0.375rem 0.5rem;
  }

  .map-search-chrome__pill-wrap {
    position: relative;
    flex: 1 1 auto;
    min-width: min(100%, 12rem);
  }

  .map-search-chrome__editor-btn {
    all: unset;
    box-sizing: border-box;
    position: relative;
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    min-width: 2.75rem;
    min-height: 2.75rem;
    border: 1px solid var(--map-chrome-border, hsl(0, 0%, 58%));
    border-radius: 999px;
    background-color: var(--map-chrome-surface, rgba(255, 255, 255, 0.98));
    color: hsl(160, 84%, 22%);
    cursor: pointer;
    pointer-events: auto;
    touch-action: manipulation;
  }

  .map-search-chrome__editor-btn:hover,
  .map-search-chrome__editor-btn:focus-visible {
    border-color: hsl(160, 40%, 72%);
    background-color: hsl(160, 45%, 96%);
  }

  .map-search-chrome__editor-btn:focus-visible {
    outline: 2px solid hsl(160, 84%, 22%);
    outline-offset: 1px;
  }

  /* Pinned Planner chip reuses .map-chrome-chip; keep it maroon and collapse
     to icon-only on narrow screens so it always fits beside the search input. */
  .map-search-chrome__planner-btn {
    color: hsl(5, 53%, 32%);
  }

  @media (max-width: 30rem) {
    .map-search-chrome__planner-btn {
      padding: 0;
      width: 2.75rem;
      min-width: 2.75rem;
      min-height: 2.75rem;
      justify-content: center;
    }

    .map-search-chrome__planner-label {
      display: none;
    }
  }

  .map-search-chrome__editor-btn--editing {
    border-color: hsl(160, 84%, 26%);
    background-color: hsl(160, 84%, 26%);
    color: white;
  }

  .map-search-chrome__editor-badge {
    position: absolute;
    top: -0.2rem;
    right: -0.2rem;
    min-width: 1rem;
    height: 1rem;
    padding: 0 0.2rem;
    border-radius: 999px;
    background: hsl(5, 65%, 42%);
    color: white;
    font-size: 0.5625rem;
    font-weight: 700;
    line-height: 1rem;
    text-align: center;
  }

  .map-search-chrome__pill {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
    min-height: 2rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid hsl(0, 0%, 88%);
    border-radius: 999px;
    background-color: hsl(0, 0%, 97%);
  }

  .search-root.mobile-shell .map-search-chrome__pill {
    border-color: transparent;
    background-color: hsl(0, 0%, 96%);
  }

  .search-icon {
    flex: 0 0 auto;
    color: hsl(0, 0%, 28%);
  }

  .map-search-chrome__pill input {
    flex: 1 1 auto;
    min-width: 8.5rem;
    border: none;
    outline: none;
    font-size: 0.875rem;
    color: #18181b;
    background: transparent;
    text-overflow: ellipsis;
  }

  .search-root:not(.mobile-shell) .map-search-chrome__pill input {
    min-width: 15rem;
  }

  .map-search-chrome__pill input::placeholder {
    color: #6b6b6b;
  }

  .clear-btn {
    all: unset;
    box-sizing: border-box;
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    min-width: 2.75rem;
    min-height: 2.75rem;
    cursor: pointer;
    color: hsl(0, 0%, 28%);
    border-radius: 999px;
    padding: 0.125rem;
  }

  .clear-btn:hover,
  .clear-btn:focus-visible {
    background-color: hsla(0, 0%, 0%, 0.08);
  }

  .clear-btn:focus-visible {
    outline: 2px solid #7b1113;
    outline-offset: 1px;
  }

  .map-search-chrome__suggestions {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    border-top: 1px solid var(--map-chrome-divider, hsl(5 12% 88%));
  }

  .search-root.search-suggestions-open:not(.mobile-shell)
    .map-search-chrome__bar,
  .search-root.search-suggestions-open:not(.mobile-shell)
    .map-search-chrome__suggestions {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .search-root.search-suggestions-open:not(.mobile-shell):not(
      .events-panel-open
    ):not(.transit-panel-open)
    .map-search-chrome__suggestions {
    border-bottom-left-radius: calc(var(--map-chrome-radius, 1rem) - 1px);
    border-bottom-right-radius: calc(var(--map-chrome-radius, 1rem) - 1px);
  }

  .map-search-chrome__suggestions :global(.suggestions-container) {
    display: flex;
    flex-direction: column;
    border-top: none;
    max-height: min(50dvh, 18rem);
  }

  .map-search-chrome__chips {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.375rem;
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 0.3125rem 0.625rem 0.3125rem;
    border-top: 1px solid var(--map-chrome-divider, hsl(5 12% 88%));
    transition: border-radius var(--motion-duration-micro)
      var(--motion-ease-out);
  }

  .map-search-chrome__chips > :global(*) {
    flex-shrink: 0;
    min-width: 0;
  }

  .search-root:not(.mobile-shell) .map-search-chrome__chips {
    border-bottom-left-radius: calc(var(--map-chrome-radius, 1rem) - 1px);
    border-bottom-right-radius: calc(var(--map-chrome-radius, 1rem) - 1px);
  }

  .search-root.events-panel-open:not(.mobile-shell) .map-search-chrome__chips,
  .search-root.transit-panel-open:not(.mobile-shell) .map-search-chrome__chips {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .map-search-chrome__chips::-webkit-scrollbar {
    display: none;
  }

  .map-search-chrome__chips :global(.building-filter-bar) {
    flex: 0 0 auto;
    min-width: 0;
    padding: 0;
  }

  .map-search-chrome__chips :global(.term-selector) {
    flex: 0 0 auto;
    min-width: 0;
    max-width: min(100%, 18rem);
  }

  .map-search-chrome__chips :global(.transit-filter-chip) {
    flex: 0 0 auto;
    min-width: 0;
  }

  .map-search-chrome__chips :global(.term-filter-chip) {
    flex: 0 0 auto;
    min-width: 0;
  }

  .map-search-chrome__transit-routes {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    padding: 0.3125rem 0.625rem 0.375rem;
    border-top: 1px solid var(--map-chrome-divider, hsl(5 12% 88%));
  }

  .search-root.transit-panel-open:not(.mobile-shell) .map-search-chrome__chips,
  .search-root.transit-panel-open:not(.mobile-shell)
    .map-search-chrome__transit-routes {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .search-root.transit-panel-open:not(.mobile-shell)
    .map-search-chrome__transit-routes {
    border-bottom-left-radius: calc(var(--map-chrome-radius, 1rem) - 1px);
    border-bottom-right-radius: calc(var(--map-chrome-radius, 1rem) - 1px);
  }

  .map-search-chrome__events {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    min-height: 0;
    max-height: min(50dvh, 22rem);
    overflow-x: clip;
    overflow-y: hidden;
    overscroll-behavior: contain;
    border-top: 1px solid var(--map-chrome-divider, hsl(5 12% 88%));
    padding: 0.1875rem 0.625rem 0.4375rem;
    -webkit-overflow-scrolling: touch;
  }

  .search-root.events-panel-open:not(.mobile-shell) .map-search-chrome__events {
    border-bottom-left-radius: calc(var(--map-chrome-radius, 1rem) - 1px);
    border-bottom-right-radius: calc(var(--map-chrome-radius, 1rem) - 1px);
  }

  .map-search-chrome__events :global(.events-section) {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1 1 auto;
    gap: 0;
  }

  .map-search-chrome__events :global(.section-actions--inline) {
    flex: 0 0 auto;
    gap: 0.375rem;
  }

  .map-search-chrome__events :global(.event-list) {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    gap: 0.375rem;
    margin-top: 0.25rem;
    padding-top: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  /* Fluid desktop search + filter row — Figma: Search | Add | chips | > */
  .search-root:not(.mobile-shell) .map-search-chrome--redesign {
    width: min(100%, calc(100vw - 2rem));
    max-width: none;
    min-width: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    overflow: visible;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__bar {
    padding: 0;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__bar-row {
    align-items: center;
    gap: var(--map-filter-gap, 0.375rem);
    flex-wrap: nowrap;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__pill-wrap {
    flex: 0 0 var(--map-search-width, 26rem);
    width: var(--map-search-width, 26rem);
    max-width: min(28rem, 42vw);
    min-width: 14rem;
  }

  /* Figma: Add lives inside the search pill (pink wash). */
  .map-search-chrome__add,
  .map-search-chrome__add-stop {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.3rem;
    height: 1.875rem;
    margin: 0 0 0 0.25rem;
    padding: 0 0.65rem;
    border: none;
    border-radius: 999px;
    background: #feeaea;
    color: #8d1437;
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    box-shadow: none;
    cursor: pointer;
  }

  /* The redesign pill is a fixed 2.375rem tall; the default 1.875rem chip plus
     the pill's 0.35rem vertical padding overflows it (chip protruded below the
     search bar). Fit the chip inside the pill on the desktop shell. */
  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__add,
  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__add-stop {
    height: 1.625rem;
    align-self: center;
  }

  .map-search-chrome__add:hover,
  .map-search-chrome__add-stop:hover,
  .map-search-chrome__add:focus-visible,
  .map-search-chrome__add-stop:focus-visible {
    background: #fcdada;
  }

  .map-search-chrome__add-stop--armed {
    background: var(--color-brand, #8d1437);
    color: #fff;
  }

  .map-search-chrome__add-stop--armed:hover,
  .map-search-chrome__add-stop--armed:focus-visible {
    background: #7a1130;
  }

  .search-root.mobile-shell .map-search-chrome__add-stop {
    width: 2rem;
    height: 2rem;
    margin-right: 0.15rem;
    padding: 0;
    justify-content: center;
  }

  .search-root.mobile-shell .map-search-chrome__add-stop-text {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__pill {
    box-sizing: border-box;
    width: 100%;
    height: var(--map-search-pill-height, 2.375rem);
    min-height: var(--map-search-pill-height, 2.375rem);
    gap: 0.55rem;
    padding: 0.35rem 0.4rem 0.35rem 0.95rem;
    border: none;
    border-radius: 999px;
    background: #fff;
    box-shadow: var(--shadow-search, 0 1px 3.5px rgb(58 58 71 / 0.2));
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__pill
    :global(.search-icon) {
    flex-shrink: 0;
    color: #332529;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__pill
    :global(.search-icon svg) {
    width: 1rem;
    height: 1rem;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__pill
    input {
    font-family: Inter, system-ui, sans-serif;
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.2;
    color: #000;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__pill
    .clear-btn
    svg {
    width: 0.875rem;
    height: 0.875rem;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__pill
    input::placeholder {
    color: #bcbcc8;
    font-weight: 600;
    opacity: 1;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__suggestions {
    width: var(--map-search-width, 26rem);
    max-width: 100%;
    margin-top: 0.5rem;
    border: none;
    border-radius: 1.25rem;
    background: #fff;
    box-shadow: var(--shadow-results, 0 2px 6px rgb(36 37 46 / 0.2));
    overflow: hidden;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__suggestions
    :global(.suggestions-container) {
    gap: 0.125rem;
    padding: 1rem 1rem 1.125rem;
    border-top: none;
    max-height: min(60vh, 22rem);
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__suggestions
    :global(.suggestions-header) {
    padding: 0.15rem 0.5rem 0.65rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: #9a9aab;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__suggestions
    :global(.suggestion-row) {
    border-radius: 0.625rem;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__suggestions
    :global(.suggestion) {
    min-height: 2.5rem;
    padding: 0.55rem 0.5rem;
    gap: 0.65rem;
    border-radius: 0.625rem;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__suggestions
    :global(.suggestion .text) {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    .map-search-chrome__suggestions
    :global(.suggestion-remove) {
    width: 2.25rem;
    color: #8a8a98;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    :global(.map-filter-chips) {
    flex: 1 1 auto;
    width: auto;
    /* Cap width so the inner scroller can overflow-x instead of clipping. */
    max-width: 100%;
    min-width: 0;
    height: var(--map-search-pill-height, 2.375rem);
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    :global(.map-filter-chips__chip) {
    height: var(--map-chip-height, 2rem);
    border-radius: 999px;
    font-size: 0.8125rem;
    padding: 0 0.75rem;
  }

  .search-root:not(.mobile-shell)
    .map-search-chrome--redesign
    :global(.map-filter-chips__more) {
    width: var(--map-chip-height, 2rem);
    height: var(--map-chip-height, 2rem);
    border-radius: 999px;
  }

  .search-root:not(.mobile-shell) .search-shell-main {
    width: min(100%, calc(100vw - 2rem));
    max-width: none;
  }

  /* Narrow desktop: chips under Search + Add. */
  @media (max-width: 64rem) {
    .search-root:not(.mobile-shell)
      .map-search-chrome--redesign
      .map-search-chrome__bar-row {
      flex-wrap: wrap;
    }

    .search-root:not(.mobile-shell)
      .map-search-chrome--redesign
      .map-search-chrome__pill-wrap {
      flex: 1 1 auto;
      width: auto;
      max-width: none;
      min-width: 12rem;
    }

    .search-root:not(.mobile-shell)
      .map-search-chrome--redesign
      :global(.map-filter-chips) {
      flex: 1 1 100%;
      order: 3;
    }
  }
</style>
