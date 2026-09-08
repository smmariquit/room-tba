import type { AppActions, AppContextData } from "@lib/context";
import type {
  BuildingData,
  CollegeData,
  DivisionData,
  DormData,
  EventData,
  OrgData,
  PlaceData,
  RoomData,
} from "@lib/types";
import type { ProposalEntityType } from "@lib/services/proposal-service";
import {
  invalidateLocalSyncKeys,
  requestCampusDataRefresh,
} from "@lib/local/data/invalidate-sync-key";

const ENTITY_SYNC_TABLES: Partial<Record<ProposalEntityType, string[]>> = {
  building: ["buildings"],
  create_building: ["buildings"],
  dorm: ["dorms"],
  create_dorm: ["dorms"],
  place: ["places"],
  create_place: ["places"],
  college: ["colleges"],
  create_college: ["colleges"],
  division: ["divisions"],
  create_division: ["divisions"],
  room: ["rooms"],
  create_room: ["rooms", "buildings"],
  event: ["events"],
  create_event: ["events"],
  event_locations: ["events"],
  organization: ["organizations"],
  create_organization: ["organizations"],
  jeepney_stop: ["jeepney_routes"],
  create_jeepney_stop: ["jeepney_routes"],
};

export function syncTablesForEntityType(
  entityType: ProposalEntityType,
): string[] {
  return ENTITY_SYNC_TABLES[entityType] ?? [];
}

function mergePublishedRow<T extends { id: number }>(
  getData: (() => AppContextData) | undefined,
  list: T[] | null | undefined,
  published: T,
): T {
  if (!getData) return published;
  const data = getData();
  if (!data.loaded || !list) return published;
  const existing = list.find((row) => row.id === published.id);
  return existing ? { ...existing, ...published } : published;
}

/** Apply approve/publish API payload to in-memory campus data immediately. */
export function applyPublishedEntity(
  actions: AppActions,
  entityType: ProposalEntityType,
  published: unknown,
  getData?: () => AppContextData,
): boolean {
  if (!published || typeof published !== "object") return false;
  const data = getData?.();

  switch (entityType) {
    case "building":
    case "create_building": {
      const row = mergePublishedRow(
        getData,
        data?.loaded ? data.buildings : undefined,
        published as BuildingData,
      );
      actions.upsertBuilding(row);
      return true;
    }
    case "dorm":
    case "create_dorm": {
      const row = mergePublishedRow(
        getData,
        data?.loaded ? data.dorms : undefined,
        published as DormData,
      );
      actions.upsertDorm(row);
      return true;
    }
    case "college":
    case "create_college": {
      const row = mergePublishedRow(
        getData,
        data?.loaded ? data.colleges : undefined,
        published as CollegeData,
      );
      actions.upsertCollege(row);
      return true;
    }
    case "division":
    case "create_division": {
      const row = mergePublishedRow(
        getData,
        data?.loaded ? data.divisions : undefined,
        published as DivisionData,
      );
      actions.upsertDivision(row);
      return true;
    }
    case "event":
    case "create_event":
      actions.replaceEvent(published as EventData);
      return true;
    case "place":
    case "create_place": {
      const row = mergePublishedRow(
        getData,
        data?.loaded ? data.places : undefined,
        published as PlaceData,
      );
      actions.upsertPlace(row);
      return true;
    }
    case "organization":
    case "create_organization": {
      const row = mergePublishedRow(
        getData,
        data?.loaded ? data.organizations : undefined,
        published as OrgData,
      );
      actions.upsertOrganization(row);
      return true;
    }
    case "room":
    case "create_room":
    case "event_locations":
      return false;
    case "jeepney_stop":
    case "create_jeepney_stop":
      return false;
    default:
      return false;
  }
}

function isRoomRow(value: unknown): value is RoomData {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<RoomData>;
  return typeof row.id === "number" && typeof row.code === "string";
}

export async function afterProposalPublished(
  actions: AppActions,
  getData: () => AppContextData,
  entityType: ProposalEntityType,
  published: unknown,
): Promise<void> {
  const applied = applyPublishedEntity(actions, entityType, published, getData);
  const tables = syncTablesForEntityType(entityType);
  if (tables.length > 0) {
    invalidateLocalSyncKeys(tables);
  }

  // Rooms have no in-memory list to upsert into and the campus refresh never
  // syncs them, so the published row has to reach PGlite directly. Awaited,
  // because reopening the room reads that table straight back and would
  // otherwise race the write and show the pre-approval value.
  if (
    (entityType === "room" || entityType === "create_room") &&
    isRoomRow(published)
  ) {
    const { upsertLocalRoom } = await import("@lib/local/data/sync");
    await upsertLocalRoom(published);
  }
  if (applied) {
    // In-memory upsert is authoritative for the open panel. A full campus
    // refresh can race PGlite and overwrite with stale rows (#481 prod).
    return;
  }
  if (tables.length > 0) {
    requestCampusDataRefresh();
  }
}
