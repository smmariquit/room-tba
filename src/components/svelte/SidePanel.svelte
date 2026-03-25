<script lang="ts">
  import RoomDisplay from "./RoomDisplay.svelte";
  import { onMount } from "svelte";
  import { debounce } from "es-toolkit/function";
  import type { RoomData, ClassMapValue, IFilterStore } from "../../lib/types";
  import {
    filterStore,
    modalStore,
    currentRoomStore,
  } from "../../lib/store.svelte";
  import RoomModalContent from "./RoomModalContent.svelte";

  type Props = {
    rooms: RoomData[];
    classesMap: Map<string, ClassMapValue[]>;
  };

  const { rooms, classesMap }: Props = $props();

  const MAX_DISPLAY_RESULT = 20;

  let searchElement: HTMLInputElement | null = $state(null);
  let searchInput: string = $state("");
  let typing: boolean = $state(false);
  let paginateOffset: number = $state(0);
  // svelte-ignore state_referenced_locally
  let roomsResult: Props["rooms"] = $state(rooms);

  const maxPaginateOffset: number = $derived(
    Math.floor((roomsResult.length - 1) / MAX_DISPLAY_RESULT) + 1,
  );
  const paginatedRooms = $derived(
    roomsResult.slice(
      paginateOffset * MAX_DISPLAY_RESULT,
      (paginateOffset + 1) * MAX_DISPLAY_RESULT,
    ),
  );

  const isSearchOnly = $derived(
    searchInput !== "" &&
      filterStore.filterData.filter === null &&
      !modalStore.open,
  );

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const paramsQuery = params.get("s");
    if (paramsQuery != null) {
      searchInput = paramsQuery;
      const searchString = paramsQuery.toLowerCase();
      roomsResult =
        searchString !== ""
          ? rooms.filter(
              ({ divisionName, collegeName, building, code }) =>
                code.toLowerCase().includes(searchString) ||
                collegeName?.toLowerCase().includes(searchString) ||
                divisionName?.toLowerCase().includes(searchString) ||
                building?.name.toLowerCase().includes(searchString),
            )
          : [];
    }

    window.addEventListener("keydown", windowKeyDown);
    return () => {
      window.removeEventListener("keydown", windowKeyDown);
    };
  });

  const debounceSearch = debounce(
    (inputValue: string, filterData: typeof filterStore.filterData) => {
      typing = false;

      // If the user starts typing a new search while looking at a modal,
      // close the modal and go back to search view
      if (inputValue !== "" && modalStore.open) {
        modalStore.closeModal();
      }

      roomsResult = findRooms(rooms, inputValue, filterData);
      paginateOffset = 0;
      const url = new URL(window.location.href);

      if (inputValue === "") url.searchParams.delete("s");
      else url.searchParams.set("s", inputValue);

      window.history.replaceState({}, "", url);
    },
    500,
  );

  $effect(() => {
    debounceSearch(searchInput, filterStore.filterData);
  });

  function windowKeyDown(ev: KeyboardEvent) {
    if (
      ev.key === "k" &&
      ev.ctrlKey &&
      searchElement != null &&
      searchElement !== document.activeElement
    ) {
      ev.preventDefault();
      searchElement.focus();
    }
    if (ev.key === "Escape") {
      modalStore.closeModal();
      if (filterStore.filterData.filter !== null) {
        filterStore.resetFilter();
      }
    }
  }

  function findRooms(
    rooms: RoomData[],
    searchTerm: string,
    { type, filter }: Pick<IFilterStore, "filter" | "type">,
  ) {
    searchTerm = searchTerm.toLowerCase().trim();

    if (filter !== null)
      switch (type) {
        case "building":
          rooms = rooms.filter((room) => room.building?.name.includes(filter));
          break;
        case "college":
          rooms = rooms.filter((room) => room.collegeName?.includes(filter));
          break;
        case "division":
          rooms = rooms.filter((room) => room.divisionName?.includes(filter));
          break;
      }

    return searchInput !== ""
      ? rooms.filter(
          ({ divisionName, collegeName, building, code }) =>
            code.toLowerCase().includes(searchTerm) ||
            collegeName?.toLowerCase().includes(searchTerm) ||
            divisionName?.toLowerCase().includes(searchTerm) ||
            building?.name.toLowerCase().includes(searchTerm) ||
            classesMap
              .get(code)
              ?.some((c) => c.courseCode.toLowerCase().includes(searchTerm)),
        )
      : rooms;
  }

  function handleInput() {
    typing = true;
    if (modalStore.open) {
      modalStore.closeModal();
    }
  }

  function scrollToTop() {
    const panel = document.querySelector(".panel-content");
    if (panel) {
      panel.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function closeSearchContext() {
    modalStore.closeModal();
    filterStore.resetFilter();
    searchInput = "";
  }
</script>

<div class="side-panel-wrapper">
  <div class="search-filter-row">
    <div class="search-container">
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
        class="search-icon"
        ><circle cx="11" cy="11" r="8" /><line
          x1="21"
          y1="21"
          x2="16.65"
          y2="16.65"
        /></svg
      >
      <input
        type="text"
        id="search"
        bind:this={searchElement}
        bind:value={searchInput}
        class={typing ? "typing" : ""}
        oninput={handleInput}
        placeholder={filterStore.filterData.filter
          ? filterStore.filterData.filter
          : "Search room code, building, division..."}
      />
      {#if typing}
        <div class="loading-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            width="20"
            height="20"
          >
            <circle stroke-width="17" r="15" cx="40" cy="65"
              ><animate
                attributeName="cy"
                calcMode="spline"
                dur="0.8"
                values="65;135;65;"
                keySplines=".5 0 .5 1;.5 0 .5 1"
                repeatCount="indefinite"
                begin="-.4"
              ></animate></circle
            >
            <circle stroke-width="17" r="15" cx="100" cy="65"
              ><animate
                attributeName="cy"
                calcMode="spline"
                dur="0.8"
                values="65;135;65;"
                keySplines=".5 0 .5 1;.5 0 .5 1"
                repeatCount="indefinite"
                begin="-.2"
              ></animate></circle
            >
            <circle stroke-width="17" r="15" cx="160" cy="65"
              ><animate
                attributeName="cy"
                calcMode="spline"
                dur="0.8"
                values="65;135;65;"
                keySplines=".5 0 .5 1;.5 0 .5 1"
                repeatCount="indefinite"
                begin="0"
              ></animate></circle
            >
          </svg>
        </div>
      {/if}
    </div>

    <div class="search-buttons">
      {#if filterStore.filterData.filter !== null || modalStore.open || searchInput !== ""}
        <button
          onclick={closeSearchContext}
          type="button"
          class="clear-btn"
          aria-label="Clear Search"
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
            ><line x1="18" y1="6" x2="6" y2="18"></line><line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
            ></line></svg
          >
        </button>
      {:else}
        <!-- onclick={() => modalStore.openModal("filters")} -->
        <button type="button" class="filter-btn" aria-label="Filters">
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
            ><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
            ></polygon></svg
          >
        </button>
      {/if}
    </div>
  </div>

  {#if searchInput !== "" || filterStore.filterData.filter !== null || modalStore.open}
    <div class="panel-content {isSearchOnly ? 'search-mode-panel' : ''}">
      {#if modalStore.open}
        <RoomModalContent />
      {:else}
        {#if filterStore.filterData.type === "building" && filterStore.filterData.filter !== null}
          <div class="building-header">
            <div class="header-top-row">
              <h2>{filterStore.filterData.filter}</h2>
            </div>
            <p class="building-subtitle">Rooms used by the institution</p>
          </div>
        {/if}

        {#if isSearchOnly}
          <div class="mobile-compact-results">
            {#if roomsResult.length === 0}
              <div class="compact-result-empty">
                <span class="compact-room-code">No rooms found</span>
              </div>
            {:else}
              {#each roomsResult.slice(0, 5) as room}
                <button
                  class="compact-result-item"
                  onclick={() => {
                    currentRoomStore.updateClasses(
                      classesMap.get(room.code) ?? [],
                    );
                    currentRoomStore.updateRoom(room);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#969696"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><line x1="7" y1="17" x2="17" y2="7"></line><polyline
                      points="7 7 17 7 17 17"
                    ></polyline></svg
                  >
                  <span class="compact-room-code"
                    ><strong>{room.code}</strong>
                    {room.building?.name ? `· ${room.building.name}` : ""}</span
                  >
                </button>
              {/each}
            {/if}
          </div>
        {/if}

        <div
          class="desktop-full-results {isSearchOnly ? 'hide-on-mobile' : ''}"
        >
          <div class="rooms-header-info">
            {#if searchInput !== "" && !typing}
              <div class="rooms-found">{roomsResult.length} rooms found</div>
            {/if}
          </div>

          <div class="room-container">
            {#each paginatedRooms as room}
              <RoomDisplay
                {room}
                {searchInput}
                classes={classesMap.get(room.code) ?? []}
              ></RoomDisplay>
            {/each}
          </div>

          {#if roomsResult.length > 20}
            <div class="pagination-controls">
              <button
                title="next"
                onclick={() => {
                  paginateOffset > 0 && paginateOffset--;
                  scrollToTop();
                }}
                disabled={paginateOffset === 0}
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
                ></button
              >
              <div>
                {paginateOffset + 1} of {maxPaginateOffset}
              </div>
              <button
                onclick={() => {
                  paginateOffset + 1 < maxPaginateOffset && paginateOffset++;
                  scrollToTop();
                }}
                disabled={paginateOffset === maxPaginateOffset - 1}
                aria-label="next"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
                ></button
              >
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .side-panel-wrapper {
    position: relative;
    margin-top: 0.75rem;
    margin-left: 1.3125rem;
    width: 25.75rem;
    max-width: calc(100% - 2.625rem);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
    min-height: 0;
    margin-bottom: 1.3125rem;
    pointer-events: auto;
  }

  /* Mobile responsiveness for side panel */
  @media screen and (max-width: 48rem) {
    .side-panel-wrapper {
      position: relative;
      margin: 0;
      width: 100%;
      max-width: 100%;
      flex: 1;
      pointer-events: none; /* Let clicks pass through empty space */
      display: flex;
      flex-direction: column;
      justify-content: space-between; /* Space between search top and panel bottom */
    }
  }

  .search-filter-row {
    background-color: white;
    border-radius: 0.8125rem;
    box-shadow: 0rem 2px 0.25rem 0rem rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  @media screen and (max-width: 48rem) {
    .search-filter-row {
      margin: 1rem;
      pointer-events: auto;
      border-radius: 2rem; /* Pill shape for mobile */
    }
  }

  .search-container {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .search-icon {
    position: absolute;
    left: 0;
    color: black;
  }

  input[type="text"] {
    width: 100%;
    border: none;
    outline: none;
    padding-left: 1.75rem;
    font-size: 0.875rem;
    color: black;
    background: transparent;
    text-overflow: ellipsis;
  }

  input[type="text"]::placeholder {
    color: #999;
  }

  .search-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .filter-btn,
  .clear-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: black;
  }

  .loading-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.5rem;
  }

  .loading-icon svg {
    fill: #7b2d26;
    stroke: #7b2d26;
  }

  .panel-content {
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0rem 2px 0.25rem 0rem rgba(0, 0, 0, 0.25);
    padding: 1.125rem 1.5rem;
    flex: 1;
    overflow: hidden;
    overflow-x: clip;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    .desktop-full-results {
      overflow-y: auto;
    }
  }

  @media screen and (max-width: 48rem) {
    .panel-content {
      pointer-events: auto;
      margin: 0;
      border-radius: 1.5rem;
      max-height: 40vh;
      padding: 1.5rem 1.5rem;
      box-shadow: 0 -0.25rem 1rem rgba(0, 0, 0, 0.1);
      flex: none;
      margin-top: auto;
    }

    .panel-content.search-mode-panel {
      margin-top: -1rem; /* THIS IS HUMAN MADE SLOP*/
      margin-bottom: auto;
      margin-left: 1rem;
      margin-right: 1rem;
      border-radius: 0.75rem;
      padding: 0.5rem;
      max-height: none;
      box-shadow: 0rem 2px 0.25rem 0rem rgba(0, 0, 0, 0.25);
    }

    .hide-on-mobile {
      display: none !important;
    }
  }

  .mobile-compact-results {
    display: none;
  }

  @media screen and (max-width: 48rem) {
    .mobile-compact-results {
      display: flex;
      flex-direction: column;
    }
  }

  .compact-result-item {
    all: unset;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 0.5rem;
    cursor: pointer;

    border-bottom: 1px solid #f0f0f0;
  }

  .compact-result-item:last-child {
    border-bottom: none;
  }

  .compact-result-empty {
    padding: 0.75rem 0.5rem;

    color: #969696;
    text-align: center;
  }

  .compact-room-code {
    font-size: 0.875rem;
    color: black;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .building-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .header-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .building-header h2 {
    font-weight: bold;
    font-size: 1.125rem;
    line-height: 1.25rem;
    margin: 0;
    color: black;
  }

  .building-desc {
    font-size: 0.75rem;
    color: #4f4f4f;
    line-height: 1.5;
    margin: 0;
    margin-bottom: 0.5rem;
  }

  .building-subtitle {
    font-size: 0.875rem;
    color: #4c4c4c;
    font-weight: bold;
    margin: 0;
  }

  .rooms-header-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .rooms-found {
    color: hsl(0, 0%, 30%);
    font-size: 0.875rem;
  }

  .room-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .pagination-controls button {
    all: unset;
    padding: 0.5rem;
    display: flex;
    justify-content: center;
    background-color: hsl(5, 53%, 32%);
    border-radius: 1rem;
    color: white;
    cursor: pointer;
  }

  .pagination-controls button:active {
    background-color: hsl(5, 53%, 20%);
  }

  .pagination-controls button:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
</style>
