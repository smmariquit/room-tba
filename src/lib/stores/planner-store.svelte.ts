import {
  offeringGroupKey,
  parentLectureSection,
  resolveParentLecture,
} from "../class-offering-groups.js";
import { findConflicts } from "../planner/conflicts.js";
import {
  mergePlannerState,
  parsePlanner,
  serializePlanner,
} from "../planner/persist.js";
import { sectionNaturalKey } from "../planner/types.js";
import type { PlannedSection, PlannerPlan } from "../planner/types.js";
import type { ClassMapValue } from "@lib/types";
import { PLANNER_LS_KEY } from "./store-types.js";

function rowToPlannedSection(row: ClassMapValue): PlannedSection | null {
  if (!row.courseCode || !row.section || !row.type) return null;
  return {
    courseCode: row.courseCode,
    section: row.section,
    type: row.type,
    schedule: row.schedule ?? ["TBA"],
    roomCode: row.roomCode ?? null,
    courseTitle: row.courseTitle ?? null,
  };
}

export class PlannerStore {
  plans = $state<PlannerPlan[]>([]);
  activePlanIdByTerm = $state<Record<string, string>>({});
  private _hydrated = false;

  constructor(private getActiveTermId: () => number | null) {}

  activeTermId = $derived.by(() => this.getActiveTermId());

  plansForTerm = $derived(
    this.plans.filter((plan) => plan.termId === this.activeTermId),
  );

  activePlan = $derived.by(() => {
    if (this.activeTermId == null) return null;
    const activeId = this.activePlanIdByTerm[String(this.activeTermId)];
    return (
      this.plansForTerm.find((plan) => plan.id === activeId) ??
      this.plansForTerm[0] ??
      null
    );
  });

  /** offeringGroupKey(courseCode, section) for every offering in the active plan. */
  addedKeys = $derived(
    new Set(
      (this.activePlan?.sections ?? [])
        .map((s) => offeringGroupKey(s.courseCode, s.section))
        .filter((key): key is string => key !== null),
    ),
  );

  conflicts = $derived(findConflicts(this.activePlan?.sections ?? []));

  init = () => {
    if (this._hydrated) return;
    this._hydrated = true;
    const state = parsePlanner(localStorage.getItem(PLANNER_LS_KEY));
    this.plans = state.plans;
    this.activePlanIdByTerm = state.activePlanIdByTerm;
  };

  /** Add every LEC/LAB row of one offering group. Rows without a natural key are skipped. */
  addOffering = (rows: ClassMapValue[]) => {
    const sections = rows
      .map(rowToPlannedSection)
      .filter((s): s is PlannedSection => s !== null);
    if (sections.length === 0) return;
    const termId = rows[0].termId ?? this.activeTermId;
    if (termId == null) return;

    const plan = this.ensurePlanForTerm(termId);
    const existing = new Set(plan.sections.map(sectionNaturalKey));
    for (const section of sections) {
      if (!existing.has(sectionNaturalKey(section))) {
        plan.sections.push(section);
      }
    }
    this.persist();
  };

  removeSections = (rows: ClassMapValue[]) => {
    const plan = this.activePlan;
    if (!plan) return;
    const removeKeys = new Set(
      rows
        .map(rowToPlannedSection)
        .filter((s): s is PlannedSection => s !== null)
        .map(sectionNaturalKey),
    );
    if (removeKeys.size === 0) return;
    plan.sections = plan.sections.filter(
      (section) => !removeKeys.has(sectionNaturalKey(section)),
    );
    this.persist();
  };

  /** Swap a course to another section: drop every planned row of the course, add the new offering. */
  replaceCourse = (courseCode: string, rows: ClassMapValue[]) => {
    // Only prune when a plan already exists; addOffering lazily creates the
    // plan for the term, so the first add (no active plan yet) must not bail.
    const plan = this.activePlan;
    if (plan) {
      plan.sections = plan.sections.filter((s) => s.courseCode !== courseCode);
    }
    this.addOffering(rows);
    this.persist();
  };

  removeOffering = (courseCode: string, section: string) => {
    const plan = this.activePlan;
    if (!plan) return;
    // A lecture and its lab/recit are one enrollment unit — removing any
    // component removes the whole unit. Resolve each section to its lecture
    // (itself if it is the lecture, else the parent encoded in a child section
    // like "C-4L" -> "C") and drop everything in that unit for the course.
    // Resolve against the sections actually in the plan so a compact recit
    // like "WX1R" finds lecture "WX" rather than a nonexistent "WX1" (#799).
    const planned = plan.sections
      .filter((s) => s.courseCode === courseCode)
      .map((s) => s.section);
    const unitOf = (s: string) =>
      resolveParentLecture({ section: s }, planned) ??
      parentLectureSection({ section: s }) ??
      s;
    const targetUnit = unitOf(section);
    plan.sections = plan.sections.filter(
      (s) => s.courseCode !== courseCode || unitOf(s.section) !== targetUnit,
    );
    this.persist();
  };

  updateSectionNote = (
    courseCode: string,
    section: string,
    type: string,
    note: string,
  ) => {
    const plan = this.activePlan;
    if (!plan) return;
    const target = plan.sections.find(
      (s) =>
        s.courseCode === courseCode && s.section === section && s.type === type,
    );
    if (target) {
      target.note = note.trim() || undefined;
      this.persist();
    }
  };

  createPlan = (): PlannerPlan | null => {
    if (this.activeTermId == null) return null;
    const plan = this.newPlan(this.activeTermId);
    this.plans.push(plan);
    this.selectPlan(plan.id);
    return plan;
  };

  /**
   * Keep the active term from hitting an empty plan list (incomprehensible UI).
   * No-op when there is no active term or a plan already exists for it.
   */
  ensurePlanForActiveTerm = (): PlannerPlan | null => {
    if (this.activeTermId == null) return null;
    if (this.plansForTerm.length > 0) return this.activePlan;
    return this.createPlan();
  };

  deletePlan = (id: string) => {
    const deleted = this.plans.find((plan) => plan.id === id);
    this.plans = this.plans.filter((plan) => plan.id !== id);
    for (const [termId, planId] of Object.entries(this.activePlanIdByTerm)) {
      if (planId === id) delete this.activePlanIdByTerm[termId];
    }
    // Deleting the last plan for a term must leave a fresh empty plan, not a blank tab strip.
    if (
      deleted != null &&
      !this.plans.some((plan) => plan.termId === deleted.termId)
    ) {
      const replacement = this.newPlan(deleted.termId);
      this.plans.push(replacement);
      this.activePlanIdByTerm[String(deleted.termId)] = replacement.id;
    }
    this.persist();
  };

  selectPlan = (id: string) => {
    const plan = this.plans.find((p) => p.id === id);
    if (!plan) return;
    this.activePlanIdByTerm[String(plan.termId)] = id;
    this.persist();
  };

  /** Clone a plan (sections and all) into a new plan for the same term. */
  duplicatePlan = (id: string): PlannerPlan | null => {
    const source = this.plans.find((p) => p.id === id);
    if (!source) return null;
    const copy: PlannerPlan = {
      id: crypto.randomUUID(),
      label: this.uniqueLabel(`${source.label} copy`, source.termId),
      termId: source.termId,
      sections: source.sections.map((s) => ({ ...s })),
    };
    this.plans.push(copy);
    this.activePlanIdByTerm[String(copy.termId)] = copy.id;
    this.persist();
    return copy;
  };

  /** Rename a plan; empty names are ignored, collisions get a numeric suffix. */
  renamePlan = (id: string, label: string) => {
    const plan = this.plans.find((p) => p.id === id);
    if (!plan) return;
    const trimmed = label.trim();
    if (!trimmed) return;
    plan.label = this.uniqueLabel(trimmed, plan.termId, plan.id);
    this.persist();
  };

  /** Add a decoded share payload as a new plan for its term and select it. */
  importShared = (termId: number, sections: PlannedSection[]): PlannerPlan => {
    const plan = this.newPlan(termId);
    plan.sections = sections;
    this.plans.push(plan);
    this.activePlanIdByTerm[String(termId)] = plan.id;
    this.persist();
    return plan;
  };

  /** Overwrite matching sections with fresh rows; mark unresolved ones stale. */
  refreshActivePlan = (rows: ClassMapValue[], fetchedCourses?: Set<string>) => {
    const plan = this.activePlan;
    if (!plan) return;
    const fresh = new Map(
      rows
        .map(rowToPlannedSection)
        .filter((s): s is PlannedSection => s !== null)
        .map((s) => [sectionNaturalKey(s), s]),
    );
    plan.sections = plan.sections.map((section) => {
      const updated = fresh.get(sectionNaturalKey(section));
      if (updated) return updated;
      // Only mark "no longer offered" when this course was actually fetched
      // successfully and the section is genuinely gone — never on a failed or
      // not-yet-loaded fetch, which would flag a just-added section.
      if (fetchedCourses && !fetchedCourses.has(section.courseCode)) {
        return section;
      }
      return { ...section, stale: true };
    });
    this.persist();
  };

  private ensurePlanForTerm(termId: number): PlannerPlan {
    const activeId = this.activePlanIdByTerm[String(termId)];
    const existing =
      this.plans.find((p) => p.id === activeId && p.termId === termId) ??
      this.plans.find((p) => p.termId === termId);
    if (existing) {
      this.activePlanIdByTerm[String(termId)] = existing.id;
      return existing;
    }
    const plan = this.newPlan(termId);
    this.plans.push(plan);
    this.activePlanIdByTerm[String(termId)] = plan.id;
    return plan;
  }

  private newPlan(termId: number): PlannerPlan {
    return {
      id: crypto.randomUUID(),
      label: this.uniqueLabel("Untitled Plan 1", termId),
      termId,
      sections: [],
    };
  }

  /** A label unique within the term. Falls back to "<base> (2)", "(3)", … on
   * collision (and "Plan 1" → "Plan 1 (2)" gives the familiar Plan 2/3 feel). */
  private uniqueLabel(base: string, termId: number, exceptId?: string): string {
    const used = new Set(
      this.plans
        .filter((p) => p.termId === termId && p.id !== exceptId)
        .map((p) => p.label),
    );
    if (base === "Untitled Plan 1") {
      let n = 1;
      while (used.has(`Untitled Plan ${n}`)) n++;
      return `Untitled Plan ${n}`;
    }
    if (!used.has(base)) return base;
    let n = 2;
    while (used.has(`${base} (${n})`)) n++;
    return `${base} (${n})`;
  }

  private persist() {
    try {
      localStorage.setItem(
        PLANNER_LS_KEY,
        serializePlanner({
          plans: this.plans,
          activePlanIdByTerm: this.activePlanIdByTerm,
        }),
      );
    } catch {
      // localStorage may be unavailable (private mode); plan still works
      // for the current session.
    }
    this.#pushToAccount();
  }

  // --- Account sync (#2) --------------------------------------------------
  // When signed in, plans (including professor notes) persist to the account
  // so they follow the user across devices; localStorage stays the offline/anon
  // cache.
  #accountSync = false;
  #saveTimer: ReturnType<typeof setTimeout> | null = null;

  /** Called on sign-in: pull the account's plans, merge, and start syncing. */
  enableAccountSync = async () => {
    if (this.#accountSync) return;
    this.#accountSync = true;
    await this.#hydrateFromAccount();
  };

  /** Called on sign-out: stop pushing to the account (localStorage remains). */
  disableAccountSync = () => {
    this.#accountSync = false;
    if (this.#saveTimer) {
      clearTimeout(this.#saveTimer);
      this.#saveTimer = null;
    }
  };

  #hydrateFromAccount = async () => {
    try {
      const res = await fetch("/api/account/plans", {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const { data } = (await res.json()) as { data: unknown };
      const remote = parsePlanner(data ? JSON.stringify(data) : null);
      const merged = mergePlannerState(
        { plans: this.plans, activePlanIdByTerm: this.activePlanIdByTerm },
        remote,
      );
      this.plans = merged.plans;
      this.activePlanIdByTerm = merged.activePlanIdByTerm;
      // Writes local cache and pushes the merged union back to the account.
      this.persist();
    } catch {
      // Offline or request failed — keep the local plans as-is.
    }
  };

  #pushToAccount = () => {
    if (!this.#accountSync || typeof fetch === "undefined") return;
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      this.#saveTimer = null;
      const data = JSON.parse(
        serializePlanner({
          plans: this.plans,
          activePlanIdByTerm: this.activePlanIdByTerm,
        }),
      );
      void fetch("/api/account/plans", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data }),
      }).catch(() => {
        // Best effort; localStorage already holds the change.
      });
    }, 1200);
  };
}
