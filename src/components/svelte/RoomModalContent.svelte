<script lang="ts">
  import { modalStore, currentRoomStore } from "../../lib/store.svelte";
  import Classes from "./Classes.svelte";
  import ScheduleRender from "./ScheduleRender.svelte";

  const lat = $derived(currentRoomStore.roomData?.building?.lat || null);
  const lon = $derived(currentRoomStore.roomData?.building?.lon || null);
</script>

<div class="room-modal__header">
  <div>
    <div class="room-modal__heading">
      <h2>{currentRoomStore.roomData?.code}</h2>
      <div class="class-count">
        {currentRoomStore.classesData.length} class{currentRoomStore.classesData
          .length > 1
          ? "es"
          : ""}
      </div>
    </div>
    <p class="room-modal__subheading">
      {currentRoomStore.roomData?.building?.name}•
      {currentRoomStore.roomData?.collegeName} •
      {currentRoomStore.roomData?.divisionName}
    </p>
    {#if currentRoomStore.roomData?.directions}
      <p class="room-modal__directions">
        {currentRoomStore.roomData.directions}
      </p>
    {:else}
      <p class="room-modal__directions no-directions">
        No directions? <a href="https://docs.google.com/forms/d/e/1FAIpQLSdius5C7OyC1klraq71fFwWPZNvNk_iDLFyhCNir_ccC07Q7Q/viewform?usp=dialog" target="_blank" rel="noreferrer"><strong>Contribute to room-tba</strong></a>
      </p>
    {/if}
  </div>
  <button onclick={() => modalStore.closeModal()} aria-label="close-modal">
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
    <h3>How to get to {currentRoomStore.roomData?.building?.name}</h3>
    {#if currentRoomStore.roomData?.building?.directions}
      <p class="building-note__directions">
        {currentRoomStore.roomData.building.directions}
      </p>
    {:else}
      <p class="building-note__directions no-directions">
        No directions? <a href="https://docs.google.com/forms/d/e/1FAIpQLSdius5C7OyC1klraq71fFwWPZNvNk_iDLFyhCNir_ccC07Q7Q/viewform?usp=dialog" target="_blank" rel="noreferrer"><strong>Contribute to room-tba</strong></a>
      </p>
    {/if}
  </div>
  {#if lat !== null && lon !== null}
    <div class="map-container">
      <iframe
        src="https://www.openstreetmap.org/export/embed.html?bbox={lon -
          0.002}%2C{lat - 0.001}%2C{lon + 0.002}%2C{lat +
          0.001}&layer=mapnik&marker={lat}%2C{lon}"
        frameborder="0"
        title="Map showing location of {currentRoomStore.roomData?.building
          ?.name}"
      ></iframe>
    </div>
  {/if}
  <hr />
  <div class="room-modal__schedule">
    <h3>Classes in this room</h3>
    <ScheduleRender
      roomCode={currentRoomStore.roomData?.code ?? ""}
      classes={currentRoomStore.classesData}
    />
    <Classes classes={currentRoomStore.classesData} />
  </div>
</div>

<style>
  button[aria-label="close-modal"] {
    all: unset;
    color: hsl(0, 0%, 70%);
    &:hover {
      color: hsl(0, 0%, 40%);
    }
  }

  h2 {
    font-weight: 600;
  }
  h3 {
    margin-bottom: 0.75rem;
  }
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

  .room-modal__schedule {
    margin: 0.75rem 0;
  }
  .room-modal__info {
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    flex: 1;
    padding: 0 0.5rem;
    border-radius: 0.75rem;
    margin-top: 0.5rem;
  }
  .map-container {
    border-radius: 0.5rem;
    overflow: hidden;
    iframe {
      width: 100%;
      height: 200px;
    }
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
