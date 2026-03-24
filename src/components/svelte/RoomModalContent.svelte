<script lang="ts">
  import { modalStore, currentRoomStore } from "../../lib/store.svelte";
  import Classes from "./Classes.svelte";
  import ScheduleRender from "./ScheduleRender.svelte";
</script>

<div class="room-details-container">
  <div class="header-section">
    <div class="header-top-row">
      <h2>{currentRoomStore.roomData?.code}</h2>
      <button
        onclick={() => modalStore.closeModal()}
        class="close-btn"
        aria-label="Close"
      >
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
          ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
        >
      </button>
    </div>
    <div class="subtitle-badge">
      <p>
        {#if currentRoomStore.roomData?.collegeName}
          {currentRoomStore.roomData.collegeName}
        {/if}
        {#if currentRoomStore.roomData?.building?.name}
          {#if currentRoomStore.roomData?.collegeName}
            •
          {/if}
          {currentRoomStore.roomData.building.name}
        {/if}
      </p>
    </div>
  </div>

  {#if currentRoomStore.roomData?.directions}
    <p class="room-directions">
      {currentRoomStore.roomData.directions}
    </p>
  {:else}
    <p class="room-directions no-directions">
      No directions? <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSdius5C7OyC1klraq71fFwWPZNvNk_iDLFyhCNir_ccC07Q7Q/viewform?usp=dialog"
        target="_blank"
        rel="noreferrer"><strong>Contribute to room-tba</strong></a
      >
    </p>
  {/if}

  {#if currentRoomStore.roomData?.building}
    <div class="building-note">
      <h3 class="building-note-title">
        How to get to {currentRoomStore.roomData.building.name}
      </h3>
      {#if currentRoomStore.roomData.building.directions}
        <p class="building-directions">
          {currentRoomStore.roomData.building.directions}
        </p>
      {:else}
        <p class="building-directions no-directions">
          No directions? <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdius5C7OyC1klraq71fFwWPZNvNk_iDLFyhCNir_ccC07Q7Q/viewform?usp=dialog"
            target="_blank"
            rel="noreferrer"><strong>Contribute to room-tba</strong></a
          >
        </p>
      {/if}
    </div>
  {/if}

  {#if currentRoomStore.roomData?.building?.lat && currentRoomStore.roomData?.building?.lon}
    <div class="map-links">
      <a
        href="https://www.google.com/maps?q={currentRoomStore.roomData.building
          .lat},{currentRoomStore.roomData.building.lon}"
        target="_blank"
        rel="noreferrer"
      >
        Open in Google Maps
      </a>
      <a
        href="https://www.openstreetmap.org/?mlat={currentRoomStore.roomData
          .building.lat}&mlon={currentRoomStore.roomData.building
          .lon}#map=18/{currentRoomStore.roomData.building
          .lat}/{currentRoomStore.roomData.building.lon}"
        target="_blank"
        rel="noreferrer"
      >
        Open in OpenStreetMap
      </a>
    </div>
  {/if}

  <div class="schedule-section">
    <h3>Classes in this room</h3>
    <ScheduleRender
      roomCode={currentRoomStore.roomData?.code ?? ""}
      classes={currentRoomStore.classesData}
    />
    <Classes classes={currentRoomStore.classesData} />
  </div>
</div>

<style>
  .room-details-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    overflow-y: auto;
  }

  .header-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-start;
    width: 100%;
  }

  .header-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .close-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4f4f4f;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.15s;
  }

  .close-btn:hover {
    background-color: #f0f0f0;
  }

  .header-section h2 {
    font-weight: bold;
    font-size: 1.125rem;
    line-height: 1.25rem;
    color: black;
    margin: 0;
  }

  .subtitle-badge {
    background-color: #ececec;
    border-radius: 0.4375rem;
    padding: 2px 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .subtitle-badge p {
    font-weight: normal;
    font-size: 0.75rem;
    color: #4f4f4f;
    margin: 0;
  }

  .room-directions {
    font-size: 0.875rem;
    line-height: 1.5;
    color: #4f4f4f;
    margin: 0;
  }

  .building-note {
    padding: 1rem 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    border-left: 4px solid hsl(103, 100%, 27%);
    background-color: hsla(103, 100%, 89%, 0.5);
    border-radius: 0 0.5rem 0.5rem 0;
  }

  .building-note-title {
    font-weight: 600;
    font-size: 1rem;
    margin: 0 0 0.5rem 0;
    color: black;
  }

  .building-directions {
    font-size: 0.875rem;
    line-height: 1.5;
    color: #4f4f4f;
    margin: 0;
  }

  .no-directions {
    color: hsl(0, 0%, 60%);
  }

  .no-directions a {
    color: hsl(5, 53%, 32%);
    outline: none;
    transition: all 0.2s;
    padding: 0.125rem 0.25rem;
    border-radius: 4px;
  }

  .no-directions a:hover,
  .no-directions a:focus-visible {
    background-color: hsl(5, 53%, 32%);
    color: white;
    text-decoration: none;
  }

  .schedule-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .schedule-section h3 {
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: black;
    margin: 0;
  }

  :global(.schedule-section > div) {
    width: 100%;
  }

  .map-links {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .map-links a {
    color: hsl(5, 53%, 32%);
    outline: none;
    transition: all 0.2s;
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid hsl(5, 53%, 32%);
    border-radius: 4px;
    text-decoration: none;
  }
  .map-links a:hover,
  .map-links a:focus-visible {
    background-color: hsl(5, 53%, 32%);
    color: white;
  }
</style>
