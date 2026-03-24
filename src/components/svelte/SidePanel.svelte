<script lang="ts">
  import RoomDisplay from "./RoomDisplay.svelte";
  import { onMount } from "svelte";
  import { debounce } from "es-toolkit/function";
  import type { RoomData, ClassMapValue, IFilterStore } from "../../lib/types";
  import { filterStore, modalStore, currentRoomStore } from "../../lib/store.svelte";
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
      
      // If the user starts typing a new search while looking at room details,
      // close the modal and go back to search view
      if (inputValue !== "" && modalStore.type === "room-details") {
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
            classesMap.get(code)?.some(
              (c) => c.courseCode.toLowerCase().includes(searchTerm)
            ),
        )
      : rooms;
  }

  function handleInput(
  ) {
    typing = true;
    if (modalStore.open && modalStore.type === 'room-details') {
      modalStore.closeModal();
    }
  }
  
  function scrollToTop() {
    const panel = document.querySelector('.panel-content');
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
      ><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        type="search"
        id="search"
        bind:this={searchElement}
        bind:value={searchInput}
        class={typing ? "typing" : ""}
        oninput={handleInput}
        placeholder={
          modalStore.type === 'room-details' ? currentRoomStore.roomData?.code :
          (filterStore.filterData.filter ? filterStore.filterData.filter : "Search room code, building, division...")
        }
      />
      {#if typing}
        <div class="loading-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="20" height="20">
            <circle stroke-width="17" r="15" cx="40" cy="65"><animate attributeName="cy" calcMode="spline" dur="0.8" values="65;135;65;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="-.4"></animate></circle>
            <circle stroke-width="17" r="15" cx="100" cy="65"><animate attributeName="cy" calcMode="spline" dur="0.8" values="65;135;65;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="-.2"></animate></circle>
            <circle stroke-width="17" r="15" cx="160" cy="65"><animate attributeName="cy" calcMode="spline" dur="0.8" values="65;135;65;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="0"></animate></circle>
          </svg>
        </div>
      {/if}
    </div>

    <div class="search-buttons">
      {#if filterStore.filterData.filter !== null || (modalStore.open && modalStore.type === 'room-details') || searchInput !== ""}
        <button onclick={closeSearchContext} type="button" class="clear-btn" aria-label="Clear Search">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      {:else}
        <button
          onclick={() => modalStore.openModal("filters")}
          type="button"
          class="filter-btn"
          aria-label="Filters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        </button>
      {/if}
    </div>
  </div>

  {#if searchInput !== "" || filterStore.filterData.filter !== null || (modalStore.open && modalStore.type === 'room-details')}
    <div class="panel-content">
      {#if modalStore.open && modalStore.type === 'room-details'}
        <RoomModalContent />
      {:else}
        {#if filterStore.filterData.type === 'building' && filterStore.filterData.filter !== null}
          <div class="building-header">
            <h2>{filterStore.filterData.filter}</h2>
            <p>Rooms used by the institution</p>
          </div>
        {/if}

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
            <button title='next'
              onclick={() => {
                paginateOffset > 0 && paginateOffset--;
                scrollToTop();
              }}
              disabled={paginateOffset === 0}
              ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
            <div>
              {paginateOffset + 1} of {maxPaginateOffset}
            </div>
            <button
              onclick={() => {
                paginateOffset + 1 < maxPaginateOffset && paginateOffset++;
                scrollToTop();
              }}
              disabled={paginateOffset === maxPaginateOffset - 1}
              aria-label='next'
              ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg></button>
          </div>
        {/if}
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
       margin-left: auto;
       margin-right: auto;
       margin-top: auto;
       margin-bottom: 1.3125rem;
       width: calc(100% - 2.625rem);
       flex: none;
       height: 50vh;
    }
  }

  .search-filter-row {
    background-color: white;
    border-radius: 0.8125rem;
    box-shadow: 0rem 2px 0.25rem 0rem rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    gap: 0.5rem;
    flex-shrink: 0;
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

  input[type="search"] {
    width: 100%;
    border: none;
    outline: none;
    padding-left: 1.75rem;
    font-size: 0.875rem;
    color: black;
    background: transparent;
    text-overflow: ellipsis;
  }
  
  input[type="search"]::placeholder {
    color: #999;
  }

  .search-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .filter-btn, .clear-btn {
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
    overflow-x: hidden;
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0rem 2px 0.25rem 0rem rgba(0,0,0,0.25);
    padding: 1.125rem 1.5rem;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .building-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .building-header h2 {
    font-weight: bold;
    font-size: 1.125rem;
    line-height: 1.25rem;
    margin: 0;
    color: black;
  }

  .building-header p {
    font-size: 0.875rem;
    color: #4c4c4c;
    font-weight: bold;
    margin: 0;
    margin-top: 0.25rem;
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
