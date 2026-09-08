import { beforeEach, describe, expect, test, vi } from "vitest";
import type { AppActions, AppContextData } from "@lib/context";
import type { RoomData } from "@lib/types";

const { upsertLocalRoom } = vi.hoisted(() => ({
  upsertLocalRoom: vi.fn(async () => {}),
}));
vi.mock("@lib/local/data/sync", () => ({ upsertLocalRoom }));

import { afterProposalPublished } from "./apply-published-entity";

const actions = {
  upsertBuilding: vi.fn(),
  upsertDorm: vi.fn(),
  upsertCollege: vi.fn(),
  upsertDivision: vi.fn(),
  upsertPlace: vi.fn(),
  upsertOrganization: vi.fn(),
  replaceEvent: vi.fn(),
} as unknown as AppActions;

const noData = () => ({ loaded: false }) as AppContextData;

const room = (directions: string): RoomData =>
  ({
    id: 42,
    code: "E2E-101",
    directions,
    buildingId: 1,
    collegeId: null,
    divisionId: null,
    version: 3,
    updatedAt: "2026-09-09T00:00:00.000Z",
  }) as unknown as RoomData;

/**
 * Rooms load lazily per building and the campus refresh never syncs them, so
 * an approved room edit only reaches the client if the publish writes the row
 * to PGlite itself. Reopening the room reads that table straight back, which
 * is why the write is awaited rather than fired off.
 */
describe("afterProposalPublished rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("writes the published room to the local cache", async () => {
    await afterProposalPublished(
      actions,
      noData,
      "room",
      room("New directions"),
    );

    expect(upsertLocalRoom).toHaveBeenCalledTimes(1);
    expect(upsertLocalRoom.mock.calls[0]?.[0]).toMatchObject({
      id: 42,
      code: "E2E-101",
      directions: "New directions",
    });
  });

  test("a newly created room lands too", async () => {
    await afterProposalPublished(actions, noData, "create_room", room("Fresh"));
    expect(upsertLocalRoom).toHaveBeenCalledTimes(1);
  });

  test("the write finishes before the call resolves", async () => {
    let settled = false;
    upsertLocalRoom.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      settled = true;
    });

    await afterProposalPublished(actions, noData, "room", room("Slow write"));

    expect(settled).toBe(true);
  });

  test("leaves other entity types alone", async () => {
    await afterProposalPublished(actions, noData, "building", {
      id: 1,
      buildingName: "Humanities",
    });
    expect(upsertLocalRoom).not.toHaveBeenCalled();
  });

  test("ignores a payload that is not a room row", async () => {
    await afterProposalPublished(actions, noData, "room", { nope: true });
    expect(upsertLocalRoom).not.toHaveBeenCalled();
  });
});
