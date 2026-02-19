<script lang="ts">
  import { currentRoomStore } from "../lib/store.svelte";
  import type { RoomData, ClassMapValue } from "../lib/types";

  type Props = {
    room: RoomData;
    searchInput: string;
    classes: ClassMapValue[];
  };

  const { room, searchInput, classes }: Props = $props();
  const pattern = $derived(new RegExp(`(${searchInput})`, "gi"));
  function highlightSearch(original: string, pattern: RegExp): string {
    return original.replaceAll(
      pattern,
      (substr) => `<mark><strong>${substr}</strong></mark>`,
    );
  }

  function openRoomData(
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement },
  ) {
    currentRoomStore.updateClasses(classes);
    currentRoomStore.updateRoom(room);
  }
</script>

<button class="room-data" onclick={openRoomData}>
  <div class="room-data__header">
    <h3>{@html highlightSearch(room.code, pattern)}</h3>
    <div class="class-count">{classes.length} classes</div>
  </div>
  <p class="subheading">
    {@html highlightSearch(room.building?.name ?? "No building", pattern)} • {@html highlightSearch(
      room.collegeName?.replace("College of ", "") ?? "No college",
      pattern,
    )} •
    {@html highlightSearch(room.divisionName ?? "No division", pattern)}
  </p>
  <p class="directions">
    {room.directions ?? ""}
  </p>
</button>

<style>
  .room-data__header {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
    gap: 0.5rem;
  }
  .room-data {
    all: unset;
    flex: 1 1 24rem;
    padding: 1.5rem 1.5rem;
    border: 1px solid hsl(0, 0%, 80%);
    border-radius: 0.5rem;
    &:hover {
      border-color: hsl(0, 0%, 40%);
    }
    h3 {
      font-weight: 600;
      font-size: 1.25rem;
    }
    > .subheading {
      margin-bottom: 0.25rem;
      color: hsl(0, 0%, 40%);
      font-size: 0.875rem;
    }
    > .directions {
      font-size: 0.875rem;
    }
    :global(mark) {
      background-color: hsl(5, 53%, 90%);
    }
  }
  .class-count {
    background: hsl(0, 0%, 95%);
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    margin: 0.25rem;
  }
</style>
