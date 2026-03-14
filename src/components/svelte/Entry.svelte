<script lang="ts">
  import RoomDisplay from "./RoomDisplay.svelte";
  import { onMount } from "svelte";
  import { debounce } from "es-toolkit/function";
  import type {
    BuildingData,
    ClassMapValue,
    CollegeData,
    DivisionData,
    IFilterStore,
    RoomData,
  } from "../../lib/types";
  import { filterStore, modalStore } from "../../lib/store.svelte";
  import Banner from "./Banner.svelte";
  import Modal from "./Modal.svelte";

  type Props = {
    rooms: RoomData[];
    buildings: BuildingData[];
    colleges: CollegeData[];
    divisions: DivisionData[];
    classesMap: Map<string, ClassMapValue[]>;
  };

  const MAX_DISPLAY_RESULT = 20;

  const { rooms, classesMap, buildings, divisions, colleges }: Props = $props();
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

    filterStore.setData([buildings, colleges, divisions]);
    window.addEventListener("keydown", windowKeyDown);
    return () => {
      window.removeEventListener("keydown", windowKeyDown);
    };
  });

  const debounceSearch = debounce(
    (inputValue: string, filterData: typeof filterStore.filterData) => {
      typing = false;
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
    if (ev.key === "Escape") modalStore.closeModal();
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
            building?.name.toLowerCase().includes(searchTerm),
        )
      : rooms;
  }

  function handleInput(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    typing = true;
  }
  function scrollToTop() {
    window.scrollTo({
      top: 48,
      behavior: "smooth",
    });
  }
</script>

<Banner
  >⚠️ <strong>This app is in active development.</strong> There might be
  mistakes in room locations and building information. Please
  <a href="mailto:semariquit@gmail.com"><strong>report any errors!</strong></a>
</Banner>
<main>
  <div id="header">
    <div class="heading">
      <img src="/carillon.jpg" alt="A tall antique building" />
      <div>
        <h2>Room TBA</h2>
        <p>"Saan sa UPLB ang ___?" Finally answered.</p>
      </div>
    </div>
    <div class="search-container">
      <input
        type="search"
        id="search"
        bind:this={searchElement}
        bind:value={searchInput}
        class={typing ? "typing" : ""}
        oninput={handleInput}
        placeholder="Search room code, building, division, or course code (e.g., CMSC 21)"
      />
      {#if typing}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 200"
          width="20"
          height="20"
          class="loading-icon"
        >
          <circle stroke-width="17" r="15" cx="40" cy="65">
            <animate
              attributeName="cy"
              calcMode="spline"
              dur="0.8"
              values="65;135;65;"
              keySplines=".5 0 .5 1;.5 0 .5 1"
              repeatCount="indefinite"
              begin="-.4"
            ></animate>
          </circle>
          <circle stroke-width="17" r="15" cx="100" cy="65">
            <animate
              attributeName="cy"
              calcMode="spline"
              dur="0.8"
              values="65;135;65;"
              keySplines=".5 0 .5 1;.5 0 .5 1"
              repeatCount="indefinite"
              begin="-.2"
            ></animate>
          </circle>
          <circle stroke-width="17" r="15" cx="160" cy="65">
            <animate
              attributeName="cy"
              calcMode="spline"
              dur="0.8"
              values="65;135;65;"
              keySplines=".5 0 .5 1;.5 0 .5 1"
              repeatCount="indefinite"
              begin="0"
            ></animate>
          </circle>
        </svg>
      {/if}
    </div>
    <div>
      <div class="search-buttons">
        <button onclick={() => modalStore.openModal("filters")} type="button"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-list-filter-icon lucide-list-filter"
            ><path d="M2 5h20" /><path d="M6 12h12" /><path d="M9 19h6" /></svg
          >Filter</button
        >
        {#if filterStore.filterData.filter !== null}
          <button onclick={() => filterStore.resetFilter()} type="button"
            >{filterStore.filterData.filter}<svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-x-icon lucide-x"
              ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
            ></button
          >
        {/if}
      </div>
      {#if searchInput !== "" && !typing}
        <div class="rooms-found">{roomsResult.length} rooms found</div>
      {/if}
    </div>
    <hr />
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
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <button
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
          stroke-linejoin="round"
          class="lucide lucide-chevron-left-icon lucide-chevron-left"
          ><path d="m15 18-6-6 6-6" /></svg
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
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-chevron-right-icon lucide-chevron-right"
          ><path d="m9 18 6-6-6-6" /></svg
        ></button
      >
    </div>
  {/if}
  <Modal />
</main>

<style>
  #header {
    margin-block: 1rem;
  }
  .heading {
    display: flex;
    margin-bottom: 0.5rem;
    gap: 1rem;
    align-items: center;
    > img {
      border-radius: 0.5rem;
      width: 48px;
      height: 48px;
      object-fit: cover;
    }

    > div * {
      margin-block: 0.5rem;
    }
  }
  div.search-container {
    position: relative;
    svg {
      position: absolute;
      left: 1rem;
      top: 50%;
      translate: 0 -50%;
      fill: #7b2d26;
      stroke: #7b2d26;
      visibility: visible;
    }
  }

  div.search-buttons {
    margin-top: 0.5rem;
    display: flex;
    gap: 1rem;
    button {
      all: unset;
      padding: 0.5rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.125s;
      border-radius: 0.5rem;
      border: 1px solid hsl(0, 0%, 87%);
      &:hover {
        color: hsl(5, 53%, 32%);
        border-color: hsl(5, 53%, 32%);
      }
    }
  }
  :global(a) {
    color: unset;
  }
  main {
    margin-top: 3rem;
  }
  #header {
    margin-bottom: 1rem;
  }
  .rooms-found {
    color: hsl(0, 0%, 30%);
    margin: 0.5rem 0;
    font-size: 0.875rem;
  }
  input[type="search"] {
    display: block;
    width: 100%;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border: 2px solid hsl(0, 0%, 90%);
    border-radius: 0.5rem;
    padding-left: 2.5rem;
    transition: all 0.175s;
    outline: none;
    &:hover {
      border-color: hsl(0, 0%, 70%);
    }
    &:focus {
      border-color: #7b2d26;
    }
  }
  .room-container {
    display: flex;
    flex-flow: row wrap;
    gap: 0.5rem;
  }
  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin: 1rem 0;
    button {
      all: unset;
      padding: 0.5rem;
      display: flex;
      justify-content: center;
      background-color: hsl(5, 53%, 32%);
      border-radius: 1rem;
      color: white;
      &:active {
        background-color: hsl(5, 53%, 20%);
      }
      &:disabled {
        opacity: 0.5;
        pointer-events: none;
      }
    }
  }
  :global(*) {
    margin: unset;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      "Open Sans",
      "Helvetica Neue",
      sans-serif;
    box-sizing: border-box;
  }
</style>
