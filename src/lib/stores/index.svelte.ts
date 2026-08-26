// src/lib/store.svelte.ts

import { CAMPUS_BOUNDS } from "@constants/map-terrain";
import { describeLocationFix } from "@lib/geolocation";
import { campusTransit } from "../../campus.config";
import { getJSONFetch, getLocalRoomByCode } from "../local/data/utils.js";
import type { BuildingTypeFilter } from "@constants/building-types";
import type { ClassMapValue } from "@lib/types";
import type { RouteTotals } from "../campus-route.js";
import { orderDayStops, type Weekday } from "../schedule-import/day-stops.js";
import { matchImportedScheduleRows } from "../schedule-import/match-classes.js";
import type { ClassQueryPage } from "../classes-api.js";
import type {
  ImportedScheduleRow,
  ScheduleMatchResult,
} from "../schedule-import/types.js";
import { ROOM_SCHEDULE_SCOPE_NOTE } from "../amis/room-scheduled-types.js";
import { dismissEphemeralOverlays } from "../overlay-stack.js";
import {
  deactivateMapModesExcept,
  registerMapMode,
  type ExclusiveMapMode,
} from "./map-modes.js";
import {
  SCHEDULE_IMPORT_SS_KEY,
  type ScheduleImportPersisted,
  syncTableLabel,
  type AppBootstrapPhase,
  type EventPlacementDraft,
  type FloatingControlPanel,
  type LandingModalTab,
  type MapProposalTarget,
  type MapToolsSection,
  type OfflineStatus,
  type QueryStoreState,
  type SyncActivity,
  type SyncInfo,
  type SyncTableKey,
  type TerrainStatus,
} from "./store-types.js";

export type { BuildingTypeFilter };
export type {
  AppBootstrapPhase,
  EventPlacementDraft,
  ExclusiveMapMode,
  FloatingControlPanel,
  LandingModalTab,
  MapProposalTarget,
  MapToolsSection,
  OfflineStatus,
  QueryStoreState,
  SyncActivity,
  SyncInfo,
  SyncTableKey,
  TerrainStatus,
};
export { deactivateMapModesExcept, syncTableLabel };
export type { MeasureLeg, MeasureSummaries } from "./map-stores.svelte";

type RoomData = {
  id: number;
  code: string;
  directions: string | null;
  building: {
    name: string;
    lat: number | null;
    lon: number | null;
    directions: string | null;
  } | null;
  buildingId: number | null;
  collegeId: number | null;
  divisionId: number | null;
  collegeName: string | null;
  divisionName: string | null;
  imageUrl?: string | null;
  version: number;
  updatedAt: string;
};

export {
  buildingTypeFilter,
  dormFilter,
  type DormFilterType,
} from "./filter-stores.svelte.js";
import { buildingTypeFilter } from "./filter-stores.svelte.js";

let _currentRoom = $state<RoomData | null>(null);
let _currentRoomNotFound = $state(false);
let roomLoadGeneration = 0;
export const currentRoom = {
  get value() {
    return _currentRoom;
  },
  /** True only after a lookup completed without a match. While null and not
   * notFound, the room is still being fetched (or a fetch is about to start),
   * so panels should show a loading state rather than "not found". */
  get notFound() {
    return _currentRoomNotFound;
  },
  async getRoomByCode(code: string) {
    // Overlapping lookups: only the newest may write. Otherwise a slow
    // earlier fetch lands last and stamps notFound from a stale result.
    const generation = ++roomLoadGeneration;
    _currentRoom = null;
    _currentRoomNotFound = false;
    try {
      const localRoom = await getLocalRoomByCode(code);
      if (localRoom === null) {
        const codeParam = encodeURI(code.toUpperCase());
        const remoteRoomReq = await getJSONFetch<{ data: RoomData }>(
          `/api/rooms?code=${codeParam}`,
        );
        if (generation !== roomLoadGeneration) return;
        _currentRoom = remoteRoomReq.data;
        return;
      }
      if (generation !== roomLoadGeneration) return;
      _currentRoom = localRoom;
    } catch (e) {
      console.error(e);
      if (generation !== roomLoadGeneration) return;
      _currentRoom = null;
    } finally {
      if (generation === roomLoadGeneration) {
        _currentRoomNotFound = _currentRoom === null;
      }
    }
  },
  async getRoomFromSearch(room: RoomData) {
    roomLoadGeneration++;
    _currentRoom = room;
    _currentRoomNotFound = false;
  },
  setRoom(room: RoomData) {
    roomLoadGeneration++;
    _currentRoom = room;
    _currentRoomNotFound = false;
  },
};

// Domain store modules
import {
  ModalStore,
  QueryStore,
  ToastStore,
  FloatingControlPanelStore,
  SidebarStore,
  SidePanelStore,
} from "./ui-stores.svelte";
import {
  MapStore,
  MapViewStore,
  MapToolsStore,
  TerrainStore,
  TrailStore,
  TravelTimeStore,
  MeasureRouteStore,
  Building3DStore,
} from "./map-stores.svelte";
import {
  EditorChromeStore,
  MapEditStore,
  MapProposalStore,
  AdditionProposalStore,
  EventPlacementStore,
} from "./editor-stores.svelte";
import {
  AppBootstrapStore,
  SyncToastStore,
  OfflineStore,
} from "./sync-stores.svelte";
import {
  TermStore,
  RoomClassesStore,
  ClassVenuesStore,
  PlannerBuildingsStore,
} from "./data-stores.svelte";
import { PlannerStore } from "./planner-store.svelte";
import { TransitStore } from "./transit-store.svelte";
import { AnnouncementsStore } from "./announcements-store.svelte";
import {
  DirectionsStore,
  MAX_DIRECTIONS_WAYPOINTS,
} from "./directions-store.svelte";
export { MAX_DIRECTIONS_WAYPOINTS };

export { plannerRoomCodes } from "./data-stores.svelte";

class LocationStore {
  coords: [number, number] | null = $state(null);
  /** Horizontal accuracy from the browser GPS fix, meters. */
  accuracyMeters: number | null = $state(null);
  bearing: number | null = $state(null);
  isTracking: boolean = $state(false);
  destination: [number, number] | null = $state(null);
  routeOrigin: [number, number] | null = $state(null);
  /** Multi-stop foot route (schedule import or 2-point fallback). */
  routeWaypoints: [number, number][] | null = $state(null);
  private watchId: number | null = null;
  /** Avoid re-toasting every watch tick; still toast once when accuracy improves. */
  private announcedGoodFix = false;
  private announcedApproximateFix = false;

  private isWithinBounds(lng: number, lat: number) {
    return (
      lng >= CAMPUS_BOUNDS.minLng &&
      lng <= CAMPUS_BOUNDS.maxLng &&
      lat >= CAMPUS_BOUNDS.minLat &&
      lat <= CAMPUS_BOUNDS.maxLat
    );
  }

  requestLocation = () => {
    if (!navigator.geolocation) {
      toastStore.show("Geolocation is not supported by your browser.", "error");
      return;
    }

    if (this.isTracking) {
      if (!this.coords) {
        toastStore.show("Still getting your location...", "info");
      }
      return;
    }

    this.isTracking = true;
    this.announcedGoodFix = false;
    this.announcedApproximateFix = false;
    toastStore.show("Requesting location access...", "info");

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { longitude, latitude, heading, accuracy } = position.coords;

        if (!this.isWithinBounds(longitude, latitude)) {
          toastStore.show(
            "You appear to be outside the UPLB Campus. Location features are limited to the campus area.",
            "error",
          );
          this.stopTracking();
          return;
        }

        this.coords = [longitude, latitude];
        this.accuracyMeters =
          Number.isFinite(accuracy) && accuracy > 0 ? accuracy : null;
        this.bearing = heading;
        // Update route origin if destination exists but origin hasn't been set
        if (this.destination && !this.routeOrigin) {
          this.routeOrigin = [longitude, latitude];
        }

        const fix = describeLocationFix(this.accuracyMeters);
        if (fix.level === "good" && !this.announcedGoodFix) {
          this.announcedGoodFix = true;
          toastStore.show(fix.message, "success");
        } else if (
          fix.level === "approximate" &&
          !this.announcedApproximateFix &&
          !this.announcedGoodFix
        ) {
          this.announcedApproximateFix = true;
          toastStore.show(fix.message, "info");
        }
      },
      (error) => {
        let msg = "An unknown error occurred while getting location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "Location access denied. Please enable it in your settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            msg = "Location request timed out.";
            break;
        }
        toastStore.show(msg, "error");
        this.stopTracking();
      },
      // maximumAge 0: avoid a stale cell/Wi‑Fi fix that can place you hundreds
      // of meters away (common indoors / on LTE). Keep watching for a better GPS fix.
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  };

  private stopTracking() {
    this.isTracking = false;
    this.coords = null;
    this.accuracyMeters = null;
    this.routeOrigin = null;
    this.announcedGoodFix = false;
    this.announcedApproximateFix = false;
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  setDestination = (coords: [number, number]) => {
    this.destination = coords;
    this.routeOrigin = this.coords;
    this.routeWaypoints = null;
  };

  clearDestination = () => {
    this.destination = null;
    this.routeOrigin = null;
    this.routeWaypoints = null;
  };

  setRouteWaypoints = (waypoints: [number, number][] | null) => {
    this.routeWaypoints = waypoints;
    if (waypoints && waypoints.length >= 2) {
      this.destination = null;
      this.routeOrigin = null;
    }
  };

  clearRouteWaypoints = () => {
    this.routeWaypoints = null;
  };
}

class JeepneyStore {
  /** Transit/jeepney layer visible (search chip or map tools). */
  layerActive: boolean = $state(false);
  selectedRouteId: string | null = $state(null);
  menuOpen: boolean = $state(false);
  selectedStopIndex: number | null = $state(null);
  hoveredStopIndex: number | null = $state(null);
  /** Route shown in the jeepney-route modal (independent of the map layer). */
  modalRouteId: string | null = $state(null);

  toggleMenu = () => {
    this.menuOpen = !this.menuOpen;
  };

  closeMenu = () => {
    this.menuOpen = false;
  };

  toggleLayer = () => {
    if (this.layerActive) {
      this.layerActive = false;
      this.menuOpen = false;
      return;
    }
    this.enableLayer();
  };

  enableLayer = () => {
    if (!campusTransit.enabled) return;
    this.layerActive = true;
    mapToolsStore.close();
    deactivateMapModesExcept("routes");
    // Transit is mutually exclusive with building/dorm pin filters: reset to
    // All so filtered pins don't overlap jeepney routes/stops (#325). This
    // covers every enable path (search chip, map tools flyout, route picker).
    buildingTypeFilter.set("all");
  };

  disableLayer = () => {
    this.layerActive = false;
    this.selectedRouteId = null;
    this.menuOpen = false;
    this.closeStop();
  };

  selectRoute = (id: string) => {
    if (!campusTransit.enabled) return;
    if (!this.layerActive) {
      this.enableLayer();
    }
    const nextId = this.selectedRouteId === id ? null : id;
    if (nextId !== this.selectedRouteId) {
      this.closeStop();
    }
    this.selectedRouteId = nextId;
    this.menuOpen = false;
    if (this.selectedRouteId !== null) {
      deactivateMapModesExcept("routes");
    }
  };

  clearRoute = () => {
    this.selectedRouteId = null;
    this.closeStop();
  };

  /** Activate the layer with `id` selected (no toggle, unlike selectRoute). */
  openRouteOnMap = (id: string) => {
    if (!campusTransit.enabled) return;
    this.enableLayer();
    if (this.selectedRouteId !== id) this.closeStop();
    this.selectedRouteId = id;
    this.menuOpen = false;
  };

  openRouteModal = (id: string) => {
    if (!campusTransit.enabled) return;
    this.modalRouteId = id;
    modalStore.openModal("jeepney-route");
  };

  setHoveredStop = (index: number | null) => {
    this.hoveredStopIndex = index;
  };

  openStop = (index: number) => {
    if (this.selectedRouteId === null) return;
    this.selectedStopIndex = index;
    this.hoveredStopIndex = index;
    sidePanelStore.expand();
  };

  closeStop = () => {
    this.selectedStopIndex = null;
    this.hoveredStopIndex = null;
  };
}

class AdminAuthStore {
  isLoggedIn: boolean = $state(false);
  username: string | null = $state(null);
  displayName: string | null = $state(null);
  role: "admin" | "editor" | "contributor" | null = $state(null);
  canPublish: boolean = $state(false);
  canReview: boolean = $state(false);
  loading: boolean = $state(false);
  loginOpen: boolean = $state(false);
  /** Which tab the login modal opens on — "signup" from the "create account"
   * entry points, "signin" everywhere else. */
  loginInitialMode: "signin" | "signup" = $state("signin");
  /** Error code from a failed OAuth redirect (`?auth_error=`). */
  oauthError: string | null = $state(null);
  accountSettingsOpen: boolean = $state(false);
  manageUsersOpen: boolean = $state(false);
  private _hydrated = false;

  private applySession(data: {
    loggedIn?: boolean;
    admin?: boolean;
    username: string | null;
    displayName?: string | null;
    role?: "admin" | "editor" | "contributor" | null;
    canPublish?: boolean;
    canReview?: boolean;
  }) {
    this.isLoggedIn = data.loggedIn ?? data.admin ?? false;
    this.username = data.username;
    this.displayName = data.displayName ?? data.username;
    this.role = data.role ?? null;
    this.canPublish = data.canPublish ?? false;
    this.canReview = data.canReview ?? false;
    if (data.canReview) void proposalsStore.refresh();
    if (this.isLoggedIn) void plannerStore.enableAccountSync();
    else plannerStore.disableAccountSync();
  }

  hydrate = async () => {
    if (this._hydrated) return;
    this._hydrated = true;
    await this.refresh();
  };

  refresh = async () => {
    try {
      const res = await fetch("/api/admin/auth", {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        loggedIn?: boolean;
        admin?: boolean;
        username: string | null;
        displayName?: string | null;
        role?: "admin" | "editor" | "contributor" | null;
        canPublish?: boolean;
        canReview?: boolean;
      };
      this.applySession(data);
    } catch {
      this.isLoggedIn = false;
      this.username = null;
      this.displayName = null;
      this.role = null;
      this.canPublish = false;
      this.canReview = false;
    }
  };

  login = async (
    username: string,
    password: string,
    turnstileToken?: string | null,
  ): Promise<string | null> => {
    this.loading = true;
    try {
      const formData = new FormData();
      formData.set("username", username.trim());
      formData.set("password", password);
      if (turnstileToken) formData.set("turnstileToken", turnstileToken);

      const res = await fetch("/api/admin/auth", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const data = await res.json().catch(
        () =>
          ({}) as {
            error?: string;
            username?: string;
            displayName?: string;
            role?: "admin" | "editor" | "contributor";
            canPublish?: boolean;
            canReview?: boolean;
          },
      );
      if (!res.ok) {
        return (
          data.error ??
          (res.status === 401
            ? "Invalid username or password"
            : res.status === 429
              ? "Too many sign-in attempts. Wait about 30 seconds and try again."
              : res.status >= 500
                ? "Sign-in failed on our side. Try again later."
                : "Could not sign in. Check your username and password.")
        );
      }
      this.applySession({
        loggedIn: true,
        username: data.username ?? username.trim().toLowerCase(),
        displayName: data.displayName,
        role: data.role ?? "editor",
        canPublish: data.canPublish,
        canReview: data.canReview,
      });
      this.loginOpen = false;
      return null;
    } catch {
      return "Network error. Try again.";
    } finally {
      this.loading = false;
    }
  };

  /** Self-signup a contributor account (attribution + username reservation).
   * Logs the new account in on success. Resolves to an error message or null. */
  signup = async (input: {
    username: string;
    password: string;
    email?: string;
    displayName?: string;
    turnstileToken?: string | null;
  }): Promise<string | null> => {
    this.loading = true;
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: input.username.trim(),
          password: input.password,
          email: input.email?.trim() || undefined,
          displayName: input.displayName?.trim() || undefined,
          turnstileToken: input.turnstileToken ?? undefined,
        }),
      });
      const data = await res.json().catch(
        () =>
          ({}) as {
            error?: string;
            username?: string;
            displayName?: string;
            role?: "admin" | "editor" | "contributor";
            canPublish?: boolean;
            canReview?: boolean;
          },
      );
      if (!res.ok) {
        return (
          data.error ??
          (res.status === 409
            ? "That username is already taken. Try another."
            : res.status === 429
              ? "Too many sign-up attempts. Wait about a minute and try again."
              : res.status >= 500
                ? "Sign-up failed on our side. Try again later."
                : "Could not create your account. Check the form and try again.")
        );
      }
      this.applySession({
        loggedIn: true,
        username: data.username ?? input.username.trim().toLowerCase(),
        displayName: data.displayName,
        role: data.role ?? "contributor",
        canPublish: data.canPublish,
        canReview: data.canReview,
      });
      this.loginOpen = false;
      return null;
    } catch {
      return "Network error. Try again.";
    } finally {
      this.loading = false;
    }
  };

  /** Start Google OAuth (#456); resolves to an error message or redirects away. */
  loginWithGoogle = async (): Promise<string | null> => {
    try {
      const [{ isSupabaseConfigured }, { createBrowserSupabaseClient }] =
        await Promise.all([
          import("@lib/supabase/env"),
          import("@lib/supabase/client"),
        ]);
      if (!isSupabaseConfigured()) {
        return "Google sign-in is not configured on this server.";
      }
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) return error.message;
      return null;
    } catch {
      return "Google sign-in failed to start. Try again.";
    }
  };

  /** Start Google OAuth to link an identity onto the *already logged-in*
   * account (Account settings → Connect Google), distinct from
   * `loginWithGoogle` which creates/logs into a new account. */
  linkGoogle = async (): Promise<string | null> => {
    try {
      const [{ isSupabaseConfigured }, { createBrowserSupabaseClient }] =
        await Promise.all([
          import("@lib/supabase/env"),
          import("@lib/supabase/client"),
        ]);
      if (!isSupabaseConfigured()) {
        return "Google sign-in is not configured on this server.";
      }
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/link-callback`,
        },
      });
      if (error) return error.message;
      return null;
    } catch {
      return "Google sign-in failed to start. Try again.";
    }
  };

  logout = async () => {
    try {
      await fetch("/api/admin/auth", {
        method: "DELETE",
        credentials: "same-origin",
      });
    } catch {
      // ignore — we're going to clear local state regardless.
    }
    this.isLoggedIn = false;
    this.username = null;
    this.displayName = null;
    this.role = null;
    this.canPublish = false;
    this.canReview = false;
    proposalsStore.pendingCount = 0;
    proposalsStore.proposals = [];
    plannerStore.disableAccountSync();
  };

  openLogin = (mode: "signin" | "signup" = "signin") => {
    dismissEphemeralOverlays();
    modalStore.closeModal();
    this.loginInitialMode = mode;
    this.loginOpen = true;
  };

  closeLogin = () => {
    this.loginOpen = false;
    this.oauthError = null;
  };

  openAccountSettings = () => {
    dismissEphemeralOverlays();
    modalStore.closeModal();
    this.accountSettingsOpen = true;
  };

  closeAccountSettings = () => {
    this.accountSettingsOpen = false;
  };

  openManageUsers = () => {
    dismissEphemeralOverlays();
    modalStore.closeModal();
    this.manageUsersOpen = true;
  };

  closeManageUsers = () => {
    this.manageUsersOpen = false;
  };
}

class ProposalsStore {
  pendingCount = $state(0);
  open = $state(false);
  loading = $state(false);
  proposals = $state<
    Array<{
      id: number;
      entityType: string;
      entityId: number;
      entityLabel: string;
      status: string;
      submitterName: string;
      proposedPatch: Record<string, unknown>;
      adminNote?: string | null;
      /** Contributor's message to the reviewer, never published (#873). */
      submitterNote?: string | null;
      createdAt: string;
      baseVersion: number;
      currentValues?: Record<string, unknown> | null;
      currentVersion?: number | null;
    }>
  >([]);

  refresh = async () => {
    if (!adminAuthStore.canReview) {
      this.pendingCount = 0;
      this.proposals = [];
      return;
    }
    this.loading = true;
    try {
      const res = await fetch("/api/admin/proposals", {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        pendingCount?: number;
        proposals?: ProposalsStore["proposals"];
      };
      this.pendingCount = data.pendingCount ?? 0;
      this.proposals = data.proposals ?? [];
    } catch {
      // ignore
    } finally {
      this.loading = false;
    }
  };

  toggle = () => {
    this.open = !this.open;
    if (this.open) void this.refresh();
  };

  close = () => {
    this.open = false;
  };
}

class ScheduleRouteStore {
  importedRows = $state<ImportedScheduleRow[]>([]);
  matches = $state<ScheduleMatchResult[]>([]);
  selectedWeekday = $state<Weekday>("M");
  routedWeekday: Weekday | null = $state(null);
  /** Walking totals for the routed day, from the map's OSRM response (#839). */
  routeTotals: RouteTotals | null = $state(null);
  /** One-shot /today?route=1 deep link: route today's classes on mount (#839). */
  pendingDayRoute = $state(false);
  focusedStopIndex: number | null = $state(null);
  matching = $state(false);
  importError: string | null = $state(null);
  private _roomCoordCache = new Map<string, [number, number] | null>();
  private _hydrated = false;

  scopeNote = ROOM_SCHEDULE_SCOPE_NOTE;

  dayStops = $derived(orderDayStops(this.matches, this.selectedWeekday));

  unresolved = $derived(
    this.matches.filter((match) => match.unresolvedReason !== null),
  );

  hasImport = $derived(this.importedRows.length > 0);

  init = () => {
    if (this._hydrated || typeof window === "undefined") return;
    this._hydrated = true;
    try {
      const raw = sessionStorage.getItem(SCHEDULE_IMPORT_SS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ScheduleImportPersisted;
      if (parsed.selectedWeekday) {
        this.selectedWeekday = parsed.selectedWeekday;
      }
    } catch (e) {
      console.error("Failed to hydrate schedule weekday:", e);
    }
  };

  private persist = () => {
    if (typeof window === "undefined") return;
    const payload: ScheduleImportPersisted = {
      selectedWeekday: this.selectedWeekday,
    };
    sessionStorage.setItem(SCHEDULE_IMPORT_SS_KEY, JSON.stringify(payload));
  };

  private async resolveRoomCoords(
    roomCode: string,
  ): Promise<[number, number] | null> {
    const normalized = roomCode.trim().toUpperCase();
    if (this._roomCoordCache.has(normalized)) {
      return this._roomCoordCache.get(normalized) ?? null;
    }

    let coords: [number, number] | null = null;
    try {
      const localRoom = await getLocalRoomByCode(normalized);
      const room = localRoom
        ? localRoom
        : (
            await getJSONFetch<{ data: RoomData }>(
              `/api/rooms?code=${encodeURIComponent(normalized)}`,
            )
          ).data;
      const lat = room?.building?.lat;
      const lon = room?.building?.lon;
      if (lat != null && lon != null) {
        coords = [lon, lat];
      }
    } catch (e) {
      console.error(`Failed to resolve room ${normalized}:`, e);
    }

    this._roomCoordCache.set(normalized, coords);
    return coords;
  }

  private async fetchClassesForTerm(
    termId: number | null,
  ): Promise<ClassMapValue[]> {
    const pageSize = 100;
    let cursor: string | null = null;
    const classes: ClassMapValue[] = [];

    while (true) {
      const params = new URLSearchParams({ limit: String(pageSize) });
      if (termId != null) params.set("term_id", String(termId));
      if (cursor) params.set("cursor", cursor);

      const page = await getJSONFetch<ClassQueryPage>(
        `/api/classes?${params.toString()}`,
      );
      classes.push(...page.rows);
      if (!page.hasMore || !page.nextCursor || page.rows.length === 0) {
        return classes;
      }
      cursor = page.nextCursor;
    }
  }

  rematch = async () => {
    if (this.importedRows.length === 0) {
      this.matches = [];
      return;
    }

    this.matching = true;
    this.importError = null;
    try {
      const classes = await this.fetchClassesForTerm(termStore.activeTermId);
      const uniqueRooms = new Set<string>();
      for (const row of classes) {
        if (row.roomCode) uniqueRooms.add(row.roomCode.trim().toUpperCase());
      }
      await Promise.all(
        [...uniqueRooms].map((code) => this.resolveRoomCoords(code)),
      );

      this.matches = matchImportedScheduleRows(
        this.importedRows,
        classes,
        (roomCode) =>
          this._roomCoordCache.get(roomCode.trim().toUpperCase()) ?? null,
      );
    } catch (e) {
      console.error("Schedule match failed:", e);
      this.importError = "Could not load classes for matching. Try again.";
      this.matches = [];
    } finally {
      this.matching = false;
    }
  };

  /** Load the active planner plan's sections as the routed schedule. */
  importFromPlanner = async () => {
    plannerStore.init();
    const rows: ImportedScheduleRow[] = (
      plannerStore.activePlan?.sections ?? []
    ).map(({ courseCode, section, type, schedule }) => ({
      courseCode,
      section,
      type,
      schedule,
    }));
    this.importedRows = rows;
    this.importError = null;
    this._roomCoordCache.clear();
    this.clearRoute();
    await this.rematch();
    return rows.length > 0;
  };

  selectWeekday = (weekday: Weekday) => {
    this.selectedWeekday = weekday;
    this.clearRoute();
    this.persist();
  };

  focusStop = (index: number) => {
    this.focusedStopIndex = this.dayStops[index] ? index : null;
  };

  clearRoute = () => {
    this.routedWeekday = null;
    this.routeTotals = null;
    this.focusedStopIndex = null;
    locationStore.clearRouteWaypoints();
  };

  /**
   * Map.svelte forwards these from the directions fetch; a 2-point
   * destination route fires the same event, so only a routed day keeps them.
   */
  setRouteTotals = (totals: RouteTotals | null) => {
    this.routeTotals = this.routedWeekday === null ? null : totals;
  };

  routeDay = (weekday: Weekday = this.selectedWeekday) => {
    this.selectedWeekday = weekday;
    this.routeTotals = null;
    this.persist();
    const stops = orderDayStops(this.matches, weekday);
    const stopCoords = stops
      .map((stop) => stop.coords)
      .filter((coords): coords is [number, number] => coords !== null);

    if (stopCoords.length === 0) {
      this.clearRoute();
      toastStore.show("No routable classes on this day.", "info");
      return;
    }

    const waypoints: [number, number][] = [];
    if (locationStore.coords) {
      waypoints.push(locationStore.coords);
    }
    waypoints.push(...stopCoords);

    if (waypoints.length < 2) {
      this.clearRoute();
      toastStore.show(
        "Need at least two stops. Enable location or add more classes.",
        "error",
      );
      return;
    }

    locationStore.setRouteWaypoints(waypoints);
    this.routedWeekday = weekday;
    toastStore.show(
      `Routing ${stops.length} class stop${stops.length === 1 ? "" : "s"}.`,
      "success",
    );
  };

  clearImport = () => {
    this.importedRows = [];
    this.matches = [];
    this.importError = null;
    this._roomCoordCache.clear();
    this.clearRoute();
    this.persist();
  };
}

export const queryStore = new QueryStore();
export const termStore = new TermStore();
export const roomClassesStore = new RoomClassesStore();
export const classVenuesStore = new ClassVenuesStore();
export const plannerBuildingsStore = new PlannerBuildingsStore();
export const plannerStore = new PlannerStore(() => termStore.activeTermId);
export const scheduleRouteStore = new ScheduleRouteStore();
export const offlineStore = new OfflineStore();
export const modalStore = new ModalStore();
export const toastStore = new ToastStore();
export const locationStore = new LocationStore();
export const mapStore = new MapStore();
export const mapViewStore = new MapViewStore();
export const floatingControlPanelStore = new FloatingControlPanelStore();
export const mapToolsStore = new MapToolsStore();
export const editorChromeStore = new EditorChromeStore();
export const mapEditStore = new MapEditStore();
export const mapProposalStore = new MapProposalStore();
export const additionProposalStore = new AdditionProposalStore();
export const eventPlacementStore = new EventPlacementStore();
export const terrainStore = new TerrainStore();
export const trailStore = new TrailStore();
export const travelTimeStore = new TravelTimeStore();
export const measureRouteStore = new MeasureRouteStore();
export const jeepneyStore = new JeepneyStore();
export const transitStore = new TransitStore();
export const announcementsStore = new AnnouncementsStore();
export const directionsStore = new DirectionsStore();
// Get directions used to also set locationStore.destination (OSRM). Clear it
// on close so Map.svelte does not redraw the foot polyline after the modal goes.
directionsStore.onClose = () => {
  locationStore.clearDestination();
};
export const appBootstrapStore = new AppBootstrapStore();
export const syncToastStore = new SyncToastStore();
export const building3DStore = new Building3DStore();
export const adminAuthStore = new AdminAuthStore();
export const proposalsStore = new ProposalsStore();
export const sidebarStore = new SidebarStore();
export const sidePanelStore = new SidePanelStore();

// Map modes (edit, jeepney routes, Makiling terrain) are mutually exclusive.
registerMapMode("edit", {
  disable: () => {
    mapEditStore.close();
    eventPlacementStore.cancel();
  },
});
registerMapMode("routes", {
  disable: () => {
    jeepneyStore.disableLayer();
  },
});
registerMapMode("terrain", {
  disable: () => {
    terrainStore.disable();
  },
});
registerMapMode("travel-time", {
  disable: () => {
    travelTimeStore.disable();
  },
});
registerMapMode("measure", {
  disable: () => {
    measureRouteStore.disable();
  },
});
