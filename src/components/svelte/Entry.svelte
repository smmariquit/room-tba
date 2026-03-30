<script lang="ts">
  import { onMount } from "svelte";
  import { modalStore, queryStore } from "../../lib/store.svelte";
  import Modal from "./Modal.svelte";
  import SidePanel from "./SidePanel.svelte";
  import Map from "./Map.svelte";
  import StatusBar from "./StatusBar.svelte";
  import type { RecentSearch } from "../../lib/types";
  import { isRecentSearch } from "../../lib/locStorage";

  const updateData = (recentSearch: RecentSearch) => {
    const recentSearchesLS = localStorage.getItem("recent-search");
    const recentSearches = [];
    try {
      const parsedSearches: unknown[] = JSON.parse(recentSearchesLS ?? "[]");
      parsedSearches.forEach((parsedSearch) => {
        if (isRecentSearch(parsedSearch)) {
          recentSearches.push(parsedSearch);
        }
      });
      recentSearches.unshift(recentSearch);
      if (recentSearches.length > 5) recentSearches.pop();
      localStorage.setItem("recent-search", JSON.stringify(recentSearches));
    } catch (e) {
      localStorage.setItem("recent-search", JSON.stringify([recentSearch]));
    }
  };
  onMount(() => {
    const hideLanding = localStorage.getItem("hideLandingModal");
    if (hideLanding !== "true") {
      modalStore.openModal("landing");
    }
  });
  $effect(() => {
    console.log(queryStore);
    if (queryStore.type === "result" && queryStore.category !== null)
      updateData({
        category: queryStore.category,
        value: queryStore.value,
      });
  });
</script>

<div class="app-layout">
  <Map />
  <div class="ui-layer">
    <!-- <header class="top-header">
      <h2>Room TBA</h2>
    </header> -->
    <div class="inner-layer">
      <SidePanel />
      <StatusBar />
    </div>
  </div>
  <Modal />
</div>

<style>
  .app-layout {
    width: 100%;
    height: 100dvh;
    overflow: hidden;
  }
  .inner-layer {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    flex: 1 0 0;
    pointer-events: none;
    gap: 0.5rem;
  }

  :global(.map) {
    width: 100%;
    height: 100%;
  }

  .ui-layer {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .top-header {
    background-color: white;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    box-shadow: 0 2px 0.25rem rgba(0, 0, 0, 0.1);
  }

  .top-header h2 {
    font-weight: bold;
    font-size: 0.9375rem;
    margin: 0;
    color: black;
  }

  :global(*) {
    margin: unset;
    box-sizing: border-box;
  }
</style>
