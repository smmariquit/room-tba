<script lang="ts">
  import { MapLibre, Marker } from "svelte-maplibre";
  import * as maplibregl from "maplibre-gl";
  import { configureMaplibreWorker } from "@lib/maplibre-worker";
  // `?worker&url`, NOT `?url`. MapLibre 6 is ESM-only and its worker is a
  // module that imports a sibling chunk (maplibre-gl-shared). `?url` copies the
  // worker file verbatim without that sibling, so in production the module
  // worker fails on its first import and NO vector tile ever loads (blank
  // basemap under working pins, #1003). `?worker&url` routes it through Vite's
  // worker pipeline, emitting a self-contained worker with its imports bundled.
  // Ref: MapLibre v5->v6 migration guide (setWorkerUrl + Vite).
  
  configureMaplibreWorker();
  import { getAppActions, getAppData } from "@lib/context";
  import {
    queryStore,
    locationStore,
    mapStore,
    mapViewStore,
    mapEditStore,
    eventPlacementStore,
    sidePanelStore,
    jeepneyStore,
    currentRoom,
    adminAuthStore,
    toastStore,
    mapProposalStore,
    additionProposalStore,
    buildingTypeFilter,
    terrainStore,
    trailStore,
    travelTimeStore,
    measureRouteStore,
    scheduleRouteStore,
    classVenuesStore,
    termStore,
    syncToastStore,
    transitStore,
    plannerStore,
    plannerBuildingsStore,
    plannerRoomCodes,
    directionsStore,
  } from "@lib/store.svelte";
  import { untrack } from "svelte";
  import { onMount } from "svelte";
  import { getSponsoredPlacePins, loadSponsors } from "@lib/sponsors";
  import {
    trackSponsorClick,
    trackSponsorImpression,
  } from "@lib/sponsor-tracking";
  import { fade } from "svelte/transition";
  import { metersToLngLatCircle } from "@lib/geolocation";
  import { sumRouteLegs } from "@lib/campus-route";
  import { isNearRoute } from "@lib/travel-graph/route-proximity";
  import MapLibreGlDirections from "@maplibre/maplibre-gl-directions";
  import CalendarDays from "@lucide/svelte/icons/calendar-days";
  import X from "@lucide/svelte/icons/x";
  import Move from "@lucide/svelte/icons/move";
  import Undo2 from "@lucide/svelte/icons/undo-2";
  import Redo2 from "@lucide/svelte/icons/redo-2";
  import PinGlyph from "./map/PinGlyph.svelte";
  import EventMapPin from "./map/EventMapPin.svelte";
  import ContributorDraftPinMarker from "./map/ContributorDraftPinMarker.svelte";
  import EventPlacementImageField from "./map-chrome/EventPlacementImageField.svelte";
  import MapEntityPin from "./map/MapEntityPin.svelte";
  import { MediaQuery } from "svelte/reactivity";
  import { observeBlockHeight } from "@lib/layout-css-vars";
  import type { StyleSpecification } from "maplibre-gl";
  import * as mapGl from "maplibre-gl";
  import type { FeatureCollection, LineString } from "geojson";
  import type {
    BuildingData,
    DormData,
    EventData,
    OrgData,
    PlaceData,
  } from "@lib/types";
  import { isStudentOrganization } from "@constants/org-categories";
  import { isLandmarkPlaceCategory } from "@constants/place-categories";
  import {
    resolveRouteGeometry,
    type JeepneyRoute,
    type JeepneyStop,
    type ResolvedRouteGeometry,
    type RouteGeometrySource,
    type StoredRouteGeometry,
  } from "@constants/jeepney-routes";
  import jeepneyGeometries from "@constants/jeepney-geometries.json";
  import {
    MAKILING_TRAIL_COLOR,
    MAKILING_TRAIL_LAYER_CASING_ID,
    MAKILING_TRAIL_LAYER_ID,
    MAKILING_TRAIL_LINE,
    MAKILING_TRAIL_STATIONS,
    MAKILING_TRAIL_STATIONS_LAYER_ID,
    MAKILING_TRAIL_STATIONS_SOURCE_ID,
    MAKILING_TRAIL_SOURCE_ID,
  } from "@constants/makiling-trail";
  import {
    CAMPUS_DEFAULT_CAMERA,
    CAMPUS_MAX_BOUNDS,
    TERRAIN_CAMERA,
    TERRAIN_MAX_BOUNDS,
    TERRAIN_SOURCE_BOUNDS,
    TERRAIN_HILLSHADE_BEFORE_LAYER_ID,
    TERRAIN_HILLSHADE_LAYER_ID,
    TERRAIN_SOURCE_ID,
    TERRAIN_TILE_FAILURE_MESSAGE,
    TERRAIN_UNAVAILABLE_OFFLINE_MESSAGE,
    getTerrainTileJsonUrl,
  } from "@constants/map-terrain";
  import {
    ISOCHRONE_CAP_MINUTES,
    VIRIDIS_STOPS,
  } from "@constants/travel-modes";
  import {
    dijkstra,
    isochroneFeatures,
    nearestNodeIndex,
    shortestPath,
    type TravelMode,
  } from "@lib/travel-graph/engine";
  import { loadTravelGraph } from "@lib/travel-graph/load";
  import { applyBasemapPalette } from "@lib/map-basemap-palette";
  import { syncSatelliteLayer } from "@lib/map-satellite";
  import { loadCampusMapStyle } from "@lib/maptiler-key";
  import { isMap2DPitch } from "@constants/map-dimension";
  import { syncBuildingLayersForDimension } from "@lib/map-dimension-layers";
  import {
    EXTERNAL_CAMPUSES_GEOJSON,
    EXTERNAL_CAMPUSES_LABELS,
  } from "@constants/external-campuses";
  import {
    buildingMatchesTypeFilter,
    dormMatchesTypeFilter,
  } from "@constants/building-types";
  import { getEventImage } from "@lib/event-images";
  import { formatCampusDateShort, formatCampusTime } from "@lib/event-time";
  import {
    completeMapMoveRedo,
    completeMapMoveUndo,
    getMapEditShortcutAction,
    recordMapMove,
    type MapMoveCoordinates,
    type VersionedMapMove,
  } from "@lib/map-move-history";
  import {
    ClientEditConflictError,
    ClientEventConflictError,
    editErrorMessage,
  } from "@lib/map-edit/errors";
  import {
    buildingPreviewFromRow,
    dormPreviewFromRow,
    entityHoverPreviewStore,
    eventPreviewFromRow,
    isBuildingHoverPreview,
    isDormHoverPreview,
    isEventHoverPreview,
    isOrganizationHoverPreview,
    isPlaceHoverPreview,
    organizationPreviewFromRow,
    placePreviewFromRow,
    type EntityHoverPreview,
  } from "@lib/entity-hover-preview.svelte";
  import { patchEventLocations, patchPosition } from "@lib/map-edit/patch-api";
  import { formatMinutes } from "@lib/schedule-import/day-stops";
  import type {
    EditableCoords,
    EditableEntityType,
    EditableVersionedPosition,
    EventLocationWriteValue,
  } from "@lib/map-edit/types";
  import {
    resolveSubmitterName,
    submitCreateProposal,
    submitPinPositionProposal,
  } from "@lib/proposals/client";
  import BuildingResult from "./controls/BuildingResult.svelte";
  import PlaceResult from "./controls/PlaceResult.svelte";
  import OrgResult from "./controls/OrgResult.svelte";
  import DormResult from "./controls/DormResult.svelte";
  import EventResult from "./controls/EventResult.svelte";

  const data = getAppData();
  const appActions = getAppActions();
  const { buildings, dorms, events, organizations, places, loaded } =
    $derived(data());
  // Refresh the set of buildings that host classes whenever the term changes
  // or an offline sync lands, so dual-role buildings (admin + class venue)
  // filter correctly.
  $effect(() => {
    // Re-run after a sync lands (allSynced isn't read by load's argument).
    void syncToastStore.allSynced;
    void classVenuesStore.load(termStore.activeTermId);
  });

  // Browsing a sidebar directory declutters the map to just that category's
  // pins; null means no browse filter (all pin kinds show).
  const browseTab = $derived(
    queryStore.category === "browse" ? queryStore.queryValue : null,
  );
  const showBuildingPins = $derived(
    browseTab === null ||
      browseTab === "buildings" ||
      browseTab === "colleges" ||
      browseTab === "divisions",
  );
  const showDormPins = $derived(browseTab === null || browseTab === "dorms");
  const orgPinFilter = $derived.by((): "all" | "student" | "office" | "none" => {
    if (browseTab === null) return "all";
    if (browseTab === "organizations") return "student";
    if (browseTab === "offices") return "office";
    return "none";
  });
  const placePinFilter = $derived.by(
    (): "all" | "landmark" | "establishment" | "none" => {
      if (browseTab === null) return "all";
      if (browseTab === "landmarks") return "landmark";
      if (browseTab === "services") return "establishment";
      return "none";
    },
  );

  const filteredBuildings = $derived.by(() => {
    if (!loaded || !showBuildingPins) return [];
    return buildings.filter((building) =>
      buildingMatchesTypeFilter(
        building,
        buildingTypeFilter.value,
        classVenuesStore.buildingIdsWithClasses,
      ),
    );
  });
  const filteredDorms = $derived.by(() => {
    if (!loaded || !showDormPins) return [];
    return dorms.filter((dorm) =>
      dormMatchesTypeFilter(dorm, buildingTypeFilter.value),
    );
  });
  // Organizations pin at their own coordinate, else fall back to the coords of
  // the building they sit in. Orgs without any resolvable location are dropped
  // from the map (they still appear in the directory list).
  function organizationPosition(org: OrgData) {
    let lat = org.lat;
    let lon = org.lon;
    if ((lat === null || lon === null) && org.buildingId !== null) {
      const host = buildings.find((building) => building.id === org.buildingId);
      if (host) {
        lat = host.lat;
        lon = host.lon;
      }
    }
    return lat !== null && lon !== null ? { lat, lon } : null;
  }

  const filteredOrganizations = $derived.by(() => {
    if (!loaded || !mapViewStore.showOrgs || orgPinFilter === "none") return [];
    return organizations.flatMap((org) => {
      if (orgPinFilter === "student" && !isStudentOrganization(org.category)) {
        return [];
      }
      if (orgPinFilter === "office" && isStudentOrganization(org.category)) {
        return [];
      }
      const position = organizationPosition(org);
      return position ? [{ org, ...position }] : [];
    });
  });
  const filteredPlaces = $derived.by(() => {
    if (!loaded || !mapViewStore.showPlaces || placePinFilter === "none") {
      return [];
    }
    return places.filter(
      (place) =>
        place.lat != null &&
        place.lon != null &&
        (placePinFilter === "all" ||
          (placePinFilter === "landmark") === isLandmarkPlaceCategory(place.category)),
    );
  });

  function isLandmarkPlace(place: PlaceData) {
    return isLandmarkPlaceCategory(place.category);
  }

  function tryAddDirectionsStop(
    lat: number,
    lon: number,
    label: string,
  ): boolean {
    if (!directionsStore.addingStop) return false;
    void directionsStore.addWaypoint({ lat, lng: lon, label });
    return true;
  }

  function handlePlaceMarkerClick(place: PlaceData) {
    if (
      place.lat != null &&
      place.lon != null &&
      tryAddDirectionsStop(place.lat, place.lon, place.name)
    ) {
      return;
    }
    if (
      queryStore.category === "place" &&
      queryStore.inputValue === place.name
    ) {
      sidePanelStore.expand();
      return;
    }
    queryStore.updateQuery({
      category: "place",
      type: "result",
      value: place.name,
    });
    queryStore.inputValue = place.name;
    sidePanelStore.openPanel({
      type: "search-result",
      component: PlaceResult,
    });
  }

  // Event titles are not unique, so resolve the selected event by its slug when
  // one is available, falling back to the title only for legacy/partial state.
  function findSelectedEvent(eventList: EventData[]): EventData | null {
    const slug = queryStore.selectedEventSlug;
    if (slug) return eventList.find((event) => event.slug === slug) ?? null;
    return (
      eventList.find((event) => event.title === queryStore.inputValue) ?? null
    );
  }
  let directions: MapLibreGlDirections | undefined = $state.raw();
  let mapStyle = $state<StyleSpecification | null>(null);

  // Sponsored place pins (docs/ad-policy.md: real locations only, capped).
  let sponsoredPlacePins = $state<Map<string, string>>(new Map());

  // Impression per sponsored pin actually on the map (session-deduped in lib).
  $effect(() => {
    if (sponsoredPlacePins.size === 0) return;
    for (const place of filteredPlaces) {
      const sponsorId = sponsoredPlacePins.get(place.name);
      if (sponsorId) trackSponsorImpression(sponsorId, "map_pin");
    }
  });

  onMount(() => {
    // Hydrate saved planner plans so the "My classes" highlight knows the
    // user's class rooms without the planner screen ever being opened.
    plannerStore.init();
    void loadSponsors().then((data) => {
      if (data) sponsoredPlacePins = getSponsoredPlacePins(data.sponsors);
    });
    void loadCampusMapStyle<StyleSpecification>()
      .then((style) => {
        mapStyle = style;
      })
      .catch((error) => {
        console.error("Failed to load campus map style", error);
        toastStore.show(
          "Campus map tiles could not load. Check MapTiler configuration.",
          "error",
        );
      });
  });

  const JEEPNEY_ROUTE_SOURCE_ID = "jeepney-route-line";
  const JEEPNEY_ROUTE_LAYER_ID = "jeepney-route-line";
  const JEEPNEY_ROUTE_LAYER_CASING_ID = "jeepney-route-line-casing";
  const USER_LOCATION_ACCURACY_SOURCE_ID = "user-location-accuracy";
  const USER_LOCATION_ACCURACY_FILL_ID = "user-location-accuracy-fill";
  const USER_LOCATION_ACCURACY_LINE_ID = "user-location-accuracy-line";
  const JEEPNEY_ROUTE_WIDTH = 5;
  const JEEPNEY_ROUTE_CASING_WIDTH = 8;
  const jeepneyRouteGeometryCache = new Map<string, ResolvedRouteGeometry>();
  const EVENT_ROUTE_SOURCE_ID = "event-route-line";
  const EVENT_ROUTE_LAYER_ID = "event-route-line";
  const EVENT_ROUTE_LAYER_CASING_ID = "event-route-line-casing";
  const EXTERNAL_CAMPUSES_SOURCE_ID = "external-campuses-source";
  const EXTERNAL_CAMPUSES_LAYER_ID = "external-campuses-fill";
  const EXTERNAL_CAMPUSES_LABELS_SOURCE_ID = "external-campuses-labels";
  const EXTERNAL_CAMPUSES_MARKER_LAYER_ID = "external-campuses-markers";
  const EXTERNAL_CAMPUSES_LABELS_LAYER_ID = "external-campuses-labels";
  let activeRouteId = $state<string | null>(null);
  let activeRouteStops = $state<JeepneyRoute["stops"]>([]);
  let activeRouteColor = $state<string>("#dc2626");
  let terrainModeWasEnabled = false;
  let selectedEditKey = $state<string | null>(null);
  let savingEditKey = $state<string | null>(null);
  let savedEditKey = $state<string | null>(null);
  let failedEditKey = $state<string | null>(null);
  let hoveredEditKey = $state<string | null>(null);
  let expandedEventGroupKey = $state<string | null>(null);
  let undoingEditKey = $state<string | null>(null);
  let undoShortcutLabel = $state("Ctrl+Z");
  let editStatusMessage = $state<string | null>(null);
  type EntityEditMove = VersionedMapMove & {
    kind: "entity";
    entityType: EditableEntityType;
    id: number;
  };
  type EventLocationEditMove = VersionedMapMove & {
    kind: "eventLocation";
    eventId: number;
    locationId: number;
    previousLocations: EventLocationWriteValue[];
    currentLocations: EventLocationWriteValue[];
  };
  type EditMove = EntityEditMove | EventLocationEditMove;
  let positionOverrides = $state<Record<string, EditableVersionedPosition>>({});
  // `events` is `$state.raw`, so in-place updates do not invalidate derived
  // marker positions. Mirror the building/dorm `positionOverrides` pattern with
  // a reactive override so the editable event marker reflects saves and, on a
  // failed save, rolls back to the previous/server position.
  let eventLocationOverrides = $state<Record<string, EditableCoords>>({});
  let undoStack = $state<EditMove[]>([]);
  let redoStack = $state<EditMove[]>([]);
  const undoMove = $derived(undoStack.at(-1) ?? null);
  const redoMove = $derived(redoStack.at(-1) ?? null);

  function routeGeometry(route: JeepneyRoute) {
    const cached = jeepneyRouteGeometryCache.get(route.id);
    if (cached) return cached;
    const resolved = resolveRouteGeometry(
      route,
      jeepneyGeometries as Record<string, StoredRouteGeometry>,
    );
    // Only sourced lines are cacheable: a stops-only line is derived from stops
    // the editor can move, so it has to be recomputed each draw.
    if (resolved.source !== "stops-only") {
      jeepneyRouteGeometryCache.set(route.id, resolved);
    }
    return resolved;
  }

  function ensureJeepneyRouteLayers(
    map: mapGl.MapLibreMap,
    color: string,
    source: RouteGeometrySource,
  ) {
    // A stops-only line is not a road path, so it must not look like one:
    // dashed and faded reads as provisional instead of confidently wrong.
    const provisional = source === "stops-only";
    // `undefined` restores the style default (solid). MapLibre dash lengths are
    // multiples of line-width, so the casing's dash is rescaled by the width
    // ratio; otherwise the white halo fills the gaps it should leave open.
    const dash = provisional ? [1.5, 1.5] : undefined;
    const casingDash = dash?.map(
      (n) => (n * JEEPNEY_ROUTE_WIDTH) / JEEPNEY_ROUTE_CASING_WIDTH,
    );
    const opacity = provisional ? 0.55 : 0.95;
    if (!map.getSource(JEEPNEY_ROUTE_SOURCE_ID)) {
      map.addSource(JEEPNEY_ROUTE_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
    }

    if (!map.getLayer(JEEPNEY_ROUTE_LAYER_CASING_ID)) {
      map.addLayer({
        id: JEEPNEY_ROUTE_LAYER_CASING_ID,
        type: "line",
        source: JEEPNEY_ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": JEEPNEY_ROUTE_CASING_WIDTH,
          "line-opacity": 0.95,
        },
      });
    }

    if (!map.getLayer(JEEPNEY_ROUTE_LAYER_ID)) {
      map.addLayer({
        id: JEEPNEY_ROUTE_LAYER_ID,
        type: "line",
        source: JEEPNEY_ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": color,
          "line-width": JEEPNEY_ROUTE_WIDTH,
          "line-opacity": 0.95,
        },
      });
    }

    // Layers outlive a single route, so provenance styling is applied on every
    // draw, not only when the layer is first created.
    map.setPaintProperty(JEEPNEY_ROUTE_LAYER_ID, "line-color", color);
    map.setPaintProperty(JEEPNEY_ROUTE_LAYER_ID, "line-opacity", opacity);
    map.setPaintProperty(JEEPNEY_ROUTE_LAYER_ID, "line-dasharray", dash);
    map.setPaintProperty(JEEPNEY_ROUTE_LAYER_CASING_ID, "line-opacity", opacity);
    map.setPaintProperty(
      JEEPNEY_ROUTE_LAYER_CASING_ID,
      "line-dasharray",
      casingDash,
    );
  }

  function clearJeepneyRouteLayers(map: mapGl.MapLibreMap) {
    if (map.getLayer(JEEPNEY_ROUTE_LAYER_ID)) {
      map.removeLayer(JEEPNEY_ROUTE_LAYER_ID);
    }
    if (map.getLayer(JEEPNEY_ROUTE_LAYER_CASING_ID)) {
      map.removeLayer(JEEPNEY_ROUTE_LAYER_CASING_ID);
    }
    if (map.getSource(JEEPNEY_ROUTE_SOURCE_ID)) {
      map.removeSource(JEEPNEY_ROUTE_SOURCE_ID);
    }
  }

  const TRAVEL_TIME_SOURCE_ID = "travel-time-isochrone";
  const TRAVEL_TIME_LAYER_ID = "travel-time-isochrone";

  function ensureTravelTimeLayers(map: mapGl.MapLibreMap) {
    if (!map.getSource(TRAVEL_TIME_SOURCE_ID)) {
      map.addSource(TRAVEL_TIME_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer(TRAVEL_TIME_LAYER_ID)) {
      // Viridis ramp over per-edge walking minutes; values past the cap keep
      // the last stop's color (interpolate clamps).
      const rampStep = ISOCHRONE_CAP_MINUTES / (VIRIDIS_STOPS.length - 1);
      map.addLayer({
        id: TRAVEL_TIME_LAYER_ID,
        type: "line",
        source: TRAVEL_TIME_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "minutes"],
            ...VIRIDIS_STOPS.flatMap((color, i) => [i * rampStep, color]),
          ] as unknown as mapGl.ExpressionSpecification,
          "line-width": 3,
          "line-opacity": 0.85,
        },
      });
    }
  }

  function clearTravelTimeLayers(map: mapGl.MapLibreMap) {
    if (map.getLayer(TRAVEL_TIME_LAYER_ID)) {
      map.removeLayer(TRAVEL_TIME_LAYER_ID);
    }
    if (map.getSource(TRAVEL_TIME_SOURCE_ID)) {
      map.removeSource(TRAVEL_TIME_SOURCE_ID);
    }
  }

  const MEASURE_ROUTE_SOURCE_ID = "measure-route-line";
  const MEASURE_ROUTE_LAYER_ID = "measure-route-line";
  const MEASURE_ROUTE_CASING_ID = "measure-route-line-casing";

  function ensureMeasureRouteLayers(map: mapGl.MapLibreMap) {
    if (!map.getSource(MEASURE_ROUTE_SOURCE_ID)) {
      map.addSource(MEASURE_ROUTE_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    // Solid white casing under the dashes: a bare 4px dashed line vanished
    // against grey buildings once zoomed out, so back it with the same
    // zoom-scaled glow the journey polyline uses.
    if (!map.getLayer(MEASURE_ROUTE_CASING_ID)) {
      map.addLayer({
        id: MEASURE_ROUTE_CASING_ID,
        type: "line",
        source: MEASURE_ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": JOURNEY_CASING_WIDTH,
          "line-opacity": 0.8,
        },
      });
    }

    if (!map.getLayer(MEASURE_ROUTE_LAYER_ID)) {
      // Dashed violet: deliberately unlike the solid casing-backed jeepney
      // red / event maroon / trail green lines and the stock blue OSRM
      // directions polyline — this is a measurement, not a route suggestion.
      map.addLayer({
        id: MEASURE_ROUTE_LAYER_ID,
        type: "line",
        source: MEASURE_ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#7c3aed",
          "line-width": JOURNEY_LINE_WIDTH,
          "line-opacity": 1,
          "line-dasharray": [0.2, 1.6],
        },
      });
    }
  }

  function clearMeasureRouteLayers(map: mapGl.MapLibreMap) {
    for (const id of [MEASURE_ROUTE_LAYER_ID, MEASURE_ROUTE_CASING_ID]) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    if (map.getSource(MEASURE_ROUTE_SOURCE_ID)) {
      map.removeSource(MEASURE_ROUTE_SOURCE_ID);
    }
  }

  const JOURNEY_SOURCE_ID = "directions-journey";
  const JOURNEY_WALK_LAYER_ID = "directions-journey-walk";
  const JOURNEY_WALK_CASING_ID = "directions-journey-walk-casing";
  const JOURNEY_RIDE_LAYER_ID = "directions-journey-ride";
  const JOURNEY_RIDE_CASING_ID = "directions-journey-ride-casing";
  /** Stock MapLibreGlDirections foot routeline (`layers.ts` routelineFoot). */
  const JOURNEY_WALK_COLOR = "#3665ff";
  /**
   * Zoom-scaled widths from maplibre-gl-directions `layersFactory` — the fat
   * translucent casing + thinner core is what made the old OSRM path look
   * like a glow, not a flat stroke.
   */
  const JOURNEY_LINE_WIDTH: mapGl.ExpressionSpecification = [
    "interpolate",
    ["exponential", 1.5],
    ["zoom"],
    0,
    3,
    5,
    3,
    18,
    10,
  ];
  const JOURNEY_CASING_WIDTH: mapGl.ExpressionSpecification = [
    "interpolate",
    ["exponential", 1.5],
    ["zoom"],
    0,
    7,
    5,
    7,
    18,
    23,
  ];

  /**
   * Journey polyline while Get directions is open (#966). Paint matches the
   * stock MapLibreGlDirections foot routeline (casing @ 0.55 under core @
   * 0.85) so walk looks like the pre–multi-modal OSRM path; ride legs use
   * the jeepney route colour with the same widths.
   */
  function ensureJourneyLayers(map: mapGl.MapLibreMap) {
    if (!map.getSource(JOURNEY_SOURCE_ID)) {
      map.addSource(JOURNEY_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer(JOURNEY_RIDE_CASING_ID)) {
      map.addLayer({
        id: JOURNEY_RIDE_CASING_ID,
        type: "line",
        source: JOURNEY_SOURCE_ID,
        filter: ["==", ["get", "kind"], "ride"],
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": JOURNEY_CASING_WIDTH,
          "line-opacity": 0.55,
        },
      });
    }

    if (!map.getLayer(JOURNEY_RIDE_LAYER_ID)) {
      map.addLayer({
        id: JOURNEY_RIDE_LAYER_ID,
        type: "line",
        source: JOURNEY_SOURCE_ID,
        filter: ["==", ["get", "kind"], "ride"],
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": JOURNEY_LINE_WIDTH,
          "line-opacity": 0.85,
        },
      });
    }

    if (!map.getLayer(JOURNEY_WALK_CASING_ID)) {
      map.addLayer({
        id: JOURNEY_WALK_CASING_ID,
        type: "line",
        source: JOURNEY_SOURCE_ID,
        filter: ["==", ["get", "kind"], "walk"],
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": JOURNEY_WALK_COLOR,
          "line-width": JOURNEY_CASING_WIDTH,
          "line-opacity": 0.55,
        },
      });
    }

    if (!map.getLayer(JOURNEY_WALK_LAYER_ID)) {
      map.addLayer({
        id: JOURNEY_WALK_LAYER_ID,
        type: "line",
        source: JOURNEY_SOURCE_ID,
        filter: ["==", ["get", "kind"], "walk"],
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": JOURNEY_WALK_COLOR,
          "line-width": JOURNEY_LINE_WIDTH,
          "line-opacity": 0.85,
        },
      });
    }
  }

  /** Re-assert OSRM-matching paint when layers already exist from an older build. */
  function applyJourneyPaint(map: mapGl.MapLibreMap) {
    for (const id of [JOURNEY_WALK_CASING_ID, JOURNEY_RIDE_CASING_ID]) {
      if (!map.getLayer(id)) continue;
      map.setPaintProperty(id, "line-dasharray", null);
      map.setPaintProperty(id, "line-opacity", 0.55);
      map.setPaintProperty(id, "line-width", JOURNEY_CASING_WIDTH);
      map.setLayoutProperty(id, "line-cap", "butt");
    }
    for (const id of [JOURNEY_WALK_LAYER_ID, JOURNEY_RIDE_LAYER_ID]) {
      if (!map.getLayer(id)) continue;
      map.setPaintProperty(id, "line-dasharray", null);
      map.setPaintProperty(id, "line-opacity", 0.85);
      map.setPaintProperty(id, "line-width", JOURNEY_LINE_WIDTH);
      map.setLayoutProperty(id, "line-cap", "butt");
    }
    if (map.getLayer(JOURNEY_WALK_CASING_ID)) {
      map.setPaintProperty(JOURNEY_WALK_CASING_ID, "line-color", JOURNEY_WALK_COLOR);
    }
    if (map.getLayer(JOURNEY_WALK_LAYER_ID)) {
      map.setPaintProperty(JOURNEY_WALK_LAYER_ID, "line-color", JOURNEY_WALK_COLOR);
    }
  }  function clearJourneyLayers(map: mapGl.MapLibreMap) {
    for (const id of [
      JOURNEY_WALK_LAYER_ID,
      JOURNEY_WALK_CASING_ID,
      JOURNEY_RIDE_LAYER_ID,
      JOURNEY_RIDE_CASING_ID,
    ]) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    if (map.getSource(JOURNEY_SOURCE_ID)) {
      map.removeSource(JOURNEY_SOURCE_ID);
    }
  }
  function ensureEventRouteLayers(map: mapGl.MapLibreMap) {
    if (!map.getSource(EVENT_ROUTE_SOURCE_ID)) {
      map.addSource(EVENT_ROUTE_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer(EVENT_ROUTE_LAYER_CASING_ID)) {
      map.addLayer({
        id: EVENT_ROUTE_LAYER_CASING_ID,
        type: "line",
        source: EVENT_ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 7,
          "line-opacity": 0.9,
        },
      });
    }

    if (!map.getLayer(EVENT_ROUTE_LAYER_ID)) {
      map.addLayer({
        id: EVENT_ROUTE_LAYER_ID,
        type: "line",
        source: EVENT_ROUTE_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#7b1113",
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });
    }
  }

  function clearEventRouteLayers(map: mapGl.MapLibreMap) {
    if (map.getLayer(EVENT_ROUTE_LAYER_ID))
      map.removeLayer(EVENT_ROUTE_LAYER_ID);
    if (map.getLayer(EVENT_ROUTE_LAYER_CASING_ID)) {
      map.removeLayer(EVENT_ROUTE_LAYER_CASING_ID);
    }
    if (map.getSource(EVENT_ROUTE_SOURCE_ID))
      map.removeSource(EVENT_ROUTE_SOURCE_ID);
  }

  function ensureExternalCampusesLayers(map: mapGl.MapLibreMap) {
    if (!map.getSource(EXTERNAL_CAMPUSES_SOURCE_ID)) {
      map.addSource(EXTERNAL_CAMPUSES_SOURCE_ID, {
        type: "geojson",
        data: EXTERNAL_CAMPUSES_GEOJSON,
      });
    }

    if (!map.getLayer(EXTERNAL_CAMPUSES_LAYER_ID)) {
      map.addLayer({
        id: EXTERNAL_CAMPUSES_LAYER_ID,
        type: "fill",
        source: EXTERNAL_CAMPUSES_SOURCE_ID,
        paint: {
          "fill-color": "#4b5563",
          "fill-opacity": 0.15,
          "fill-outline-color": "#4b5563",
        },
      });
    }

    if (!map.getSource(EXTERNAL_CAMPUSES_LABELS_SOURCE_ID)) {
      map.addSource(EXTERNAL_CAMPUSES_LABELS_SOURCE_ID, {
        type: "geojson",
        data: EXTERNAL_CAMPUSES_LABELS,
      });
    }

    if (!map.getLayer(EXTERNAL_CAMPUSES_MARKER_LAYER_ID)) {
      map.addLayer({
        id: EXTERNAL_CAMPUSES_MARKER_LAYER_ID,
        type: "circle",
        source: EXTERNAL_CAMPUSES_LABELS_SOURCE_ID,
        paint: {
          "circle-radius": 7,
          "circle-color": "#7b1113",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
    }

    if (!map.getLayer(EXTERNAL_CAMPUSES_LABELS_LAYER_ID)) {
      map.addLayer({
        id: EXTERNAL_CAMPUSES_LABELS_LAYER_ID,
        type: "symbol",
        source: EXTERNAL_CAMPUSES_LABELS_SOURCE_ID,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#374151",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      });
    }
  }

  function ensureTrailLayers(map: mapGl.MapLibreMap) {
    // Trail line source + casing + line
    if (!map.getSource(MAKILING_TRAIL_SOURCE_ID)) {
      map.addSource(MAKILING_TRAIL_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: MAKILING_TRAIL_LINE,
          },
          properties: {},
        },
      });
    }

    if (!map.getLayer(MAKILING_TRAIL_LAYER_CASING_ID)) {
      map.addLayer({
        id: MAKILING_TRAIL_LAYER_CASING_ID,
        type: "line",
        source: MAKILING_TRAIL_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 7,
          "line-opacity": 0.9,
        },
      });
    }

    if (!map.getLayer(MAKILING_TRAIL_LAYER_ID)) {
      map.addLayer({
        id: MAKILING_TRAIL_LAYER_ID,
        type: "line",
        source: MAKILING_TRAIL_SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": MAKILING_TRAIL_COLOR,
          "line-width": 4,
          "line-opacity": 0.95,
        },
      });
    }

    // Station markers source + circle layer
    if (!map.getSource(MAKILING_TRAIL_STATIONS_SOURCE_ID)) {
      map.addSource(MAKILING_TRAIL_STATIONS_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: MAKILING_TRAIL_STATIONS.map((s) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [s.lon, s.lat],
            },
            properties: {
              station: s.station,
              name: s.name,
              elevation: s.elevationMeters,
            },
          })),
        },
      });
    }

    if (!map.getLayer(MAKILING_TRAIL_STATIONS_LAYER_ID)) {
      map.addLayer({
        id: MAKILING_TRAIL_STATIONS_LAYER_ID,
        type: "circle",
        source: MAKILING_TRAIL_STATIONS_SOURCE_ID,
        paint: {
          "circle-radius": 6,
          "circle-color": MAKILING_TRAIL_COLOR,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-opacity": 0.95,
        },
      });
    }
  }

  function clearTrailLayers(map: mapGl.MapLibreMap) {
    if (map.getLayer(MAKILING_TRAIL_STATIONS_LAYER_ID))
      map.removeLayer(MAKILING_TRAIL_STATIONS_LAYER_ID);
    if (map.getLayer(MAKILING_TRAIL_LAYER_ID))
      map.removeLayer(MAKILING_TRAIL_LAYER_ID);
    if (map.getLayer(MAKILING_TRAIL_LAYER_CASING_ID))
      map.removeLayer(MAKILING_TRAIL_LAYER_CASING_ID);
    if (map.getSource(MAKILING_TRAIL_STATIONS_SOURCE_ID))
      map.removeSource(MAKILING_TRAIL_STATIONS_SOURCE_ID);
    if (map.getSource(MAKILING_TRAIL_SOURCE_ID))
      map.removeSource(MAKILING_TRAIL_SOURCE_ID);
  }

  function buildEventRouteGeometry(
    route: EventData["routes"][number],
  ): LineString | null {
    const coordinates = route.stops
      .filter((stop) => stop.resolvedLon !== null && stop.resolvedLat !== null)
      .map((stop) => [stop.resolvedLon as number, stop.resolvedLat as number]);
    if (coordinates.length < 2) return null;
    return { type: "LineString", coordinates };
  }

  function buildSelectedEventRouteFeatures(
    event: EventData,
  ): FeatureCollection<LineString>["features"] {
    return event.routes.flatMap((route) => {
      const geometry = buildEventRouteGeometry(route);
      if (!geometry) return [];
      return [
        {
          type: "Feature" as const,
          geometry,
          properties: { eventId: event.id, routeId: route.id },
        },
      ];
    });
  }

  function fitMapToRoute(map: mapGl.MapLibreMap, route: JeepneyRoute) {
    if (route.stops.length === 0) return;
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const stop of route.stops) {
      if (stop.lon < minLng) minLng = stop.lon;
      if (stop.lon > maxLng) maxLng = stop.lon;
      if (stop.lat < minLat) minLat = stop.lat;
      if (stop.lat > maxLat) maxLat = stop.lat;
    }
    // rAF: camera moves fire map event handlers synchronously; keep their
    // state writes out of the reactive flush that called us (see stop flyTo
    // effect) or the scheduler can die with effect_update_depth_exceeded.
    requestAnimationFrame(() => {
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          duration: 1200,
          pitch: 30,
        },
      );
    });
  }

  function getEventMapLocations(event: EventData) {
    return event.locations.filter(
      (location) =>
        location.resolvedLon !== null && location.resolvedLat !== null,
    );
  }

  function focusMapOnEvent(map: mapGl.MapLibreMap, event: EventData) {
    const points: [number, number][] = [];
    for (const location of getEventMapLocations(event)) {
      points.push([
        location.resolvedLon as number,
        location.resolvedLat as number,
      ]);
    }
    // Include route geometry so events whose route stops extend beyond their
    // primary locations still fit fully within the viewport.
    for (const route of event.routes) {
      for (const stop of route.stops) {
        if (stop.resolvedLon !== null && stop.resolvedLat !== null) {
          points.push([stop.resolvedLon, stop.resolvedLat]);
        }
      }
    }
    if (points.length === 0) return false;

    if (points.length === 1) {
      map.flyTo({
        center: points[0],
        zoom: 17,
        pitch: 50,
        padding: calculatePadding(md.current),
        duration: 1200,
      });
      return true;
    }

    const bounds = new mapGl.LngLatBounds();
    for (const point of points) {
      bounds.extend(point);
    }
    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      duration: 1000,
      pitch: 30,
      maxZoom: 17,
    });
    return true;
  }

  async function createEventAtMapPoint(coords: EditableCoords) {
    if (!eventPlacementStore.draft || eventPlacementStore.creating) return;

    const draft = eventPlacementStore.draft;
    eventPlacementStore.beginCreate();
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...draft,
          recurrence: "none",
          isActive: true,
          includeInSeo: true,
          locations: [
            {
              anchorType: "custom",
              buildingId: null,
              dormId: null,
              label: "Event marker",
              lat: coords.lat,
              lon: coords.lon,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
          routes: [],
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        event?: EventData;
      };

      if (!res.ok || !data.event) {
        throw new Error(data.error ?? `Create failed (${res.status})`);
      }

      appActions.replaceEvent(data.event);
      queryStore.updateQuery({
        category: "event",
        type: "result",
        value: data.event.title,
        eventSlug: data.event.slug,
      });
      queryStore.inputValue = data.event.title;
      sidePanelStore.expand();
      if (!mapEditStore.enabled) mapEditStore.toggle();
      eventPlacementStore.finishCreate(data.event.id);
      mapStore.mapInstance?.flyTo({
        center: [coords.lon, coords.lat],
        zoom: 17,
        pitch: 50,
        padding: calculatePadding(md.current),
        duration: 800,
      });
      toastStore.show(
        `${data.event.title} created. Drag its marker on the map to refine the location.`,
        "success",
      );
    } catch (error) {
      eventPlacementStore.failCreate();
      toastStore.show(
        error instanceof Error ? error.message : "Failed to create event.",
        "error",
      );
    }
  }

  async function proposeEventAtMapPoint(coords: EditableCoords) {
    if (!eventPlacementStore.draft || eventPlacementStore.creating) return;

    const draft = eventPlacementStore.draft;
    eventPlacementStore.beginCreate();
    try {
      const submitterName = resolveSubmitterName({
        displayName: adminAuthStore.displayName,
        username: adminAuthStore.username,
        draftName: eventPlacementStore.submitterName,
      });
      if (!submitterName) {
        throw new Error("Enter your name before proposing an event.");
      }

      const result = await submitCreateProposal({
        entityType: "create_event",
        patch: {
          ...draft,
          recurrence: "none",
          isActive: true,
          includeInSeo: true,
          locations: [
            {
              anchorType: "custom",
              buildingId: null,
              dormId: null,
              label: "Event marker",
              lat: coords.lat,
              lon: coords.lon,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
          routes: [],
        },
        submitterName,
      });

      if (!result.ok) {
        throw new Error(result.error ?? "Failed to submit event proposal.");
      }

      eventPlacementStore.cancel();
      toastStore.show(
        `Event "${draft.title}" submitted for editor review.`,
        "success",
      );
    } catch (error) {
      eventPlacementStore.failCreate();
      toastStore.show(
        error instanceof Error ? error.message : "Failed to propose event.",
        "error",
      );
    }
  }

  async function placeEventAtMapPoint(coords: EditableCoords) {
    if (eventPlacementStore.proposing || !adminAuthStore.canPublish) {
      await proposeEventAtMapPoint(coords);
      return;
    }
    await createEventAtMapPoint(coords);
  }

  function ensureTerrainRendering(map: mapGl.MapLibreMap) {
    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      map.addSource(TERRAIN_SOURCE_ID, {
        type: "raster-dem",
        url: getTerrainTileJsonUrl(),
        bounds: TERRAIN_SOURCE_BOUNDS,
        maxzoom: 14,
        tileSize: 512,
      });
    }

    if (!map.getLayer(TERRAIN_HILLSHADE_LAYER_ID)) {
      map.addLayer(
        {
          id: TERRAIN_HILLSHADE_LAYER_ID,
          type: "hillshade",
          source: TERRAIN_SOURCE_ID,
          layout: { visibility: "none" },
          paint: {
            "hillshade-accent-color": "rgba(112, 79, 40, 0.28)",
            "hillshade-exaggeration": 0.85,
            "hillshade-highlight-color": "rgba(255, 244, 214, 0.35)",
            "hillshade-illumination-anchor": "viewport",
            "hillshade-illumination-direction": 315,
            "hillshade-shadow-color": "rgba(34, 25, 14, 0.55)",
          },
        },
        map.getLayer(TERRAIN_HILLSHADE_BEFORE_LAYER_ID)
          ? TERRAIN_HILLSHADE_BEFORE_LAYER_ID
          : undefined,
      );
    }
  }

  function setTerrainHillshadeVisible(
    map: mapGl.MapLibreMap,
    visible: boolean,
  ) {
    if (!map.getLayer(TERRAIN_HILLSHADE_LAYER_ID)) return;
    map.setLayoutProperty(
      TERRAIN_HILLSHADE_LAYER_ID,
      "visibility",
      visible ? "visible" : "none",
    );
  }

  function flyToCamera(
    map: mapGl.MapLibreMap,
    camera: typeof CAMPUS_DEFAULT_CAMERA,
  ) {
    map.easeTo({
      center: camera.center,
      zoom: camera.zoom,
      pitch: camera.pitch,
      bearing: camera.bearing,
      duration: 1500,
      padding: calculatePadding(untrack(() => md.current)),
    });
  }

  function disableTerrain(map: mapGl.MapLibreMap) {
    map.setTerrain(null);
    setTerrainHillshadeVisible(map, false);
    syncBuildingLayersForDimension(map, isMap2DPitch(map.getPitch()), false);
  }

  function restoreFlatMapCamera(map: mapGl.MapLibreMap) {
    untrack(() => {
      const category = queryStore.category;
      const type = queryStore.type;
      const value = queryStore.inputValue;

      if (category === "building" && type === "result") {
        if (!loaded) return;
        const currentBuilding = buildings.find(
          (building) => building.buildingName === value,
        );

        if (currentBuilding?.lon && currentBuilding.lat) {
          map.flyTo({
            center: [currentBuilding.lon, currentBuilding.lat],
            zoom: 18,
            pitch: 60,
            padding: calculatePadding(md.current),
            duration: 1500,
          });
        }
      } else if (category === null) {
        flyToCamera(map, CAMPUS_DEFAULT_CAMERA);
        if (directions) directions.clear();
      } else if (category === "room") {
        currentRoom.getRoomByCode(value).then(() => {
          if (
            currentRoom.value?.building?.lat &&
            currentRoom.value.building.lon &&
            !terrainStore.enabled
          ) {
            map.flyTo({
              center: [
                currentRoom.value.building.lon,
                currentRoom.value.building.lat,
              ],
              zoom: 18,
              pitch: 60,
              padding: calculatePadding(md.current),
              duration: 1500,
            });
          }
        });
      } else if (category === "dorm") {
        if (!loaded) return;

        const currentDorm = dorms.find((dorm) => dorm.dormName === value);
        if (currentDorm?.lon && currentDorm.lat) {
          map.flyTo({
            center: [currentDorm.lon, currentDorm.lat],
            zoom: 18,
            pitch: 60,
            padding: calculatePadding(md.current),
            duration: 1500,
          });
        }
      } else if (category === "event") {
        if (!loaded) return;
        const currentEvent = findSelectedEvent(events);
        if (currentEvent) focusMapOnEvent(map, currentEvent);
      } else if (category === "organization") {
        if (!loaded) return;
        mapViewStore.showOrgs = true;
        const currentOrg = organizations.find((org) => org.name === value);
        const position = currentOrg ? organizationPosition(currentOrg) : null;
        if (position) {
          map.flyTo({
            center: [position.lon, position.lat],
            zoom: 18,
            pitch: 60,
            padding: calculatePadding(md.current),
            duration: 1500,
          });
        }
      } else if (category === "place") {
        if (!loaded) return;
        mapViewStore.showPlaces = true;
        const currentPlace = places.find((place) => place.name === value);
        if (currentPlace?.lon != null && currentPlace.lat != null) {
          map.flyTo({
            center: [currentPlace.lon, currentPlace.lat],
            zoom: 18,
            pitch: 60,
            padding: calculatePadding(md.current),
            duration: 1500,
          });
        }
      }
    });
  }

  function failTerrain(map: mapGl.MapLibreMap, message: string) {
    disableTerrain(map);
    terrainStore.markUnavailable(message);
  }

  function sourceErrorMatchesTerrain(event: mapGl.ErrorEvent) {
    const sourceId = (event as mapGl.ErrorEvent & { sourceId?: string })
      .sourceId;
    const message = event.error?.message ?? "";
    return (
      sourceId === TERRAIN_SOURCE_ID || message.includes(TERRAIN_SOURCE_ID)
    );
  }

  let zoomLevel = $state(0);
  // Progressive disclosure, Google Maps style: low-priority POI pins (orgs,
  // offices, landmarks, establishments) only appear once zoomed in enough.
  // Buildings and dorms always show. Active (searched) and sponsored pins
  // bypass the gate so deep links and paid placements never vanish.
  const POI_MIN_ZOOM = 15.5;
  const poiPinsVisible = $derived(zoomLevel >= POI_MIN_ZOOM);
  $effect(() => {
    mapViewStore.poiPinsZoomVisible = poiPinsVisible;
  });
  const SIDEPANEL_WIDTH = 25.75 * 16;
  const md = new MediaQuery("max-width:48rem");
  let editChromeEl = $state<HTMLElement | null>(null);
  const editChromeActive = $derived(
    eventPlacementStore.active ||
      additionProposalStore.pinPickActive ||
      mapProposalStore.enabled ||
      (adminAuthStore.canPublish && mapEditStore.enabled),
  );

  $effect(() => {
    const root = editChromeEl?.closest(".app-layout") as HTMLElement | null;
    if (!editChromeActive) {
      root?.style.setProperty("--edit-bar-height", "0px");
      return;
    }
    const el = editChromeEl;
    if (!el) return;
    return observeBlockHeight(el, "--edit-bar-height", {
      shouldSkip: () => !editChromeActive,
      skipValue: "0px",
    });
  });

  const calculatePadding = (md: boolean): mapGl.PaddingOptions => {
    if (md) {
      return {
        bottom: window.innerWidth / 2,
        left: 0,
      };
    }
    return {
      left: SIDEPANEL_WIDTH,
      bottom: 0,
    };
  };

  function handleZoom() {
    if (!mapStore.mapInstance) return;
    zoomLevel = mapStore.mapInstance.getZoom();
  }

  function buildingEditKey(id: number) {
    return `building:${id}`;
  }

  function dormEditKey(id: number) {
    return `dorm:${id}`;
  }

  function eventLocationEditKey(id: number) {
    return `event:${id}:location`;
  }

  function getEditablePosition(
    key: string,
    fallback: EditableVersionedPosition,
  ): EditableVersionedPosition {
    return positionOverrides[key] ?? fallback;
  }

  function getLoadedVersion(version: number | undefined): number {
    return Number.isInteger(version) ? version : 1;
  }

  function isMapEditEnabled() {
    return adminAuthStore.canPublish && mapEditStore.enabled;
  }

  function canDragPin(key: string) {
    if (isMapEditEnabled()) return true;
    return mapProposalStore.allowsKey(key);
  }

  function isMapPinSuggestMode() {
    return mapProposalStore.enabled;
  }

  function handleEditablePinEnter(key: string) {
    if (!canDragPin(key)) return;
    hoveredEditKey = key;
  }

  function handleEditablePinLeave(key: string) {
    if (!canDragPin(key)) return;
    if (hoveredEditKey === key) hoveredEditKey = null;
  }

  function shouldShowEntityHoverPreview() {
    return (
      !mapEditStore.enabled &&
      !mapProposalStore.enabled &&
      !eventPlacementStore.active
    );
  }

  function handlePinPointerEnter(
    preview: EntityHoverPreview,
    pointer: PointerEvent,
    editKey?: string,
  ) {
    if (editKey !== undefined) handleEditablePinEnter(editKey);
    if (!shouldShowEntityHoverPreview()) return;
    if (editKey !== undefined && canDragPin(editKey)) return;
    entityHoverPreviewStore.show(preview, {
      x: pointer.clientX,
      y: pointer.clientY,
    });
  }

  function handlePinPointerLeave(editKey?: string) {
    if (editKey !== undefined) handleEditablePinLeave(editKey);
    if (!shouldShowEntityHoverPreview()) return;
    if (editKey !== undefined && canDragPin(editKey)) return;
    entityHoverPreviewStore.scheduleHide();
  }

  function handleBuildingPinPointerEnter(
    building: BuildingData,
    editKey: string,
    event: PointerEvent,
  ) {
    handlePinPointerEnter(buildingPreviewFromRow(building), event, editKey);
  }

  function handleBuildingPinPointerLeave(editKey: string) {
    handlePinPointerLeave(editKey);
  }

  function handleDormPinPointerEnter(
    dorm: DormData,
    editKey: string,
    event: PointerEvent,
  ) {
    handlePinPointerEnter(dormPreviewFromRow(dorm), event, editKey);
  }

  function handleDormPinPointerLeave(editKey: string) {
    handlePinPointerLeave(editKey);
  }

  function handleEventPinPointerEnter(event: EventData, pointer: PointerEvent) {
    handlePinPointerEnter(eventPreviewFromRow(event), pointer);
  }

  function handleEventPinPointerLeave() {
    handlePinPointerLeave();
  }

  function handleOrganizationPinPointerEnter(
    organization: OrgData,
    pointer: PointerEvent,
  ) {
    handlePinPointerEnter(organizationPreviewFromRow(organization), pointer);
  }

  function handlePlacePinPointerEnter(place: PlaceData, pointer: PointerEvent) {
    handlePinPointerEnter(placePreviewFromRow(place), pointer);
  }

  function handleDetailPinPointerLeave() {
    handlePinPointerLeave();
  }

  function beginMarkerDrag(key: string) {
    if (!canDragPin(key)) return;
    selectedEditKey = key;
    failedEditKey = null;
  }

  function markSaved(key: string) {
    savedEditKey = key;
    setTimeout(() => {
      if (savedEditKey === key) savedEditKey = null;
    }, 1800);
  }

  function setEditStatus(message: string) {
    editStatusMessage = message;
    setTimeout(() => {
      if (editStatusMessage === message) editStatusMessage = null;
    }, 3500);
  }

  function setLocalPosition(
    type: EditableEntityType,
    id: number,
    coords: EditableVersionedPosition,
  ) {
    const key = type === "building" ? buildingEditKey(id) : dormEditKey(id);
    positionOverrides = { ...positionOverrides, [key]: coords };

    if (type === "building") {
      const building = buildings.find((b) => b.id === id);
      if (building) {
        building.lat = coords.lat;
        building.lon = coords.lon;
        building.version = coords.version;
      }
      return;
    }

    const dorm = dorms.find((d) => d.id === id);
    if (dorm) {
      dorm.lat = coords.lat;
      dorm.lon = coords.lon;
      dorm.version = coords.version;
    }
  }

  function clearEventLocationOverride(eventId: number) {
    const key = eventLocationEditKey(eventId);
    if (!(key in eventLocationOverrides)) return;
    const next = { ...eventLocationOverrides };
    delete next[key];
    eventLocationOverrides = next;
  }

  function setLocalEvent(updated: EventData) {
    appActions.replaceEvent(updated);

    const key = eventLocationEditKey(updated.id);
    const editable = getEditableEventLocation(updated);
    if (editable && isAnchoredEventLocation(editable)) {
      clearEventLocationOverride(updated.id);
      return;
    }

    const coords = editable ? getResolvedEventLocationCoords(editable) : null;
    if (coords) {
      eventLocationOverrides = { ...eventLocationOverrides, [key]: coords };
    } else {
      clearEventLocationOverride(updated.id);
    }
  }

  function getResolvedEventLocationCoords(
    location: EventData["locations"][number],
  ): EditableCoords | null {
    if (location.resolvedLat === null || location.resolvedLon === null) {
      return null;
    }
    return {
      lat: location.resolvedLat,
      lon: location.resolvedLon,
    };
  }

  function serializeEventLocation(
    location: EventData["locations"][number],
    overrides: Partial<EventData["locations"][number]> = {},
  ): EventLocationWriteValue {
    return {
      id: location.id,
      anchorType: overrides.anchorType ?? location.anchorType,
      buildingId:
        overrides.buildingId !== undefined
          ? overrides.buildingId
          : location.buildingId,
      dormId:
        overrides.dormId !== undefined ? overrides.dormId : location.dormId,
      label: overrides.label ?? location.label,
      lat: overrides.lat !== undefined ? overrides.lat : location.lat,
      lon: overrides.lon !== undefined ? overrides.lon : location.lon,
      highlightPriority:
        overrides.highlightPriority ?? location.highlightPriority,
      sortOrder: overrides.sortOrder ?? location.sortOrder,
      isPrimary: overrides.isPrimary ?? location.isPrimary,
    };
  }

  function buildEventLocationDragUpdate(
    event: EventData,
    targetLocation: EventData["locations"][number],
    coords: EditableCoords,
  ): EventLocationWriteValue[] {
    return event.locations.map((location) =>
      location.id === targetLocation.id
        ? serializeEventLocation(location, {
            anchorType: "custom",
            buildingId: null,
            dormId: null,
            label: location.label || "Event marker",
            lat: coords.lat,
            lon: coords.lon,
            isPrimary: true,
          })
        : serializeEventLocation(location, { isPrimary: false }),
    );
  }

  function recordMove(move: EditMove) {
    const next = recordMapMove(undoStack, move);
    undoStack = next.undoStack;
    redoStack = next.redoStack;
  }

  async function saveBuildingPosition(
    id: number,
    name: string,
    previous: EditableVersionedPosition,
    current: { lat: number; lon: number },
    version: number,
  ): Promise<void> {
    const key = buildingEditKey(id);
    savingEditKey = key;
    failedEditKey = null;

    try {
      const updated = await patchPosition("building", id, current, version);
      setLocalPosition("building", id, updated);
      recordMove({
        kind: "entity",
        entityType: "building",
        id,
        name,
        key,
        previous,
        current,
        version: updated.version,
      });
      markSaved(key);
      setEditStatus(`${name} saved. You can undo this move.`);
    } catch (error) {
      failedEditKey = key;
      if (error instanceof ClientEditConflictError) {
        if (error.latest) {
          setLocalPosition("building", id, error.latest);
        } else {
          setLocalPosition("building", id, previous);
        }
        toastStore.show(editErrorMessage(name, error.message, error), "error");
        return;
      }
      setLocalPosition("building", id, previous);
      toastStore.show(
        editErrorMessage(name, "Failed to save building position.", error),
        "error",
      );
    } finally {
      if (savingEditKey === key) savingEditKey = null;
      if (selectedEditKey === key) selectedEditKey = null;
    }
  }

  async function saveDormPosition(
    id: number,
    name: string,
    previous: EditableVersionedPosition,
    current: { lat: number; lon: number },
    version: number,
  ): Promise<void> {
    const key = dormEditKey(id);
    savingEditKey = key;
    failedEditKey = null;

    try {
      const updated = await patchPosition("dorm", id, current, version);
      setLocalPosition("dorm", id, updated);
      recordMove({
        kind: "entity",
        entityType: "dorm",
        id,
        name,
        key,
        previous,
        current,
        version: updated.version,
      });
      markSaved(key);
      setEditStatus(`${name} saved. You can undo this move.`);
    } catch (error) {
      failedEditKey = key;
      if (error instanceof ClientEditConflictError) {
        if (error.latest) {
          setLocalPosition("dorm", id, error.latest);
        } else {
          setLocalPosition("dorm", id, previous);
        }
        toastStore.show(editErrorMessage(name, error.message, error), "error");
        return;
      }
      setLocalPosition("dorm", id, previous);
      toastStore.show(
        editErrorMessage(name, "Failed to save dorm position.", error),
        "error",
      );
    } finally {
      if (savingEditKey === key) savingEditKey = null;
      if (selectedEditKey === key) selectedEditKey = null;
    }
  }

  async function saveEventLocationPosition(
    event: EventData,
    location: EventData["locations"][number],
    current: EditableCoords,
  ): Promise<void> {
    const key = eventLocationEditKey(event.id);
    const previous = getResolvedEventLocationCoords(location);
    if (!previous) return;
    const previousEvent = {
      ...event,
      locations: event.locations.map((eventLocation) => ({
        ...eventLocation,
      })),
    };
    const previousLocations = event.locations.map((eventLocation) =>
      serializeEventLocation(eventLocation),
    );
    const currentLocations = buildEventLocationDragUpdate(
      event,
      location,
      current,
    );
    savingEditKey = key;
    failedEditKey = null;

    try {
      const updated = await patchEventLocations(event, currentLocations);
      setLocalEvent(updated);
      recordMove({
        kind: "eventLocation",
        eventId: event.id,
        locationId: location.id,
        name: updated.title,
        key,
        previous,
        current,
        previousLocations,
        currentLocations,
        version: updated.version,
      });
      markSaved(key);
      setEditStatus(`${updated.title} location saved. You can undo this move.`);
    } catch (error) {
      failedEditKey = key;
      if (error instanceof ClientEventConflictError) {
        if (error.latest) setLocalEvent(error.latest);
        else setLocalEvent(previousEvent);
        toastStore.show(
          editErrorMessage(event.title, error.message, error),
          "error",
        );
        return;
      }
      setLocalEvent(previousEvent);
      toastStore.show(
        editErrorMessage(event.title, "Failed to save event location.", error),
        "error",
      );
    } finally {
      if (savingEditKey === key) savingEditKey = null;
      if (selectedEditKey === key) selectedEditKey = null;
    }
  }

  async function submitSuggestedPinMove(input: {
    key: string;
    pinType: "building" | "dorm" | "event";
    entityId: number;
    entityLabel: string;
    baseVersion: number;
    lat: number;
    lon: number;
    previous: EditableVersionedPosition | EditableCoords;
    rollback: () => void;
    eventLocations?: unknown[];
  }) {
    savingEditKey = input.key;
    failedEditKey = null;
    try {
      const result = await submitPinPositionProposal({
        pinType: input.pinType,
        entityId: input.entityId,
        baseVersion: input.baseVersion,
        lat: input.lat,
        lon: input.lon,
        entityLabel: input.entityLabel,
        submitterName: resolveSubmitterName({
          displayName: adminAuthStore.displayName,
          username: adminAuthStore.username,
          draftName: mapProposalStore.submitterName,
        }),
        proposalId: mapProposalStore.proposalId,
        eventLocations: input.eventLocations,
      });
      if (!result.ok) {
        failedEditKey = input.key;
        input.rollback();
        toastStore.show(
          result.error ??
            `${input.entityLabel} pin suggestion could not be submitted.`,
          "error",
        );
        return;
      }
      markSaved(input.key);
      mapProposalStore.disable();
      toastStore.show(
        `Pin move for ${input.entityLabel} submitted for review.`,
        "success",
      );
    } finally {
      if (savingEditKey === input.key) savingEditKey = null;
      if (selectedEditKey === input.key) selectedEditKey = null;
    }
  }

  async function handleBuildingDragEnd(
    e: { marker: mapGl.Marker },
    id: number,
    name: string,
    previous: EditableVersionedPosition,
  ) {
    const lngLat = e.marker.getLngLat();
    const coords = { lat: lngLat.lat, lon: lngLat.lng };
    const key = buildingEditKey(id);
    if (mapProposalStore.allowsKey(key)) {
      await submitSuggestedPinMove({
        key,
        pinType: "building",
        entityId: id,
        entityLabel: name,
        baseVersion: previous.version,
        lat: coords.lat,
        lon: coords.lon,
        previous,
        rollback: () => setLocalPosition("building", id, previous),
      });
      return;
    }
    if (!isMapEditEnabled()) return;
    await saveBuildingPosition(id, name, previous, coords, previous.version);
  }

  async function handleDormDragEnd(
    e: { marker: mapGl.Marker },
    id: number,
    name: string,
    previous: EditableVersionedPosition,
  ) {
    const lngLat = e.marker.getLngLat();
    const coords = { lat: lngLat.lat, lon: lngLat.lng };
    const key = dormEditKey(id);
    if (mapProposalStore.allowsKey(key)) {
      await submitSuggestedPinMove({
        key,
        pinType: "dorm",
        entityId: id,
        entityLabel: name,
        baseVersion: previous.version,
        lat: coords.lat,
        lon: coords.lon,
        previous,
        rollback: () => setLocalPosition("dorm", id, previous),
      });
      return;
    }
    if (!isMapEditEnabled()) return;
    await saveDormPosition(id, name, previous, coords, previous.version);
  }

  async function handleEventLocationDragEnd(
    e: { marker: mapGl.Marker },
    event: EventData,
    location: EventData["locations"][number],
  ) {
    const lngLat = e.marker.getLngLat();
    const coords = { lat: lngLat.lat, lon: lngLat.lng };
    const key = eventLocationEditKey(event.id);
    if (mapProposalStore.allowsKey(key)) {
      const previous = getResolvedEventLocationCoords(location);
      await submitSuggestedPinMove({
        key,
        pinType: "event",
        entityId: event.id,
        entityLabel: event.title,
        baseVersion: event.version,
        lat: coords.lat,
        lon: coords.lon,
        previous: previous ?? coords,
        rollback: () => {
          if (previous) {
            eventLocationOverrides = {
              ...eventLocationOverrides,
              [key]: previous,
            };
          } else {
            clearEventLocationOverride(event.id);
          }
        },
        eventLocations: buildEventLocationDragUpdate(event, location, coords),
      });
      return;
    }
    if (!isMapEditEnabled()) return;
    await saveEventLocationPosition(event, location, coords);
  }

  async function applyRecordedMove(
    move: EditMove,
    direction: "undo" | "redo",
  ): Promise<number> {
    if (move.kind === "entity") {
      const updated = await patchPosition(
        move.entityType,
        move.id,
        direction === "undo" ? move.previous : move.current,
        move.version,
      );
      setLocalPosition(move.entityType, move.id, updated);
      return updated.version;
    }

    const event = events.find((event) => event.id === move.eventId);
    if (!event) throw new Error(`${move.name} is no longer loaded.`);

    const updated = await patchEventLocations(
      event,
      direction === "undo" ? move.previousLocations : move.currentLocations,
      move.version,
    );
    setLocalEvent(updated);
    return updated.version;
  }

  function handleRecordedMoveError(
    move: EditMove,
    error: unknown,
    fallback: string,
  ) {
    failedEditKey = move.key;
    if (move.kind === "entity" && error instanceof ClientEditConflictError) {
      if (error.latest) {
        setLocalPosition(move.entityType, move.id, error.latest);
      }
      toastStore.show(error.message, "error");
      return;
    }

    if (
      move.kind === "eventLocation" &&
      error instanceof ClientEventConflictError
    ) {
      if (error.latest) setLocalEvent(error.latest);
      toastStore.show(error.message, "error");
      return;
    }

    toastStore.show(error instanceof Error ? error.message : fallback, "error");
  }

  async function undoLastMove() {
    if (!undoMove || !isMapEditEnabled()) return;

    const move = undoMove;
    undoingEditKey = move.key;
    savingEditKey = move.key;
    failedEditKey = null;

    try {
      const version = await applyRecordedMove(move, "undo");
      markSaved(move.key);
      setEditStatus(`Undid move for ${move.name}.`);
      const next = completeMapMoveUndo(undoStack, redoStack, move, version);
      undoStack = next.undoStack;
      redoStack = next.redoStack;
    } catch (error) {
      handleRecordedMoveError(move, error, "Failed to undo last move.");
    } finally {
      if (savingEditKey === move.key) savingEditKey = null;
      if (undoingEditKey === move.key) undoingEditKey = null;
    }
  }

  async function redoMoveBranch() {
    if (!redoMove || !isMapEditEnabled()) return;

    const move = redoMove;
    undoingEditKey = move.key;
    savingEditKey = move.key;
    failedEditKey = null;

    try {
      const version = await applyRecordedMove(move, "redo");
      markSaved(move.key);
      setEditStatus(`Redid move for ${move.name}.`);
      const next = completeMapMoveRedo(undoStack, redoStack, move, version);
      undoStack = next.undoStack;
      redoStack = next.redoStack;
    } catch (error) {
      handleRecordedMoveError(move, error, "Failed to redo move.");
    } finally {
      if (savingEditKey === move.key) savingEditKey = null;
      if (undoingEditKey === move.key) undoingEditKey = null;
    }
  }

  function handleMapEditKeydown(e: KeyboardEvent) {
    if (!isMapEditEnabled()) return;
    const action = getMapEditShortcutAction(e);
    if (!action) return;

    e.preventDefault();
    if (action === "undo") undoLastMove();
    else redoMoveBranch();
  }

  $effect(() => {
    if (typeof navigator === "undefined") return;
    undoShortcutLabel = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
      ? "Cmd+Z"
      : "Ctrl+Z";
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    if (!map) return;

    let cancelled = false;
    const applyPalette = () => {
      if (!cancelled) applyBasemapPalette(map);
    };
    if (map.isStyleLoaded()) {
      applyPalette();
    } else {
      map.once("load", applyPalette);
    }
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    const satellite = mapViewStore.satellite;
    const historicalTileUrl = mapViewStore.waybackSnapshot?.tileUrl;
    if (!map) return;

    let cancelled = false;
    const applySatellite = () => {
      if (!cancelled) syncSatelliteLayer(map, satellite, historicalTileUrl);
    };
    if (map.isStyleLoaded()) {
      applySatellite();
    } else {
      map.once("load", applySatellite);
    }
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    if (mapStore.mapInstance) {
      const map = mapStore.mapInstance;
      const handleMapError = (event: mapGl.ErrorEvent) => {
        if (!terrainStore.enabled || !sourceErrorMatchesTerrain(event)) return;
        failTerrain(map, TERRAIN_TILE_FAILURE_MESSAGE);
      };
      // Sync once on bind — zoomLevel starts at 0, and pin/label zoom gates
      // must reflect the real camera before the first zoom event fires.
      handleZoom();
      map.on("zoom", handleZoom);
      map.on("error", handleMapError);
      return () => {
        map.off("zoom", handleZoom);
        map.off("error", handleMapError);
      };
    }
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    const enabled = terrainStore.enabled;
    const exaggeration = terrainStore.exaggeration;
    if (!map) return;

    let cancelled = false;
    const apply = () => {
      if (cancelled) return;

      if (!enabled) {
        const shouldRestoreFlatCamera = terrainModeWasEnabled;
        disableTerrain(map);
        terrainModeWasEnabled = false;
        if (shouldRestoreFlatCamera) restoreFlatMapCamera(map);
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        failTerrain(map, TERRAIN_UNAVAILABLE_OFFLINE_MESSAGE);
        return;
      }

      try {
        terrainStore.markLoading();
        ensureTerrainRendering(map);
        map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration });
        setTerrainHillshadeVisible(map, true);
        syncBuildingLayersForDimension(map, isMap2DPitch(map.getPitch()), true);
        if (!terrainModeWasEnabled) {
          flyToCamera(map, TERRAIN_CAMERA);
        }
        terrainModeWasEnabled = true;
        terrainStore.markActive();
      } catch (error) {
        console.warn("Terrain setup failed", error);
        failTerrain(map, TERRAIN_TILE_FAILURE_MESSAGE);
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("load", apply);
    }

    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    const terrainEnabled = terrainStore.enabled;
    if (!map) return;

    let cancelled = false;
    const applyDimensionLayers = () => {
      if (cancelled) return;
      syncBuildingLayersForDimension(
        map,
        isMap2DPitch(map.getPitch()),
        terrainEnabled,
      );
    };

    if (map.isStyleLoaded()) {
      applyDimensionLayers();
    } else {
      map.once("load", applyDimensionLayers);
    }

    map.on("pitch", applyDimensionLayers);
    map.on("moveend", applyDimensionLayers);

    return () => {
      cancelled = true;
      map.off("pitch", applyDimensionLayers);
      map.off("moveend", applyDimensionLayers);
    };
  });

  // svelte-maplibre only passes maxBounds at map construction; keep the live
  // instance in sync when bounds constants change (HMR) or terrain toggles.
  $effect(() => {
    const map = mapStore.mapInstance;
    const terrainEnabled = terrainStore.enabled;
    if (!map) return;

    const bounds = terrainEnabled
      ? TERRAIN_MAX_BOUNDS
      : CAMPUS_MAX_BOUNDS;

    const applyBounds = () => {
      map.setMaxBounds(bounds);
    };

    if (map.isStyleLoaded()) {
      applyBounds();
    } else {
      map.once("load", applyBounds);
    }
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    const resetNonce = terrainStore.resetNonce;
    if (!map || !terrainStore.enabled || resetNonce === 0) return;

    flyToCamera(map, TERRAIN_CAMERA);
  });

  $effect(() => {
    if (mapStore.mapInstance && !directions) {
      const initDirections = () => {
        if (!directions && mapStore.mapInstance) {
          directions = new MapLibreGlDirections(mapStore.mapInstance, {
            api: "https://routing.openstreetmap.de/routed-foot/route/v1",
            profile: "foot",
          });
          // Walking totals for the routed day (#839): the OSRM response the
          // map already fetched carries per-leg distance/duration.
          directions.on("fetchroutesend", (event) => {
            const legs = event.data?.directions?.routes?.[0]?.legs;
            scheduleRouteStore.setRouteTotals(legs ? sumRouteLegs(legs) : null);
          });
        }
      };

      if (mapStore.mapInstance.isStyleLoaded()) {
        initDirections();
      } else {
        mapStore.mapInstance.once("load", initDirections);
      }
    }
  });

  /**
   * Follow camera for navigation (#966): a tilted, heading-up view locked to
   * the rider, like GMaps navigation. A manual pan releases the lock rather
   * than fighting the user for the camera; the bar's re-centre button takes
   * it back.
   */
  const NAV_PITCH = 60;
  const NAV_ZOOM = 18;
  /** Plain let: edge detector for nav exit; must not be $state or it loops. */
  let wasNavigating = false;

  $effect(() => {
    const map = mapStore.mapInstance;
    if (!map || !directionsStore.navigating) return;

    const onUserPan = (event: { originalEvent?: unknown }) => {
      // Only a real gesture releases the lock; our own easeTo has no
      // originalEvent, so the camera does not fight itself.
      if (event.originalEvent) directionsStore.releaseCamera();
    };
    map.on("dragstart", onUserPan);
    map.on("rotatestart", onUserPan);
    map.on("zoomstart", onUserPan);
    return () => {
      map.off("dragstart", onUserPan);
      map.off("rotatestart", onUserPan);
      map.off("zoomstart", onUserPan);
    };
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    const coords = locationStore.coords;
    if (
      !map ||
      !directionsStore.navigating ||
      !directionsStore.cameraFollowing ||
      !coords
    ) {
      return;
    }

    // rAF: easeTo fires zoom/move handlers sync; keep those state writes out
    // of this reactive flush (same guard as jeepney stop flyTo).
    const bearing = locationStore.bearing ?? map.getBearing();
    const frame = requestAnimationFrame(() => {
      map.easeTo({
        center: coords,
        zoom: NAV_ZOOM,
        pitch: NAV_PITCH,
        // Hold the current bearing when the device gives no heading, rather
        // than snapping north-up mid-walk.
        bearing,
        duration: 900,
        essential: true,
      });
    });
    return () => cancelAnimationFrame(frame);
  });

  /**
   * After follow-mode ends, flatten north-up. Must NOT run on every boot:
   * campus defaultCamera is pitched (pitch 60), and calling easeTo from this
   * effect while !navigating re-entered via zoom handlers →
   * effect_update_depth_exceeded (blank crash card).
   */
  $effect(() => {
    const map = mapStore.mapInstance;
    const navigating = directionsStore.navigating;
    const leavingNav = wasNavigating && !navigating;
    wasNavigating = navigating;

    if (!map || !leavingNav) return;
    if (untrack(() => terrainStore.enabled)) return; // terrain owns the camera

    const frame = requestAnimationFrame(() => {
      map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
    });
    return () => cancelAnimationFrame(frame);
  });

  /**
   * Draw the selected multi-modal journey (#966) while the directions modal
   * (or follow mode) is open. Same readiness gate as jeepney routes:
   * isStyleLoaded() is false during repaints and "load" fires once, so those
   * gates deadlock and the polyline never appears.
   */
  $effect(() => {
    const map = mapStore.mapInstance;
    if (!map) return;

    // Track the fields the selected getter reads so replan/select re-draws.
    void directionsStore.journeys;
    void directionsStore.selectedId;
    const journey = directionsStore.selected;

    if (!journey || !directionsStore.active) {
      // Clear immediately — never queue clears on styledata (wipes a later draw).
      try {
        clearJourneyLayers(map);
      } catch {
        // Style not ready; nothing drawn yet.
      }
      return;
    }

    const draw = () => {
      ensureJourneyLayers(map);
      applyJourneyPaint(map);
      const source = map.getSource(JOURNEY_SOURCE_ID) as
        | mapGl.GeoJSONSource
        | undefined;
      source?.setData({
        type: "FeatureCollection",
        features: journey.legs
          .filter((leg) => leg.coordinates.length >= 2)
          .map((leg) => ({
            type: "Feature" as const,
            geometry: {
              type: "LineString" as const,
              coordinates: leg.coordinates,
            },
            properties: {
              kind: leg.kind,
              color: leg.kind === "ride" ? leg.color : JOURNEY_WALK_COLOR,
            },
          })),
      });
    };

    const tryDraw = () => {
      try {
        draw();
        return true;
      } catch (error) {
        console.warn("journey draw failed; retrying on styledata", error);
        return false;
      }
    };

    if (tryDraw()) return;
    const onStyleData = () => {
      if (tryDraw()) map.off("styledata", onStyleData);
    };
    map.on("styledata", onStyleData);
    return () => {
      map.off("styledata", onStyleData);
    };
  });

  $effect(() => {
    if (!directions) return;

    // Multi-modal Get directions owns the drawn journey; keep OSRM clear while
    // that session is open. Schedule-day routes still use routeWaypoints.
    // Do not revive OSRM from locationStore.destination — that leftover used
    // to redraw the foot polyline after the directions modal closed (#966).
    if (directionsStore.active) {
      directions.clear();
      return;
    }

    const waypoints = locationStore.routeWaypoints;
    if (waypoints && waypoints.length >= 2) {
      directions.setWaypoints(waypoints);
      const map = mapStore.mapInstance;
      if (map) {
        const bounds = new mapGl.LngLatBounds();
        for (const point of waypoints) {
          bounds.extend(point);
        }
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          duration: 1200,
          maxZoom: 18,
        });
      }
    } else {
      directions.clear();
    }
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    const index = scheduleRouteStore.focusedStopIndex;
    const stop =
      index === null ? null : (scheduleRouteStore.dayStops[index] ?? null);
    if (!map || !stop?.coords) return;

    map.easeTo({
      center: stop.coords,
      zoom: Math.max(map.getZoom(), 17),
      duration: 650,
    });
  });

  $effect(() => {
    if (!adminAuthStore.canPublish && mapEditStore.enabled) {
      mapEditStore.close();
    }
    if (!mapEditStore.enabled) {
      hoveredEditKey = null;
      selectedEditKey = null;
    }
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    if (!map || !additionProposalStore.pinPickActive) return;

    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    canvas.style.cursor = "crosshair";
    const handlePinPick = (event: mapGl.MapMouseEvent) => {
      additionProposalStore.deliverMapPin(event.lngLat.lat, event.lngLat.lng);
    };

    map.on("click", handlePinPick);
    return () => {
      map.off("click", handlePinPick);
      if (canvas.style.cursor === "crosshair") {
        canvas.style.cursor = previousCursor;
      }
    };
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    const pin = additionProposalStore.draftPin;
    if (!map || !pin) return;

    // Defer the camera move out of the reactive flush: easeTo fires zoom/move
    // handlers synchronously, and their state writes inside this flush can
    // chain into effect_update_depth_exceeded, which kills the whole Svelte
    // scheduler (app looks frozen, hover still works). Same guard as the
    // jeepney stop-focus flyTo effect below.
    const padding = calculatePadding(untrack(() => md.current));
    const frame = requestAnimationFrame(() => {
      map.easeTo({
        center: [pin.lon, pin.lat],
        zoom: Math.max(map.getZoom(), 17),
        duration: 650,
        padding,
      });
    });
    return () => cancelAnimationFrame(frame);
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    if (!map || !eventPlacementStore.active) return;

    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    canvas.style.cursor = "crosshair";
    const handlePlacementClick = (event: mapGl.MapMouseEvent) => {
      void placeEventAtMapPoint({
        lat: event.lngLat.lat,
        lon: event.lngLat.lng,
      });
    };

    map.on("click", handlePlacementClick);
    return () => {
      map.off("click", handlePlacementClick);
      if (canvas.style.cursor === "crosshair") {
        canvas.style.cursor = previousCursor;
      }
    };
  });

  // #847: travel-time isochrone — while active, taps pick the origin point.
  $effect(() => {
    const map = mapStore.mapInstance;
    if (!map || !travelTimeStore.active) return;

    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    canvas.style.cursor = "crosshair";
    const handleTravelTimeClick = (event: mapGl.MapMouseEvent) => {
      travelTimeStore.setOrigin(event.lngLat.lat, event.lngLat.lng);
    };

    map.on("click", handleTravelTimeClick);
    return () => {
      map.off("click", handleTravelTimeClick);
      if (canvas.style.cursor === "crosshair") {
        canvas.style.cursor = previousCursor;
      }
    };
  });

  // #847: snap the tapped origin to the walk graph, run single-source
  // Dijkstra, and paint every edge by walking minutes. The graph JSON is a
  // lazy chunk loaded on first use.
  $effect(() => {
    const map = mapStore.mapInstance;
    const origin = travelTimeStore.active ? travelTimeStore.origin : null;
    if (!map) return;

    if (!origin) {
      // Clear immediately — never queue clears on "load"/"styledata" (see the
      // jeepney route effect below for the prod-only bug this avoids).
      try {
        clearTravelTimeLayers(map);
      } catch {
        // Style not ready yet, so nothing was drawn.
      }
      return;
    }

    let cancelled = false;
    travelTimeStore.status = "loading";
    loadTravelGraph()
      .then((graph) => {
        if (cancelled) return;
        const sourceNode = nearestNodeIndex(graph, origin.lat, origin.lng);
        const { seconds } = dijkstra(graph, sourceNode, "walk");
        const data = isochroneFeatures(graph, seconds);
        const tryDraw = () => {
          try {
            ensureTravelTimeLayers(map);
            const source = map.getSource(TRAVEL_TIME_SOURCE_ID) as
              | mapGl.GeoJSONSource
              | undefined;
            source?.setData(data);
            return true;
          } catch {
            return false;
          }
        };
        if (!tryDraw()) {
          const onStyleData = () => {
            if (cancelled || tryDraw()) map.off("styledata", onStyleData);
          };
          map.on("styledata", onStyleData);
        }
        travelTimeStore.status = "ready";
      })
      .catch((error) => {
        console.warn("travel-time graph load failed", error);
        if (!cancelled) travelTimeStore.status = "error";
      });
    return () => {
      cancelled = true;
    };
  });

  // #848: measure route — while active, taps drop waypoints.
  $effect(() => {
    const map = mapStore.mapInstance;
    if (!map || !measureRouteStore.active) return;

    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    canvas.style.cursor = "crosshair";
    const handleMeasureClick = (event: mapGl.MapMouseEvent) => {
      measureRouteStore.addWaypoint(event.lngLat.lat, event.lngLat.lng);
    };

    map.on("click", handleMeasureClick);
    return () => {
      map.off("click", handleMeasureClick);
      if (canvas.style.cursor === "crosshair") {
        canvas.style.cursor = previousCursor;
      }
    };
  });

  // #848: snap waypoints to the walk graph, compute per-leg shortest paths
  // for every mode (pill minutes), and draw the selected mode's geometry.
  $effect(() => {
    const map = mapStore.mapInstance;
    const active = measureRouteStore.active;
    const waypoints = measureRouteStore.waypoints;
    const mode = measureRouteStore.mode;
    if (!map) return;

    if (!active || waypoints.length < 2) {
      // Clear immediately — never queue clears (see the jeepney note below).
      try {
        clearMeasureRouteLayers(map);
      } catch {
        // Style not ready yet, so nothing was drawn.
      }
      return;
    }

    let cancelled = false;
    loadTravelGraph()
      .then((graph) => {
        if (cancelled) return;
        // Snap per mode: drive/cycle skip nodes their filters cannot leave,
        // so a tap beside a footpath still measures along the nearest road.
        const modes: TravelMode[] = ["walk", "cycle", "drive"];
        const nodesByMode = Object.fromEntries(
          modes.map((m) => [
            m,
            waypoints.map((w) => nearestNodeIndex(graph, w.lat, w.lng, m)),
          ]),
        ) as Record<TravelMode, number[]>;
        const nodes = nodesByMode[mode];
        const summaries = {
          walk: [] as ({ seconds: number; meters: number } | null)[],
          cycle: [] as ({ seconds: number; meters: number } | null)[],
          drive: [] as ({ seconds: number; meters: number } | null)[],
        };
        const legFeatures: FeatureCollection = {
          type: "FeatureCollection",
          features: [],
        };
        for (let i = 0; i + 1 < nodes.length; i++) {
          for (const legMode of modes) {
            const legNodes = nodesByMode[legMode];
            const route = shortestPath(
              graph,
              legNodes[i],
              legNodes[i + 1],
              legMode,
            );
            summaries[legMode].push(
              route ? { seconds: route.seconds, meters: route.meters } : null,
            );
            if (legMode === mode && route && route.coordinates.length > 1) {
              legFeatures.features.push({
                type: "Feature",
                geometry: { type: "LineString", coordinates: route.coordinates },
                properties: { leg: i },
              });
            }
          }
        }
        measureRouteStore.setResults(
          nodes.map((n) => ({ lat: graph.lat[n], lng: graph.lng[n] })),
          summaries,
        );
        const tryDraw = () => {
          try {
            ensureMeasureRouteLayers(map);
            const source = map.getSource(MEASURE_ROUTE_SOURCE_ID) as
              | mapGl.GeoJSONSource
              | undefined;
            source?.setData(legFeatures);
            return true;
          } catch {
            return false;
          }
        };
        if (!tryDraw()) {
          const onStyleData = () => {
            if (cancelled || tryDraw()) map.off("styledata", onStyleData);
          };
          map.on("styledata", onStyleData);
        }
      })
      .catch((error) => {
        console.warn("measure-route graph load failed", error);
        if (!cancelled) measureRouteStore.loadFailed = true;
      });
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    const coords = locationStore.coords;
    const accuracyMeters = locationStore.accuracyMeters;
    if (!map) return;

    const clearAccuracy = () => {
      try {
        if (map.getLayer(USER_LOCATION_ACCURACY_FILL_ID)) {
          map.removeLayer(USER_LOCATION_ACCURACY_FILL_ID);
        }
        if (map.getLayer(USER_LOCATION_ACCURACY_LINE_ID)) {
          map.removeLayer(USER_LOCATION_ACCURACY_LINE_ID);
        }
        if (map.getSource(USER_LOCATION_ACCURACY_SOURCE_ID)) {
          map.removeSource(USER_LOCATION_ACCURACY_SOURCE_ID);
        }
      } catch {
        // Style may not be ready.
      }
    };

    if (!coords || accuracyMeters == null || accuracyMeters <= 0) {
      clearAccuracy();
      return;
    }

    const featureCollection = {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: metersToLngLatCircle(coords, accuracyMeters),
        },
      ],
    };

    const draw = () => {
      if (!map.getSource(USER_LOCATION_ACCURACY_SOURCE_ID)) {
        map.addSource(USER_LOCATION_ACCURACY_SOURCE_ID, {
          type: "geojson",
          data: featureCollection,
        });
      } else {
        const source = map.getSource(USER_LOCATION_ACCURACY_SOURCE_ID) as
          | mapGl.GeoJSONSource
          | undefined;
        source?.setData(featureCollection);
      }

      if (!map.getLayer(USER_LOCATION_ACCURACY_FILL_ID)) {
        map.addLayer({
          id: USER_LOCATION_ACCURACY_FILL_ID,
          type: "fill",
          source: USER_LOCATION_ACCURACY_SOURCE_ID,
          paint: {
            "fill-color": "#4285f4",
            "fill-opacity": 0.12,
          },
        });
      }
      if (!map.getLayer(USER_LOCATION_ACCURACY_LINE_ID)) {
        map.addLayer({
          id: USER_LOCATION_ACCURACY_LINE_ID,
          type: "line",
          source: USER_LOCATION_ACCURACY_SOURCE_ID,
          paint: {
            "line-color": "#4285f4",
            "line-width": 1.5,
            "line-opacity": 0.45,
          },
        });
      }
    };

    try {
      draw();
      return;
    } catch {
      const onStyleData = () => {
        try {
          draw();
          map.off("styledata", onStyleData);
        } catch {
          // keep retrying until style accepts the layer
        }
      };
      map.on("styledata", onStyleData);
      return () => {
        map.off("styledata", onStyleData);
        clearAccuracy();
      };
    }
  });

  $effect(() => {
    const selectedId = jeepneyStore.selectedRouteId;
    const map = mapStore.mapInstance;
    if (!map) return;

    const route = selectedId
      ? transitStore.getRoute(selectedId)
      : null;

    if (!route) {
      activeRouteId = null;
      activeRouteStops = [];
      // Clear immediately — NEVER queue this on "load"/"styledata". A queued
      // clear registered at mount (style still streaming) fires AFTER a later
      // route draw and silently wipes its layers; that was the prod-only
      // missing-polyline bug (dev styles settle before anyone clicks).
      try {
        clearJeepneyRouteLayers(map);
      } catch {
        // Style not ready yet, so nothing was drawn and there is nothing to clear.
      }
      return;
    }

    activeRouteId = route.id;
    activeRouteStops = route.stops;
    activeRouteColor = route.color;

    // Geometry is resolved synchronously (static import + stop fallback).
    // Readiness gating is deliberately attempt-based: isStyleLoaded() is false
    // during ANY repaint and "load" fires only once per map lifetime, so
    // gating on either deadlocks and the polyline never draws. addSource /
    // addLayer only throw before the initial style load; try now and retry on
    // "styledata" until one attempt succeeds.
    const { line, source: geometrySource } = routeGeometry(route);
    const draw = () => {
      ensureJeepneyRouteLayers(map, route.color, geometrySource);
      const source = map.getSource(JEEPNEY_ROUTE_SOURCE_ID) as
        | mapGl.GeoJSONSource
        | undefined;
      source?.setData({
        type: "FeatureCollection",
        features: line
          ? [
              {
                type: "Feature",
                geometry: line,
                properties: { routeId: route.id, geometrySource },
              },
            ]
          : [],
      });
      fitMapToRoute(map, route);
    };

    const tryDraw = () => {
      try {
        draw();
        return true;
      } catch (error) {
        console.warn("jeepney route draw failed; retrying on styledata", error);
        return false;
      }
    };

    if (tryDraw()) return;
    const onStyleData = () => {
      if (tryDraw()) map.off("styledata", onStyleData);
    };
    map.on("styledata", onStyleData);
    return () => {
      map.off("styledata", onStyleData);
    };
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    const routeId = jeepneyStore.selectedRouteId;
    const stopIndex = jeepneyStore.selectedStopIndex;
    if (!map || routeId === null || stopIndex === null) return;

    const route = transitStore.getRoute(routeId);
    const stop = route?.stops[stopIndex];
    if (!stop) return;

    // Defer the camera move out of the reactive flush: flyTo fires zoom/move
    // handlers synchronously (reduced-motion jumps instantly), and their state
    // writes inside this flush can chain into effect_update_depth_exceeded,
    // which kills the whole Svelte scheduler (app looks frozen, hover still
    // works). Same guard as fitMapToRoute below.
    const frame = requestAnimationFrame(() => {
      map.flyTo({
        center: [stop.lon, stop.lat],
        zoom: Math.max(map.getZoom(), 16),
        duration: 700,
        essential: true,
      });
    });
    return () => cancelAnimationFrame(frame);
  });

  // #716: Makiling trail overlay — toggle trail line + station markers
  $effect(() => {
    const map = mapStore.mapInstance;
    const enabled = trailStore.enabled;
    if (!map) return;

    if (enabled) {
      ensureTrailLayers(map);
    } else {
      clearTrailLayers(map);
    }
  });

  // Load external campuses footprint layers
  $effect(() => {
    const map = mapStore.mapInstance;
    if (!map) return;
    
    if (map.isStyleLoaded()) {
      ensureExternalCampusesLayers(map);
    } else {
      map.once("styledata", () => ensureExternalCampusesLayers(map));
    }
  });

  $effect(() => {
    const map = mapStore.mapInstance;
    const selectedEvent =
      loaded && queryStore.category === "event" && queryStore.type === "result"
        ? findSelectedEvent(events)
        : null;
    if (!map) return;

    const routeFeatures = selectedEvent
      ? buildSelectedEventRouteFeatures(selectedEvent)
      : [];
    if (routeFeatures.length === 0) {
      clearEventRouteLayers(map);
      return;
    }

    const draw = () => {
      ensureEventRouteLayers(map);
      const source = map.getSource(EVENT_ROUTE_SOURCE_ID) as
        mapGl.GeoJSONSource | undefined;
      const featureCollection: FeatureCollection<LineString> = {
        type: "FeatureCollection",
        features: routeFeatures,
      };
      source?.setData(featureCollection);
    };

    if (map.isStyleLoaded()) {
      draw();
      return;
    }

    // Style isn't ready yet: defer the draw until load, but remove the handler
    // on re-run/teardown so rapid selection changes don't stack listeners and
    // draw a stale route once the style finally loads.
    map.once("load", draw);
    return () => {
      map.off("load", draw);
    };
  });

  $effect(() => {
    const category = queryStore.category;
    const type = queryStore.type;
    const value = queryStore.inputValue;
    const map = mapStore.mapInstance;

    if (!map) return;

    untrack(() => {
      const isTerrainEnabled = terrainStore.enabled;
      if (category === "building" && type === "result") {
        if (!loaded) return;
        const currentBuilding = buildings.find(
          (building) => building.buildingName === value,
        );

        if (currentBuilding?.lon && currentBuilding.lat) {
          map.flyTo({
            center: [currentBuilding.lon, currentBuilding.lat],
            zoom: 18,
            pitch: 60,
            padding: calculatePadding(md.current),
            duration: 1500,
          });
        }
      } else if (category === null) {
        flyToCamera(
          map,
          isTerrainEnabled ? TERRAIN_CAMERA : CAMPUS_DEFAULT_CAMERA,
        );
        if (directions) directions.clear();
      } else if (category === "room") {
        currentRoom.getRoomByCode(value).then(() => {
          if (
            currentRoom.value?.building?.lat &&
            currentRoom.value.building.lon
          ) {
            map.flyTo({
              center: [
                currentRoom.value.building.lon,
                currentRoom.value.building.lat,
              ],
              zoom: 18,
              pitch: 60,
              padding: calculatePadding(md.current),
              duration: 1500,
            });
          }
        });
      } else if (category === "dorm") {
        if (!loaded) return;

        const currentDorm = dorms.find((dorm) => dorm.dormName === value);
        if (currentDorm?.lon && currentDorm.lat) {
          map.flyTo({
            center: [currentDorm.lon, currentDorm.lat],
            zoom: 18,
            pitch: 60,
            padding: calculatePadding(md.current),
            duration: 1500,
          });
        }
      } else if (category === "event") {
        if (!loaded) return;
        const currentEvent = findSelectedEvent(events);
        if (currentEvent) focusMapOnEvent(map, currentEvent);
      } else if (category === "organization") {
        if (!loaded) return;
        mapViewStore.showOrgs = true;
        const currentOrg = organizations.find((org) => org.name === value);
        const position = currentOrg ? organizationPosition(currentOrg) : null;
        if (position) {
          map.flyTo({
            center: [position.lon, position.lat],
            zoom: 18,
            pitch: 60,
            padding: calculatePadding(md.current),
            duration: 1500,
          });
        }
      } else if (category === "place") {
        if (!loaded) return;
        mapViewStore.showPlaces = true;
        const currentPlace = places.find((place) => place.name === value);
        if (currentPlace?.lon != null && currentPlace.lat != null) {
          map.flyTo({
            center: [currentPlace.lon, currentPlace.lat],
            zoom: 18,
            pitch: 60,
            padding: calculatePadding(md.current),
            duration: 1500,
          });
        }
      }
    });
  });

  function handleBuildingMarkerClick(
    buildingName: string,
    lat: number | null,
    lon: number | null,
  ) {
    if (eventPlacementStore.active) return;
    if (isMapEditEnabled() && selectedEditKey !== null) return;
    if (
      lat != null &&
      lon != null &&
      tryAddDirectionsStop(lat, lon, buildingName)
    ) {
      return;
    }
    if (buildingName === queryStore.inputValue) return;
    queryStore.updateQuery({
      category: "building",
      type: "result",
      value: buildingName,
    });
    queryStore.inputValue = buildingName;
    sidePanelStore.openPanel({
      type: "search-result",
      component: BuildingResult,
    });
  }

  function handleDormMarkerClick(
    dormName: string,
    lat: number | null,
    lon: number | null,
  ) {
    if (eventPlacementStore.active) return;
    if (isMapEditEnabled() && selectedEditKey !== null) return;
    if (
      lat != null &&
      lon != null &&
      tryAddDirectionsStop(lat, lon, dormName)
    ) {
      return;
    }
    if (dormName === queryStore.inputValue) return;
    queryStore.updateQuery({
      category: "dorm",
      type: "result",
      value: dormName,
    });
    queryStore.inputValue = dormName;
    sidePanelStore.openPanel({
      type: "search-result",
      component: DormResult,
    });
  }

  function handleOrgMarkerClick(
    name: string,
    lat: number | null,
    lon: number | null,
  ) {
    if (eventPlacementStore.active) return;
    if (isMapEditEnabled() && selectedEditKey !== null) return;
    if (lat != null && lon != null && tryAddDirectionsStop(lat, lon, name)) {
      return;
    }
    if (
      queryStore.category === "organization" &&
      name === queryStore.inputValue
    ) {
      sidePanelStore.expand();
      return;
    }
    queryStore.updateQuery({
      category: "organization",
      type: "result",
      value: name,
    });
    queryStore.inputValue = name;
    sidePanelStore.openPanel({
      type: "search-result",
      component: OrgResult,
    });
  }

  function handleEventMarkerClick(event: EventData) {
    if (eventPlacementStore.active) return;
    if (isMapEditEnabled() && selectedEditKey !== null) return;
    if (queryStore.selectedEventSlug === event.slug) return;
    queryStore.updateQuery({
      category: "event",
      type: "result",
      value: event.title,
      eventSlug: event.slug,
    });
    queryStore.inputValue = event.title;
    sidePanelStore.openPanel({
      type: "search-result",
      component: EventResult,
    });
  }

  function toggleEventMarkerGroup(groupKey: string) {
    if (eventPlacementStore.active) return;
    expandedEventGroupKey =
      expandedEventGroupKey === groupKey ? null : groupKey;
  }

  function collapseEventMarkerGroup() {
    if (eventPlacementStore.active) return;
    expandedEventGroupKey = null;
  }

  function isSelectedEvent(event: EventData) {
    if (queryStore.category !== "event") return false;
    if (queryStore.selectedEventSlug) {
      return queryStore.selectedEventSlug === event.slug;
    }
    return queryStore.inputValue === event.title;
  }

  function formatEventMarkerDate(value: string) {
    return formatCampusDateShort(value);
  }

  function formatEventMarkerTime(value: string) {
    return formatCampusTime(value);
  }

  function formatEventMarkerDateTime(value: string) {
    return `${formatCampusDateShort(value)}, ${formatCampusTime(value)}`;
  }

  function getEventStatusLabel(event: EventData) {
    if (event.status === "active") return "Active now";
    if (event.status === "past") return "Past";
    return "Upcoming";
  }

  $effect(() => {
    if (!loaded || !isMapEditEnabled()) return;
    const event = findSelectedEvent(events);
    if (!event) return;
    const location = getEditableEventLocation(event);
    if (!location || !isAnchoredEventLocation(location)) return;
    untrack(() => clearEventLocationOverride(event.id));
  });

  type EventMarkerEntry = {
    event: EventData;
    location: EventData["locations"][number];
  };

  function isAnchoredEventLocation(
    location: EventData["locations"][number],
  ): boolean {
    return location.anchorType === "building" || location.anchorType === "dorm";
  }

  function getEventMarkerLngLat(editable: {
    event: EventData;
    location: EventData["locations"][number];
  }): [number, number] {
    if (!isAnchoredEventLocation(editable.location)) {
      const override =
        eventLocationOverrides[eventLocationEditKey(editable.event.id)];
      if (override) return [override.lon, override.lat];
    }
    return [
      Number(editable.location.resolvedLon),
      Number(editable.location.resolvedLat),
    ];
  }

  function getEditableEventLocation(event: EventData) {
    return (
      event.locations.find(
        (location) =>
          location.isPrimary &&
          location.resolvedLon !== null &&
          location.resolvedLat !== null,
      ) ??
      event.locations.find(
        (location) =>
          location.resolvedLon !== null && location.resolvedLat !== null,
      ) ??
      null
    );
  }

  function isSelectedEditableEventLocation(
    event: EventData,
    location: EventData["locations"][number],
  ) {
    if (
      !isMapEditEnabled() ||
      queryStore.category !== "event" ||
      queryStore.type !== "result"
    ) {
      return false;
    }

    const slug = queryStore.selectedEventSlug;
    if (slug) {
      if (slug !== event.slug) return false;
    } else if (queryStore.inputValue !== event.title) {
      return false;
    }

    return getEditableEventLocation(event)?.id === location.id;
  }

  function getEventLocationKey(location: EventMarkerEntry["location"]) {
    if (location.resolvedLon === null || location.resolvedLat === null) {
      return null;
    }
    return `${location.resolvedLon.toFixed(6)}:${location.resolvedLat.toFixed(6)}`;
  }

  let eventMarkerGroups = $derived.by(() => {
    if (!loaded) return [];
    const groups = new Map<
      string,
      {
        key: string;
        lngLat: [number, number];
        label: string;
        anchored: boolean;
        entries: EventMarkerEntry[];
      }
    >();

    for (const event of events) {
      // Past events are dropped from the map (#17); only active/upcoming pin.
      if (event.status !== "active" && event.status !== "upcoming") {
        continue;
      }
      for (const location of event.locations) {
        if (isSelectedEditableEventLocation(event, location)) continue;
        const key = getEventLocationKey(location);
        if (
          key === null ||
          location.resolvedLon === null ||
          location.resolvedLat === null
        ) {
          continue;
        }

        const group = groups.get(key);
        const entry = { event, location };
        if (group) {
          group.anchored =
            group.anchored ||
            location.anchorType === "building" ||
            location.anchorType === "dorm";
          group.entries.push(entry);
          continue;
        }

        groups.set(key, {
          key,
          lngLat: [location.resolvedLon, location.resolvedLat],
          label: location.resolvedLabel,
          anchored:
            location.anchorType === "building" ||
            location.anchorType === "dorm",
          entries: [entry],
        });
      }
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      entries: group.entries.sort((a, b) => {
        const statusDelta =
          Number(b.event.status === "active") -
          Number(a.event.status === "active");
        if (statusDelta !== 0) return statusDelta;
        return a.event.occurrenceStartsAt.localeCompare(
          b.event.occurrenceStartsAt,
        );
      }),
    }));
  });

  let editableEventLocation = $derived.by(() => {
    if (
      !loaded ||
      !isMapEditEnabled() ||
      queryStore.category !== "event" ||
      queryStore.type !== "result"
    ) {
      return null;
    }

    const event = findSelectedEvent(events);
    if (!event) return null;

    const location = getEditableEventLocation(event);
    if (
      !location ||
      location.resolvedLon === null ||
      location.resolvedLat === null
    ) {
      return null;
    }

    return { event, location };
  });

  $effect(() => {
    if (
      !loaded ||
      queryStore.category !== "event" ||
      queryStore.type !== "result"
    )
      return;
    const group = eventMarkerGroups.find((group) =>
      group.entries.some((entry) => isSelectedEvent(entry.event)),
    );
    if (!group) return;
    untrack(() => {
      expandedEventGroupKey = group.key;
    });
  });

  let activeBuildingName = $derived.by(() => {
    if (!queryStore.category || queryStore.type !== "result") return null;
    switch (queryStore.category) {
      case "building":
        return queryStore.inputValue;
      case "room": {
        return null;
        // const currentRoom = rooms.find(
        //   (room) => room.code === queryStore.inputValue,
        // );
        // return currentRoom && currentRoom.building
        //   ? currentRoom.building.name
        //   : null;
      }
      default:
        return null;
    }
  });

  let selectedEventFocus = $derived.by(() => {
    if (
      !loaded ||
      isMapEditEnabled() ||
      queryStore.category !== "event" ||
      queryStore.type !== "result"
    ) {
      return null;
    }
    return findSelectedEvent(events);
  });

  let selectedEventBuildingIds = $derived.by(() => {
    const event = selectedEventFocus;
    if (!event) return null;
    return new Set(
      event.locations
        .filter(
          (location) =>
            location.anchorType === "building" && location.buildingId !== null,
        )
        .map((location) => location.buildingId as number),
    );
  });

  let selectedEventDormIds = $derived.by(() => {
    const event = selectedEventFocus;
    if (!event) return null;
    return new Set(
      event.locations
        .filter(
          (location) =>
            location.anchorType === "dorm" && location.dormId !== null,
        )
        .map((location) => location.dormId as number),
    );
  });

  const eventPlaceFocusActive = $derived(selectedEventFocus !== null);

  function isBuildingDimmedForEventFocus(buildingId: number): boolean {
    if (!eventPlaceFocusActive || selectedEventBuildingIds === null)
      return false;
    if (selectedEventBuildingIds.size === 0) return true;
    return !selectedEventBuildingIds.has(buildingId);
  }

  function isDormDimmedForEventFocus(dormId: number): boolean {
    if (!eventPlaceFocusActive || selectedEventDormIds === null) return false;
    if (selectedEventDormIds.size === 0) return true;
    return !selectedEventDormIds.has(dormId);
  }

  function isBuildingEventLinked(buildingId: number): boolean {
    if (selectedEventBuildingIds !== null) {
      return selectedEventBuildingIds.has(buildingId);
    }
    return linkedActiveEventBuildingIds.has(buildingId);
  }

  function isDormEventLinked(dormId: number): boolean {
    if (selectedEventDormIds !== null) {
      return selectedEventDormIds.has(dormId);
    }
    return linkedActiveEventDormIds.has(dormId);
  }

  // "My classes" highlight (#see MapViewStore.highlightMyBuildings): emphasize
  // buildings hosting the active planner plan's classes, dim every other pin.
  // Same shape as the event-focus dimming above.
  const activePlannerRoomCodes = $derived(
    plannerRoomCodes(plannerStore.activePlan?.sections ?? []),
  );
  const classHighlightActive = $derived(
    mapViewStore.highlightMyBuildings && activePlannerRoomCodes.length > 0,
  );

  $effect(() => {
    if (!mapViewStore.highlightMyBuildings) return;
    void plannerBuildingsStore.load(activePlannerRoomCodes);
  });

  function isMyClassBuilding(buildingId: number): boolean {
    return classHighlightActive && plannerBuildingsStore.buildingIds.has(buildingId);
  }

  function isBuildingDimmedForClassHighlight(buildingId: number): boolean {
    return classHighlightActive && !plannerBuildingsStore.buildingIds.has(buildingId);
  }

  /**
   * While Get Directions is open, fade pins that are not the destination,
   * a waypoint, or within ~25 m of the drawn route (#966 route UI).
   */
  function isExemptFromDirectionsDim(lat: number, lon: number): boolean {
    const dest = directionsStore.destination;
    if (
      dest &&
      Math.abs(dest.lat - lat) < 1e-5 &&
      Math.abs(dest.lng - lon) < 1e-5
    ) {
      return true;
    }
    for (const stop of directionsStore.waypoints) {
      if (
        Math.abs(stop.lat - lat) < 1e-5 &&
        Math.abs(stop.lng - lon) < 1e-5
      ) {
        return true;
      }
    }
    const line = directionsStore.selectedRouteCoords;
    if (line.length >= 2 && isNearRoute({ lat, lon }, line)) return true;
    return false;
  }

  function isDimmedForDirections(lat: number | null, lon: number | null): boolean {
    if (
      !directionsStore.active ||
      !directionsStore.selected ||
      lat == null ||
      lon == null
    ) {
      return false;
    }
    return !isExemptFromDirectionsDim(lat, lon);
  }

  let linkedActiveEventBuildingIds = $derived.by(() => {
    if (!loaded) return new Set<number>();
    return new Set(
      events
        .filter((event) => event.status === "active")
        .flatMap((event) => event.locations)
        .filter(
          (location) =>
            location.anchorType === "building" && location.buildingId !== null,
        )
        .map((location) => location.buildingId as number),
    );
  });

  let activeDormName = $derived.by(() => {
    if (queryStore.category === "dorm" && queryStore.type === "result") {
      return queryStore.inputValue;
    }
    return null;
  });

  let activeOrgName = $derived.by(() => {
    if (queryStore.category === "organization" && queryStore.type === "result") {
      return queryStore.inputValue;
    }
    return null;
  });

  let linkedActiveEventDormIds = $derived.by(() => {
    if (!loaded) return new Set<number>();
    return new Set(
      events
        .filter((event) => event.status === "active")
        .flatMap((event) => event.locations)
        .filter(
          (location) =>
            location.anchorType === "dorm" && location.dormId !== null,
        )
        .map((location) => location.dormId as number),
    );
  });

  let selectedEventRouteStops = $derived.by(() => {
    if (!loaded || queryStore.category !== "event") return [];
    const selectedEvent = findSelectedEvent(events);
    if (!selectedEvent) return [];
    return selectedEvent.routes.flatMap((route) =>
      route.stops.filter(
        (stop) => stop.resolvedLon !== null && stop.resolvedLat !== null,
      ),
    );
  });
</script>

<svelte:window onkeydown={handleMapEditKeydown} />

<div class="map-shell">
  <div class="map-container">
    {#if eventPlacementStore.active}
      <EventPlacementImageField />
    {/if}
    {#if mapStyle}
      <MapLibre
        bind:map={mapStore.mapInstance}
        style={mapStyle}
        maxBounds={CAMPUS_MAX_BOUNDS}
        center={CAMPUS_DEFAULT_CAMERA.center}
        zoom={17}
        pitch={CAMPUS_DEFAULT_CAMERA.pitch}
        bearing={CAMPUS_DEFAULT_CAMERA.bearing}
        minZoom={13}
        class="map"
        attributionControl={false}
      >
        {#if locationStore.coords}
          <Marker lngLat={locationStore.coords}>
            {#if directionsStore.navigating}
              <!-- Heading arrow while navigating (#966); falls back to the
                   plain dot when the device reports no heading. -->
              <div
                class="user-location-puck"
                class:user-location-puck--heading={locationStore.bearing !==
                  null}
                style:--puck-rotation="{locationStore.bearing ?? 0}deg"
              ></div>
            {:else}
              <div class="user-location-pin"></div>
            {/if}
          </Marker>
        {/if}
        {#if directionsStore.active}
          {#each directionsStore.waypoints as stop, i (`dir-wp-${i}-${stop.lat}-${stop.lng}`)}
            <Marker lngLat={[stop.lng, stop.lat]}>
              <button
                type="button"
                class="directions-waypoint"
                aria-label={`Stop ${i + 1}: ${stop.label}. Remove stop.`}
                onclick={() => void directionsStore.removeWaypoint(i)}
              >
                {i + 1}
              </button>
            </Marker>
          {/each}
        {/if}
        {#if measureRouteStore.active}
          {#each measureRouteStore.waypoints as waypoint, i (i)}
            {@const snapped =
              measureRouteStore.snapped.length ===
              measureRouteStore.waypoints.length
                ? measureRouteStore.snapped[i]
                : waypoint}
            <Marker lngLat={{ lng: snapped.lng, lat: snapped.lat }}>
              <button
                type="button"
                class="measure-waypoint"
                aria-label={`Remove waypoint ${i + 1}`}
                onclick={() => measureRouteStore.removeWaypoint(i)}
              >
                {i + 1}
              </button>
            </Marker>
          {/each}
        {/if}
        {#if additionProposalStore.draftPin}
          <Marker
            lngLat={{
              lng: additionProposalStore.draftPin.lon,
              lat: additionProposalStore.draftPin.lat,
            }}
          >
            {#if additionProposalStore.draftPinPreview}
              <ContributorDraftPinMarker
                preview={additionProposalStore.draftPinPreview}
              />
            {:else}
              <div class="addition-draft-pin" aria-hidden="true"></div>
            {/if}
          </Marker>
        {/if}
        {#if loaded}
          {#if editableEventLocation}
            {@const editKey = eventLocationEditKey(
              editableEventLocation.event.id,
            )}
            <Marker
              lngLat={getEventMarkerLngLat(editableEventLocation)}
              draggable={canDragPin(editKey)}
              onclick={() =>
                handleEventMarkerClick(editableEventLocation.event)}
              ondragstart={() => beginMarkerDrag(editKey)}
              ondragend={(e) =>
                handleEventLocationDragEnd(
                  e,
                  editableEventLocation.event,
                  editableEventLocation.location,
                )}
            >
              <div class="event-marker-anchor event-edit-anchor">
                <span class="event-anchor-dot event-edit-dot" aria-hidden="true"
                ></span>
                <div
                  class="event-edit-pin"
                  class:editing={selectedEditKey === editKey}
                  class:hovered={hoveredEditKey === editKey}
                  class:saving={savingEditKey === editKey}
                  class:saved={savedEditKey === editKey}
                  class:failed={failedEditKey === editKey}
                  title={`Drag to move ${editableEventLocation.event.title}`}
                  onpointerenter={() => handleEditablePinEnter(editKey)}
                  onpointerleave={() => handleEditablePinLeave(editKey)}
                >
                  <span class="event-edit-icon" aria-hidden="true">
                    <CalendarDays size={18} />
                  </span>
                  <span class="event-edit-copy">
                    <span>{editableEventLocation.event.title}</span>
                    {#if savingEditKey === editKey}
                      <strong>Saving</strong>
                    {:else if savedEditKey === editKey}
                      <strong>Saved</strong>
                    {:else if failedEditKey === editKey}
                      <strong>Failed</strong>
                    {:else}
                      <strong>Drag location</strong>
                    {/if}
                  </span>
                  <span class="event-edit-handle" aria-hidden="true">
                    <Move size={16} />
                  </span>
                </div>
              </div>
            </Marker>
          {/if}
          {#each eventMarkerGroups as group (`event-group:${group.key}`)}
            <Marker lngLat={group.lngLat}>
              <div class="event-marker-anchor" class:anchored={group.anchored}>
                <span class="event-anchor-connector" aria-hidden="true"></span>
                <span class="event-anchor-dot" aria-hidden="true"></span>
                <div class="event-callout" class:anchored={group.anchored}>
                  {#if group.entries.length === 1}
                    {@const entry = group.entries[0]}
                    {#if entry}
                      {@const image = getEventImage(
                        entry.event.slug,
                        entry.event.imageUrl,
                        entry.event.title,
                      )}
                      {@const active = isSelectedEvent(entry.event)}
                      {@const centralHoverPreview =
                        shouldShowEntityHoverPreview()}
                      {@const previewSuppressed =
                        centralHoverPreview &&
                        isEventHoverPreview(
                          entityHoverPreviewStore.entity,
                          entry.event.slug,
                        )}
                      <EventMapPin
                        {active}
                        useCentralHoverPreview={centralHoverPreview}
                        {previewSuppressed}
                        anchored={group.anchored}
                        imageSrc={image?.src ?? null}
                        dateLabel={formatEventMarkerDate(
                          entry.event.occurrenceStartsAt,
                        )}
                        status={entry.event.status}
                        title={`${entry.event.title}: ${entry.location.resolvedLabel}`}
                        ariaLabel={`Open event ${entry.event.title} at ${entry.location.resolvedLabel}`}
                        labelTitle={entry.event.title}
                        labelMeta={`${getEventStatusLabel(entry.event)} · ${formatEventMarkerDateTime(
                          entry.event.occurrenceStartsAt,
                        )}`}
                        labelVisible={zoomLevel >= 17 || active}
                        onclick={() => handleEventMarkerClick(entry.event)}
                        onpointerenter={(event) =>
                          handleEventPinPointerEnter(entry.event, event)}
                        onpointerleave={handleEventPinPointerLeave}
                      />
                    {/if}
                  {:else}
                    {@const primaryEntry = group.entries[0]}
                    {@const isExpanded = expandedEventGroupKey === group.key}
                    {#if primaryEntry}
                      {@const primaryImage = getEventImage(
                        primaryEntry.event.slug,
                        primaryEntry.event.imageUrl,
                        primaryEntry.event.title,
                      )}
                      <EventMapPin
                        variant="group"
                        anchored={group.anchored}
                        expanded={isExpanded}
                        ariaExpanded={isExpanded}
                        count={group.entries.length}
                        imageSrc={primaryImage?.src ?? null}
                        dateLabel={formatEventMarkerDate(
                          primaryEntry.event.occurrenceStartsAt,
                        )}
                        status={primaryEntry.event.status}
                        title={`${group.entries.length} events at ${group.label}`}
                        ariaLabel={`${isExpanded ? "Collapse" : "Expand"} ${group.entries.length} events at ${group.label}`}
                        onclick={() => toggleEventMarkerGroup(group.key)}
                        onpointerenter={(event) =>
                          handleEventPinPointerEnter(primaryEntry.event, event)}
                        onpointerleave={handleEventPinPointerLeave}
                      />
                      {#if isExpanded}
                        <div
                          class="event-pin-stack"
                          role="group"
                          aria-label={`${group.entries.length} events at ${group.label}`}
                          transition:fade
                        >
                          <div class="event-stack-header">
                            <span class="event-stack-heading">
                              <strong>{group.entries.length} events</strong>
                              <span>{group.label}</span>
                            </span>
                            <button
                              class="event-stack-close"
                              type="button"
                              aria-label={`Collapse events at ${group.label}`}
                              onclick={collapseEventMarkerGroup}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div class="event-stack-list">
                            {#each group.entries as entry (`event-stack:${entry.event.id}:${entry.location.id}`)}
                              {@const image = getEventImage(
                                entry.event.slug,
                                entry.event.imageUrl,
                                entry.event.title,
                              )}
                              <button
                                type="button"
                                class="event-stack-item"
                                class:active={isSelectedEvent(entry.event)}
                                class:upcoming={entry.event.status ===
                                  "upcoming"}
                                title={`${entry.event.title}: ${entry.location.resolvedLabel}`}
                                aria-label={`Open event ${entry.event.title} at ${entry.location.resolvedLabel}`}
                                onclick={() =>
                                  handleEventMarkerClick(entry.event)}
                              >
                                {#if image}
                                  <img
                                    class="event-stack-thumb"
                                    src={image.src}
                                    alt=""
                                    width="32"
                                    height="32"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                {:else}
                                  <span
                                    class="event-stack-icon"
                                    aria-hidden="true"
                                  >
                                    <CalendarDays size={14} />
                                  </span>
                                {/if}
                                <span class="event-stack-copy">
                                  <span class="event-stack-title"
                                    >{entry.event.title}</span
                                  >
                                  <span class="event-stack-meta">
                                    {formatEventMarkerDate(
                                      entry.event.occurrenceStartsAt,
                                    )}
                                    at {formatEventMarkerTime(
                                      entry.event.occurrenceStartsAt,
                                    )}
                                    - {getEventStatusLabel(entry.event)}
                                  </span>
                                </span>
                              </button>
                            {/each}
                          </div>
                        </div>
                      {/if}
                    {/if}
                  {/if}
                </div>
              </div>
            </Marker>
          {/each}
          {#each selectedEventRouteStops as stop (`event-stop:${stop.id}`)}
            <Marker
              lngLat={[Number(stop.resolvedLon), Number(stop.resolvedLat)]}
            >
              <div class="event-route-stop-pin" title={stop.resolvedLabel}>
                <span>{stop.sortOrder + 1}</span>
                <span class="event-route-stop-label" transition:fade>
                  {stop.resolvedLabel}
                </span>
              </div>
            </Marker>
          {/each}
        {/if}
        {#each scheduleRouteStore.dayStops as stop, index (`schedule-stop:${index}:${stop.courseCode}:${stop.roomCode}:${stop.scheduleSlot}`)}
          {#if stop.coords}
            {@const routeActive =
              scheduleRouteStore.routedWeekday ===
                scheduleRouteStore.selectedWeekday &&
              locationStore.routeWaypoints !== null}
            <Marker lngLat={stop.coords}>
              <button
                type="button"
                class="schedule-route-stop-pin"
                class:focused={scheduleRouteStore.focusedStopIndex === index}
                class:routed={routeActive}
                title={`${stop.courseCode} ${stop.section} at ${stop.roomCode ?? "room TBA"}`}
                aria-label={`Show ${stop.courseCode} ${stop.roomCode ?? ""} schedule stop`}
                onclick={() => scheduleRouteStore.focusStop(index)}
              >
                <span>{index + 1}</span>
                <span class="schedule-route-stop-label" transition:fade>
                  {formatMinutes(stop.startMinutes)}
                  {stop.courseCode}
                  {#if stop.roomCode} · {stop.roomCode}{/if}
                </span>
              </button>
            </Marker>
          {/if}
        {/each}
        {#if !mapViewStore.eventsOnly}
          {#each filteredBuildings as building (`building:${building.id}`)}
            {#if building.lat && building.lon}
              {@const editKey = buildingEditKey(building.id)}
              {@const position = getEditablePosition(editKey, {
                lat: building.lat,
                lon: building.lon,
                version: getLoadedVersion(building.version),
              })}
              {@const centralHoverPreview = shouldShowEntityHoverPreview()}
              {@const previewSuppressed =
                centralHoverPreview &&
                isBuildingHoverPreview(
                  entityHoverPreviewStore.entity,
                  building.id,
                )}
              {#key `${editKey}:${canDragPin(editKey)}`}
                <Marker
                  lngLat={[position.lon, position.lat]}
                  draggable={canDragPin(editKey)}
                  onclick={() =>
                    handleBuildingMarkerClick(
                      building.buildingName,
                      position.lat,
                      position.lon,
                    )}
                  ondragstart={() => beginMarkerDrag(editKey)}
                  ondragend={(e) =>
                    handleBuildingDragEnd(
                      e,
                      building.id,
                      building.buildingName,
                      position,
                    )}
                >
                  <MapEntityPin
                    label={building.buildingName}
                    active={activeBuildingName === building.buildingName}
                    editable={canDragPin(editKey)}
                    editing={selectedEditKey === editKey}
                    dimmed={isBuildingDimmedForEventFocus(building.id) ||
                      isBuildingDimmedForClassHighlight(building.id) ||
                      isDimmedForDirections(position.lat, position.lon)}
                    eventLinked={isBuildingEventLinked(building.id)}
                    hovered={hoveredEditKey === editKey}
                    saveState={savingEditKey === editKey
                      ? "saving"
                      : savedEditKey === editKey
                        ? "saved"
                        : failedEditKey === editKey
                          ? "failed"
                          : "idle"}
                    labelVisible={!isDimmedForDirections(
                      position.lat,
                      position.lon,
                    ) &&
                      (zoomLevel >= 17 ||
                        activeBuildingName === building.buildingName ||
                        isMyClassBuilding(building.id))}
                    useCentralHoverPreview={centralHoverPreview}
                    {previewSuppressed}
                    onpointerenter={(event) =>
                      handleBuildingPinPointerEnter(building, editKey, event)}
                    onpointerleave={() =>
                      handleBuildingPinPointerLeave(editKey)}
                  >
                    <PinGlyph name="building" size={20} />
                  </MapEntityPin>
                </Marker>
              {/key}
            {/if}
          {/each}
        {/if}
        {#if activeRouteId}
          {#each activeRouteStops as stop, i (`${activeRouteId}-${i}-${stop.name}`)}
            {@const isHovered = jeepneyStore.hoveredStopIndex === i}
            {@const isSelected = jeepneyStore.selectedStopIndex === i}
            <Marker lngLat={[stop.lon, stop.lat]}>
              <button
                type="button"
                class="jeepney-stop-pin"
                class:jeepney-stop-pin--hovered={isHovered}
                class:jeepney-stop-pin--selected={isSelected}
                style:--stop-color={activeRouteColor}
                aria-label={`Jeepney stop ${i + 1}: ${stop.name}`}
                aria-pressed={isSelected}
                onclick={(event) => {
                  event.stopPropagation();
                  jeepneyStore.openStop(i);
                }}
                onmouseenter={() => jeepneyStore.setHoveredStop(i)}
                onmouseleave={() => jeepneyStore.setHoveredStop(null)}
                onfocus={() => jeepneyStore.setHoveredStop(i)}
                onblur={() => jeepneyStore.setHoveredStop(null)}
              >
                <span class="stop-index" aria-hidden="true">{i + 1}</span>
                <span class="stop-label" transition:fade>{stop.name}</span>
              </button>
            </Marker>
          {/each}
        {/if}

        {#if !mapViewStore.eventsOnly}
          {#each filteredDorms as dorm (`dorm:${dorm.id}`)}
            {#if dorm.lat && dorm.lon}
              {@const editKey = dormEditKey(dorm.id)}
              {@const position = getEditablePosition(editKey, {
                lat: dorm.lat,
                lon: dorm.lon,
                version: getLoadedVersion(dorm.version),
              })}
              {@const centralHoverPreview = shouldShowEntityHoverPreview()}
              {@const previewSuppressed =
                centralHoverPreview &&
                isDormHoverPreview(entityHoverPreviewStore.entity, dorm.id)}
              {#key `${editKey}:${canDragPin(editKey)}`}
                <Marker
                  lngLat={[position.lon, position.lat]}
                  draggable={canDragPin(editKey)}
                  onclick={() =>
                    handleDormMarkerClick(
                      dorm.dormName,
                      position.lat,
                      position.lon,
                    )}
                  ondragstart={() => beginMarkerDrag(editKey)}
                  ondragend={(e) =>
                    handleDormDragEnd(e, dorm.id, dorm.dormName, position)}
                >
                  <MapEntityPin
                    label={dorm.dormName}
                    tone={dorm.isUpManaged ? "dorm" : "privateDorm"}
                    active={activeDormName === dorm.dormName}
                    dimmed={isDormDimmedForEventFocus(dorm.id) ||
                      classHighlightActive ||
                      isDimmedForDirections(position.lat, position.lon)}
                    eventLinked={isDormEventLinked(dorm.id)}
                    editable={canDragPin(editKey)}
                    editing={selectedEditKey === editKey}
                    hovered={hoveredEditKey === editKey}
                    saveState={savingEditKey === editKey
                      ? "saving"
                      : savedEditKey === editKey
                        ? "saved"
                        : failedEditKey === editKey
                          ? "failed"
                          : "idle"}
                    labelVisible={!isDimmedForDirections(
                      position.lat,
                      position.lon,
                    ) &&
                      (zoomLevel >= 17 || activeDormName === dorm.dormName)}
                    useCentralHoverPreview={centralHoverPreview}
                    {previewSuppressed}
                    onpointerenter={(event) =>
                      handleDormPinPointerEnter(dorm, editKey, event)}
                    onpointerleave={() => handleDormPinPointerLeave(editKey)}
                  >
                    <PinGlyph name="dorm" size={18} />
                  </MapEntityPin>
                </Marker>
              {/key}
            {/if}
          {/each}

          {#each filteredPlaces as place (`place:${place.id}`)}
            {#if place.lat != null && place.lon != null && (poiPinsVisible || sponsoredPlacePins.has(place.name) || (queryStore.category === "place" && queryStore.inputValue === place.name))}
              {@const centralHoverPreview = shouldShowEntityHoverPreview()}
              {@const previewSuppressed =
                centralHoverPreview &&
                isPlaceHoverPreview(entityHoverPreviewStore.entity, place.id)}
              {@const pinSponsorId = sponsoredPlacePins.get(place.name)}
              <Marker lngLat={[place.lon, place.lat]}>
                <MapEntityPin
                  label={place.name}
                  tone={isLandmarkPlace(place) ? "landmark" : "establishment"}
                  active={queryStore.category === "place" &&
                    queryStore.inputValue === place.name}
                  dimmed={(classHighlightActive &&
                    pinSponsorId === undefined) ||
                    isDimmedForDirections(place.lat, place.lon)}
                  labelVisible={!isDimmedForDirections(place.lat, place.lon) &&
                    (zoomLevel >= 17 ||
                      (queryStore.category === "place" &&
                        queryStore.inputValue === place.name))}
                  sponsored={pinSponsorId !== undefined}
                  useCentralHoverPreview={centralHoverPreview}
                  {previewSuppressed}
                  onclick={() => {
                    if (pinSponsorId) trackSponsorClick(pinSponsorId, "map_pin");
                    handlePlaceMarkerClick(place);
                  }}
                  onpointerenter={(event) =>
                    handlePlacePinPointerEnter(place, event)}
                  onpointerleave={handleDetailPinPointerLeave}
                >
                  {#if isLandmarkPlace(place)}
                    <PinGlyph name="landmark" size={16} />
                  {:else}
                    <PinGlyph name="establishment" size={16} />
                  {/if}
                </MapEntityPin>
              </Marker>
            {/if}
          {/each}
        {/if}

        {#if !mapViewStore.eventsOnly}
          {#each filteredOrganizations as { org, lat, lon } (`org:${org.id}`)}
            {#if poiPinsVisible || activeOrgName === org.name}
            {@const centralHoverPreview = shouldShowEntityHoverPreview()}
            {@const previewSuppressed =
              centralHoverPreview &&
              isOrganizationHoverPreview(entityHoverPreviewStore.entity, org.id)}
            <Marker lngLat={[lon, lat]}>
              <MapEntityPin
                label={org.name}
                tone={isStudentOrganization(org.category)
                  ? "organization"
                  : "office"}
                active={activeOrgName === org.name}
                dimmed={classHighlightActive ||
                  isDimmedForDirections(lat, lon)}
                labelVisible={!isDimmedForDirections(lat, lon) &&
                  (zoomLevel >= 17 || activeOrgName === org.name)}
                useCentralHoverPreview={centralHoverPreview}
                {previewSuppressed}
                onclick={() => handleOrgMarkerClick(org.name, lat, lon)}
                onpointerenter={(event) =>
                  handleOrganizationPinPointerEnter(org, event)}
                onpointerleave={handleDetailPinPointerLeave}
              >
                {#if isStudentOrganization(org.category)}
                  <PinGlyph name="organization" size={16} />
                {:else}
                  <PinGlyph name="office" size={16} />
                {/if}
              </MapEntityPin>
            </Marker>
            {/if}
          {/each}
        {/if}
      </MapLibre>
    {/if}
  </div>

  {#if eventPlacementStore.active}
    {#if md.current}
      <div
        bind:this={editChromeEl}
        class="edit-dock event-placement-dock"
        role="status"
        aria-live="polite"
      >
        <p class="edit-dock-status">
          {eventPlacementStore.creating
            ? "Creating event…"
            : "Tap the map to place the event"}
        </p>
        <button
          class="edit-dock-action cancel"
          type="button"
          disabled={eventPlacementStore.creating}
          onclick={() => eventPlacementStore.cancel()}
        >
          Cancel
        </button>
      </div>
    {:else}
      <div
        bind:this={editChromeEl}
        class="event-placement-toolbar"
        role="status"
        aria-live="polite"
      >
        <div class="event-placement-copy">
          <strong>Choose event location on the map</strong>
          <span>
            {eventPlacementStore.creating
              ? "Creating the event at the selected map point..."
              : "Click or tap the map point where this event should appear."}
          </span>
        </div>
        <button
          class="event-placement-cancel"
          type="button"
          disabled={eventPlacementStore.creating}
          onclick={() => eventPlacementStore.cancel()}
        >
          Cancel
        </button>
      </div>
    {/if}
  {:else if additionProposalStore.pinPickActive}
    {#if md.current}
      <div
        bind:this={editChromeEl}
        class="edit-dock event-placement-dock"
        role="status"
        aria-live="polite"
      >
        <p class="edit-dock-status">
          Tap the map to set the pin location. The preview shows how it will
          look after approval.
        </p>
        <button
          class="edit-dock-action cancel"
          type="button"
          onclick={() => additionProposalStore.cancelMapPin()}
        >
          Cancel
        </button>
      </div>
    {:else}
      <div
        bind:this={editChromeEl}
        class="event-placement-toolbar"
        role="status"
        aria-live="polite"
      >
        <div class="event-placement-copy">
          <strong>Choose a map pin location</strong>
          <span>
            Click or tap the map where this entry should appear. The preview
            pin shows how it will look after approval.
          </span>
        </div>
        <button
          class="event-placement-cancel"
          type="button"
          onclick={() => additionProposalStore.cancelMapPin()}
        >
          Cancel
        </button>
      </div>
    {/if}
  {:else if isMapPinSuggestMode()}
    <div
      bind:this={editChromeEl}
      class="edit-dock map-edit-dock"
      role="status"
      aria-live="polite"
    >
      <p class="edit-dock-status">
        Drag the highlighted pin, then release to submit for review.
      </p>
    </div>
  {:else if isMapEditEnabled()}
    {#if md.current}
      <div
        bind:this={editChromeEl}
        class="edit-dock map-edit-dock"
        role="status"
        aria-live="polite"
      >
        {#if editStatusMessage}
          <p class="edit-dock-status">{editStatusMessage}</p>
        {/if}
        <div class="edit-dock-actions">
          <button
            class="edit-dock-action"
            disabled={!undoMove || undoingEditKey !== null}
            onclick={undoLastMove}
            title={undoMove
              ? `Undo move for ${undoMove.name}`
              : "No move to undo yet"}
            aria-label="Undo last pin move"
          >
            <Undo2 size={18} />
            <span>Undo</span>
          </button>
          <button
            class="edit-dock-action"
            disabled={!redoMove || undoingEditKey !== null}
            onclick={redoMoveBranch}
            title={redoMove
              ? `Redo move for ${redoMove.name}`
              : "No move to redo yet"}
            aria-label="Redo last pin move"
          >
            <Redo2 size={18} />
            <span>Redo</span>
          </button>
        </div>
      </div>
    {:else}
      <div
        bind:this={editChromeEl}
        class="map-edit-toolbar"
        role="status"
        aria-live="polite"
      >
        <div class="map-edit-summary">
          <div class="map-edit-copy">
            <strong>Editing map</strong>
            <span>
              {editStatusMessage ??
                `Click pins for details or drag to move. ${undoShortcutLabel} undo, ${undoShortcutLabel.replace("Z", "Y")} redo.`}
            </span>
          </div>
        </div>
        <div class="map-edit-actions">
          <button
            class="map-edit-action"
            disabled={!undoMove || undoingEditKey !== null}
            onclick={undoLastMove}
            title={undoMove
              ? `Undo move for ${undoMove.name}`
              : "No move to undo yet"}
            aria-label="Undo last pin move"
          >
            {#if undoingEditKey && undoMove}
              Undoing
            {:else}
              Undo
            {/if}
          </button>
          <button
            class="map-edit-action"
            disabled={!redoMove || undoingEditKey !== null}
            onclick={redoMoveBranch}
            title={redoMove
              ? `Redo move for ${redoMove.name}`
              : "No move to redo yet"}
            aria-label="Redo last pin move"
          >
            {#if undoingEditKey && redoMove}
              Redoing
            {:else}
              Redo
            {/if}
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .map-shell {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .map-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: auto;
  }

  /* Marker wrappers are stacking contexts (transform), so pin-level z-index
     can't lift a pin above sibling markers — raise the wrapper instead. */
  .map-container :global(.maplibregl-marker:has(.map-entity-pin.sponsored)) {
    z-index: 2;
  }

  .map-shell :global(.edit-dock),
  .map-shell :global(.map-edit-toolbar),
  .map-shell :global(.event-placement-toolbar) {
    pointer-events: auto;
    z-index: 18;
  }

  .map-edit-toolbar {
    position: fixed;
    right: calc(
      var(--map-ui-padding, 0.5rem) + var(--bottom-fab-inset, 3.75rem)
    );
    bottom: calc(
      var(--status-bar-block-height, 2.75rem) +
        var(--bottom-fab-gap, var(--map-ui-padding, 0.5rem)) +
        env(safe-area-inset-bottom, 0px)
    );
    left: calc(
      var(--map-search-chrome-width, min(31rem, calc(100vw - 15rem))) +
        var(--map-ui-padding, 0.5rem) + var(--bottom-fab-gap, 0.5rem)
    );
    z-index: 18;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: auto;
    min-width: 0;
    max-width: calc(
      100% - var(--map-search-chrome-width, min(31rem, calc(100vw - 15rem))) -
        var(--map-ui-padding, 0.5rem) * 2 - var(--bottom-fab-inset, 3.75rem) -
        var(--bottom-fab-gap, 0.5rem) * 2
    );
    min-height: 2.5rem;
    padding: 0.25rem 0.25rem 0.25rem 0.625rem;
    border: 1px solid hsla(160, 52%, 32%, 0.35);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(12px);
    color: hsl(0, 0%, 12%);
    font-size: 0.8125rem;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
    pointer-events: auto;
  }

  .map-edit-summary {
    display: flex;
    min-width: 0;
    align-items: center;
  }

  .map-edit-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.05rem;
    padding-left: 0.1rem;
  }

  .map-edit-copy strong {
    color: hsl(160, 84%, 18%);
    font-size: 0.75rem;
    line-height: 1.15;
  }

  .map-edit-copy span {
    display: block;
    min-width: 0;
    overflow: hidden;
    color: hsl(0, 0%, 24%);
    font-size: 0.75rem;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .map-edit-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding-left: 0.25rem;
  }

  .map-edit-action {
    flex: 0 0 auto;
    min-width: 3.75rem;
    overflow: hidden;
    padding: 0.3125rem 0.625rem;
    border: none;
    border-radius: 999px;
    background: hsl(160, 84%, 26%);
    color: white;
    cursor: pointer;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .map-edit-action:hover:not(:disabled) {
    background: hsl(160, 84%, 20%);
  }

  .map-edit-action:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .event-placement-toolbar {
    position: fixed;
    right: calc(
      var(--map-ui-padding, 0.5rem) + var(--bottom-fab-inset, 3.75rem)
    );
    bottom: calc(
      var(--status-bar-block-height, 2.75rem) +
        var(--bottom-fab-gap, var(--map-ui-padding, 0.5rem)) +
        env(safe-area-inset-bottom, 0px)
    );
    left: calc(
      var(--map-search-chrome-width, min(31rem, calc(100vw - 15rem))) +
        var(--map-ui-padding, 0.5rem) + var(--bottom-fab-gap, 0.5rem)
    );
    z-index: 18;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: auto;
    min-width: 0;
    max-width: calc(
      100% - var(--map-search-chrome-width, min(31rem, calc(100vw - 15rem))) -
        var(--map-ui-padding, 0.5rem) * 2 - var(--bottom-fab-inset, 3.75rem) -
        var(--bottom-fab-gap, 0.5rem) * 2
    );
    min-height: 2.5rem;
    padding: 0.25rem 0.25rem 0.25rem 0.625rem;
    border: 1px solid hsla(5, 53%, 32%, 0.35);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(12px);
    color: hsl(0, 0%, 12%);
    font-size: 0.8125rem;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
    pointer-events: auto;
  }

  .event-placement-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.05rem;
  }

  .event-placement-copy strong {
    color: #7b1113;
    font-size: 0.78rem;
    line-height: 1.15;
  }

  .event-placement-copy span {
    display: block;
    min-width: 0;
    overflow: hidden;
    color: hsl(0, 0%, 24%);
    font-size: 0.75rem;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-placement-cancel {
    flex: 0 0 auto;
    min-width: 3.75rem;
    padding: 0.3125rem 0.625rem;
    border: none;
    border-radius: 999px;
    background: #7b1113;
    color: white;
    cursor: pointer;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .event-placement-cancel:hover:not(:disabled) {
    background: #5f0d0f;
  }

  .event-placement-cancel:disabled {
    cursor: progress;
    opacity: 0.55;
  }

  .edit-dock {
    position: fixed;
    left: max(0.5rem, env(safe-area-inset-left, 0px));
    right: calc(
      var(--bottom-fab-inset, 3.25rem) +
        max(0.5rem, env(safe-area-inset-right, 0px))
    );
    bottom: calc(
      var(--status-bar-block-height, 2.75rem) +
        var(--bottom-fab-gap, var(--map-ui-padding, 0.5rem)) +
        env(safe-area-inset-bottom, 0px)
    );
    z-index: 18;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.375rem;
    min-width: 0;
    min-height: 2rem;
    max-height: 2.75rem;
    padding: 0.25rem 0.375rem 0.25rem 0.625rem;
    border: 1px solid hsla(160, 52%, 32%, 0.35);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
    pointer-events: auto;
  }

  .event-placement-dock {
    border-color: hsla(5, 53%, 32%, 0.35);
  }

  .edit-dock-status {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    color: hsl(0, 0%, 24%);
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .edit-dock-actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.375rem;
  }

  .edit-dock-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    flex: 0 0 auto;
    min-width: 2.25rem;
    min-height: 2rem;
    padding: 0.25rem 0.625rem;
    border: none;
    border-radius: 999px;
    background: hsl(160, 84%, 26%);
    color: white;
    cursor: pointer;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .edit-dock-action :global(svg) {
    flex-shrink: 0;
  }

  .edit-dock-action span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .edit-dock-action:hover:not(:disabled) {
    background: hsl(160, 84%, 20%);
  }

  .edit-dock-action:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .edit-dock-action.cancel {
    background: #7b1113;
  }

  .edit-dock-action.cancel:hover:not(:disabled) {
    background: #5f0d0f;
  }

  .user-location-pin {
    width: 1rem;
    height: 1rem;
    background-color: #4285f4;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 70;
  }

  /* Navigation puck (#966): a white disc with a heading arrow, GMaps-style.
     Without a heading the arrow is hidden and only the disc shows, so the
     puck never points somewhere the device did not actually report. */
  .user-location-puck {
    position: relative;
    z-index: 70;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 6px rgb(0 0 0 / 0.35);
  }

  .user-location-puck::before {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    background: #4285f4;
  }

  .user-location-puck--heading::before {
    /* Arrowhead pointing along the reported bearing. */
    width: 0;
    height: 0;
    border-right: 0.4375rem solid transparent;
    border-bottom: 0.75rem solid #4285f4;
    border-left: 0.4375rem solid transparent;
    border-radius: 0;
    background: none;
    rotate: var(--puck-rotation, 0deg);
    transition: rotate 300ms linear;
  }

  @media (prefers-reduced-motion: reduce) {
    .user-location-puck--heading::before {
      transition: none;
    }
  }

  .measure-waypoint {
    display: flex;
    width: 1.5rem;
    height: 1.5rem;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    border-radius: 50%;
    background-color: #7c3aed;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
    cursor: pointer;
    position: relative;
    z-index: 71;
  }

  .measure-waypoint:focus-visible {
    outline: 2px solid white;
    outline-offset: 1px;
  }

  /* Numbered intermediate stops while Get Directions is open (#966). */
  .directions-waypoint {
    display: flex;
    width: 1.5rem;
    height: 1.5rem;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    border-radius: 50%;
    background-color: var(--color-brand, #8d1437);
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
    cursor: pointer;
    position: relative;
    z-index: 72;
  }

  .directions-waypoint:focus-visible {
    outline: 2px solid white;
    outline-offset: 1px;
  }

  .addition-draft-pin {
    width: 1.125rem;
    height: 1.125rem;
    background-color: hsl(5, 53%, 42%);
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
    position: relative;
    z-index: 71;
  }

  .event-marker-anchor {
    position: relative;
    z-index: 80;
    display: block;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .event-anchor-dot {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    width: 0.7rem;
    height: 0.7rem;
    border: 2px solid white;
    border-radius: 999px;
    background: #7b1113;
    box-shadow:
      0 0 0 0.14rem rgba(123, 17, 19, 0.22),
      0 0.15rem 0.35rem rgba(0, 0, 0, 0.24);
    translate: -50% -50%;
    pointer-events: none;
  }

  .event-anchor-connector {
    position: absolute;
    top: -0.05rem;
    left: 0.05rem;
    z-index: 1;
    display: none;
    width: 2rem;
    height: 0.2rem;
    border-radius: 999px;
    background: rgba(123, 17, 19, 0.72);
    box-shadow: 0 0 0 2px white;
    transform: rotate(-38deg);
    transform-origin: left center;
    pointer-events: none;
  }

  .event-marker-anchor.anchored .event-anchor-connector {
    display: block;
  }

  .event-callout {
    position: absolute;
    bottom: 0.68rem;
    left: 0;
    z-index: 3;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    translate: -50% 0;
    pointer-events: auto;
  }

  .event-callout.anchored {
    bottom: 1.08rem;
    left: 1.32rem;
    translate: 0 0;
  }

  .event-edit-pin {
    all: unset;
    position: absolute;
    bottom: 0.68rem;
    left: 0;
    z-index: 90;
    display: inline-flex;
    min-width: 4.75rem;
    min-height: 3rem;
    align-items: center;
    gap: 0.35rem;
    padding: 0.22rem 0.35rem 0.22rem 0.22rem;
    border: 2px solid white;
    border-radius: 999px;
    background: #7b1113;
    color: white;
    cursor: grab;
    line-height: 1;
    pointer-events: auto;
    touch-action: none;
    box-shadow:
      0 0 0 0.2rem rgba(250, 204, 21, 0.92),
      0 0.55rem 1.1rem rgba(0, 0, 0, 0.34);
    transform-origin: bottom center;
    translate: -50% 0;
  }

  .event-edit-pin::after {
    content: "";
    position: absolute;
    top: calc(100% - 0.2rem);
    left: 50%;
    width: 0.55rem;
    height: 0.55rem;
    border-right: 2px solid white;
    border-bottom: 2px solid white;
    background: inherit;
    pointer-events: none;
    rotate: 45deg;
    translate: -50% 0;
  }

  .event-edit-pin.hovered,
  .event-edit-pin.editing {
    transform: scale(1.05);
  }

  .event-edit-pin.editing {
    cursor: grabbing;
  }

  .event-edit-icon,
  .event-edit-handle {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
  }

  .event-edit-icon {
    width: 2.2rem;
    height: 2.2rem;
    background: rgba(255, 255, 255, 0.18);
  }

  .event-edit-handle {
    width: 2.25rem;
    height: 2.25rem;
    margin-left: 0.1rem;
    background: rgba(255, 255, 255, 0.16);
  }

  .event-edit-copy {
    display: grid;
    min-width: 0;
    gap: 0.12rem;
    pointer-events: none;
  }

  .event-edit-copy span,
  .event-edit-copy strong {
    overflow: hidden;
    max-width: 9rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-edit-copy span {
    font-size: 0.72rem;
    font-weight: 900;
    line-height: 1.05;
  }

  .event-edit-copy strong {
    font-size: 0.62rem;
    line-height: 1;
    text-transform: uppercase;
  }

  .event-edit-pin.saving {
    box-shadow:
      0 0 0 0.22rem hsl(45, 94%, 47%),
      0 0.55rem 1.1rem rgba(0, 0, 0, 0.34);
  }

  .event-edit-pin.saved {
    box-shadow:
      0 0 0 0.22rem hsl(145, 63%, 42%),
      0 0.55rem 1.1rem rgba(0, 0, 0, 0.34);
  }

  .event-edit-pin.failed {
    box-shadow:
      0 0 0 0.22rem hsl(0, 72%, 51%),
      0 0.55rem 1.1rem rgba(0, 0, 0, 0.34);
  }

  .event-pin-stack {
    position: relative;
    margin-top: 0.5rem;
    display: grid;
    width: min(15rem, calc(100vw - 2rem));
    overflow: hidden;
    border: 2px solid white;
    border-radius: 1rem;
    background: white;
    box-shadow:
      0 0 0 0.16rem rgba(123, 17, 19, 0.28),
      0 0.55rem 1.15rem rgba(0, 0, 0, 0.34);
  }

  .event-stack-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    padding: 0.42rem 0.45rem 0.42rem 0.6rem;
    background: #7b1113;
    color: white;
  }

  .event-stack-heading {
    display: grid;
    min-width: 0;
    gap: 0.1rem;
  }

  .event-stack-heading strong {
    font-size: 0.72rem;
    line-height: 1;
    text-transform: uppercase;
  }

  .event-stack-heading span {
    overflow: hidden;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-stack-close {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.35rem;
    height: 1.35rem;
    flex: 0 0 auto;
    border: 1px solid rgba(255, 255, 255, 0.42);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    cursor: pointer;
    color: white;
  }

  .event-stack-close:hover,
  .event-stack-close:focus-visible {
    background: rgba(255, 255, 255, 0.28);
  }

  .event-stack-close:focus-visible {
    outline: 2px solid white;
    outline-offset: 1px;
  }

  .event-stack-list {
    display: grid;
    gap: 1px;
    background: #eee1e1;
  }

  .event-stack-item {
    all: unset;
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    align-items: center;
    gap: 0.45rem;
    padding: 0.42rem 0.5rem;
    background: white;
    color: #18181b;
    cursor: pointer;
  }

  .event-stack-item:hover,
  .event-stack-item:focus-visible,
  .event-stack-item.active {
    background: #fdf3f3;
  }

  .event-stack-item:focus-visible {
    outline: 2px solid #7b1113;
    outline-offset: -2px;
  }

  .event-stack-thumb,
  .event-stack-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
  }

  .event-stack-thumb {
    object-fit: contain;
    background: hsl(0, 0%, 96%);
  }

  .event-stack-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #fdf3f3;
    color: #7b1113;
  }

  .event-stack-copy {
    display: grid;
    min-width: 0;
    gap: 0.16rem;
  }

  .event-stack-title {
    overflow: hidden;
    color: #7b1113;
    font-size: 0.76rem;
    font-weight: 900;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-stack-meta {
    color: #71717a;
    font-size: 0.62rem;
    font-weight: 800;
    line-height: 1;
    text-transform: uppercase;
  }

  @media (max-width: 48rem) {
    .event-edit-pin {
      min-height: 3.35rem;
      padding-right: 0.42rem;
    }

    .event-edit-icon,
    .event-edit-handle {
      width: 2.55rem;
      height: 2.55rem;
    }

    .event-edit-copy span,
    .event-edit-copy strong {
      max-width: 7rem;
    }

    .event-pin-stack {
      width: min(13rem, calc(100vw - 1rem));
    }
  }

  .event-route-stop-pin {
    position: relative;
    z-index: 64;
    display: flex;
    width: 1.35rem;
    height: 1.35rem;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    border-radius: 50%;
    background: #7b1113;
    color: white;
    font-size: 0.72rem;
    font-weight: 800;
    box-shadow: 0 2px 0.5rem rgba(0, 0, 0, 0.32);
  }

  .event-route-stop-label {
    position: absolute;
    bottom: calc(100% + 0.35rem);
    left: 50%;
    translate: -50% 0;
    width: max-content;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    background: white;
    color: #18181b;
    font-size: 0.72rem;
    font-weight: 700;
    opacity: 0;
    pointer-events: none;
    box-shadow: 0 2px 0.5rem rgba(0, 0, 0, 0.2);
  }

  .event-route-stop-pin:hover .event-route-stop-label {
    opacity: 1;
  }

  .schedule-route-stop-pin {
    all: unset;
    position: relative;
    z-index: 66;
    box-sizing: border-box;
    display: flex;
    width: 1.45rem;
    height: 1.45rem;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    border-radius: 50%;
    background: #2563eb;
    color: white;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 800;
    box-shadow: 0 2px 0.5rem rgba(0, 0, 0, 0.32);
    transition:
      background-color 0.15s ease,
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  .schedule-route-stop-pin.routed {
    background: #7b1113;
  }

  .schedule-route-stop-pin.focused,
  .schedule-route-stop-pin:hover,
  .schedule-route-stop-pin:focus-visible {
    transform: translateY(-1px) scale(1.08);
    box-shadow:
      0 0 0 0.18rem rgba(250, 204, 21, 0.88),
      0 2px 0.5rem rgba(0, 0, 0, 0.32);
  }

  .schedule-route-stop-pin:focus-visible {
    outline: 2px solid #7b1113;
    outline-offset: 3px;
  }

  .schedule-route-stop-label {
    position: absolute;
    bottom: calc(100% + 0.35rem);
    left: 50%;
    translate: -50% 0;
    width: max-content;
    max-width: 12rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    background: white;
    color: #18181b;
    font-size: 0.72rem;
    font-weight: 700;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-shadow: 0 2px 0.5rem rgba(0, 0, 0, 0.2);
  }

  .schedule-route-stop-pin.focused .schedule-route-stop-label,
  .schedule-route-stop-pin:hover .schedule-route-stop-label,
  .schedule-route-stop-pin:focus-visible .schedule-route-stop-label {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .schedule-route-stop-pin {
      transition: none;
    }
  }

  .jeepney-stop-pin {
    --stop-color: #dc2626;
    all: unset;
    box-sizing: border-box;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    background-color: var(--stop-color);
    border: 2px solid white;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
    cursor: pointer;
    position: relative;
    z-index: 50;
    touch-action: manipulation;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  .jeepney-stop-pin:hover,
  .jeepney-stop-pin--hovered,
  .jeepney-stop-pin--selected,
  .jeepney-stop-pin:focus-visible {
    transform: scale(1.12);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  }

  .jeepney-stop-pin--selected {
    z-index: 52;
    outline: 2px solid white;
    outline-offset: 2px;
  }

  .jeepney-stop-pin:focus-visible {
    outline: 2px solid hsl(5, 53%, 32%);
    outline-offset: 2px;
  }

  .jeepney-stop-pin .stop-index {
    pointer-events: none;
  }

  .jeepney-stop-pin .stop-label {
    position: absolute;
    bottom: calc(100% + 0.4rem);
    left: 50%;
    translate: -50% 0;
    background-color: white;
    color: hsl(0, 0%, 15%);
    border-radius: 0.5rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
    max-width: min(14rem, calc(100vw - 2rem));
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .jeepney-stop-pin:hover .stop-label,
  .jeepney-stop-pin--hovered .stop-label,
  .jeepney-stop-pin--selected .stop-label,
  .jeepney-stop-pin:focus-visible .stop-label {
    opacity: 1;
  }
</style>
