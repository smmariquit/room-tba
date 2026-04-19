<script lang="ts">
  // import { Locate, LocateFixed } from "@lucide/svelte";
  import { locationStore, mapStore, toastStore } from "../../lib/store.svelte";

  let centered: boolean = $state(false);
  const handleLocationClick = () => {
    if (!locationStore.coords) {
      locationStore.requestLocation();
      return;
    }
    if (!mapStore.mapInstance) {
      toastStore.show("Map component is still initializing", "info");
      return;
    }

    centered = true;
    mapStore.mapInstance.flyTo({
      center: locationStore.coords,
      zoom: 17,
      offset: [0, -24],
      bearing: locationStore.bearing ?? 0,
      duration: 1500,
    });
  };
</script>

<button
  class="my-location-btn"
  onclick={handleLocationClick}
  title="My Location"
  aria-label="My Location"
>
  {#if centered}
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="20"
      height="20"
    >
      <circle cx="12" cy="10" r="3" />
      <path
        d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"
      />
      <circle cx="12" cy="10" r="1" />
    </svg>
  {:else}
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="20"
      height="20"
    >
      <circle cx="12" cy="10" r="3" />
      <path
        d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"
      />
    </svg>
  {/if}
</button>

<style>
  .my-location-btn {
    pointer-events: auto;
    background-color: white;
    border: 1px solid #ececec;
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: hsl(5, 53%, 32%);
    transition:
      background-color 0.2s,
      transform 0.2s;

    &:hover {
      background-color: hsl(5, 53%, 98%);
      transform: scale(1.05);
    }
  }
</style>
