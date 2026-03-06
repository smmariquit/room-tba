<script lang="ts">
  import RoomDisplay from "./RoomDisplay.svelte";
  import { onMount } from "svelte";
  import { debounce } from "es-toolkit/function";
  import type { buildingData, ClassMapValue, RoomData } from "../lib/types";
  import { currentRoomStore, filterStore } from "../lib/store.svelte";
  import Banner from "./Banner.svelte";
  import Modal from "./Modal.svelte";

  type Props = {
    rooms: RoomData[];
    buildings: buildingData[];
    classesMap: Map<string, ClassMapValue[]>;
  };

  const computeMaxPaginate = (arrLength: number, divisor: number) =>
    Math.floor((arrLength - 1) / divisor) + 1;

  const MAX_DISPLAY_RESULT = 20;

  const { rooms, classesMap, buildings }: Props = $props();
  let searchElement: HTMLInputElement | null = $state(null);
  let searchInput: string = $state("");
  let typing: boolean = $state(false);
  let paginateOffset: number = $state(0);
  let roomsResult: Props["rooms"] = $state([]);
  const maxPaginateOffset: number = $derived(
    computeMaxPaginate(roomsResult.length, MAX_DISPLAY_RESULT),
  );

  const debounceSearch = debounce((inputValue: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("s", inputValue);
    window.history.replaceState({}, "", url);
    typing = false;
    searchInput = inputValue;
    roomsResult = findRooms(inputValue);
    paginateOffset = 0;
  }, 500);

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
    if (ev.key === "Escape" && currentRoomStore.roomStore.open)
      currentRoomStore.closeModal();
  }

  function findRooms(searchTerm: string) {
    searchTerm = searchTerm.toLowerCase().trim();

    return searchInput !== ""
      ? rooms.filter(
          ({ divisionName, collegeName, building, code }) =>
            code.toLowerCase().includes(searchTerm) ||
            collegeName?.toLowerCase().includes(searchTerm) ||
            divisionName?.toLowerCase().includes(searchTerm) ||
            building?.name.toLowerCase().includes(searchTerm),
        )
      : [];
  }

  function handleInput(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    typing = true;
    debounceSearch(event.currentTarget.value);
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
    <label for="search">
      <input
        type="search"
        id="search"
        bind:this={searchElement}
        value={searchInput}
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
    </label>
    <button onclick={() => filterStore.openModal()}
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
    <div>{roomsResult.length} rooms found</div>
    <hr />
  </div>

  <div class="room-container">
    {#each roomsResult.slice(paginateOffset * MAX_DISPLAY_RESULT, (paginateOffset + 1) * MAX_DISPLAY_RESULT) as room}
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
        onclick={() => {
          paginateOffset > 0 && paginateOffset--;
          scrollToTop();
        }}>&LeftAngleBracket;</button
      >
      <div>
        {paginateOffset + 1} of {maxPaginateOffset}
      </div>
      <button
        onclick={() => {
          paginateOffset + 1 < maxPaginateOffset && paginateOffset++;
          scrollToTop();
        }}>&RightAngleBracket;</button
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
  label[for="search"] {
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
  :global(a) {
    color: unset;
  }
  main {
    padding: 2rem;
    max-width: 64rem;
    margin-inline: auto;
    margin-top: 3rem;
  }
  #header {
    margin-bottom: 1rem;
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
