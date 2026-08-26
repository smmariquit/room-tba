<script lang="ts">
  import { MapLibre, Marker } from "svelte-maplibre";
  import type { MapLibreMap, StyleSpecification } from "maplibre-gl";
  import { loadCampusMapStyle } from "@lib/maptiler-key";
  import {
    pinChangeBounds,
    pinMoveDistanceMeters,
    type ProposalPinChange,
  } from "@lib/proposals/proposal-pin";

  type Props = {
    change: ProposalPinChange;
    label: string;
  };

  const { change, label }: Props = $props();

  let mapStyle = $state<StyleSpecification | null>(null);
  let styleError = $state(false);
  let map = $state.raw<MapLibreMap | null>(null);

  const distance = $derived(pinMoveDistanceMeters(change));

  // The style is only fetched once this component mounts, which happens only
  // when the reviewer opens the preview — a 59-row queue never pays for it.
  $effect(() => {
    let cancelled = false;
    void loadCampusMapStyle<StyleSpecification>()
      .then((style) => {
        if (!cancelled) mapStyle = style;
      })
      .catch(() => {
        if (!cancelled) styleError = true;
      });
    return () => {
      cancelled = true;
    };
  });

  // Camera moves fire map handlers synchronously; running them inside a
  // reactive flush can chain back into this effect and kill the Svelte
  // scheduler (effect_update_depth_exceeded). Defer to the next frame.
  $effect(() => {
    const instance = map;
    if (!instance) return;
    const bounds = pinChangeBounds(change);
    const frame = requestAnimationFrame(() => {
      if (bounds) {
        instance.fitBounds(bounds, { padding: 36, duration: 0, maxZoom: 18 });
      } else {
        instance.jumpTo({ center: [change.after.lon, change.after.lat], zoom: 17 });
      }
    });
    return () => cancelAnimationFrame(frame);
  });
</script>

<div class="proposal-pin-preview">
  {#if styleError}
    <p class="proposal-pin-preview__fallback">
      Map tiles unavailable. Proposed position: {change.after.lat.toFixed(6)}, {change.after.lon.toFixed(
        6,
      )}
    </p>
  {:else if mapStyle}
    <div class="proposal-pin-preview__canvas">
      <MapLibre
        bind:map
        style={mapStyle}
        center={[change.after.lon, change.after.lat]}
        zoom={17}
        attributionControl={false}
        interactive={false}
        class="proposal-pin-preview__map"
        aria-label={`Map preview of the proposed position for ${label}`}
      >
        {#if change.before}
          <Marker lngLat={[change.before.lon, change.before.lat]}>
            <span
              class="proposal-pin proposal-pin--before"
              title="Published position"
            ></span>
          </Marker>
        {/if}
        <Marker lngLat={[change.after.lon, change.after.lat]}>
          <span
            class="proposal-pin proposal-pin--after"
            title="Proposed position"
          ></span>
        </Marker>
      </MapLibre>
    </div>
    <p class="proposal-pin-preview__legend">
      {#if change.before}
        <span class="proposal-pin proposal-pin--before" aria-hidden="true"
        ></span> Published
        <span class="proposal-pin proposal-pin--after" aria-hidden="true"
        ></span> Proposed
        {#if distance !== null}
          · moved {distance}m
        {/if}
      {:else}
        <span class="proposal-pin proposal-pin--after" aria-hidden="true"
        ></span> New position · {change.after.lat.toFixed(5)}, {change.after.lon.toFixed(
          5,
        )}
      {/if}
    </p>
  {:else}
    <p class="proposal-pin-preview__fallback">Loading map preview…</p>
  {/if}
</div>

<style>
  .proposal-pin-preview {
    margin: 0.375rem 0 0;
  }

  .proposal-pin-preview__canvas {
    height: 9rem;
    overflow: hidden;
    border: 1px solid hsl(0, 0%, 84%);
    border-radius: 6px;
  }

  .proposal-pin-preview__canvas :global(.proposal-pin-preview__map) {
    width: 100%;
    height: 100%;
  }

  .proposal-pin-preview__fallback {
    margin: 0;
    padding: 0.35rem 0.5rem;
    border: 1px solid hsl(0, 0%, 88%);
    border-radius: 6px;
    background: hsl(0, 0%, 98%);
    font-size: 0.8rem;
    color: hsl(0, 0%, 35%);
  }

  .proposal-pin-preview__legend {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin: 0.25rem 0 0;
    font-size: 0.75rem;
    color: hsl(0, 0%, 40%);
  }

  .proposal-pin {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 1px 3px hsla(0, 0%, 0%, 0.4);
  }

  .proposal-pin--before {
    background: hsl(0, 0%, 45%);
  }

  .proposal-pin--after {
    background: hsl(140, 55%, 38%);
  }
</style>
