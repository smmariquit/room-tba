<script lang="ts">
  import { onMount } from "svelte";
  import * as maplibregl from "maplibre-gl";
  import { configureMaplibreWorker } from "@lib/maplibre-worker";
    import "maplibre-gl/dist/maplibre-gl.css";
  import { campusMap } from "../../../campus.config";
  import {
    campusSlug,
    generateCampusConfig,
    vercelDeployUrl,
    type ForkConfig,
  } from "@lib/fork/campus-config-template";
  import { copyTextToClipboard } from "@lib/clipboard";

  // See Map.svelte: `?worker&url` (not `?url`) so Vite bundles the v6 module
  // worker with its sibling chunk; `?url` leaves it unable to load, no tiles.
  configureMaplibreWorker();

  /** Plain OSM raster style — works on any deployment, no MapTiler key. */
  const OSM_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  };

  // ---- Map state (defaults: the upstream campus, so the page works untouched)
  let centerLng = $state(campusMap.defaultCamera.center[0]);
  let centerLat = $state(campusMap.defaultCamera.center[1]);
  let west = $state(campusMap.maxBounds[0][0]);
  let south = $state(campusMap.maxBounds[0][1]);
  let east = $state(campusMap.maxBounds[1][0]);
  let north = $state(campusMap.maxBounds[1][1]);
  let clickMode = $state<"center" | "cornerA" | "cornerB">("center");
  let mapZoom = $state(campusMap.defaultCamera.zoom);

  // ---- Form state. Slug / site URL / zoom auto-fill until manually edited.
  let name = $state("");
  let slugOverride = $state<string | null>(null);
  let siteUrlOverride = $state<string | null>(null);
  let zoomOverride = $state<number | null>(null);
  let transitOverlay = $state(false);
  let transitLabel = $state("Jeepney routes");
  let terrain = $state(false);

  const slug = $derived(slugOverride ?? campusSlug(name));
  const siteUrl = $derived(
    siteUrlOverride ?? (slug ? `https://${slug}-room-tba.vercel.app` : ""),
  );
  const zoom = $derived(zoomOverride ?? Math.round(mapZoom * 100) / 100);

  const errors = $derived.by(() => {
    const list: string[] = [];
    if (!name.trim()) list.push("Campus name is required.");
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
      list.push("Short name must be lowercase letters, digits, and dashes.");
    if (!URL.canParse(siteUrl)) list.push("Site URL must be a valid URL.");
    if (!(zoom >= 1 && zoom <= 22)) list.push("Default zoom must be 1–22.");
    if (!(west < east && south < north))
      list.push(
        "Bounds are degenerate: west must be less than east and south less than north.",
      );
    if (transitOverlay && !transitLabel.trim())
      list.push("Transit overlay label is required when the overlay is on.");
    return list;
  });

  const forkConfig = $derived<ForkConfig>({
    name: name.trim(),
    siteUrl,
    center: [centerLng, centerLat],
    bounds: [
      [west, south],
      [east, north],
    ],
    defaultZoom: zoom,
    transitOverlay,
    transitLabel: transitLabel.trim(),
    terrain,
  });

  const configText = $derived(generateCampusConfig(forkConfig));
  const deployUrl = $derived(vercelDeployUrl(slug));

  // ---- Map plumbing (event handlers only — no camera calls inside $effect)
  let mapContainer: HTMLDivElement | undefined = $state();
  let map: maplibregl.Map | null = null;
  let marker: maplibregl.Marker | null = null;

  function boundsGeoJson(): GeoJSON.Feature {
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ],
        ],
      },
    };
  }

  function syncOverlays() {
    marker?.setLngLat([centerLng, centerLat]);
    const source = map?.getSource("fork-bounds") as
      | maplibregl.GeoJSONSource
      | undefined;
    source?.setData(boundsGeoJson());
  }

  function normalizeBounds() {
    if (west > east) [west, east] = [east, west];
    if (south > north) [south, north] = [north, south];
  }

  function handleMapClick(lngLat: maplibregl.LngLat) {
    const lng = lngLat.lng;
    const lat = lngLat.lat;
    if (clickMode === "center") {
      centerLng = lng;
      centerLat = lat;
    } else if (clickMode === "cornerA") {
      // Do not normalize yet: corner B's click completes the rectangle and
      // normalizing halfway would swap this click into the wrong slot.
      west = lng;
      south = lat;
      clickMode = "cornerB";
    } else {
      east = lng;
      north = lat;
      normalizeBounds();
      clickMode = "center";
    }
    syncOverlays();
  }

  function numberInput(apply: (value: number) => void) {
    return (event: Event) => {
      const value = Number.parseFloat(
        (event.currentTarget as HTMLInputElement).value,
      );
      if (Number.isFinite(value)) {
        apply(value);
        syncOverlays();
      }
    };
  }

  onMount(() => {
    if (!mapContainer) return;
    const instance = new maplibregl.Map({
      container: mapContainer,
      style: OSM_STYLE,
      center: [centerLng, centerLat],
      zoom: campusMap.defaultCamera.zoom,
    });
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    const centerMarker = new maplibregl.Marker({
      draggable: true,
      color: "#8c231c",
    })
      .setLngLat([centerLng, centerLat])
      .addTo(instance);
    centerMarker.on("dragend", () => {
      const position = centerMarker.getLngLat();
      centerLng = position.lng;
      centerLat = position.lat;
    });
    instance.on("load", () => {
      instance.addSource("fork-bounds", {
        type: "geojson",
        data: boundsGeoJson(),
      });
      instance.addLayer({
        id: "fork-bounds-fill",
        type: "fill",
        source: "fork-bounds",
        paint: { "fill-color": "#8c231c", "fill-opacity": 0.08 },
      });
      instance.addLayer({
        id: "fork-bounds-line",
        type: "line",
        source: "fork-bounds",
        paint: {
          "line-color": "#8c231c",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });
    });
    instance.on("click", (event) => handleMapClick(event.lngLat));
    instance.on("moveend", () => {
      mapZoom = instance.getZoom();
    });
    map = instance;
    marker = centerMarker;
    return () => {
      instance.remove();
      map = null;
      marker = null;
    };
  });

  // ---- Copy button
  let copyStatus = $state("");
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  async function copyConfig() {
    try {
      await copyTextToClipboard(configText);
      copyStatus = "Copied.";
    } catch {
      copyStatus = "Could not copy — select the text manually.";
    }
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyStatus = "";
    }, 2500);
  }

  const round = (value: number, places: number) =>
    Number(value.toFixed(places));
</script>

<div class="fw">
  <section class="fw__section" aria-labelledby="fw-map-heading">
    <h2 id="fw-map-heading">1. Point at your campus</h2>
    <p>
      Pan and zoom the map to your campus. Click the map to place the campus
      center, then set the two bound corners — the app never pans outside the
      bounds. No mouse? The numeric fields below do the same thing.
    </p>

    <div class="fw__mode" role="group" aria-label="What a map click sets">
      <span class="fw__mode-label">Map click sets:</span>
      <button
        type="button"
        class="fw__mode-btn"
        aria-pressed={clickMode === "center"}
        onclick={() => (clickMode = "center")}
      >
        Center
      </button>
      <button
        type="button"
        class="fw__mode-btn"
        aria-pressed={clickMode === "cornerA"}
        onclick={() => (clickMode = "cornerA")}
      >
        Bounds corner A
      </button>
      <button
        type="button"
        class="fw__mode-btn"
        aria-pressed={clickMode === "cornerB"}
        onclick={() => (clickMode = "cornerB")}
      >
        Bounds corner B
      </button>
    </div>

    <div
      class="fw__map"
      bind:this={mapContainer}
      aria-label="Map for picking the campus center and bounds. Use the numeric fields below as the keyboard alternative."
    ></div>

    <p class="fw__readout" aria-live="polite">
      Center: {round(centerLat, 6)}, {round(centerLng, 6)} · Bounds: [{round(
        west,
        4,
      )}, {round(south, 4)}] → [{round(east, 4)}, {round(north, 4)}] · Map zoom:
      {round(mapZoom, 2)}
    </p>

    <fieldset class="fw__coords">
      <legend>Center (keyboard alternative to clicking)</legend>
      <label>
        Latitude
        <input
          type="number"
          step="any"
          value={centerLat}
          oninput={numberInput((v) => (centerLat = v))}
        />
      </label>
      <label>
        Longitude
        <input
          type="number"
          step="any"
          value={centerLng}
          oninput={numberInput((v) => (centerLng = v))}
        />
      </label>
    </fieldset>

    <fieldset class="fw__coords">
      <legend>Bounds (west/south/east/north)</legend>
      <label>
        West
        <input
          type="number"
          step="any"
          value={west}
          oninput={numberInput((v) => (west = v))}
        />
      </label>
      <label>
        South
        <input
          type="number"
          step="any"
          value={south}
          oninput={numberInput((v) => (south = v))}
        />
      </label>
      <label>
        East
        <input
          type="number"
          step="any"
          value={east}
          oninput={numberInput((v) => (east = v))}
        />
      </label>
      <label>
        North
        <input
          type="number"
          step="any"
          value={north}
          oninput={numberInput((v) => (north = v))}
        />
      </label>
    </fieldset>
  </section>

  <section class="fw__section" aria-labelledby="fw-form-heading">
    <h2 id="fw-form-heading">2. Name it</h2>

    <div class="fw__form">
      <label>
        Campus name
        <input
          type="text"
          required
          placeholder="e.g. Visayas State University"
          bind:value={name}
        />
      </label>
      <label>
        Short name (slug)
        <input
          type="text"
          value={slug}
          oninput={(e) => (slugOverride = e.currentTarget.value)}
        />
        <span class="fw__hint">
          Auto-filled from the name. Used for the Vercel project name.
        </span>
      </label>
      <label>
        Site URL
        <input
          type="url"
          value={siteUrl}
          oninput={(e) => (siteUrlOverride = e.currentTarget.value)}
        />
        <span class="fw__hint">
          Where the fork will live. The Vercel default works until you have a
          domain.
        </span>
      </label>
      <label>
        Default zoom
        <input
          type="number"
          step="0.01"
          min="1"
          max="22"
          value={zoom}
          oninput={numberInput((v) => (zoomOverride = v))}
        />
        <span class="fw__hint">Follows the map zoom until you edit it.</span>
      </label>
      <label class="fw__check">
        <input type="checkbox" bind:checked={transitOverlay} />
        Transit overlay (campus routes drawn on the map)
      </label>
      <label>
        Transit overlay label
        <input
          type="text"
          bind:value={transitLabel}
          disabled={!transitOverlay}
        />
        <span class="fw__hint">
          What the toggle is called in your app, e.g. "Jeepney routes",
          "Shuttle lines".
        </span>
      </label>
      <label class="fw__check">
        <input type="checkbox" bind:checked={terrain} />
        3D terrain (needs a MapTiler key on your deployment)
      </label>
    </div>
  </section>

  <section class="fw__section" aria-labelledby="fw-output-heading">
    <h2 id="fw-output-heading">3. Take your config and deploy</h2>

    {#if errors.length > 0}
      <ul class="fw__errors" aria-label="Fix before the config is ready">
        {#each errors as error (error)}
          <li>{error}</li>
        {/each}
      </ul>
    {:else}
      <div class="fw__output-actions">
        <button type="button" class="fw__copy" onclick={copyConfig}>
          Copy config
        </button>
        <span class="fw__copy-status" role="status" aria-live="polite">
          {copyStatus}
        </span>
        <a
          class="fw__deploy"
          data-testid="fork-deploy-link"
          href={deployUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Deploy with Vercel
        </a>
      </div>
      <pre class="fw__config" data-testid="fork-config"><code
          >{configText}</code
        ></pre>

      <h3>Next steps</h3>
      <ol class="fw__next">
        <li>
          <a
            href="https://github.com/uplbtools/room-tba/fork"
            target="_blank"
            rel="noopener noreferrer">Fork the repo on GitHub</a
          >.
        </li>
        <li>
          Paste the config above over <code>src/campus.config.ts</code> in your
          fork.
        </li>
        <li>
          Seed a starter dataset: <code>bun run seed:sample</code>, then import
          your class schedule with <code>bun run import:classes-generic</code>.
        </li>
        <li>
          Click "Deploy with Vercel" above — it prompts for the env vars the app
          needs (<code>DATABASE_URL</code> and friends, see
          <code>.env.example</code>).
        </li>
        <li>
          Read the
          <a
            href="https://github.com/uplbtools/room-tba#fork-this-for-your-campus"
            target="_blank"
            rel="noopener noreferrer">README fork section</a
          >
          and the
          <a href="/wiki/fork-for-your-campus">full fork guide</a> for the rest
          (data, aliases, the painful parts).
        </li>
      </ol>
    {/if}
  </section>
</div>

<style>
  .fw {
    display: grid;
    gap: 2.5rem;
  }

  .fw__section h2 {
    margin: 0 0 0.5rem;
    font-size: 1.35rem;
  }

  .fw__section > p {
    max-width: 44rem;
    margin: 0 0 1rem;
    line-height: 1.5;
  }

  .fw__mode {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .fw__mode-label {
    font-size: 0.9rem;
    font-weight: 600;
  }

  .fw__mode-btn {
    padding: 0.35rem 0.75rem;
    border: 1px solid #c9b7b4;
    border-radius: 999px;
    background: #fff;
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .fw__mode-btn[aria-pressed="true"] {
    border-color: #8c231c;
    background: #8c231c;
    color: #fff;
  }

  .fw__mode-btn:focus-visible {
    outline: 2px solid #8c231c;
    outline-offset: 2px;
  }

  .fw__map {
    width: 100%;
    height: 420px;
    border: 1px solid #c9b7b4;
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .fw__readout {
    margin: 0.5rem 0 1rem;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    color: #5c4a47;
  }

  .fw__coords {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    margin: 0 0 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid #e0d5d2;
    border-radius: 0.75rem;
  }

  .fw__coords legend {
    padding: 0 0.35rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .fw__coords label {
    display: grid;
    gap: 0.25rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .fw__form {
    display: grid;
    gap: 1rem;
    max-width: 34rem;
  }

  .fw__form label {
    display: grid;
    gap: 0.3rem;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .fw__form label.fw__check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .fw input[type="text"],
  .fw input[type="url"],
  .fw input[type="number"] {
    padding: 0.5rem 0.65rem;
    border: 1px solid #c9b7b4;
    border-radius: 0.5rem;
    font: inherit;
    font-weight: 400;
  }

  .fw input:focus-visible,
  .fw a:focus-visible,
  .fw button:focus-visible {
    outline: 2px solid #8c231c;
    outline-offset: 2px;
  }

  .fw input:disabled {
    background: #f1ebe9;
    color: #8a7a77;
  }

  .fw__hint {
    font-size: 0.8rem;
    font-weight: 400;
    color: #5c4a47;
  }

  .fw__errors {
    margin: 0;
    padding: 0.75rem 1rem 0.75rem 2rem;
    border: 1px solid #d9a29c;
    border-radius: 0.5rem;
    background: #fbeeec;
    color: #6d1b15;
  }

  .fw__output-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .fw__copy {
    padding: 0.5rem 1rem;
    border: 1px solid #8c231c;
    border-radius: 0.5rem;
    background: #fff;
    color: #8c231c;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .fw__copy-status {
    min-width: 4rem;
    font-size: 0.85rem;
    color: #065f46;
  }

  .fw__deploy {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background: #000;
    color: #fff;
    font-weight: 600;
    text-decoration: none;
  }

  .fw__config {
    max-height: 26rem;
    margin: 0 0 1.5rem;
    padding: 1rem;
    overflow: auto;
    border: 1px solid #e0d5d2;
    border-radius: 0.75rem;
    background: #241d1c;
    color: #f4ece9;
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .fw__next {
    max-width: 44rem;
    margin: 0.5rem 0 0;
    padding-left: 1.25rem;
    line-height: 1.6;
  }

  .fw__next li {
    margin-bottom: 0.35rem;
  }

  .fw__next code,
  .fw__section code {
    padding: 0.1rem 0.3rem;
    border-radius: 0.25rem;
    background: #f1ebe9;
    font-size: 0.85em;
  }

  @media (max-width: 640px) {
    .fw__map {
      height: 320px;
    }
  }
</style>
