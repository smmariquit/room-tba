<script lang="ts">
  import { currentRoomStore, modalStore } from "../../lib/store.svelte";
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

  function openRoomData(
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement },
  ) {
    currentRoomStore.updateClasses(classes);
    currentRoomStore.updateRoom(room);
    modalStore.openModal("room-details");
    window.location.hash = "#modal-content";
    // window.history.pushState();
  }
</script>

<button class="room-data" onclick={openRoomData}>
  <div class="room-data__header">
    <h3>{@html highlightSearch(room.code, pattern)}</h3>
    <div class="class-count">
      {classes.length} class{classes.length > 1 ? "es" : ""}
    </div>
  </div>
  <p class="subheading">
    {@html highlightSearch(room.building?.name ?? "No building", pattern)} • {@html highlightSearch(
      room.collegeName?.replace("College of ", "") ?? "No college",
      pattern,
    )} •
    {@html highlightSearch(room.divisionName ?? "No division", pattern)}
  </p>
  {#if room.directions}
    <p class="directions">
      {room.directions}
    </p>
  {:else}
    <p class="directions no-directions">
      <em>No directions?</em>
      <a href="/contribute" target="_blank" rel="noreferrer"
        ><strong>Contribute to room-tba</strong></a
      >
    </p>
  {/if}
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
    transition: all 0.125s;
    &:hover,
    &:focus {
      border-color: hsl(5, 53%, 32%);
      background-color: hsl(5, 53%, 92%);
      .class-count {
        background-color: hsl(5, 53%, 95%);
      }
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
    .class-count {
      background: hsl(0, 0%, 95%);
      border-radius: 0.25rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      margin: 0.25rem;
      flex: 0 0 auto;
    }
    .no-directions {
      color: hsl(0, 0%, 60%);
      a {
        color: hsl(5, 53%, 32%);
        outline: none;
        transition: all 0.2s;
        padding: 0.125rem 0.25rem;
        &:focus {
          background-color: hsl(5, 53%, 32%);
          color: white;
          border-radius: 4px;
          text-decoration: none;
        }
      }
    }
  }
</style>
