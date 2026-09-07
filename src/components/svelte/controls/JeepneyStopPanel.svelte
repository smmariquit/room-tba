<script lang="ts">
  import Bus from "@lucide/svelte/icons/bus";
  import PersonStanding from "@lucide/svelte/icons/person-standing";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import MapPin from "@lucide/svelte/icons/map-pin";
  import EntityPanelClose from "./EntityPanelClose.svelte";
  import EntityGoogleMapsLink from "./EntityGoogleMapsLink.svelte";
  import EntityShareCopyLink from "./EntityShareCopyLink.svelte";
  import TransitStopEditor from "./TransitStopEditor.svelte";
  import { getGoogleStreetViewUrl } from "@lib/google-maps-links";
  import { getJeepneyRouteShareUrl } from "@lib/share-links";
  import MapChromeActionLink from "@ui/map-chrome/MapChromeActionLink.svelte";
  import { jeepneyStore, transitStore } from "@lib/store.svelte";
  import MapChromeActionChip from "@ui/map-chrome/MapChromeActionChip.svelte";
  import "@ui/map-chrome/map-chrome.css";

  const route = $derived(
    transitStore.getRoute(jeepneyStore.selectedRouteId),
  );

  const stopIndex = $derived(jeepneyStore.selectedStopIndex);
  const stop = $derived(
    route && stopIndex !== null ? (route.stops[stopIndex] ?? null) : null,
  );

  const mapsUrl = $derived(stop ? { lat: stop.lat, lon: stop.lon } : null);

  function openPreviousStop() {
    if (route === null || stopIndex === null || stopIndex <= 0) return;
    jeepneyStore.openStop(stopIndex - 1);
  }

  function openNextStop() {
    if (route === null || stopIndex === null) return;
    if (stopIndex >= route.stops.length - 1) return;
    jeepneyStore.openStop(stopIndex + 1);
  }

  function closeStop() {
    jeepneyStore.closeStop();
  }

  function openRouteDetails() {
    if (!route) return;
    jeepneyStore.closeStop();
  }
</script>

{#if route && stop && stopIndex !== null}
  <div class="entity-detail jeepney-stop-panel">
    <header class="entity-header">
      <div class="entity-panel-header-top">
        <span
          class="jeepney-stop-panel__route-badge"
          style:background-color={route.color}
        >
          <Bus size={14} aria-hidden="true" />
          {route.name}
        </span>
        <EntityPanelClose ariaLabel="Close stop details" onclick={closeStop} />
      </div>
      <h2 class="entity-header__title">{stop.name}</h2>
      <p class="entity-header__context">
        Stop {stopIndex + 1} of {route.stops.length}
      </p>
      <MapChromeActionChip toolbar onclick={openRouteDetails}>
        <ChevronLeft size={14} aria-hidden="true" />
        Back to {route.name} route
      </MapChromeActionChip>
    </header>

    <p class="entity-directions__text">{stop.description}</p>
    <p class="entity-panel-note">{route.description}</p>

    <p class="jeepney-stop-panel__coords">
      <MapPin size={14} aria-hidden="true" />
      <span>{stop.lat.toFixed(5)}, {stop.lon.toFixed(5)}</span>
    </p>

    {#key stop.id ?? stopIndex}
      <TransitStopEditor
        routeId={route.id}
        routeName={route.name}
        {stop}
        onRemoved={closeStop}
      />
    {/key}

    <div class="entity-actions">
      <div class="jeepney-stop-panel__pager" aria-label="Route stops">
        <MapChromeActionChip
          toolbar
          disabled={stopIndex <= 0}
          onclick={openPreviousStop}
        >
          <ChevronLeft size={14} aria-hidden="true" />
          Previous stop
        </MapChromeActionChip>
        <MapChromeActionChip
          toolbar
          disabled={stopIndex >= route.stops.length - 1}
          onclick={openNextStop}
        >
          Next stop
          <ChevronRight size={14} aria-hidden="true" />
        </MapChromeActionChip>
      </div>
      {#if mapsUrl}
        <EntityGoogleMapsLink
          lat={mapsUrl.lat}
          lon={mapsUrl.lon}
          name={stop.name}
          ariaLabel={`Open ${stop.name} in Google Maps`}
        />
        <MapChromeActionLink
          href={getGoogleStreetViewUrl(mapsUrl.lat, mapsUrl.lon)}
          ariaLabel={`Open ${stop.name} in Google Street View`}
          toolbar
        >
          <PersonStanding size={14} aria-hidden="true" />
          Street View
        </MapChromeActionLink>
      {/if}
      <EntityShareCopyLink
        url={getJeepneyRouteShareUrl(route.id, stopIndex, route)}
        entityLabel={stop.name}
      />
    </div>
  </div>
{/if}

<style>
  @import "./entity-detail.css";

  .jeepney-stop-panel {
    min-width: 0;
    padding: 0.125rem 0;
  }

  .jeepney-stop-panel__route-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    align-self: flex-start;
    max-width: calc(100% - 6rem);
    padding: 0.1875rem 0.5rem;
    border-radius: 999px;
    color: white;
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .jeepney-stop-panel__coords {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: #71717a;
  }

  .jeepney-stop-panel__pager {
    display: inline-flex;
    gap: 0.25rem;
    padding-right: 0.5rem;
    border-right: 1px solid hsl(0 0% 86%);
  }

  @media (max-width: 30rem) {
    .jeepney-stop-panel__pager {
      width: 100%;
      padding: 0 0 0.5rem;
      border: 0;
      border-bottom: 1px solid hsl(0 0% 86%);
    }
  }

</style>
