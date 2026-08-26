import {
  announcementsTable,
  buildingsTable,
  dormsTable,
  eventLocationsTable,
  eventRouteStopsTable,
  eventRoutesTable,
  eventsTable,
  organizationsTable,
  placesTable,
  roomPositionsTable,
  termsTable,
} from "@drizzle/schema";
import type { QueryStoreState } from "./store.svelte";

export type AppData = {
  buildings: {
    [key: string]: {
      rooms: string[];
      directions: string;
      lat: number;
      lon: number;
      osm_link: string;
    };
  };
  colleges: {
    [key: string]: string[];
  };
  divisions: {
    [key: string]: string[];
  };
  rooms: {
    [key: string]: {
      building: string | null;
      college: string | null;
      division: string | null;
      classes: {
        course_code: string;
        section: string;
        type: "LAB" | "LEC" | "SEM";
        schedule: string[];
        course_title: string;
      }[];
    };
  };
};

type RoomData = {
  id: number;
  code: string;
  /** Unabbreviated readable name when the code is an abbreviation (#875). */
  fullName?: string | null;
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
  /** Room purpose category (#537): classroom | office | org-tambayan | … | null. */
  category?: string | null;
  version: number;
  updatedAt: string;
  floor?: number | null;
};

type BuildingData = typeof buildingsTable.$inferSelect;

type BuildingType = BuildingData["buildingType"];

type ClassMapValue = {
  courseCode: string | null;
  roomCode: string | null;
  section: string | null;
  type: string | null;
  schedule: string[] | null;
  directions: string | null;
  courseTitle: string | null;
  roomId: number | null;
  termId: number | null;
  id: number;
  /** Server-computed hint for unassigned sections (#846); assigned sections never carry it. */
  probableLocation?: import("./probable-location").ProbableLocation | null;
};

type FinalExamRow = {
  id: number;
  termId: number;
  courseCode: string;
  section: string | null;
  courseTitle: string | null;
  roomId: number | null;
  roomCode: string | null;
  examDate: string;
  startsAt: string;
  endsAt: string;
  source: string;
};

type CollegeData = {
  id: number;
  collegeName: string;
  version: number;
  updatedAt: string;
  floor?: number | null;
};

type DivisionData = {
  id: number;
  divisionName: string;
  collegeId: number | null;
  version: number;
  updatedAt: string;
  floor?: number | null;
};

type DormData = typeof dormsTable.$inferSelect;

type OrgData = typeof organizationsTable.$inferSelect;
type PlaceData = typeof placesTable.$inferSelect;
type AnnouncementData = typeof announcementsTable.$inferSelect;

type Term = typeof termsTable.$inferSelect;

// A term plus how many classes are tagged with it, for the term selector UI.
type TermWithCount = Term & { classCount: number };

type EventCategory = typeof eventsTable.$inferSelect.category;

type EventRecurrence = typeof eventsTable.$inferSelect.recurrence;

type EventLocationAnchorType =
  typeof eventLocationsTable.$inferSelect.anchorType;

type EventStatus = "active" | "upcoming" | "past";

type EventData = typeof eventsTable.$inferSelect & {
  status: EventStatus;
  occurrenceStartsAt: string;
  occurrenceEndsAt: string;
  locations: EventLocationData[];
  routes: EventRouteData[];
};

type EventLocationData = typeof eventLocationsTable.$inferSelect & {
  resolvedLat: number | null;
  resolvedLon: number | null;
  resolvedLabel: string;
  buildingName: string | null;
  dormName: string | null;
};

type EventRouteData = typeof eventRoutesTable.$inferSelect & {
  stops: EventRouteStopData[];
};

type EventRouteStopData = typeof eventRouteStopsTable.$inferSelect & {
  resolvedLat: number | null;
  resolvedLon: number | null;
  resolvedLabel: string;
};

type RoomPosition = typeof roomPositionsTable.$inferSelect;

interface ContributorInfo {
  name: string;
  href?: string;
  img_alt?: string;
}

interface DeveloperInfo {
  name: string;
  href?: string;
  img_alt?: string;
}

interface RecentSearch {
  category: Exclude<QueryStoreState["category"], null>;
  value: string;
  eventSlug?: string;
}

type TableSyncInfo = {
  valid: boolean;
  newKey: string | null;
};

type EntityLoadResult<T> = {
  rows: T[];
  source: "remote" | "cache";
};

/** Chromium-only `beforeinstallprompt` event; absent from TypeScript's DOM lib. */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
