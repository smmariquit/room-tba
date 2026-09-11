import type { ClassMapValue } from "@lib/types";

export type ClassOfferingGroup = {
  key: string;
  courseCode: string;
  courseTitle: string | null;
  section: string;
  sections: ClassMapValue[];
};

const TYPE_ORDER: Record<string, number> = {
  LEC: 0,
  LAB: 1,
  RCT: 2,
  REC: 2,
  SEM: 3,
};

function classType(row: ClassMapValue): string {
  return (row.type ?? "").trim().toUpperCase();
}

export function parentLectureSection(row: ClassMapValue): string | null {
  if (!row.section) return null;
  const section = row.section.trim().toUpperCase();
  // Hyphenated child slot: "G-1L", "UV-1R", "B-1R" → parent before "-<n>".
  const hyphenated = section.match(/^(.+)-\d+[A-Z]+$/);
  if (hyphenated?.[1]) return hyphenated[1];
  // Compact lab slot: "ST11L" → "ST1".
  const compactLab = section.match(/^(.+)\dL$/);
  if (compactLab?.[1]) return compactLab[1];
  // Recit suffix on the lecture section: "AB1R", "ST2R" → drop trailing R.
  if (section.endsWith("R") && section.length > 1) {
    return section.slice(0, -1);
  }
  return null;
}

export function offeringGroupKey(
  courseCode: string | null | undefined,
  section: string | null | undefined,
): string | null {
  if (!courseCode || !section) return null;
  return `${courseCode}::${section}`;
}

/**
 * Lecture sections a child section could belong to, most specific first.
 * "ST2R" is normally the recit of lecture "ST2", but STAT 135 names its recits
 * "WX1R" to "WX6R" under one lecture "WX", so the digit-stripped form is a
 * second candidate. Callers keep the first one that actually exists (#799).
 */
export function parentLectureCandidates(row: ClassMapValue): string[] {
  const first = parentLectureSection(row);
  if (!first) return [];
  const stripped = first.replace(/\d+$/, "");
  return stripped && stripped !== first ? [first, stripped] : [first];
}

/** First parent candidate present in `known` (section names), else null. */
export function resolveParentLecture(
  row: ClassMapValue,
  known: Iterable<string>,
): string | null {
  const have = new Set([...known].map((s) => s.trim().toUpperCase()));
  for (const candidate of parentLectureCandidates(row)) {
    if (have.has(candidate)) return candidate;
  }
  return null;
}

/** Group LEC/LAB/SEM rows that share course code + section (#301). */
export function groupClassesByOffering(
  classes: ClassMapValue[],
): ClassOfferingGroup[] {
  const groups = new Map<string, ClassOfferingGroup>();

  for (const row of classes) {
    const key = offeringGroupKey(row.courseCode, row.section);
    if (!key) {
      groups.set(`__solo__${row.id}`, {
        key: `__solo__${row.id}`,
        courseCode: row.courseCode ?? "Class",
        courseTitle: row.courseTitle,
        section: row.section ?? "",
        sections: [row],
      });
      continue;
    }

    const existing = groups.get(key);
    if (existing) {
      existing.sections.push(row);
      if (!existing.courseTitle && row.courseTitle) {
        existing.courseTitle = row.courseTitle;
      }
    } else {
      groups.set(key, {
        key,
        courseCode: row.courseCode!,
        courseTitle: row.courseTitle,
        section: row.section!,
        sections: [row],
      });
    }
  }

  const linkedLectureKeys = new Set<string>();
  for (const group of groups.values()) {
    const linkedLectures = new Map<number, ClassMapValue>();
    for (const row of group.sections) {
      let parent: ClassOfferingGroup | null = null;
      for (const candidate of parentLectureCandidates(row)) {
        const key = offeringGroupKey(row.courseCode, candidate);
        const found = key ? groups.get(key) : null;
        if (found && found !== group) {
          parent = found;
          break;
        }
      }
      if (!parent) continue;
      for (const parentRow of parent.sections) {
        if (classType(parentRow) === "LEC") {
          linkedLectures.set(parentRow.id, parentRow);
        }
      }
      if (linkedLectures.size > 0) linkedLectureKeys.add(parent.key);
    }
    group.sections.unshift(...linkedLectures.values());
  }

  for (const group of groups.values()) {
    group.sections.sort((a, b) => {
      const ta = TYPE_ORDER[classType(a)] ?? 9;
      const tb = TYPE_ORDER[classType(b)] ?? 9;
      if (ta !== tb) return ta - tb;
      return (a.roomCode ?? "").localeCompare(b.roomCode ?? "");
    });
  }

  return [...groups.values()]
    .filter(
      (group) =>
        !linkedLectureKeys.has(group.key) ||
        group.sections.some((row) => classType(row) !== "LEC"),
    )
    .sort((a, b) => a.courseCode.localeCompare(b.courseCode));
}
