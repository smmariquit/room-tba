<script lang="ts">
  import { debounce } from "es-toolkit/function";
  import type { RoomData } from "../lib/types";
  import { findAncestor } from "typescript";

  type Props = {
    rooms: RoomData[];
  };
  const { rooms }: Props = $props();
  let searchInput: string = $state("");
  let paginateOffset: number = $state(0);
  let roomsResult: Props["rooms"] = $state([]);

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
      : rooms;
  }

  const setSearchResult = debounce(() => {
    roomsResult = findRooms(searchInput);
  }, 500);
  function handleSearch(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    setSearchResult();
  }
</script>

<input
  type="search"
  oninput={handleSearch}
  bind:value={searchInput}
  placeholder="Search room code, building, division, or course code (e.g., CMSC 21)"
/>
{#if searchInput != ""}
  <div>{searchInput}</div>
{/if}

<style>
</style>
