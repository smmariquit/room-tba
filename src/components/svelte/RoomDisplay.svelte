<script lang="ts">
  import { currentRoomStore, queryStore } from "../../lib/store.svelte";
  import type { RoomData, ClassMapValue } from "../../lib/types";

  type Props = {
    room: RoomData;
    searchInput: string;
    classes: ClassMapValue[];
  };

  const { room, searchInput, classes }: Props = $props();
  const pattern = $derived(new RegExp(`(${searchInput.trim()})`, "gi"));
  function highlightSearch(original: string, pattern: RegExp): string {
    return searchInput.length < 2
      ? original
      : original.replaceAll(pattern, (substr) => `<mark>${substr}</mark>`);
  }

  function openRoomData() {
    currentRoomStore.updateClasses(classes);
    currentRoomStore.updateRoom(room);
    queryStore.updateQuery({ type: "result", category: "room" });
    queryStore.value = room.code;
  }
</script>

<button class="room-data" onclick={openRoomData}>
  <div class="room-data__content">
    <div class="icon-wrapper">
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
        ><line x1="7" y1="17" x2="17" y2="7"></line><polyline
          points="7 7 17 7 17 17"
        ></polyline></svg
      >
    </div>
    <h3 class="room-code">{@html highlightSearch(room.code, pattern)}</h3>
    <div class="class-count">
      {classes.length} class{classes.length !== 1 ? "es" : ""}
    </div>
  </div>
</button>

<style>
  .room-data {
    all: unset;
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background-color: white;
    border: 1px solid #ececec;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.125s;
    width: 100%;
    box-sizing: border-box;
  }

  .room-data:hover,
  .room-data:focus-visible {
    border-color: hsl(5, 53%, 32%);
    background-color: hsl(5, 53%, 98%);
  }

  .room-data__content {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    width: 100%;
  }

  .icon-wrapper {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: black;
  }

  .room-code {
    font-weight: normal;
    font-size: 0.875rem;
    color: black;
    margin: 0;
    line-height: 1.25rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .class-count {
    background-color: #ececec;
    border-radius: 0.25rem;
    padding: 2px 0.375rem;
    font-size: 0.75rem;
    color: #969696;
    margin-left: auto; /* Push to the right if there's space, or keep it close */
    white-space: nowrap;
  }

  :global(mark) {
    background-color: hsl(5, 53%, 90%);
  }
</style>
