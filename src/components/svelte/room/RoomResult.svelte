<script lang="ts">
  import { modalStore, queryStore } from "../../../lib/store.svelte";
  import { getAppData } from "../../../lib/context";
  import Classes from "./Classes.svelte";

  const { rooms, classesMap } = getAppData();

  const roomData = $derived(rooms.find((r) => r.code === queryStore.value));

  const classesData = $derived(
    roomData ? classesMap.get(roomData.code) || [] : [],
  );
</script>

<div class="room-details-container">
  {#if roomData}
    <div class="header-section">
      <div class="header-top-row">
        <h2>{roomData.code}</h2>
      </div>
      <div class="subtitle-badge">
        <p>
          {#if roomData.collegeName}
            {roomData.collegeName}
          {/if}
          {#if roomData.building?.name}
            {#if roomData.collegeName}
              •
            {/if}
            {roomData.building.name}
          {/if}
        </p>
      </div>
    </div>

    {#if roomData.directions}
      <p class="room-directions">
        {roomData.directions}
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

    {#if roomData.building}
      <div class="building-note">
        <h3 class="building-note-title">
          How to get to {roomData.building.name}
        </h3>
        {#if roomData.building.directions}
          <p class="building-directions">
            {roomData.building.directions}
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

    {#if roomData.building?.lat && roomData.building?.lon}
      <div class="map-links">
        <a
          href="https://www.google.com/maps?q={roomData.building.lat},{roomData
            .building.lon}"
          target="_blank"
          rel="noreferrer"
        >
          Open in Google Maps
        </a>
        <!-- <a
          href="https://www.openstreetmap.org/?mlat={roomData.building
            .lat}&mlon={roomData.building.lon}#map=18/{roomData.building
            .lat}/{roomData.building.lon}"
          target="_blank"
          rel="noreferrer"
        >
          Open in OpenStreetMap
        </a> -->
      </div>
    {/if}

    <div class="schedule-section">
      <div class="schedule-section__header">
        <h3>Classes in this room</h3>
        <button onclick={() => modalStore.openModal("schedule-expand")}
          >Open schedule</button
        >
      </div>
      <Classes classes={classesData} />
    </div>
  {:else}
    <p>Room not found.</p>
  {/if}
</div>

<style>
  .room-details-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    overflow-y: auto;
    width: 100%;
    flex: 1;
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
    padding: 0.75rem 1rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    border-left: 4px solid hsl(103, 100%, 27%);
    background-color: hsla(103, 100%, 89%, 0.5);
  }

  .building-note-title {
    font-weight: 600;
    font-size: 1rem;
    margin: 0 0 0.25rem 0;
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
    .schedule-section__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      button {
        all: unset;
        font-size: 0.875rem;
        font-weight: 600;
        padding: 0.25rem 1rem;
        background-color: hsl(5, 53%, 32%);
        color: white;
        border-radius: 8px;
        cursor: pointer;
      }
    }
  }

  .schedule-section h3 {
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.25rem;
    color: black;
    margin: 0;
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
