<script lang="ts">
  import { onMount } from "svelte";
  import "@lib/maplibre-worker";
  import type { InitialSearchState } from "@lib/app-data";
  import { getAppData } from "@lib/context";
  import { findCampusPointBySlug } from "@lib/route-links";
  import { campusTransit } from "../../campus.config";
  import {
    modalStore,
    queryStore,
    sidePanelStore,
    locationStore,
    toastStore,
    building3DStore,
    adminAuthStore,
    mapEditStore,
    mapToolsStore,
    mapViewStore,
    travelTimeStore,
    measureRouteStore,
    editorChromeStore,
    jeepneyStore,
    appBootstrapStore,
    plannerStore,
    scheduleRouteStore,
    termStore,
    sidebarStore,
    announcementsStore,
  } from "@lib/store.svelte";
  import { isRecentSearch } from "@lib/locStorage";
  import { decodeSharePlan } from "@lib/planner/share-codec";
  import { resolveSharedPlan } from "@lib/planner/import-shared";
  import Modal from "@ui/modal/Modal.svelte";
  import MainControls from "@ui/controls/MainControls.svelte";
  import Map from "@ui/Map.svelte";
  import MapAttribution from "@ui/MapAttribution.svelte";
  import MeasureRoutePanel from "@ui/MeasureRoutePanel.svelte";
  import CameraDebugHud from "@ui/CameraDebugHud.svelte";
  import MapContextMenu from "@ui/map-chrome/MapContextMenu.svelte";
  import TravelTimeLegend from "@ui/TravelTimeLegend.svelte";
  import Toast from "@ui/Toast.svelte";
  import Building3DViewer from "@ui/Building3DViewer.svelte";
  import AdminLoginModal from "@ui/AdminLoginModal.svelte";
  import AccountSettingsModal from "@ui/AccountSettingsModal.svelte";
  import ManageUsersModal from "@ui/modal/ManageUsersModal.svelte";
  import EditorAdditionModal from "@ui/EditorAdditionModal.svelte";
  import PlannerScreen from "@ui/planner/PlannerScreen.svelte";
  import FinalExamsScreen from "@ui/final-exams/FinalExamsScreen.svelte";
  import AcademicCalendarScreen from "@ui/calendar/AcademicCalendarScreen.svelte";
  import TodayScreen from "@ui/today/TodayScreen.svelte";
  import EntityUrlSync from "@ui/EntityUrlSync.svelte";
  import EntityHoverPreview from "@ui/map/EntityHoverPreview.svelte";
  import "./map-chrome/map-chrome.css";
  import { observeBlockHeight } from "@lib/layout-css-vars";
  import {
    dispatchGlobalShortcut,
    getGlobalShortcutAction,
  } from "@lib/keyboard-shortcuts";
  import { dismissEphemeralOverlays } from "@lib/overlay-stack";
  import { openCampusBrowse } from "@lib/browse-campus";
  import { getTransitRoutePath, getTransitStopPath } from "@lib/transit-urls";
  import { shouldAutoOpenLandingModal } from "@lib/landing-modal-auto-open";
  import StagingBanner from "./StagingBanner.svelte";
  import AnnouncementBar from "./AnnouncementBar.svelte";
  import KeyboardShortcutsPopup from "./map-chrome/KeyboardShortcutsPopup.svelte";
  import DesktopTopBar from "./map-chrome/DesktopTopBar.svelte";
  import MapControlsStack from "./map-chrome/MapControlsStack.svelte";
  import MapToolsFlyout from "./MapToolsFlyout.svelte";
  import MobileBottomNav from "./map-chrome/MobileBottomNav.svelte";
  import { MediaQuery } from "svelte/reactivity";
  import type { RecentSearch } from "@lib/types";

  type Props = {
    initialSearch?: InitialSearchState;
    suppressLandingModal?: boolean;
    openToday?: boolean;
    openPlanner?: boolean;
    openFinals?: boolean;
    openCalendar?: boolean;
  };

  const mobile = new MediaQuery("max-width:48rem");
  const {
    initialSearch,
    suppressLandingModal = false,
    openToday = false,
    openPlanner = false,
    openFinals = false,
    openCalendar = false,
  }: Props = $props();

  const updateData = (queryHistory: RecentSearch[]) => {
    localStorage.setItem("recent-search", JSON.stringify(queryHistory));
  };

  // Capture one-shot URL params (editor=login, auth_error, account, share
  // codes) at script init. Child components like EntityUrlSync normalize the
  // URL in their onMount, which fires before this parent component's onMount,
  // so reading window.location.search there would see an already-stripped URL.
  const initialUrlSearch =
    typeof window !== "undefined" ? window.location.search : "";

  const appData = getAppData();

  onMount(() => {
    // Session state drives account-backed planner sync too. This belongs at the
    // app root: /planner renders without the map-only location control that
    // used to hydrate auth, so direct planner visits were treated as guests.
    void adminAuthStore.hydrate();

    // Cache-first: the sidebar badge and the critical bar need announcements
    // before the user opens anything.
    announcementsStore.init();

    const recentSearchesLS = localStorage.getItem("recent-search");
    try {
      const parsedSearches: unknown[] = JSON.parse(recentSearchesLS ?? "[]");
      parsedSearches.forEach((parsedSearch) => {
        if (isRecentSearch(parsedSearch)) {
          queryStore.addRecentSearch(parsedSearch);
        }
      });
    } catch {
      queryStore.recentSearches = [];
    }
    if (initialSearch) {
      queryStore.hydrateQuery({
        category: initialSearch.category,
        type: "result",
        value: initialSearch.value,
        eventSlug: initialSearch.eventSlug,
      });
    }

    const urlParams = new URLSearchParams(initialUrlSearch);

    if (urlParams.get("editor") === "login") {
      adminAuthStore.openLogin();
      window.history.replaceState({}, "", window.location.pathname);
    }

    const authError = urlParams.get("auth_error");
    if (authError) {
      adminAuthStore.oauthError = authError;
      adminAuthStore.openLogin();
      window.history.replaceState({}, "", window.location.pathname);
    }

    const accountEvent = urlParams.get("account");
    if (accountEvent === "email-changed") {
      toastStore.show("Email address updated.", "success");
      adminAuthStore.openAccountSettings();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (accountEvent === "google-linked") {
      toastStore.show("Google account connected.", "success");
      adminAuthStore.openAccountSettings();
      window.history.replaceState({}, "", window.location.pathname);
    }

    const accountError = urlParams.get("account_error");
    if (accountError) {
      const messages: Record<string, string> = {
        missing_token: "That confirmation link is missing its token.",
        invalid_or_expired_token:
          "That confirmation link is invalid or has expired. Request a new one.",
        not_logged_in:
          "Sign in first, then connect Google from account settings.",
        missing_code: "Google sign-in was cancelled or incomplete. Try again.",
        oauth_failed: "Connecting Google failed. Try again.",
        already_linked:
          "That Google account is already connected to a different Room TBA account.",
      };
      toastStore.show(
        messages[accountError] ?? "Something went wrong. Try again.",
        "error",
      );
      adminAuthStore.openAccountSettings();
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (urlParams.get("contribute") === "1") {
      editorChromeStore.openAdditionModal();
      window.history.replaceState({}, "", window.location.pathname);
    }

    // 3D deep link: /building/<slug>/?3d=1 opens the building's 3D viewer.
    if (urlParams.get("3d") === "1" && initialSearch?.category === "building") {
      building3DStore.open(initialSearch.value);
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Jeepney deep link: ?jeepney=<routeId>[&stop=<index>] opens the route on
    // the map (and focuses a stop when given). Shared from the route modal /
    // stop panel copy-link.
    const jeepneyRouteId = campusTransit.enabled
      ? urlParams.get("jeepney")
      : null;
    if (jeepneyRouteId) {
      openCampusBrowse(queryStore, sidePanelStore, "jeepney");
      jeepneyStore.openRouteOnMap(jeepneyRouteId);
      const stopParam = Number.parseInt(urlParams.get("stop") ?? "", 10);
      if (Number.isInteger(stopParam)) {
        jeepneyStore.openStop(stopParam);
      }
      window.history.replaceState(
        {},
        "",
        Number.isInteger(stopParam)
          ? getTransitStopPath(jeepneyRouteId, stopParam)
          : getTransitRoutePath(jeepneyRouteId),
      );
    }

    // /route/<from>/<to> sends its two endpoints here as slugs. Resolving them
    // against loaded campus data (rather than passing coordinates in the URL)
    // keeps the link stable when an editor moves a pin. On /today the same
    // param means "route my day" instead (handled below).
    const routeParam = urlParams.get("route");
    if (routeParam && !openToday) {
      const [fromSlug, toSlug] = routeParam.split(",");
      const waypoints = [fromSlug, toSlug]
        .map((slug) => (slug ? findCampusPointBySlug(appData(), slug) : null))
        .filter((point): point is [number, number] => point !== null);
      if (waypoints.length === 2) {
        locationStore.setRouteWaypoints(waypoints);
      }
      window.history.replaceState({}, "", window.location.pathname);
    }

    plannerStore.init();

    // /planner deep link (prop set by the planner.astro page). Driven by a prop,
    // not window.location, because the SPA URL router normalizes the path to "/"
    // on boot before this runs. ?term still flows through termStore.
    if (openPlanner) {
      void termStore.init();
      sidebarStore.changeOpened("planner");
    }

    // /final-exams deep link (prop set by final-exams.astro), same shape.
    if (openFinals) {
      void termStore.init();
      sidebarStore.changeOpened("finals");
    }

    // /calendar deep link (prop set by calendar.astro), same shape.
    if (openCalendar) {
      void termStore.init();
      sidebarStore.changeOpened("calendar");
    }

    // /today deep link (prop set by today.astro), same shape.
    if (openToday) {
      void termStore.init();
      sidebarStore.changeOpened("today");
      // /today?route=1 routes today's classes once the screen mounts (#839).
      if (routeParam === "1") {
        scheduleRouteStore.pendingDayRoute = true;
      }
    }

    const planParam = urlParams.get("plan");
    if (planParam) {
      window.history.replaceState({}, "", window.location.pathname);
      const decoded = decodeSharePlan(planParam);
      if (!decoded) {
        toastStore.show("That plan link is invalid.", "error");
      } else {
        void termStore
          .init()
          .then(() => resolveSharedPlan(decoded))
          .then(({ sections, missing }) => {
            plannerStore.importShared(decoded.termId, sections);
            if (termStore.terms.some((term) => term.id === decoded.termId)) {
              termStore.setTerm(decoded.termId);
            }
            sidebarStore.changeOpened("planner");
            if (missing > 0) {
              toastStore.show(
                `${missing} shared ${missing === 1 ? "section is" : "sections are"} no longer offered.`,
                "info",
              );
            }
          });
      }
    }
  });

  let landingModalAutoOpenConsumed = $state(false);

  $effect(() => {
    if (
      !shouldAutoOpenLandingModal({
        consumed: landingModalAutoOpenConsumed,
        phase: appBootstrapStore.phase,
        suppressLandingModal,
        hideLandingModal: localStorage.getItem("hideLandingModal") === "true",
        modalOpen: modalStore.open,
      })
    ) {
      return;
    }
    landingModalAutoOpenConsumed = true;
    // Auto-open counts as seen: the welcome tour shows once per browser, not
    // on every visit. Reopen stays available from the app menu.
    localStorage.setItem("hideLandingModal", "true");
    modalStore.openModal("landing");
  });
  $effect(() => {
    updateData(queryStore.recentSearches);
  });

  let mapToolsStackEl = $state<HTMLDivElement | null>(null);
  let bottomChromeEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    const el = mapToolsStackEl;
    if (!el) return;
    return observeBlockHeight(el, "--map-tools-block-height", {
      shouldSkip: () => window.matchMedia("(max-width: 48rem)").matches,
      skipValue: "0px",
    });
  });

  $effect(() => {
    const el = bottomChromeEl;
    const root = document.querySelector(".app-layout") as HTMLElement | null;
    if (!root) return;

    // Desktop redesign has no bottom nav; keep side-panel insets sane.
    if (!el) {
      root.style.setProperty("--status-bar-block-height", "0px");
      root.style.setProperty("--mobile-bottom-nav-height", "0px");
      root.style.setProperty(
        "--side-panel-bottom-inset-measured",
        "calc(1rem + env(safe-area-inset-bottom, 0px))",
      );
      return;
    }

    let rafId = 0;
    let lastHeight = "";
    let lastInset = "";

    const sync = () => {
      rafId = 0;
      const rect = el.getBoundingClientRect();
      const height = `${Math.max(0, Math.round(rect.height))}px`;
      const inset = `${Math.max(0, Math.round(window.innerHeight - rect.top))}px`;

      if (height !== lastHeight) {
        lastHeight = height;
        root.style.setProperty("--status-bar-block-height", height);
        root.style.setProperty("--mobile-bottom-nav-height", height);
      }
      if (inset !== lastInset) {
        lastInset = inset;
        root.style.setProperty("--side-panel-bottom-inset-measured", inset);
      }
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(sync);
    };

    sync();
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      if (rafId) cancelAnimationFrame(rafId);
    };
  });

  function handleKeydown(e: KeyboardEvent) {
    const action = getGlobalShortcutAction(e);
    if (action) {
      e.preventDefault();
      dispatchGlobalShortcut(action);
      return;
    }

    if (e.key === "Escape") {
      dismissEphemeralOverlays();
      if (modalStore.open) {
        modalStore.closeModal();
      } else if (building3DStore.buildingName) {
        building3DStore.close();
      } else if (adminAuthStore.loginOpen) {
        adminAuthStore.closeLogin();
      } else if (editorChromeStore.additionModalOpen) {
        editorChromeStore.closeAdditionModal();
      } else if (mapToolsStore.open) {
        mapToolsStore.close();
      } else if (travelTimeStore.active) {
        travelTimeStore.disable();
      } else if (measureRouteStore.active) {
        measureRouteStore.disable();
      } else if (jeepneyStore.selectedStopIndex !== null) {
        jeepneyStore.closeStop();
      } else if (queryStore.inputValue !== "" || queryStore.type === "result") {
        queryStore.clearQuery();
        if (locationStore.destination) {
          locationStore.clearDestination();
        }
      }
      sidePanelStore.closePanel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<EntityUrlSync />
<EntityHoverPreview />

<div
  class="app-layout"
  class:edit-mode={mapEditStore.enabled}
  class:redesign-desktop={!mobile.current}
>
  <Map />
  <StagingBanner />
  <AnnouncementBar />
  <div class="ui-layer">
    {#if !mobile.current}
      <DesktopTopBar />
    {/if}
    {#if ["map", "contributors", "settings"].includes(sidebarStore.panelOpen)}
      {#if mobile.current}
        <div
          class="mobile-map-controls"
          class:mobile-map-controls--sheet-open={sidePanelStore.mobileSheetSnap !==
            "closed"}
          bind:this={mapToolsStackEl}
          aria-hidden={sidePanelStore.mobileSheetSnap !== "closed"}
        >
          <MapToolsFlyout />
          <MapControlsStack hideCompass />
        </div>
      {:else}
        <div class="desktop-map-controls" bind:this={mapToolsStackEl}>
          <MapToolsFlyout />
          <MapControlsStack />
        </div>
      {/if}
      {#if !mobile.current}
        <div class="map-attrib-corner">
          <MapAttribution />
        </div>
      {/if}
      <MapContextMenu />
      <div class="inner-layer">
        <MainControls />
        <div class="bottom-band">
          {#if travelTimeStore.active}
            <TravelTimeLegend />
          {/if}
          {#if measureRouteStore.active}
            <MeasureRoutePanel />
          {/if}
          {#if mapViewStore.cameraDebug}
            <CameraDebugHud />
          {/if}
        </div>
      </div>
    {:else if sidebarStore.panelOpen === "today"}
      <TodayScreen />
    {:else if sidebarStore.panelOpen === "planner"}
      <PlannerScreen />
    {:else if sidebarStore.panelOpen === "finals"}
      <FinalExamsScreen />
    {:else if sidebarStore.panelOpen === "calendar"}
      <AcademicCalendarScreen />
    {/if}
    {#if mobile.current}
      <div class="mobile-bottom-nav-slot" bind:this={bottomChromeEl}>
        <MobileBottomNav />
      </div>
    {/if}
  </div>
  {#if toastStore.message}
    <Toast
      message={toastStore.message}
      type={toastStore.type}
      onclose={() => toastStore.clear()}
    />
  {/if}
  <Modal />
  <KeyboardShortcutsPopup />
  {#if building3DStore.buildingName}
    <Building3DViewer name={building3DStore.buildingName} />
  {/if}
  {#if adminAuthStore.loginOpen}
    <AdminLoginModal />
  {/if}
  {#if adminAuthStore.accountSettingsOpen}
    <AccountSettingsModal />
  {/if}
  {#if adminAuthStore.manageUsersOpen}
    <ManageUsersModal />
  {/if}
  <EditorAdditionModal />
</div>

<style>
  .app-layout {
    --map-ui-padding: 0.5rem;
    /* Gap between bottom chrome and edit dock / map padding edge */
    --bottom-fab-gap: var(--map-ui-padding, 0.5rem);
    --bottom-chrome-gap: var(--bottom-fab-gap, 0.5rem);
    --search-block-height: 3.25rem;
    --staging-banner-height: 0px;
    /* Extra air between staging strip and search / top bar. Zero unless a
       banner is actually rendering: StagingBanner sets both vars together.
       Defaulting this to 0.5rem pushed the desktop top bar 8px off the top
       edge on production, where there is no banner to clear. */
    --staging-banner-gap: 0px;
    /* Top-left search card + drawer: use viewport minus right-side map chrome. */
    --map-search-chrome-width: min(31rem, calc(100vw - 15rem));
    --status-bar-block-height: 2rem;
    --side-panel-bottom-gap: 0.375rem;
    /* Measured at runtime from .bottom-chrome top edge (see Entry.svelte). */
    --side-panel-bottom-inset-measured: calc(
      var(--status-bar-block-height, 2.75rem) + var(--map-ui-padding, 0.5rem) +
        env(safe-area-inset-bottom, 0px)
    );
    --side-panel-bottom-inset: calc(
      var(--side-panel-bottom-inset-measured) +
        var(--side-panel-bottom-gap, 0.375rem)
    );
    --side-panel-top-inset: calc(
      var(--staging-banner-height, 0px) + var(--staging-banner-gap, 0.5rem) +
        var(--search-block-height, 3.25rem) + var(--map-ui-padding, 0.5rem) +
        var(--side-panel-top-gap, 0.75rem)
    );
    --side-panel-top-gap: 0.75rem;
    --drawer-peek-offset: 1.75rem;
    --map-tools-block-height: 3.25rem;
    --mobile-detail-sheet-top-inset: calc(
      var(--staging-banner-height, 0px) + var(--staging-banner-gap, 0.5rem) +
        var(--search-block-height) + var(--map-tools-block-height) +
        var(--map-ui-padding) * 2 + var(--mobile-detail-sheet-gap, 0.375rem)
    );
    --mobile-detail-sheet-gap: 0.375rem;
    --edit-bar-height: 0rem;
    --bottom-fab-inset: 3.75rem;
    --pill-padding-x: 0.875rem;
    --map-chrome-radius: 1rem;
    --map-chrome-toggle-size: 2.75rem;
    --map-chrome-toggle-radius: 0.625rem;
    /* Map chrome contrast: warm off-white surfaces + stronger edges so controls
       float above light basemap tiles without dimming the map itself. */
    --map-chrome-surface: hsl(5 20% 97%);
    --map-chrome-panel-bg: hsl(5 18% 96%);
    --map-chrome-border: hsl(5 10% 68%);
    --map-chrome-border-accent: hsl(5 40% 42%);
    --map-chrome-divider: hsl(5 12% 88%);
    --map-chrome-panel-accent-border: hsl(5 15% 78%);
    --map-chrome-band-backdrop: hsla(5, 22%, 96%, 0.82);
    --map-chrome-shadow:
      0 0 0 1px hsla(15, 8%, 20%, 0.14), 0 1px 3px hsla(0, 0%, 0%, 0.12),
      0 4px 12px hsla(0, 0%, 0%, 0.16), 0 10px 24px hsla(0, 0%, 0%, 0.1);
    --map-chrome-panel-shadow:
      0 0 0 1px hsla(15, 8%, 20%, 0.16), 0 2px 8px hsla(0, 0%, 0%, 0.14),
      0 8px 20px hsla(0, 0%, 0%, 0.18), 0 16px 32px hsla(0, 0%, 0%, 0.08);
    --map-chrome-fab-shadow:
      inset 0 0 0 1px hsla(0, 0%, 100%, 0.72), 0 2px 6px hsla(0, 0%, 0%, 0.2),
      0 6px 16px hsla(0, 0%, 0%, 0.14);
    --motion-duration-fast: 150ms;
    --motion-duration-micro: 200ms;
    --motion-duration-panel: 280ms;
    --motion-duration-shelf: 260ms;
    --motion-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
    --motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
    @media (prefers-reduced-motion: reduce) {
      --motion-duration-fast: 0ms;
      --motion-duration-micro: 0ms;
      --motion-duration-panel: 0ms;
      --motion-duration-shelf: 0ms;
    }
    /* Stacking contract — highest first; blocking overlays dismiss ephemeral chrome.
       map(0) < side-panel(2) < status-bar(5) < map-tools(15) < mobile-sheet(16)
       < chrome-popover(17) < search-elevated(18) < modal(100) < login-modal(200)
       < toast(1000). (#302) */
    --z-map: 0;
    --z-staging-banner: 20;
    --z-side-panel: 2;
    --z-search-elevated: 18;
    --z-status-bar: 5;
    --z-map-tools: 15;
    --z-mobile-sheet: 16;
    --z-chrome-popover: 17;
    --z-modal: 100;
    --z-login-modal: 200;
    --z-toast: 1000;

    width: 100%;
    height: 100dvh;
    /* clip, not hidden: `hidden` leaves a programmatically scrollable box, so
       overflowing chrome stays "reachable" to scripts while invisible to users
       and hides layout bugs like this one. Matches Layout.astro. */
    overflow-x: clip;
    overflow-y: hidden;
  }

  .app-layout.edit-mode {
    /* Keep the mobile detail drawer peek above the measured edit dock. */
    --side-panel-bottom-inset: calc(
      var(--side-panel-bottom-inset-measured) +
        var(--side-panel-bottom-gap, 0.375rem) + var(--edit-bar-height, 0rem) +
        var(--bottom-fab-gap, 0.5rem)
    );
  }

  .inner-layer {
    display: flex;
    flex-direction: column;
    padding: var(--map-ui-padding, 0.5rem);
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    width: 100%;
    pointer-events: none;
    gap: 0.5rem;
  }

  .bottom-band {
    position: relative;
    z-index: var(--z-status-bar, 3);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-end;
    flex-shrink: 0;
    width: 100%;
    /* The band is a flex item several levels below .app-layout, and an ancestor
       (.inner-layer) still carries flexbox's default `min-width: auto`. So the
       band's min-content width (the nowrap credits plus the status text)
       inflated it past the viewport, 719px at 320px, and every `max-width:100%`
       underneath resolved against that inflated width instead of the screen.
       Nothing could shrink, so the trailing controls laid out off-screen. That
       is the real cause of the clipping #893 worked around by wrapping the
       pill. Capping against the viewport fixes it at the source without
       reaching into the shared shell. */
    min-width: 0;
    max-width: 100vw;
    pointer-events: none;
  }

  .bottom-chrome {
    position: relative;
    z-index: var(--z-status-bar, 3);
    display: flex;
    flex-direction: row;
    /* The row carries a fixed-width credits block plus a fixed-width action
       column; below ~430px their sum exceeds the viewport and the trailing
       controls used to be clipped away entirely. Wrapping drops the action
       column onto its own line instead of pushing it off-screen. */
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.5rem;
    row-gap: 0.375rem;
    width: 100%;
    /* vw, not %: see .bottom-band. A percentage here resolves against an
       ancestor that has already been inflated past the screen. */
    max-width: 100vw;
    min-width: 0;
    min-height: 2rem;
    box-sizing: border-box;
    /* Transparent shell so the bar hugs its content on the left and the
       location controls sit on the right — no full-width empty stretch. */
    pointer-events: none;
  }

  /* The bordered pill only wraps the left cluster (attribution + menu +
     status), so it no longer sprawls across the whole viewport. */
  .bottom-chrome__bar {
    display: flex;
    flex-direction: row;
    /* Wraps, but the status is never what wraps. The regression this fixes was
       the status dropping onto a row of its own and reading as a second status
       bar stacked against the attribution. The cure for that is making the
       status shrinkable (it ellipsises, see .bottom-chrome__status), not
       forbidding the wrap: with nowrap, credits (a hard floor under basemap
       terms) plus a sync-error Retry could not both fit at 320px and the row
       overflowed the viewport by about a pixel instead. Wrapping lets an
       oversized action drop a line while the status stays beside the credits. */
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
    flex: 0 1 auto;
    min-width: 0;
    max-width: 100%;
    min-height: 2rem;
    background-color: var(--map-chrome-surface, hsl(5 20% 97%));
    backdrop-filter: blur(10px);
    border: 1px solid var(--map-chrome-border, hsl(5 10% 68%));
    border-radius: var(--map-chrome-radius, 1rem);
    padding: 0.125rem 0.375rem;
    box-shadow: var(
      --map-chrome-panel-shadow,
      0 0 0 1px hsla(15, 8%, 20%, 0.16),
      0 2px 8px hsla(0, 0%, 0%, 0.14),
      0 8px 20px hsla(0, 0%, 0%, 0.18)
    );
    box-sizing: border-box;
    pointer-events: auto;
  }

  .bottom-chrome__leading {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    align-self: center;
    min-width: 0;
  }

  .bottom-chrome__status {
    display: flex;
    /* basis 0, not auto. With flex-wrap on the pill, line breaks are decided
       from flex *base* sizes before any shrinking happens, so a content-sized
       status does not compress, it gets pushed onto its own row. That is the
       regression #905 fixed and #935 reintroduced by restoring the wrap while
       leaving the basis at auto. At basis 0 the status never forces a break:
       it grows into whatever is left beside the credits and ellipsises past
       that, so only an oversized sync action can take a second row. */
    flex: 1 1 0;
    align-items: center;
    min-width: 0;
    overflow: hidden;
  }

  /* The pill is one line, so the status text is what yields when the viewport
     cannot fit credits + status: it ellipsises instead of wrapping the pill
     onto a second row. Any sync action button beside it keeps its full width,
     so a Retry stays tappable at 320px. */
  .bottom-chrome__status :global(.sync-status),
  .bottom-chrome__status :global(.sync-status-copy) {
    min-width: 0;
  }

  .bottom-chrome__status :global(.sync-status-label),
  .bottom-chrome__status :global(.sync-status-detail) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bottom-chrome__status :global(.status-bar) {
    width: 100%;
    max-width: 100%;
    margin: 0;
    align-self: stretch;
    border: none;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
    border-radius: 0;
    padding: 0;
    min-height: 1.25rem;
  }

  .bottom-chrome__actions {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    /* Bottom-align controls so an open legend panel grows upward without
       floating +/locate over the panel body. */
    align-items: flex-end;
    gap: 0.375rem;
    padding: 0;
    /* Stay hard right once the row wraps this column onto its own line. */
    margin-left: auto;
    max-width: 100%;
    pointer-events: auto;
  }

  .bottom-chrome__actions :global(.map-legend--open) {
    position: relative;
    z-index: 2;
  }

  .bottom-chrome__actions :global(.map-control-stack.embedded) {
    position: relative;
    z-index: 1;
  }

  .bottom-chrome__actions :global(.map-chrome-control-btn--compact) {
    flex-shrink: 0;
  }
  .bottom-chrome__triggers {
    display: flex;
    /* A sixth chip must wrap, not clip (same failure the browse-chip row hit). */
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.375rem;
    align-items: flex-end;
    max-width: 100%;
  }

  .bottom-band::before {
    content: "";
    position: absolute;
    /* Bleed through inner-layer padding so the fade reaches the viewport edge. */
    left: calc(-1 * var(--map-ui-padding, 0.5rem));
    right: calc(-1 * var(--map-ui-padding, 0.5rem));
    bottom: calc(
      -1 * (var(--map-ui-padding, 0.5rem) + env(safe-area-inset-bottom, 0px))
    );
    height: calc(
      6rem + var(--map-ui-padding, 0.5rem) + env(safe-area-inset-bottom, 0px)
    );
    background: linear-gradient(
      to top,
      var(--map-chrome-surface) 0%,
      var(--map-chrome-band-backdrop) 14%,
      hsla(5, 22%, 96%, 0.35) 54%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 0;
  }

  :global(.map) {
    width: 100%;
    height: 100%;
  }

  .ui-layer {
    /* Fixed banner overlays the viewport; pin chrome below it.
       Do not use `inset: 0` here — it resets `top` back to 0. */
    position: fixed;
    top: calc(
      var(--staging-banner-height, 0px) + var(--staging-banner-gap, 0.5rem)
    );
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .app-layout.redesign-desktop {
    /* Fluid desktop chrome — Figma 1512 is the ceiling, not a fixed layout. */
    --desktop-top-bar-height: clamp(3rem, 5.5vh, 3.5625rem);
    --map-search-width: clamp(18rem, 28vw, 26rem);
    --map-search-pill-height: 2.375rem;
    --map-chip-height: 2rem;
    --map-search-chrome-width: clamp(18rem, 26vw, 22.5rem);
    --map-filter-gap: 0.375rem;
    /* Figma: locate/2D square; compass larger circle; zoom width=square, height≈2.2× */
    --map-ctrl-size: 2.25rem;
    --map-ctrl-compass: 3.25rem;
    --map-ctrl-zoom-h: 4.875rem;
    /* Side panel matches search / chip floating cards. */
    --map-chrome-surface: #fff;
    --map-chrome-panel-bg: #fff;
    --map-chrome-border: #e8e4e5;
    --map-chrome-panel-accent-border: transparent;
    --map-chrome-panel-shadow: var(--shadow-results, 0 2px 6px rgb(36 37 46 / 0.2));
    --map-chrome-radius: 0.75rem;
  }

  /* Compact panel chrome: Close + action chips like filter chips. */
  .app-layout.redesign-desktop
    :global(.drawer-card .entity-panel-close) {
    min-height: var(--map-chip-height, 1.875rem);
    min-width: 0;
    height: var(--map-chip-height, 1.875rem);
    padding: 0 0.55rem;
    border: none;
    border-radius: 0.5rem;
    background: #fff;
    color: var(--color-brand, #8d1437);
    font-size: 0.75rem;
    font-weight: 500;
    box-shadow: var(--shadow-search, 0 1px 3.5px rgb(58 58 71 / 0.2));
  }

  .app-layout.redesign-desktop
    :global(.drawer-card .entity-panel-close:hover),
  .app-layout.redesign-desktop
    :global(.drawer-card .entity-panel-close:focus-visible) {
    background: #fff;
    border-color: transparent;
    box-shadow:
      var(--shadow-search, 0 1px 3.5px rgb(58 58 71 / 0.2)),
      0 0 0 1px var(--color-brand, #8d1437);
  }

  .app-layout.redesign-desktop
    :global(.drawer-card .entity-panel-filter--search) {
    min-height: var(--map-search-pill-height, 2.25rem);
    border: none;
    border-radius: 0.5rem;
    box-shadow: var(--shadow-search, 0 1px 3.5px rgb(58 58 71 / 0.2));
  }

  .app-layout.redesign-desktop
    :global(.drawer-card .entity-panel-filter--search:focus-within) {
    outline: none;
    border-color: transparent;
    box-shadow:
      var(--shadow-search, 0 1px 3.5px rgb(58 58 71 / 0.2)),
      0 0 0 1px var(--color-brand, #8d1437);
  }

  .app-layout.redesign-desktop
    :global(.drawer-card .entity-panel-filter--search input) {
    padding: 0.35rem 0;
  }

  .app-layout.redesign-desktop
    :global(.drawer-card .map-chrome-action-chip),
  .app-layout.redesign-desktop
    :global(.drawer-card .map-chrome-action-chip--toolbar),
  .app-layout.redesign-desktop
    :global(.drawer-card .editor-toggle--toolbar) {
    min-height: var(--map-chip-height, 1.875rem);
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.5rem;
    background: #fff;
    color: var(--color-ink, #332529);
    font-size: 0.75rem;
    font-weight: 500;
    box-shadow: var(--shadow-search, 0 1px 3.5px rgb(58 58 71 / 0.2));
  }

  .app-layout.redesign-desktop
    :global(.drawer-card .map-chrome-action-chip:hover:not(:disabled)),
  .app-layout.redesign-desktop
    :global(.drawer-card .map-chrome-action-chip--toolbar:hover:not(:disabled)),
  .app-layout.redesign-desktop
    :global(.drawer-card .editor-toggle--toolbar:hover) {
    border-color: transparent;
    background: #fff;
    box-shadow:
      var(--shadow-search, 0 1px 3.5px rgb(58 58 71 / 0.2)),
      0 0 0 1px var(--color-brand, #8d1437);
  }

  .app-layout.redesign-desktop .inner-layer {
    padding-top: 0.75rem;
  }

  .desktop-map-controls {
    /* fixed: ui-layer is flex-column; absolute was resolving to static top. */
    position: fixed;
    top: auto;
    right: 0.75rem;
    bottom: calc(2.5rem + env(safe-area-inset-bottom, 0px));
    left: auto;
    z-index: var(--z-map-tools, 15);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.375rem;
    width: auto;
    height: auto;
    pointer-events: none;
  }

  .desktop-map-controls > :global(*) {
    pointer-events: auto;
  }

  /* Mobile 393 frame: controls above bottom nav (Figma spacing). */
  .mobile-map-controls {
    position: fixed;
    top: auto;
    right: 1rem;
    bottom: calc(var(--mobile-bottom-nav-height, 4.5rem) + 1rem);
    left: auto;
    z-index: var(--z-map-tools, 15);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    /* The tools FAB needs its own breathing room above the controls stack —
       without a row gap it sat flush against the location button. */
    row-gap: 0.5rem;
    pointer-events: none;
    opacity: 1;
    transition: opacity var(--motion-duration-micro, 200ms) ease;
  }

  .mobile-map-controls > :global(*) {
    pointer-events: auto;
  }

  /* Entity sheet open (peek or expanded): hide locate / 3D / zoom — they sit
     in the same corner as the sheet and otherwise paint on top of it. */
  .mobile-map-controls--sheet-open {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  .mobile-map-controls--sheet-open > :global(*) {
    pointer-events: none !important;
  }

  .mobile-bottom-nav-slot {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: var(--z-status-bar, 5);
    pointer-events: none;
  }

  .mobile-bottom-nav-slot > :global(*) {
    pointer-events: auto;
  }

  /* Bottom-right corner — white 40% rect (MapAttribution). */
  .map-attrib-corner {
    position: absolute;
    right: 0;
    bottom: 0;
    z-index: var(--z-map-tools, 15);
    max-width: min(100%, calc(100vw - 0.5rem));
    pointer-events: none;
  }

  .map-attrib-corner :global(.map-attribution) {
    pointer-events: auto;
  }

  @media (max-width: 48rem) {
    .app-layout {
      --mobile-bottom-nav-height: 4.5rem;
      /* 44px touch target. The token is only set on .redesign-desktop, so
         mobile fell through to the 1.875rem default and every browse chip
         rendered 34px tall, under the 44px this project enforces elsewhere
         (the bottom chrome's e2e asserts >= 43.5px on its trigger chips).
         Set on the layout rather than the chip so the row's own square
         controls, which size from the same token, grow with it. */
      --map-chip-height: 2.75rem;
    }

    .map-attrib-corner {
      bottom: var(--mobile-bottom-nav-height, 4.5rem);
      max-width: min(100%, calc(100vw - 5.5rem));
    }

    /* Keep Planner / Finals / Today clear of fixed bottom nav. */
    .ui-layer > :global(.planner-screen),
    .ui-layer > :global(.finals-screen),
    .ui-layer > :global(.today-screen),
    .ui-layer > :global(.acal-screen) {
      padding-bottom: calc(
        1rem + var(--mobile-bottom-nav-height, 4.5rem) +
          env(safe-area-inset-bottom, 0px)
      );
      box-sizing: border-box;
    }
  }

  /* Desktop redesign: no bottom-left chrome shell (was an empty white pill). */
  .app-layout.redesign-desktop .bottom-band::before {
    display: none;
  }


  .top-right-map-stack {
    position: absolute;
    top: calc(var(--map-ui-padding) + 2px);
    right: calc(var(--map-ui-padding) + 2px);
    z-index: var(--z-map-tools, 15);
    display: flex;
    width: min(22.5rem, calc(100% - 1rem));
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    padding-top: 2px;
    padding-right: 2px;
    overflow: visible;
    pointer-events: none;
  }

  .desktop-camera-controls {
    display: none;
    pointer-events: none;
  }

  /* #716: desktop-only — was @media (min-width: 48.0625rem), now gated by
     .desktop class on <html> (set by middleware + inline script) */
  :global(.desktop) .desktop-camera-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    pointer-events: none;
  }

  .camera-controls-card {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    box-sizing: border-box;
    gap: 0.125rem;
    padding: 0.1875rem;
    background-color: var(--map-chrome-surface, hsl(5 20% 97%));
    backdrop-filter: blur(10px);
    border: 1.5px solid var(--map-chrome-border, hsl(5 10% 68%));
    border-radius: var(--map-chrome-toggle-radius, 0.625rem);
    box-shadow: var(
      --map-chrome-shadow,
      0 0 0 1px hsla(0, 0%, 0%, 0.18),
      0 2px 6px hsla(0, 0%, 0%, 0.18),
      0 8px 20px hsla(0, 0%, 0%, 0.14)
    );
  }

  .camera-controls-card__divider {
    height: 2px;
    margin: 0.5rem 0.125rem;
    background-color: var(--map-chrome-divider, hsl(5 12% 70%));
  }

  @media (prefers-reduced-motion: reduce) {
    .app-layout {
      --motion-duration-fast: 0ms;
      --motion-duration-micro: 0ms;
      --motion-duration-panel: 0ms;
      --motion-duration-shelf: 0ms;
    }
  }

  @media (max-width: 48rem) {
    .app-layout {
      --map-ui-padding: 0.375rem;
      --map-search-inline-pad: 0.625rem;
      --bottom-fab-gap: 0.375rem;
      --bottom-chrome-gap: var(--bottom-fab-gap);
      --map-tools-block-height: 0px;
      /* search-block-height is the fixed mobile search shell (includes its
         top padding); do not add --staging-banner-gap again. */
      --mobile-detail-sheet-top-inset: calc(
        var(--staging-banner-height, 0px) + var(--search-block-height) +
          var(--mobile-detail-sheet-gap, 0.375rem)
      );
      --bottom-fab-inset: 3.25rem;
    }

    .inner-layer {
      padding: 0;
      gap: 0;
    }

    .bottom-chrome {
      gap: 0.25rem;
      min-height: 2rem;
      padding: 0.125rem max(0.375rem, env(safe-area-inset-left, 0px))
        calc(0.125rem + env(safe-area-inset-bottom, 0px))
        max(0.375rem, env(safe-area-inset-right, 0px));
      border-radius: 0;
      border-left: none;
      border-right: none;
      border-bottom: none;
      backdrop-filter: none;
    }

    .bottom-chrome__status :global(.status-bar) {
      min-height: 1.25rem;
      padding-bottom: 0;
    }

    .bottom-chrome__leading {
      padding-left: max(0.125rem, env(safe-area-inset-left, 0px));
    }

    .top-right-map-stack {
      position: fixed;
      inset: 0;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: auto;
      pointer-events: none;
      z-index: 16;
    }

    .top-right-map-stack :global(.map-chrome-fab-trigger) {
      display: none;
    }

    .top-right-map-stack :global(.map-chrome-panel) {
      position: fixed;
      /* Float below the search block with a gap, inset + rounded to match the
         search chrome, instead of butting edge-to-edge against the top bar. */
      top: calc(
        var(--staging-banner-height, 0px) + var(--staging-banner-gap, 0.5rem) +
          var(--search-block-height) + var(--map-ui-padding, 0.375rem)
      );
      right: var(--map-ui-padding, 0.375rem);
      left: var(--map-ui-padding, 0.375rem);
      width: auto;
      max-width: none;
      max-height: calc(
        100dvh - var(--staging-banner-height, 0px) -
          var(--staging-banner-gap, 0.5rem) - var(--search-block-height) -
          var(--map-ui-padding, 0.375rem) - var(--status-bar-block-height)
      );
      margin: 0;
      pointer-events: auto;
    }

    .top-right-map-stack :global(.map-tools-panel) {
      /* Hug content; scroll inside when a section is expanded. */
      min-height: 0;
      max-height: min(
        42dvh,
        calc(
          100dvh - var(--search-block-height) -
            var(--map-ui-padding, 0.375rem) - var(--status-bar-block-height) -
            0.5rem
        )
      );
      padding: 0.5rem 0.625rem;
      gap: 0.375rem;
    }

    .top-right-map-stack :global(.map-tools-panel .map-chrome-panel-header) {
      font-size: 0.875rem;
      padding: 0.125rem 0.125rem 0.375rem;
    }

    .top-right-map-stack :global(.map-tools-panel .map-chrome-panel-close) {
      width: 2.25rem;
      height: 2.25rem;
    }

    .top-right-map-stack :global(.map-tools-panel .map-chrome-panel-body) {
      flex: 0 1 auto;
      min-height: 0;
      gap: 0.25rem;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .top-right-map-stack
      :global(.map-tools-panel .map-chrome-accordion-toggle) {
      min-height: 2.125rem;
      padding: 0.375rem 0.5rem;
      font-size: 0.8125rem;
    }

    .top-right-map-stack :global(.map-tools-panel .map-chrome-accordion-body) {
      padding: 0.125rem 0 0.3125rem;
    }
  }
</style>
