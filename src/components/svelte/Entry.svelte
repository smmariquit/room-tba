<script lang="ts">
  import { onMount } from "svelte";
  import {
    modalStore,
    queryStore,
    locationStore,
    toastStore,
  } from "../../lib/store.svelte";
  import Modal from "./modal/Modal.svelte";
  import SidePanel from "./sidepanel/SidePanel.svelte";
  import Map from "./Map.svelte";
  import StatusBar from "./StatusBar.svelte";
  import Toast from "./Toast.svelte";
  import type { RecentSearch } from "../../lib/types";
  import { isRecentSearch } from "../../lib/locStorage";
  import { getAppData } from "../../lib/context";

  const { rooms, buildings } = getAppData();

  const updateData = (queryHistory: RecentSearch[]) => {
    localStorage.setItem("recent-search", JSON.stringify(queryHistory));
  };

  /**
   * Honor /?building=<name>, /?room=<code>, and /?q=<text> from URL on first
   * load so links from the static SEO landing pages (or anywhere else) deep
   * link into the SPA with the right thing pre-selected.
   */
  function applyDeepLinkFromQuery() {
    if (typeof window === "undefined") return false;
    const params = new URL(window.location.href).searchParams;
    const buildingParam = params.get("building");
    const roomParam = params.get("room");
    const qParam = params.get("q");

    if (buildingParam) {
      const match = buildings.find(
        (b) =>
          b.building_name.toLowerCase() === buildingParam.toLowerCase(),
      );
      if (match) {
        queryStore.updateQuery({
          category: "building",
          type: "result",
          value: match.building_name,
        });
        queryStore.inputValue = match.building_name;
        return true;
      }
    }

    if (roomParam) {
      const match = rooms.find(
        (r) => r.code.toLowerCase() === roomParam.toLowerCase(),
      );
      if (match) {
        queryStore.updateQuery({
          category: "room",
          type: "result",
          value: match.code,
        });
        queryStore.inputValue = match.code;
        return true;
      }
    }

    if (qParam) {
      queryStore.inputValue = qParam;
      return true;
    }

    return false;
  }

  onMount(() => {
    const hideLanding = localStorage.getItem("hideLandingModal");
    const recentSearchesLS = localStorage.getItem("recent-search");
    try {
      const parsedSearches: unknown[] = JSON.parse(recentSearchesLS ?? "[]");
      parsedSearches.forEach((parsedSearch) => {
        if (isRecentSearch(parsedSearch)) {
          queryStore.addRecentSearch(parsedSearch);
        }
      });
    } catch (e) {
      queryStore.recentSearches = [];
    }

    const usedDeepLink = applyDeepLinkFromQuery();
    if (hideLanding !== "true" && !usedDeepLink) {
      modalStore.openModal("landing");
    }
  });
  $effect(() => {
    updateData(queryStore.recentSearches);
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      if (modalStore.open) {
        modalStore.closeModal();
      } else if (queryStore.inputValue !== "" || queryStore.type === "result") {
        queryStore.clearQuery();
        if (locationStore.destination) {
          locationStore.clearDestination();
        }
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

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
    {#if toastStore.message}
      <Toast
        message={toastStore.message}
        type={toastStore.type}
        onclose={() => toastStore.clear()}
      />
    {/if}
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

  :global(*) {
    margin: unset;
    box-sizing: border-box;
  }
</style>
