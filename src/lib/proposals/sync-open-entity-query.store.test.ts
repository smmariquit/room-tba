import { beforeEach, describe, expect, test, vi } from "vitest";
import type { AppContextData } from "@lib/context";
import type { RoomData } from "@lib/types";

const { getJSONFetch, getLocalRoomByCode } = vi.hoisted(() => ({
  getJSONFetch: vi.fn(),
  getLocalRoomByCode: vi.fn(),
}));

vi.mock("../local/data/utils.js", () => ({
  getJSONFetch,
  getLocalRoomByCode,
  getBuildingIdsWithClasses: vi.fn(),
  getLocalClassesForRoom: vi.fn(),
  getLocalBuildingRooms: vi.fn(),
}));

import { currentRoom, queryStore } from "@lib/store.svelte";
import { syncOpenEntityQueryAfterPublish } from "./sync-open-entity-query";

const room = (id: number, code: string, directions: string | null): RoomData =>
  ({ id, code, directions, version: 2 }) as unknown as RoomData;

const noAppData = () => ({ loaded: false }) as AppContextData;

function openRoomQuery(code: string) {
  queryStore.updateQuery({ type: "result", category: "room", value: code });
}

describe("syncOpenEntityQueryAfterPublish room", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openRoomQuery("E2E-101");
  });

  test("replaces the room on screen with the published row", () => {
    currentRoom.setRoom(room(1, "E2E-101", "Old directions"));

    syncOpenEntityQueryAfterPublish(
      noAppData,
      "room",
      room(1, "E2E-101", "New directions"),
    );

    expect(currentRoom.value?.directions).toBe("New directions");
  });

  test("still lands when the room lookup has not resolved yet", async () => {
    let resolveLookup!: (value: RoomData | null) => void;
    getLocalRoomByCode.mockReturnValue(
      new Promise<RoomData | null>((resolve) => {
        resolveLookup = resolve;
      }),
    );
    const lookup = currentRoom.getRoomByCode("E2E-101");
    expect(currentRoom.value).toBeNull();

    syncOpenEntityQueryAfterPublish(
      noAppData,
      "room",
      room(1, "E2E-101", "New directions"),
    );

    // The in-flight lookup answers with the pre-approval row; it must lose.
    resolveLookup(room(1, "E2E-101", "Old directions"));
    await lookup;
    expect(currentRoom.value?.directions).toBe("New directions");
  });

  test("leaves another room alone", () => {
    currentRoom.setRoom(room(1, "E2E-101", "Old directions"));

    syncOpenEntityQueryAfterPublish(
      noAppData,
      "room",
      room(2, "E2E-202", "New directions"),
    );

    expect(currentRoom.value?.directions).toBe("Old directions");
  });

  test("renames the open query so the URL follows a published room code", () => {
    currentRoom.setRoom(room(1, "E2E-101", null));

    syncOpenEntityQueryAfterPublish(
      noAppData,
      "room",
      room(1, "E2E-999", null),
    );

    expect(queryStore.queryValue).toBe("E2E-999");
  });
});
