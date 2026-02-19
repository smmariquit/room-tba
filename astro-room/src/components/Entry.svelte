<script lang="ts">
  import RoomDisplay from "./RoomDisplay.svelte";
  import { onMount } from "svelte";
  import { debounce } from "es-toolkit/function";
  import type { ClassMapValue, RoomData } from "../lib/types";

  type Props = {
    rooms: RoomData[];
    classesMap: Map<string, ClassMapValue[]>;
  };

  const computeMaxPaginate = (arrLength: number, divisor: number) =>
    Math.floor((arrLength - 1) / divisor) + 1;

  const MAX_DISPLAY_RESULT = 20;
  const { rooms, classesMap }: Props = $props();
  let searchElement: HTMLInputElement | null = $state(null);
  let searchInput: string = $state("");
  let paginateOffset: number = $state(0);
  let roomsResult: Props["rooms"] = $state([]);
  const maxPaginateOffset: number = $derived(
    computeMaxPaginate(roomsResult.length, MAX_DISPLAY_RESULT),
  );

  const debounceSearch = debounce((inputValue: string) => {
    searchInput = inputValue;
    roomsResult = findRooms(inputValue);
    paginateOffset = 0;
  }, 500);

  onMount(() => {
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
  }

  function findRooms(searchTerm: string) {
    searchTerm = searchTerm.toLowerCase();

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
    debounceSearch(event.currentTarget.value);
  }
  function scrollToTop() {
    window.scrollTo({
      top: 48,
      behavior: "smooth",
    });
  }
  $effect(() => {});
</script>

<main>
  <div id="header">
    <input
      type="search"
      bind:this={searchElement}
      oninput={handleInput}
      placeholder="Search room code, building, division, or course code (e.g., CMSC 21)"
    />
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
</main>

<style>
  main {
    padding: 1rem;
    max-width: 64rem;
    margin: 0 auto;
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
  }
</style>
