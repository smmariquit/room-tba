<script lang="ts">
  import { modalStore, currentRoomStore} from "../../lib/store.svelte";
  import Classes from "./Classes.svelte";
  import ScheduleRender from "./ScheduleRender.svelte";
</script>

<div class="room-details-container">
  <div class="header-section">
    <div class="header-top-row">
      <h2>{currentRoomStore.roomData?.code}</h2>
      <button onclick={() => modalStore.closeModal()} class="close-btn" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="subtitle-badge">
      <p>
        {#if currentRoomStore.roomData?.collegeName}
          {currentRoomStore.roomData.collegeName}
        {/if}
        {#if currentRoomStore.roomData?.building?.name}
          {#if currentRoomStore.roomData?.collegeName} • {/if}
          {currentRoomStore.roomData.building.name}
        {/if}
      </p>
    </div>
  </div>

  {#if currentRoomStore.roomData?.building?.lat && currentRoomStore.roomData?.building?.lon}
    <div class="map-links">
      <a
        href="https://www.google.com/maps?q={currentRoomStore.roomData.building.lat},{currentRoomStore.roomData.building.lon}"
        target="_blank"
        rel="noreferrer"
      >
        Open in Google Maps
      </a>
      <a
        href="https://www.openstreetmap.org/?mlat={currentRoomStore.roomData.building.lat}&mlon={currentRoomStore.roomData.building.lon}#map=18/{currentRoomStore.roomData.building.lat}/{currentRoomStore.roomData.building.lon}"
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
    font-family: 'DM Sans', sans-serif;
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
    font-family: 'DM Sans', sans-serif;
    font-weight: normal;
    font-size: 0.75rem;
    color: #4f4f4f;
    margin: 0;
  }

  .schedule-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .schedule-section h3 {
    font-family: 'DM Sans', sans-serif;
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
  .map-links a:hover, .map-links a:focus-visible {
    background-color: hsl(5, 53%, 32%);
    color: white;
  }
</style>
