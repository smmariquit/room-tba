<script lang="ts">
  import { currentRoomStore } from "../lib/store.svelte";
  import { fade, fly } from "svelte/transition";
  import ScheduleRender from "./ScheduleRender.svelte";
  import Classes from "./Classes.svelte";

  const { currentRoomStore: roomStore, closeModal } = currentRoomStore;
  const lat = $derived(roomStore.roomData?.building?.lat || null);
  const lon = $derived(roomStore.roomData?.building?.lon || null);
</script>

{#if roomStore.open}
  <div class="modal-set">
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      class="overlay"
      onclick={() => closeModal()}
      transition:fade={{ duration: 100 }}
    ></button>
    <div
      class="room-modal"
      in:fly={{
        duration: 200,
        delay: 50,
        y: 50,
      }}
      out:fade={{
        duration: 75,
      }}
    >
      <div class="room-modal__header">
        <div>
          <div class="room-modal__heading">
            <h2>{roomStore.roomData?.code}</h2>
            <div class="class-count">
              {roomStore.classesData.length} class{roomStore.classesData
                .length > 1
                ? "es"
                : ""}
            </div>
          </div>
          <p class="room-modal__subheading">
            {roomStore.roomData?.building?.name}•
            {roomStore.roomData?.collegeName} •
            {roomStore.roomData?.divisionName}
          </p>
          <p class="room-modal__directions">
            {roomStore.roomData?.directions ?? ""}
          </p>
        </div>
        <button onclick={() => closeModal()} aria-label="close-modal">
          <svg
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
          >
        </button>
      </div>
      <div class="room-modal__info">
        <hr />
        <div class="building-note">
          <h3>How to get to {roomStore.roomData?.building?.name}</h3>
          <p class="building-note__directions">
            {roomStore.roomData?.building?.directions}
          </p>
        </div>
        {#if lat !== null && lon !== null}
          <div class="map-container">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox={lon -
                0.002}%2C{lat - 0.001}%2C{lon + 0.002}%2C{lat +
                0.001}&layer=mapnik&marker={lat}%2C{lon}"
              frameborder="0"
              title="Map showing location of {roomStore.roomData?.building
                ?.name}"
            ></iframe>
          </div>
        {/if}
        <hr />
        <div class="room-modal__schedule">
          <h3>Classes in this room</h3>
          <ScheduleRender
            roomCode={roomStore.roomData?.code ?? ""}
            classes={roomStore.classesData}
          />
          <Classes classes={roomStore.classesData} />
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  button[aria-label="close-modal"] {
    all: unset;
    color: hsl(0, 0%, 70%);
    &:hover {
      color: hsl(0, 0%, 40%);
    }
  }
  hr {
    margin: 1rem 0;
    border-width: 2px;
    border-color: hsl(0, 0%, 90%);
    border-style: solid;
  }
  h2 {
    font-weight: 600;
  }
  h3 {
    margin-bottom: 0.75rem;
  }
  .modal-set {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    padding: 0.75rem;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .map-container {
    border-radius: 0.5rem;
    overflow: hidden;
    iframe {
      width: 100%;
      height: 200px;
    }
  }
  .room-modal {
    flex: 0 1 1024px;
    height: 90%;
    background-color: white;
    z-index: 100;
    border-radius: 1rem;
    padding: 1.5rem;
    display: flex;
    flex-flow: column nowrap;

    .room-modal__heading {
      display: flex;
      align-items: center;
      margin-bottom: 0.25rem;
      gap: 0.5rem;
      flex: 0 0 auto;
    }

    .room-modal__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .class-count {
      background: hsl(0, 0%, 95%);
      border-radius: 0.25rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      margin: 0.25rem;
      flex: 0 0 auto;
    }
    h3 {
      font-weight: 600;
      font-size: 1.25rem;
    }
    .room-modal__subheading {
      margin-bottom: 0.25rem;
      color: hsl(0, 0%, 40%);
      font-size: 0.875rem;
    }
    .room-modal__directions {
      font-size: 0.875rem;
    }
    :global(mark) {
      background-color: hsl(5, 53%, 90%);
    }
    .room-modal__schedule {
      margin: 0.75rem 0;
    }
    .room-modal__info {
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      flex: 1;
      border-radius: 0.75rem;
      margin-top: 0.5rem;
    }
  }
  .overlay {
    all: unset;
    width: 100%;
    height: 100%;
    inset: 0;
    position: absolute;
    inset: 0;
    background-color: hsla(0, 0%, 0%, 0.2);
  }
  .building-note {
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
    border-left: 4px solid hsl(103, 100%, 27%);
    background-color: hsla(103, 100%, 89%, 0.5);
    p {
      font-size: 0.875rem;
    }
  }
</style>
