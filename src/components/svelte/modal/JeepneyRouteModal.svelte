<script lang="ts">
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import MapPinned from "@lucide/svelte/icons/map-pinned";
  import { jeepneyStore, modalStore, transitStore } from "@lib/store.svelte";
  import {
    JEEPNEY_FARE_NOTE,
    JEEPNEY_RIDING_NOTES,
    TRANSIT_DATA_CREDIT,
    resolveRouteGeometry,
    type StoredRouteGeometry,
  } from "@constants/jeepney-routes";
  import jeepneyGeometries from "@constants/jeepney-geometries.json";
  import { getJeepneyRouteShareUrl } from "@lib/share-links";
  import EntityShareCopyLink from "../controls/EntityShareCopyLink.svelte";
  import TransitStopEditor from "../controls/TransitStopEditor.svelte";

  type Props = {
    routeId?: string | null;
    onback?: () => void;
  };

  let { routeId = null, onback }: Props = $props();

  const route = $derived(
    transitStore.getRoute(routeId ?? jeepneyStore.modalRouteId),
  );

  // Say so when the drawn line is inferred rather than traced from the
  // operator's mapped route; riders plan around these lines.
  const geometryNote = $derived(
    route
      ? resolveRouteGeometry(
          route,
          jeepneyGeometries as Record<string, StoredRouteGeometry>,
        ).caveat
      : null,
  );

  function viewOnMap() {
    if (!route) return;
    jeepneyStore.openRouteOnMap(route.id);
    modalStore.closeModal();
  }

  function showStop(index: number) {
    if (!route) return;
    // openStop bails when no route is selected on the map, and openRouteOnMap
    // clears the stop when the route changes, so the route has to come first.
    // The side-panel copy (routeId set) is already showing this route, and its
    // container swaps to JeepneyStopPanel on its own, so there is nothing to
    // select and no modal to dismiss.
    if (routeId === null) {
      jeepneyStore.openRouteOnMap(route.id);
      modalStore.closeModal();
    }
    jeepneyStore.openStop(index);
  }
</script>

{#if route}
  <div class="jeepney-modal" style:--route-color={route.color}>
    {#if onback}
      <button type="button" class="jeepney-modal__back" onclick={onback}>
        <ChevronLeft size={16} aria-hidden="true" />
        Jeepney routes
      </button>
    {/if}
    <header class="jeepney-modal__header">
      <span
        class="jeepney-modal__swatch"
        style:background-color={route.color}
        aria-hidden="true"
      ></span>
      <h2 class="jeepney-modal__title">{route.name} jeepney route</h2>
    </header>

    <div class="jeepney-modal__scroll">
      <p class="jeepney-modal__desc">{route.description}</p>

      {#if route.directionNote}
        <p class="jeepney-modal__direction">{route.directionNote}</p>
      {/if}

      <dl class="jeepney-modal__fare">
        <div>
          <dt>Regular fare</dt>
          <dd>₱{route.fare.regular}</dd>
        </div>
        <div>
          <dt>Student / PWD / senior</dt>
          <dd>₱{route.fare.discounted}</dd>
        </div>
      </dl>
      <p class="jeepney-modal__fare-note">{JEEPNEY_FARE_NOTE}</p>

      {#if geometryNote}
        <p class="jeepney-modal__geometry-note">{geometryNote}</p>
      {/if}

      <h3 class="jeepney-modal__stops-title">
        Stops <span>({route.stops.length})</span>
      </h3>
      <ol class="jeepney-modal__stops">
        {#each route.stops as stop, i (`${route.id}-${i}`)}
          <li>
            <button
              type="button"
              class="jeepney-modal__stop"
              onclick={() => showStop(i)}
            >
              <span class="jeepney-modal__stop-index">{i + 1}</span>
              <span class="jeepney-modal__stop-name">{stop.name}</span>
            </button>
          </li>
        {/each}
      </ol>
      <TransitStopEditor routeId={route.id} routeName={route.name} />

      <h3 class="jeepney-modal__stops-title">Riding tips</h3>
      <ul class="jeepney-modal__tips">
        {#each JEEPNEY_RIDING_NOTES as note (note)}
          <li>{note}</li>
        {/each}
      </ul>
      <p class="jeepney-modal__credit">{TRANSIT_DATA_CREDIT}</p>
    </div>

    <div class="jeepney-modal__actions">
      <EntityShareCopyLink
        url={getJeepneyRouteShareUrl(route.id)}
        entityLabel={`${route.name} route`}
      />
      {#if routeId === null}
        <button type="button" class="jeepney-modal__view" onclick={viewOnMap}>
          <MapPinned size={16} aria-hidden="true" />
          View on map
        </button>
      {/if}
    </div>
  </div>
{:else}
  <p class="jeepney-modal__empty">This jeepney route is no longer available.</p>
{/if}

<style>
  .jeepney-modal {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.5rem 0.5rem 0.25rem;
    flex: 1 1 auto;
    min-height: 0;
  }

  .jeepney-modal__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-right: 2.25rem;
  }

  .jeepney-modal__back {
    all: unset;
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 0.25rem;
    color: hsl(5, 53%, 32%);
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 700;
  }

  .jeepney-modal__back:focus-visible {
    outline: 2px solid hsl(5, 53%, 32%);
    outline-offset: -2px;
    border-radius: 0.25rem;
  }

  .jeepney-modal__swatch {
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .jeepney-modal__title {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 700;
    color: hsl(0, 0%, 15%);
  }

  .jeepney-modal__scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-right: 0.375rem;
  }

  .jeepney-modal__desc {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.5;
    color: hsl(0, 0%, 12%);
  }

  .jeepney-modal__direction {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.5;
    color: hsl(0, 0%, 12%);
  }

  .jeepney-modal__fare {
    display: flex;
    gap: 0.75rem;
    margin: 0;
  }

  .jeepney-modal__fare div {
    flex: 1 1 0;
    border: 1px solid hsl(0, 0%, 88%);
    border-radius: 0.625rem;
    padding: 0.5rem 0.75rem;
  }

  .jeepney-modal__fare dt {
    font-size: 0.75rem;
    font-weight: 600;
    color: hsl(0, 0%, 28%);
  }

  .jeepney-modal__fare dd {
    margin: 0.125rem 0 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: hsl(5, 53%, 32%);
  }

  .jeepney-modal__fare-note {
    margin: 0;
    font-size: 0.75rem;
    color: hsl(0, 0%, 32%);
  }

  .jeepney-modal__tips {
    margin: 0;
    padding-left: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: hsl(0, 0%, 24%);
  }

  .jeepney-modal__credit {
    margin: 0;
    font-size: 0.6875rem;
    color: hsl(0, 0%, 45%);
  }

  .jeepney-modal__geometry-note {
    margin: 0;
    padding-left: 0.5rem;
    border-left: 2px solid hsl(0, 0%, 78%);
    font-size: 0.75rem;
    line-height: 1.45;
    color: hsl(0, 0%, 32%);
  }

  .jeepney-modal__stops-title {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: hsl(0, 0%, 40%);
  }

  .jeepney-modal__stops-title span {
    color: hsl(0, 0%, 60%);
  }

  /* Metro-map style: numbered dots in the route color, joined by a line. */
  .jeepney-modal__stops {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  /* Stays the positioning context for the connector line and the index badge;
     the button inside is the actual row. */
  .jeepney-modal__stops li {
    position: relative;
    display: flex;
  }

  /* Global `button { all: unset }` means every box property is re-stated. */
  .jeepney-modal__stop {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    min-height: 2rem;
    padding: 0.125rem 0.25rem 0.125rem 2.125rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: left;
    color: hsl(0, 0%, 10%);
    cursor: pointer;
  }

  .jeepney-modal__stop:hover {
    background: color-mix(in srgb, var(--route-color, #7b1113) 10%, white);
  }

  .jeepney-modal__stops li::before {
    content: "";
    position: absolute;
    left: calc(0.75rem - 1.5px);
    top: 0;
    bottom: 0;
    width: 3px;
    background: color-mix(in srgb, var(--route-color, #7b1113) 55%, white);
  }

  .jeepney-modal__stops li:first-child::before {
    top: 50%;
  }

  .jeepney-modal__stops li:last-child::before {
    bottom: 50%;
  }

  .jeepney-modal__stop-index {
    position: absolute;
    left: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--route-color, hsl(5, 40%, 34%));
    border: 2px solid white;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--route-color, #7b1113) 45%, white);
    color: white;
    font-size: 0.6875rem;
    font-weight: 700;
  }

  .jeepney-modal__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.25rem 0 0.375rem;
    border-top: 1px solid hsl(0, 0%, 92%);
  }

  .jeepney-modal__actions :global(.map-chrome-action-chip) {
    min-height: 2.25rem;
  }

  .jeepney-modal__view {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 2.25rem;
    padding: 0.4rem 1rem;
    border: 1px solid hsl(5, 53%, 32%);
    border-radius: 0.625rem;
    background: hsl(5, 53%, 32%);
    color: white;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
  }

  .jeepney-modal__view:hover {
    background: hsl(5, 53%, 38%);
  }

  .jeepney-modal__empty {
    padding: 1.5rem;
    color: hsl(0, 0%, 45%);
    text-align: center;
  }
</style>
