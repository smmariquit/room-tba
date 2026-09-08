import { currentRoom, queryStore } from "@lib/store.svelte";
import type { AppContextData } from "@lib/context";
import type { ProposalEntityType } from "@lib/services/proposal-service";
import type {
  BuildingData,
  CollegeData,
  DivisionData,
  DormData,
  EventData,
  RoomData,
} from "@lib/types";

type PublishedRow = { id: number };

/**
 * Campus app data does not carry rooms (they load per building), so
 * `applyPublishedEntity` has no room case and the campus refresh it falls back
 * to never touches the rooms table. Without this the open room panel keeps the
 * pre-approval value until the browser reloads.
 */
function syncOpenRoom(published: RoomData): void {
  if (queryStore.category !== "room") return;
  const open = currentRoom.value;
  // The lookup started by opening the room can still be in flight when an
  // approve lands, so fall back to the code the query was opened with.
  // `setRoom` bumps the room load generation, which makes that lookup drop its
  // result instead of writing the pre-approval row over this one.
  const isOpen = open
    ? open.id === published.id
    : queryStore.queryValue.toUpperCase() === published.code.toUpperCase();
  if (!isOpen) return;

  currentRoom.setRoom(published);
  queryStore.hydrateQuery({
    type: "result",
    category: "room",
    value: published.code,
  });
}

function openEntityId(
  data: AppContextData,
  category: typeof queryStore.category,
  queryValue: string,
): number | null {
  if (!data.loaded || !category || !queryValue) return null;

  switch (category) {
    case "building": {
      const row = data.buildings.find((b) => b.buildingName === queryValue);
      return row?.id ?? null;
    }
    case "dorm": {
      const row = data.dorms.find((d) => d.dormName === queryValue);
      return row?.id ?? null;
    }
    case "college": {
      const row = data.colleges.find((c) => c.collegeName === queryValue);
      return row?.id ?? null;
    }
    case "division": {
      const row = data.divisions.find((d) => d.divisionName === queryValue);
      return row?.id ?? null;
    }
    case "event": {
      const row = data.events.find(
        (e) =>
          e.title === queryValue || e.slug === queryStore.selectedEventSlug,
      );
      return row?.id ?? null;
    }
    default:
      return null;
  }
}

/** Keep the open side panel pointed at the entity a publish just changed. */
export function syncOpenEntityQueryAfterPublish(
  getData: () => AppContextData,
  entityType: ProposalEntityType,
  published: unknown,
): void {
  if (!published || typeof published !== "object" || !("id" in published)) {
    return;
  }
  const publishedId = Number((published as PublishedRow).id);
  if (!Number.isInteger(publishedId)) return;

  if (entityType === "room") {
    syncOpenRoom(published as RoomData);
    return;
  }

  const data = getData();
  const openId = openEntityId(data, queryStore.category, queryStore.queryValue);
  if (openId !== publishedId) return;

  switch (entityType) {
    case "building":
    case "create_building": {
      const row = published as BuildingData;
      queryStore.hydrateQuery({
        type: "result",
        category: "building",
        value: row.buildingName,
      });
      return;
    }
    case "dorm":
    case "create_dorm": {
      const row = published as DormData;
      queryStore.hydrateQuery({
        type: "result",
        category: "dorm",
        value: row.dormName,
      });
      return;
    }
    case "college":
    case "create_college": {
      const row = published as CollegeData;
      queryStore.hydrateQuery({
        type: "result",
        category: "college",
        value: row.collegeName,
      });
      return;
    }
    case "division":
    case "create_division": {
      const row = published as DivisionData;
      queryStore.hydrateQuery({
        type: "result",
        category: "division",
        value: row.divisionName,
      });
      return;
    }
    case "event":
    case "create_event": {
      const row = published as EventData;
      queryStore.hydrateQuery({
        type: "result",
        category: "event",
        value: row.title,
        eventSlug: row.slug,
      });
      return;
    }
    default:
      return;
  }
}
