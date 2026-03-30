<script lang="ts">
  import { onMount } from "svelte";
  import Search from "./Search.svelte";
  import { queryStore } from "../../lib/store.svelte";
  import BuildingResult from "./BuildingQuery.svelte";
  import CollegeResult from "./CollegeResult.svelte";
  import DivisionResult from "./DivisionResult.svelte";
  import RoomResult from "./RoomResult.svelte";

  // let searchElement: HTMLInputElement | null = $state(null);
  // let searchInput: string = $state("");
  // let paginateOffset: number = $state(0);
  // svelte-ignore state_referenced_locally
  // let roomsResult: typeof rooms = $state(rooms);
  // const paginatedRooms = $derived(
  //   roomsResult.slice(
  //     paginateOffset * MAX_DISPLAY_RESULT,
  //     (paginateOffset + 1) * MAX_DISPLAY_RESULT,
  //   ),
  // );

  // const maxPaginateOffset: number = $derived(
  //   Math.floor((roomsResult.length - 1) / MAX_DISPLAY_RESULT) + 1,
  // );

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const paramsQuery = params.get("s");
    if (paramsQuery != null) {
      // searchInput = paramsQuery;
      // const searchString = paramsQuery.toLowerCase();
      // roomsResult =
      //   searchString !== ""
      //     ? rooms.filter(
      //         ({ divisionName, collegeName, building, code }) =>
      //           code.toLowerCase().includes(searchString) ||
      //           collegeName?.toLowerCase().includes(searchString) ||
      //           divisionName?.toLowerCase().includes(searchString) ||
      //           building?.name.toLowerCase().includes(searchString),
      //       )
      //     : [];
    }

    // window.addEventListener("keydown", windowKeyDown);
    // return () => {
    //   window.removeEventListener("keydown", windowKeyDown);
    // };
  });

  // const debounceSearch = debounce((inputValue: string) => {
  //   typing = false;

  //   if (inputValue !== "" && modalStore.open) {
  //     modalStore.closeModal();
  //   }

  //   // roomsResult = findRooms(rooms, inputValue);
  //   // paginateOffset = 0;
  //   const url = new URL(window.location.href);

  //   if (inputValue === "") url.searchParams.delete("s");
  //   else url.searchParams.set("s", inputValue);

  //   window.history.replaceState({}, "", url);
  // }, 500);

  // $effect(() => {
  //   debounceSearch(searchInput);
  // });

  // function windowKeyDown(ev: KeyboardEvent) {
  //   if (
  //     ev.key === "k" &&
  //     ev.ctrlKey &&
  //     searchElement != null &&
  //     searchElement !== document.activeElement
  //   ) {
  //     ev.preventDefault();
  //     searchElement.focus();
  //   }
  // }

  // function findRooms(rooms: RoomData[], searchTerm: string) {
  //   searchTerm = searchTerm.toLowerCase().trim();

  //   return searchInput !== ""
  //     ? rooms.filter(
  //         ({ divisionName, collegeName, building, code }) =>
  //           code.toLowerCase().includes(searchTerm) ||
  //           collegeName?.toLowerCase().includes(searchTerm) ||
  //           divisionName?.toLowerCase().includes(searchTerm) ||
  //           building?.name.toLowerCase().includes(searchTerm) ||
  //           classesMap
  //             .get(code)
  //             ?.some((c) => c.courseCode.toLowerCase().includes(searchTerm)),
  //       )
  //     : rooms;
  // }
</script>

<div class="side-panel-wrapper">
  <Search />
  {#if queryStore.type === "result"}
    <div class="side-panel-content">
      {#if queryStore.category === "building"}
        <BuildingResult />
      {:else if queryStore.category === "college"}
        <CollegeResult />
      {:else if queryStore.category === "division"}
        <DivisionResult />
      {:else}
        <RoomResult />
      {/if}
    </div>
  {/if}
</div>

<style>
  .side-panel-wrapper {
    position: relative;
    width: 25.75rem;
    max-width: calc(100% - 2.625rem);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
    pointer-events: none;
  }
  .side-panel-content {
    background-color: white;
    border-radius: 1.5rem; /* 24px */
    padding: 1.125rem 1.5rem; /* 18px top/bottom, 24px left/right */
    pointer-events: auto;
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.25);
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

    .side-panel-content {
      flex: none;
      margin-top: auto;
      max-height: 45vh;
      box-shadow: 0px -4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  /* .panel-content {
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
      flex: 1;
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
      margin-top: -1rem; // THIS IS HUMAN MADE SLOP
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
  } */
</style>
