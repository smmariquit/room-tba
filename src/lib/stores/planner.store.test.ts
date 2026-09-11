import { beforeEach, describe, expect, test } from "vitest";
import { PlannerStore } from "./planner-store.svelte.js";
import { PLANNER_LS_KEY } from "./store-types.js";
import type { ClassMapValue } from "@lib/types";

const row = (overrides: Partial<ClassMapValue>): ClassMapValue => ({
  id: 1,
  courseCode: "CMSC 128",
  section: "AB-1L",
  type: "LEC",
  schedule: ["MW 07:00AM-08:00AM"],
  roomCode: "ICS MH1",
  directions: null,
  courseTitle: "Software Engineering",
  roomId: 1,
  termId: 1252,
  ...overrides,
});

describe("PlannerStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const makeStore = (termId: number | null = 1252) => {
    const store = new PlannerStore(() => termId);
    store.init();
    return store;
  };

  test("addOffering creates first plan and adds LEC+LAB together, deduped", () => {
    const store = makeStore();
    const rows = [
      row({}),
      row({ id: 2, type: "LAB", schedule: ["F 01:00PM-04:00PM"] }),
    ];
    store.addOffering(rows);
    store.addOffering(rows);
    expect(store.activePlan?.label).toBe("Untitled Plan 1");
    expect(store.activePlan?.sections).toHaveLength(2);
    expect(store.addedKeys.has("CMSC 128::AB-1L")).toBe(true);
  });

  test("removeOffering removes all section rows of the offering", () => {
    const store = makeStore();
    store.addOffering([row({}), row({ id: 2, type: "LAB" })]);
    store.removeOffering("CMSC 128", "AB-1L");
    expect(store.activePlan?.sections).toEqual([]);
    expect(store.addedKeys.size).toBe(0);
  });

  test("removing the lab also removes its paired lecture (one enrollment unit)", () => {
    const store = makeStore();
    store.addOffering([
      row({ id: 1, section: "AB", type: "LEC" }),
      row({ id: 2, section: "AB-1L", type: "LAB" }),
    ]);
    // Remove via the lab; the lecture "AB" must go with it.
    store.removeOffering("CMSC 128", "AB-1L");
    expect(store.activePlan?.sections).toEqual([]);
  });

  test("removing the lecture also removes its lab", () => {
    const store = makeStore();
    store.addOffering([
      row({ id: 1, section: "AB", type: "LEC" }),
      row({ id: 2, section: "AB-1L", type: "LAB" }),
    ]);
    store.removeOffering("CMSC 128", "AB");
    expect(store.activePlan?.sections).toEqual([]);
  });

  test("removing a compact recit (WX1R) also removes lecture WX (#799)", () => {
    const store = makeStore();
    store.addOffering([
      row({ id: 1, courseCode: "STAT 135", section: "WX", type: "LEC" }),
      row({ id: 2, courseCode: "STAT 135", section: "WX1R", type: "RCT" }),
    ]);
    store.removeOffering("STAT 135", "WX1R");
    expect(store.activePlan?.sections).toEqual([]);
  });

  test("removing lecture WX also removes its compact recit (#799)", () => {
    const store = makeStore();
    store.addOffering([
      row({ id: 1, courseCode: "STAT 135", section: "WX", type: "LEC" }),
      row({ id: 2, courseCode: "STAT 135", section: "WX1R", type: "RCT" }),
    ]);
    store.removeOffering("STAT 135", "WX");
    expect(store.activePlan?.sections).toEqual([]);
  });

  test("refreshActivePlan does NOT stale a section whose course was not fetched", () => {
    const store = makeStore();
    store.addOffering([row({ id: 1, section: "AB", type: "LEC" })]);
    // Fetched a different course only — the just-added CMSC 128 must not flag.
    store.refreshActivePlan([], new Set(["OTHER 1"]));
    expect(store.activePlan?.sections.every((s) => !s.stale)).toBe(true);
  });

  test("refreshActivePlan stales a section only when its fetched course dropped it", () => {
    const store = makeStore();
    store.addOffering([row({ id: 1, section: "AB", type: "LEC" })]);
    store.refreshActivePlan([], new Set(["CMSC 128"]));
    expect(store.activePlan?.sections.every((s) => s.stale)).toBe(true);
  });

  test("removeSections removes exact linked lecture and lab rows", () => {
    const store = makeStore();
    const rows = [
      row({ id: 1, section: "AB", type: "LEC" }),
      row({ id: 2, section: "AB-1L", type: "LAB" }),
    ];
    store.addOffering(rows);
    store.removeSections(rows);
    expect(store.activePlan?.sections).toEqual([]);
  });

  test("replaceCourse swaps every planned row of the course, labs included", () => {
    const store = makeStore();
    store.addOffering([
      row({ id: 1, section: "AB", type: "LEC" }),
      row({ id: 2, section: "AB-1L", type: "LAB" }),
    ]);
    store.replaceCourse("CMSC 128", [
      row({ id: 3, section: "CD", type: "LEC" }),
      row({ id: 4, section: "CD-2L", type: "LAB" }),
    ]);
    expect(store.activePlan?.sections.map((s) => s.section).sort()).toEqual([
      "CD",
      "CD-2L",
    ]);
  });

  test("rows without natural key are skipped", () => {
    const store = makeStore();
    store.addOffering([row({ courseCode: null })]);
    expect(store.plans).toEqual([]);
  });

  test("plans are per term and labels count up Untitled Plan 1, Untitled Plan 2", () => {
    const store = makeStore();
    store.addOffering([row({})]);
    const planB = store.createPlan();
    expect(planB?.label).toBe("Untitled Plan 2");
    expect(store.activePlan?.id).toBe(planB?.id);
    expect(store.plansForTerm).toHaveLength(2);
    store.addOffering([row({ id: 3, termId: 1253, courseCode: "MATH 27" })]);
    expect(store.plans.find((p) => p.termId === 1253)?.label).toBe(
      "Untitled Plan 1",
    );
    expect(store.plansForTerm).toHaveLength(2); // active term still 1252
  });

  test("selectPlan and deletePlan update the active pointer", () => {
    const store = makeStore();
    store.addOffering([row({})]);
    const planA = store.activePlan!;
    const planB = store.createPlan()!;
    store.selectPlan(planA.id);
    expect(store.activePlan?.id).toBe(planA.id);
    store.deletePlan(planA.id);
    expect(store.activePlan?.id).toBe(planB.id);
  });

  test("deletePlan replaces the last plan for a term with a fresh empty plan", () => {
    const store = makeStore();
    store.addOffering([row({})]);
    const only = store.activePlan!;
    store.deletePlan(only.id);
    expect(store.plansForTerm).toHaveLength(1);
    expect(store.activePlan?.id).not.toBe(only.id);
    expect(store.activePlan?.sections).toEqual([]);
    expect(store.activePlan?.label).toBe("Untitled Plan 1");
  });

  test("ensurePlanForActiveTerm creates a plan when the term has none", () => {
    const store = makeStore();
    expect(store.plansForTerm).toHaveLength(0);
    const created = store.ensurePlanForActiveTerm();
    expect(created).not.toBeNull();
    expect(store.plansForTerm).toHaveLength(1);
    expect(store.activePlan?.id).toBe(created!.id);
    expect(store.ensurePlanForActiveTerm()?.id).toBe(created!.id);
  });

  test("conflicts derive from the active plan", () => {
    const store = makeStore();
    store.addOffering([row({})]);
    store.addOffering([
      row({
        id: 9,
        courseCode: "MATH 27",
        section: "B-2",
        schedule: ["M 07:30AM-08:30AM"],
      }),
    ]);
    expect(store.conflicts).toHaveLength(1);
  });

  test("persists to localStorage and hydrates in a new instance", () => {
    const store = makeStore();
    store.addOffering([row({})]);
    expect(localStorage.getItem(PLANNER_LS_KEY)).toContain("CMSC 128");

    const rehydrated = makeStore();
    expect(rehydrated.activePlan?.sections).toHaveLength(1);
    expect(rehydrated.activePlan?.label).toBe("Untitled Plan 1");
  });

  test("importShared creates and selects a new plan", () => {
    const store = makeStore();
    store.addOffering([row({})]);
    const imported = store.importShared(1252, [
      {
        courseCode: "MATH 27",
        section: "B-2",
        type: "LEC",
        schedule: ["TBA"],
        roomCode: null,
        courseTitle: null,
      },
    ]);
    expect(store.activePlan?.id).toBe(imported.id);
    expect(imported.label).toBe("Untitled Plan 2");
  });

  test("refreshActivePlan updates matches and marks misses stale", () => {
    const store = makeStore();
    store.addOffering([row({}), row({ id: 2, type: "LAB" })]);
    store.refreshActivePlan([row({ roomCode: "NEW ROOM" })]);
    const sections = store.activePlan!.sections;
    expect(sections.find((s) => s.type === "LEC")?.roomCode).toBe("NEW ROOM");
    expect(sections.find((s) => s.type === "LAB")?.stale).toBe(true);
  });

  test("duplicatePlan clones sections into a new selected plan", () => {
    const store = makeStore();
    store.addOffering([row({}), row({ id: 2, type: "LAB" })]);
    const source = store.activePlan!;
    const copy = store.duplicatePlan(source.id);
    expect(copy).not.toBeNull();
    expect(copy!.id).not.toBe(source.id);
    expect(copy!.label).toBe("Untitled Plan 1 copy");
    expect(copy!.sections).toHaveLength(2);
    // Deep copy — mutating the copy must not touch the source.
    copy!.sections.pop();
    expect(source.sections).toHaveLength(2);
    expect(store.activePlan?.id).toBe(copy!.id);
  });

  test("duplicating twice gives distinct suffixed labels", () => {
    const store = makeStore();
    store.addOffering([row({})]);
    const source = store.activePlan!;
    store.duplicatePlan(source.id);
    const second = store.duplicatePlan(source.id);
    expect(second!.label).toBe("Untitled Plan 1 copy (2)");
  });

  test("renamePlan trims, ignores empty, and de-duplicates", () => {
    const store = makeStore();
    store.addOffering([row({})]);
    const a = store.activePlan!;
    const b = store.createPlan()!; // "Untitled Plan 2"
    store.renamePlan(a.id, "  My schedule  ");
    expect(store.plans.find((p) => p.id === a.id)?.label).toBe("My schedule");
    // Empty rename is ignored.
    store.renamePlan(b.id, "   ");
    expect(store.plans.find((p) => p.id === b.id)?.label).toBe(
      "Untitled Plan 2",
    );
    // Collision with an existing label gets a numeric suffix.
    store.renamePlan(b.id, "My schedule");
    expect(store.plans.find((p) => p.id === b.id)?.label).toBe(
      "My schedule (2)",
    );
  });
});
