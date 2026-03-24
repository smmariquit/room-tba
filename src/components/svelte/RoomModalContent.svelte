<script lang="ts">
  import { modalStore, currentRoomStore } from "../../lib/store.svelte";
  import Classes from "./Classes.svelte";
  import ScheduleRender from "./ScheduleRender.svelte";
</script>

<div class="room-details-container">
  <div class="header-section">
    <h2>{currentRoomStore.roomData?.code}</h2>
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
  }

  .header-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-start;
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
</style>