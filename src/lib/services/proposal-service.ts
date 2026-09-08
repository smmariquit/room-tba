import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { sendReviewNotice } from "@lib/email/review-notice";
import {
  adminUsersTable,
  buildingsTable,
  collegesTable,
  divisionsTable,
  dormsTable,
  placesTable,
  editProposalsTable,
  eventLocationsTable,
  eventsTable,
  jeepneyStopsTable,
  organizationsTable,
  roomsTable,
} from "@drizzle/schema";
import { normalizeAlias } from "@lib/site";
import type { SessionUser } from "@lib/admin/auth";
import { db } from "@lib/db";
import {
  validateSubmitterName,
  validateSubmitterNote,
} from "@constants/proposals";
import { recordProposalContribution } from "./contribution-service";
import { parseImageUrl } from "@lib/r2-upload";
import { R2_PUBLIC_URL } from "astro:env/server";
import { canWithdrawProposal } from "./proposal-access";
export {
  canViewProposalSubmitterDetails,
  canWithdrawProposal,
} from "./proposal-access";
import {
  EditConflictError,
  DuplicateSlugError,
  createBuilding,
  createCollege,
  createDivision,
  createDorm,
  createEvent,
  createOrganization,
  createPlace,
  createRoom,
  updateBuilding,
  updateCollege,
  updateDivision,
  updateDorm,
  updatePlace,
  updateEvent,
  updateEventLocations,
  updateOrganization,
  updateRoom,
  type BuildingUpdateInput,
  type DormCreateInput,
  type DormUpdateInput,
  type OrgCreateInput,
  type OrgUpdateInput,
  type DivisionUpdateInput,
  type EventLocationWriteInput,
  type EventWriteInput,
  type PlaceCreateInput,
  type PlaceUpdateInput,
  type RoomCreateInput,
  type RoomUpdateInput,
} from "./admin-service";
import {
  createJeepneyStop,
  updateJeepneyStop,
  type JeepneyStopCreateInput,
  type JeepneyStopWriteInput,
} from "./transit-service";
import { allowEntityScopedProposalMerge } from "@lib/proposals/proposal-merge-policy";
import {
  ProposalValidationError,
  parseBundledRooms,
  validateCreateProposalPatch,
} from "@lib/proposals/create-proposal-validation";

export const PROPOSAL_UPDATE_TYPES = [
  "building",
  "dorm",
  "place",
  "room",
  "college",
  "division",
  "event",
  "event_locations",
  "organization",
  "jeepney_stop",
] as const;

export const PROPOSAL_CREATE_TYPES = [
  "create_building",
  "create_event",
  "create_dorm",
  "create_place",
  "create_room",
  "create_college",
  "create_division",
  "create_organization",
  "create_jeepney_stop",
] as const;

export const PROPOSAL_ENTITY_TYPES = [
  ...PROPOSAL_UPDATE_TYPES,
  ...PROPOSAL_CREATE_TYPES,
] as const;

export type ProposalUpdateType = (typeof PROPOSAL_UPDATE_TYPES)[number];
export type ProposalCreateType = (typeof PROPOSAL_CREATE_TYPES)[number];
export type ProposalEntityType = (typeof PROPOSAL_ENTITY_TYPES)[number];

export function isCreateProposalType(
  value: string,
): value is ProposalCreateType {
  return (PROPOSAL_CREATE_TYPES as readonly string[]).includes(value);
}

export function isUpdateProposalType(
  value: string,
): value is ProposalUpdateType {
  return (PROPOSAL_UPDATE_TYPES as readonly string[]).includes(value);
}

export type EditProposalRow = typeof editProposalsTable.$inferSelect;

export type EditProposalSummary = EditProposalRow & {
  entityLabel: string;
};

function isProposalEntityType(value: string): value is ProposalEntityType {
  return (PROPOSAL_ENTITY_TYPES as readonly string[]).includes(value);
}

export async function getEntityLabel(
  entityType: ProposalEntityType,
  entityId: number,
  patch?: Record<string, unknown>,
): Promise<string> {
  if (isCreateProposalType(entityType)) {
    const p = patch ?? {};
    switch (entityType) {
      case "create_building": {
        const name =
          typeof p.buildingName === "string" && p.buildingName.trim()
            ? p.buildingName.trim()
            : null;
        const rooms = parseBundledRooms(p);
        if (name && rooms.length > 0) {
          return `New building: ${name} (+ ${rooms.length} room${rooms.length === 1 ? "" : "s"})`;
        }
        return name ? `New building: ${name}` : "New building";
      }
      case "create_event":
        return typeof p.title === "string" && p.title.trim()
          ? `New event: ${p.title.trim()}`
          : "New event";
      case "create_dorm":
        return typeof p.dormName === "string" && p.dormName.trim()
          ? `New dorm: ${p.dormName.trim()}`
          : "New dorm";
      case "create_place":
        return typeof p.name === "string" && p.name.trim()
          ? `New place: ${p.name.trim()}`
          : "New place";
      case "create_room": {
        const code =
          typeof p.roomCode === "string" && p.roomCode.trim()
            ? p.roomCode.trim()
            : null;
        const buildingId = Number(p.buildingId);
        if (code && Number.isInteger(buildingId) && buildingId >= 1) {
          const [row] = await db
            .select({ label: buildingsTable.buildingName })
            .from(buildingsTable)
            .where(eq(buildingsTable.id, buildingId))
            .limit(1);
          if (row?.label) {
            return `New room: ${code} (${row.label})`;
          }
        }
        return code ? `New room: ${code}` : "New room";
      }
      case "create_college":
        return typeof p.collegeName === "string" && p.collegeName.trim()
          ? `New college: ${p.collegeName.trim()}`
          : "New college";
      case "create_division":
        return typeof p.divisionName === "string" && p.divisionName.trim()
          ? `New division: ${p.divisionName.trim()}`
          : "New division";
      case "create_organization":
        return typeof p.name === "string" && p.name.trim()
          ? `New org: ${p.name.trim()}`
          : "New organization";
      case "create_jeepney_stop":
        return typeof p.name === "string" && p.name.trim()
          ? `New jeepney stop: ${p.name.trim()}`
          : "New jeepney stop";
    }
  }

  switch (entityType) {
    case "building": {
      const [row] = await db
        .select({ label: buildingsTable.buildingName })
        .from(buildingsTable)
        .where(eq(buildingsTable.id, entityId))
        .limit(1);
      return row?.label ?? `Building #${entityId}`;
    }
    case "dorm": {
      const [row] = await db
        .select({ label: dormsTable.dormName })
        .from(dormsTable)
        .where(eq(dormsTable.id, entityId))
        .limit(1);
      return row?.label ?? `Dorm #${entityId}`;
    }
    case "place": {
      const [row] = await db
        .select({ label: placesTable.name })
        .from(placesTable)
        .where(eq(placesTable.id, entityId))
        .limit(1);
      return row?.label ?? `Place #${entityId}`;
    }
    case "room": {
      const [row] = await db
        .select({ label: roomsTable.roomCode })
        .from(roomsTable)
        .where(eq(roomsTable.id, entityId))
        .limit(1);
      return row?.label ?? `Room #${entityId}`;
    }
    case "college": {
      const [row] = await db
        .select({ label: collegesTable.collegeName })
        .from(collegesTable)
        .where(eq(collegesTable.id, entityId))
        .limit(1);
      return row?.label ?? `College #${entityId}`;
    }
    case "division": {
      const [row] = await db
        .select({ label: divisionsTable.divisionName })
        .from(divisionsTable)
        .where(eq(divisionsTable.id, entityId))
        .limit(1);
      return row?.label ?? `Division #${entityId}`;
    }
    case "event":
    case "event_locations": {
      const [row] = await db
        .select({ label: eventsTable.title })
        .from(eventsTable)
        .where(eq(eventsTable.id, entityId))
        .limit(1);
      return row?.label ?? `Event #${entityId}`;
    }
    case "organization": {
      const [row] = await db
        .select({ label: organizationsTable.name })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, entityId))
        .limit(1);
      return row?.label ?? `Organization #${entityId}`;
    }
    case "jeepney_stop": {
      const [row] = await db
        .select({ label: jeepneyStopsTable.name })
        .from(jeepneyStopsTable)
        .where(eq(jeepneyStopsTable.id, entityId))
        .limit(1);
      return row?.label ?? `Jeepney stop #${entityId}`;
    }
  }
}

async function entityExists(
  entityType: ProposalUpdateType,
  entityId: number,
): Promise<boolean> {
  switch (entityType) {
    case "building": {
      const [row] = await db
        .select({ id: buildingsTable.id })
        .from(buildingsTable)
        .where(eq(buildingsTable.id, entityId))
        .limit(1);
      return row !== undefined;
    }
    case "dorm": {
      const [row] = await db
        .select({ id: dormsTable.id })
        .from(dormsTable)
        .where(eq(dormsTable.id, entityId))
        .limit(1);
      return row !== undefined;
    }
    case "place": {
      const [row] = await db
        .select({ id: placesTable.id })
        .from(placesTable)
        .where(eq(placesTable.id, entityId))
        .limit(1);
      return row !== undefined;
    }
    case "room": {
      const [row] = await db
        .select({ id: roomsTable.id })
        .from(roomsTable)
        .where(eq(roomsTable.id, entityId))
        .limit(1);
      return row !== undefined;
    }
    case "college": {
      const [row] = await db
        .select({ id: collegesTable.id })
        .from(collegesTable)
        .where(eq(collegesTable.id, entityId))
        .limit(1);
      return row !== undefined;
    }
    case "division": {
      const [row] = await db
        .select({ id: divisionsTable.id })
        .from(divisionsTable)
        .where(eq(divisionsTable.id, entityId))
        .limit(1);
      return row !== undefined;
    }
    case "event":
    case "event_locations": {
      const [row] = await db
        .select({ id: eventsTable.id })
        .from(eventsTable)
        .where(eq(eventsTable.id, entityId))
        .limit(1);
      return row !== undefined;
    }
    case "organization": {
      const [row] = await db
        .select({ id: organizationsTable.id })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, entityId))
        .limit(1);
      return row !== undefined;
    }
    case "jeepney_stop": {
      const [row] = await db
        .select({ id: jeepneyStopsTable.id })
        .from(jeepneyStopsTable)
        .where(eq(jeepneyStopsTable.id, entityId))
        .limit(1);
      return row !== undefined;
    }
  }
}

export type ProposalPublicView = {
  id: number;
  entityType: string;
  entityId: number;
  entityLabel: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProposalSubmitterView = ProposalPublicView & {
  proposedPatch: Record<string, unknown>;
  baseVersion: number;
  submitterName: string;
};

export function toPublicProposalView(
  summary: EditProposalSummary,
): ProposalPublicView {
  const showNote =
    summary.status === "needs_changes" || summary.status === "rejected";
  return {
    id: summary.id,
    entityType: summary.entityType,
    entityId: summary.entityId,
    entityLabel: summary.entityLabel,
    status: summary.status,
    adminNote: showNote ? summary.adminNote : null,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
  };
}

export function toSubmitterProposalView(
  summary: EditProposalSummary,
): ProposalSubmitterView {
  return {
    ...toPublicProposalView(summary),
    proposedPatch: summary.proposedPatch as Record<string, unknown>,
    baseVersion: summary.baseVersion,
    submitterName: summary.submitterName,
  };
}
export async function withEntityLabel(
  row: EditProposalRow,
): Promise<EditProposalSummary> {
  return {
    ...row,
    entityLabel: await getEntityLabel(
      row.entityType as ProposalEntityType,
      row.entityId,
      row.proposedPatch as Record<string, unknown>,
    ),
  };
}

export async function listPendingProposals(): Promise<EditProposalSummary[]> {
  const rows = await db
    .select()
    .from(editProposalsTable)
    .where(
      inArray(editProposalsTable.status, ["pending", "needs_changes"] as const),
    )
    .orderBy(desc(editProposalsTable.createdAt));

  return Promise.all(rows.map(withEntityLabel));
}

export async function getCurrentEntityValues(
  entityType: ProposalUpdateType,
  entityId: number,
): Promise<Record<string, unknown> | null> {
  switch (entityType) {
    case "building": {
      const [row] = await db
        .select()
        .from(buildingsTable)
        .where(eq(buildingsTable.id, entityId))
        .limit(1);
      return row ?? null;
    }
    case "dorm": {
      const [row] = await db
        .select()
        .from(dormsTable)
        .where(eq(dormsTable.id, entityId))
        .limit(1);
      return row ?? null;
    }
    case "room": {
      const [row] = await db
        .select()
        .from(roomsTable)
        .where(eq(roomsTable.id, entityId))
        .limit(1);
      return row ?? null;
    }
    case "college": {
      const [row] = await db
        .select()
        .from(collegesTable)
        .where(eq(collegesTable.id, entityId))
        .limit(1);
      return row ?? null;
    }
    case "division": {
      const [row] = await db
        .select()
        .from(divisionsTable)
        .where(eq(divisionsTable.id, entityId))
        .limit(1);
      return row ?? null;
    }
    case "event": {
      const [row] = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.id, entityId))
        .limit(1);
      return row ?? null;
    }
    case "event_locations": {
      const [row] = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.id, entityId))
        .limit(1);
      if (!row) return null;
      // Patch key is `locations`; include the published ones so the review
      // queue renders a real before/after instead of a blank diff.
      const locations = await db
        .select()
        .from(eventLocationsTable)
        .where(eq(eventLocationsTable.eventId, entityId))
        .orderBy(eventLocationsTable.sortOrder, eventLocationsTable.id);
      return { ...row, locations };
    }
    case "organization": {
      const [row] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.id, entityId))
        .limit(1);
      return row ?? null;
    }
    case "place": {
      const [row] = await db
        .select()
        .from(placesTable)
        .where(eq(placesTable.id, entityId))
        .limit(1);
      return row ?? null;
    }
    case "jeepney_stop": {
      const [row] = await db
        .select()
        .from(jeepneyStopsTable)
        .where(eq(jeepneyStopsTable.id, entityId))
        .limit(1);
      return row ?? null;
    }
  }
}

export type ReviewProposalSummary = EditProposalSummary & {
  /** Published values for the patched fields; null for create_* or deleted entities. */
  currentValues: Record<string, unknown> | null;
  currentVersion: number | null;
};

export async function listPendingProposalsForReview(): Promise<
  ReviewProposalSummary[]
> {
  const rows = await listPendingProposals();
  return Promise.all(
    rows.map(async (row) => {
      if (isCreateProposalType(row.entityType)) {
        return { ...row, currentValues: null, currentVersion: null };
      }
      const current = await getCurrentEntityValues(
        row.entityType as ProposalUpdateType,
        row.entityId,
      );
      if (!current) {
        return { ...row, currentValues: null, currentVersion: null };
      }
      const patch = row.proposedPatch as Record<string, unknown>;
      const currentValues = Object.fromEntries(
        Object.keys(patch)
          .filter((key) => key in current)
          .map((key) => [key, current[key]]),
      );
      const version = current.version;
      return {
        ...row,
        currentValues,
        currentVersion: typeof version === "number" ? version : null,
      };
    }),
  );
}

export async function countPendingProposals(): Promise<number> {
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(editProposalsTable)
    .where(
      inArray(editProposalsTable.status, ["pending", "needs_changes"] as const),
    );
  return Number(rows[0]?.c ?? 0);
}

export async function getProposalById(
  id: number,
): Promise<EditProposalSummary | null> {
  const [row] = await db
    .select()
    .from(editProposalsTable)
    .where(eq(editProposalsTable.id, id))
    .limit(1);
  if (!row) return null;
  return withEntityLabel(row);
}

type SubmitProposalInput = {
  entityType: string;
  entityId: number;
  baseVersion: number;
  patch: Record<string, unknown>;
  submitterName: string;
  submitterUserId?: number | null;
  proposalId?: number | null;
  /** Contributor's message to the reviewer. Never merged into the patch. */
  submitterNote?: string | null;
};

/** Anonymous submitters cannot borrow a registered contributor's identity:
 * signup reserves usernames, so a free-text name that normalizes to an
 * account's username or display name ("Stimmie", "STIMMIE", "St immie") is
 * rejected with a sign-in hint. Case/spacing/punctuation collapse via
 * normalizeAlias.
 * ponytail: full-table scan of admin_users; index a normalized column if the
 * account list ever grows past a few thousand. */
async function isReservedContributorName(name: string): Promise<boolean> {
  const key = normalizeAlias(name);
  if (!key) return false;
  const accounts = await db
    .select({
      username: adminUsersTable.username,
      displayName: adminUsersTable.displayName,
    })
    .from(adminUsersTable);
  return accounts.some(
    (account) =>
      normalizeAlias(account.username ?? "") === key ||
      normalizeAlias(account.displayName ?? "") === key,
  );
}

export async function submitProposal(
  input: SubmitProposalInput,
): Promise<EditProposalSummary> {
  if (!isProposalEntityType(input.entityType)) {
    throw new ProposalValidationError("Unsupported entity type.");
  }
  const isCreate = isCreateProposalType(input.entityType);
  if (isCreate) {
    if (input.entityId !== 0) {
      throw new ProposalValidationError("Invalid entity ID for a new entry.");
    }
    if (input.baseVersion !== 0) {
      throw new ProposalValidationError(
        "Invalid base version for a new entry.",
      );
    }
  } else {
    if (!Number.isInteger(input.entityId) || input.entityId < 1) {
      throw new ProposalValidationError("Invalid entity ID.");
    }
    if (!Number.isInteger(input.baseVersion) || input.baseVersion < 1) {
      throw new ProposalValidationError("Invalid base version.");
    }
  }
  const validation = validateSubmitterName(input.submitterName);
  if (!validation.ok) {
    throw new ProposalValidationError(validation.error);
  }
  const name = validation.name;
  const noteValidation = validateSubmitterNote(input.submitterNote ?? "");
  if (!noteValidation.ok) {
    throw new ProposalValidationError(noteValidation.error);
  }
  const submitterNote = noteValidation.note;
  if (!input.submitterUserId && (await isReservedContributorName(name))) {
    throw new ProposalValidationError(
      "That name belongs to a registered contributor. Sign in to use it, or pick a different name.",
    );
  }
  if (Object.keys(input.patch).length === 0) {
    throw new ProposalValidationError("No changes to submit.");
  }

  if (
    !isCreate &&
    !(await entityExists(
      input.entityType as ProposalUpdateType,
      input.entityId,
    ))
  ) {
    throw new ProposalValidationError("Entity not found.");
  }

  let existing: EditProposalRow | undefined;

  if (input.proposalId) {
    [existing] = await db
      .select()
      .from(editProposalsTable)
      .where(eq(editProposalsTable.id, input.proposalId))
      .limit(1);
    if (
      !existing ||
      !["pending", "needs_changes"].includes(existing.status) ||
      existing.submitterName !== name ||
      (input.submitterUserId &&
        existing.submitterUserId !== input.submitterUserId)
    ) {
      existing = undefined;
    }
  } else if (allowEntityScopedProposalMerge(isCreate, input.submitterUserId)) {
    [existing] = await db
      .select()
      .from(editProposalsTable)
      .where(
        and(
          eq(editProposalsTable.entityType, input.entityType),
          eq(editProposalsTable.entityId, input.entityId),
          eq(editProposalsTable.submitterUserId, input.submitterUserId),
          inArray(editProposalsTable.status, [
            "pending",
            "needs_changes",
          ] as const),
        ),
      )
      .limit(1);
  }

  const mergedPatch = existing
    ? {
        ...(existing.proposedPatch as Record<string, unknown>),
        ...input.patch,
      }
    : input.patch;

  if (isCreate) {
    validateCreateProposalPatch(input.entityType, mergedPatch);
    if (input.entityType === "create_room") {
      const buildingId = Number(mergedPatch.buildingId);
      const [row] = await db
        .select({ id: buildingsTable.id })
        .from(buildingsTable)
        .where(eq(buildingsTable.id, buildingId))
        .limit(1);
      if (!row) {
        throw new ProposalValidationError(
          "That building is not on the map yet. Wait for editors to approve your building suggestion, or pick a building that already exists.",
        );
      }
    }
  }

  if (existing) {
    const [updated] = await db
      .update(editProposalsTable)
      .set({
        proposedPatch: mergedPatch,
        baseVersion: input.baseVersion,
        status: "pending",
        adminNote: null,
        // A revise with no new note keeps the one already on the proposal.
        submitterNote: submitterNote ?? existing.submitterNote,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: sql`now()`,
      })
      .where(eq(editProposalsTable.id, existing.id))
      .returning();
    if (!updated) throw new Error("Failed to update proposal.");
    return withEntityLabel(updated);
  }

  const [created] = await db
    .insert(editProposalsTable)
    .values({
      entityType: input.entityType,
      entityId: input.entityId,
      proposedPatch: mergedPatch,
      baseVersion: input.baseVersion,
      submitterName: name,
      submitterUserId: input.submitterUserId ?? null,
      submitterNote,
      status: "pending",
    })
    .returning();

  if (!created) throw new Error("Failed to create proposal.");
  return withEntityLabel(created);
}

export {
  ProposalValidationError,
  parseBundledRooms,
  validateBundledRooms,
  type BundledRoomDraft,
} from "@lib/proposals/create-proposal-validation";

export class ProposalActionError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ProposalActionError";
    this.status = status;
  }
}

function validateProposalImageUrl(
  patch: Record<string, unknown>,
  label: string,
) {
  if (!("imageUrl" in patch)) return;
  const parsed = parseImageUrl(patch.imageUrl, R2_PUBLIC_URL, label);
  if (!parsed.ok) {
    throw new ProposalActionError(parsed.error);
  }
  if (parsed.provided) {
    patch.imageUrl = parsed.imageUrl;
  }
}

const IMAGE_PATCH_ENTITY_LABELS: Readonly<Record<string, string>> = {
  create_event: "Event image",
  event: "Event image",
  building: "Building image",
  room: "Room image",
  dorm: "Dorm image",
  create_dorm: "Dorm image",
};

async function applyProposalPatch(proposal: EditProposalRow, editedBy: string) {
  const patch = proposal.proposedPatch as Record<string, unknown>;
  const entityType = proposal.entityType as ProposalEntityType;

  const imageLabel = IMAGE_PATCH_ENTITY_LABELS[entityType];
  if (imageLabel) {
    validateProposalImageUrl(patch, imageLabel);
  }

  if (isCreateProposalType(entityType)) {
    switch (entityType) {
      case "create_building": {
        const rooms = parseBundledRooms(patch);
        const building = await createBuilding(
          {
            buildingName:
              typeof patch.buildingName === "string" ? patch.buildingName : "",
            directions:
              typeof patch.directions === "string" ? patch.directions : "",
            buildingType:
              patch.buildingType === "admin" ? "admin" : "non-admin",
            lat: patch.lat as number,
            lon: patch.lon as number,
          },
          editedBy,
        );
        if (!building) {
          throw new ProposalActionError("Failed to create building.", 500);
        }
        try {
          for (const room of rooms) {
            await createRoom(
              {
                roomCode: room.roomCode,
                directions: room.directions || null,
                buildingId: building.id,
              },
              editedBy,
            );
          }
        } catch (error) {
          // Roll back the building so a failed bundle doesn't leave an
          // orphaned building on the map. Editor history keeps the attempt.
          await db
            .delete(roomsTable)
            .where(eq(roomsTable.buildingId, building.id));
          await db
            .delete(buildingsTable)
            .where(eq(buildingsTable.id, building.id));
          const reason =
            error instanceof Error ? error.message : "unknown error";
          throw new ProposalActionError(
            `Failed to create bundled rooms (${reason}); building was rolled back.`,
            500,
          );
        }
        return building;
      }
      case "create_college": {
        const collegeName =
          typeof patch.collegeName === "string" ? patch.collegeName : "";
        return createCollege(collegeName, editedBy);
      }
      case "create_division": {
        const divisionName =
          typeof patch.divisionName === "string" ? patch.divisionName : "";
        const collegeId =
          patch.collegeId === null || patch.collegeId === undefined
            ? null
            : Number(patch.collegeId);
        return createDivision(
          {
            divisionName,
            collegeId: Number.isInteger(collegeId) ? collegeId : null,
          },
          editedBy,
        );
      }
      case "create_dorm":
        return createDorm(patch as DormCreateInput, editedBy);
      case "create_place":
        return createPlace(patch as PlaceCreateInput, editedBy);
      case "create_room":
        return createRoom(patch as RoomCreateInput, editedBy);
      case "create_event":
        return createEvent(patch as EventWriteInput, editedBy);
      case "create_organization":
        return createOrganization(patch as OrgCreateInput, editedBy);
      case "create_jeepney_stop": {
        const stop = await createJeepneyStop(
          patch as JeepneyStopCreateInput,
          editedBy,
        );
        if (!stop) {
          throw new ProposalActionError("Jeepney route no longer exists.", 409);
        }
        return stop;
      }
    }
  }

  const version = proposal.baseVersion;

  switch (entityType) {
    case "building":
      return updateBuilding(
        proposal.entityId,
        patch as BuildingUpdateInput,
        version,
        editedBy,
      );
    case "dorm":
      return updateDorm(
        proposal.entityId,
        patch as DormUpdateInput,
        version,
        editedBy,
      );
    case "place":
      return updatePlace(
        proposal.entityId,
        patch as PlaceUpdateInput,
        version,
        editedBy,
      );
    case "room":
      return updateRoom(
        proposal.entityId,
        patch as RoomUpdateInput,
        version,
        editedBy,
      );
    case "college": {
      const name =
        typeof patch.collegeName === "string" ? patch.collegeName : "";
      return updateCollege(proposal.entityId, name, version, editedBy);
    }
    case "division": {
      const updates: DivisionUpdateInput = {};
      if (typeof patch.divisionName === "string") {
        updates.divisionName = patch.divisionName;
      }
      if (patch.collegeId !== undefined) {
        updates.collegeId =
          patch.collegeId === null ? null : Number(patch.collegeId);
      }
      return updateDivision(proposal.entityId, updates, version, editedBy);
    }
    case "event":
      return updateEvent(
        proposal.entityId,
        patch as EventWriteInput,
        version,
        editedBy,
      );
    case "event_locations": {
      const locations = patch.locations;
      if (!Array.isArray(locations)) {
        throw new ProposalActionError("Invalid event locations proposal.");
      }
      return updateEventLocations(
        proposal.entityId,
        locations as EventLocationWriteInput[],
        version,
        editedBy,
      );
    }
    case "organization":
      return updateOrganization(
        proposal.entityId,
        patch as OrgUpdateInput,
        version,
        editedBy,
      );
    case "jeepney_stop": {
      const stop = await updateJeepneyStop(
        proposal.entityId,
        patch as JeepneyStopWriteInput,
        version,
        editedBy,
      );
      if (!stop) {
        throw new ProposalActionError("Jeepney stop no longer exists.", 409);
      }
      return stop;
    }
    default:
      throw new ProposalActionError("Unsupported entity type.");
  }
}

async function finalizeProposal(
  id: number,
  status: "approved" | "rejected" | "needs_changes",
  reviewedBy: string,
  adminNote?: string | null,
) {
  const [updated] = await db
    .update(editProposalsTable)
    .set({
      status,
      reviewedBy,
      reviewedAt: sql`now()`,
      adminNote: adminNote?.trim() || null,
      updatedAt: sql`now()`,
    })
    .where(eq(editProposalsTable.id, id))
    .returning();
  return updated ?? null;
}

export async function approveProposal(id: number, reviewer: SessionUser) {
  const proposal = await getProposalById(id);
  if (!proposal) throw new ProposalActionError("Proposal not found.", 404);
  if (!["pending", "needs_changes"].includes(proposal.status)) {
    throw new ProposalActionError("This proposal is no longer open.", 409);
  }

  const reviewedBy = reviewer.displayName || reviewer.username;
  const priorStatus = proposal.status;
  const priorNote = proposal.adminNote;

  const [claimed] = await db
    .update(editProposalsTable)
    .set({
      status: "approved",
      reviewedBy,
      reviewedAt: sql`now()`,
      adminNote: null,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(editProposalsTable.id, id),
        inArray(editProposalsTable.status, [
          "pending",
          "needs_changes",
        ] as const),
      ),
    )
    .returning();

  if (!claimed) {
    throw new ProposalActionError("This proposal is no longer open.", 409);
  }

  try {
    const published = await applyProposalPatch(claimed, reviewedBy);
    const proposal = await withEntityLabel(claimed);
    await recordProposalContribution(proposal);
    await sendReviewNotice({
      outcome: "approved",
      entityLabel: proposal.entityLabel,
      submitterName: proposal.submitterName,
      submitterUserId: proposal.submitterUserId ?? null,
      reviewedBy,
    });
    return { proposal, published };
  } catch (err) {
    await db
      .update(editProposalsTable)
      .set({
        status: priorStatus,
        reviewedBy: null,
        reviewedAt: null,
        adminNote: priorNote,
        updatedAt: sql`now()`,
      })
      .where(eq(editProposalsTable.id, id));

    if (err instanceof EditConflictError) {
      throw new ProposalActionError(
        "Published data changed before approval. Refresh and review again.",
        409,
      );
    }
    if (err instanceof DuplicateSlugError) {
      throw new ProposalActionError(err.message, 409);
    }
    throw err;
  }
}

export async function rejectProposal(
  id: number,
  reviewer: SessionUser,
  note?: string,
) {
  const proposal = await getProposalById(id);
  if (!proposal) throw new ProposalActionError("Proposal not found.", 404);
  if (!["pending", "needs_changes"].includes(proposal.status)) {
    throw new ProposalActionError("This proposal is no longer open.", 409);
  }
  const finalized = await finalizeProposal(
    id,
    "rejected",
    reviewer.displayName || reviewer.username,
    note,
  );
  if (!finalized) throw new ProposalActionError("Proposal not found.", 404);
  const labeled = await withEntityLabel(finalized);
  await sendReviewNotice({
    outcome: "rejected",
    entityLabel: labeled.entityLabel,
    submitterName: labeled.submitterName,
    submitterUserId: labeled.submitterUserId ?? null,
    reviewedBy: reviewer.displayName || reviewer.username,
    note,
  });
  return labeled;
}

export async function requestProposalChanges(
  id: number,
  reviewer: SessionUser,
  note?: string,
) {
  const proposal = await getProposalById(id);
  if (!proposal) throw new ProposalActionError("Proposal not found.", 404);
  if (!["pending", "needs_changes"].includes(proposal.status)) {
    throw new ProposalActionError("This proposal is no longer open.", 409);
  }
  if (!note?.trim()) {
    throw new ProposalValidationError(
      "Add a note so the contributor knows what to change.",
    );
  }
  const finalized = await finalizeProposal(
    id,
    "needs_changes",
    reviewer.displayName || reviewer.username,
    note,
  );
  if (!finalized) throw new ProposalActionError("Proposal not found.", 404);
  const labeled = await withEntityLabel(finalized);
  await sendReviewNotice({
    outcome: "needs_changes",
    entityLabel: labeled.entityLabel,
    submitterName: labeled.submitterName,
    submitterUserId: labeled.submitterUserId ?? null,
    reviewedBy: reviewer.displayName || reviewer.username,
    note,
  });
  return labeled;
}

export async function withdrawProposal(
  id: number,
  session: SessionUser | null,
  submitterName?: string,
) {
  const proposal = await getProposalById(id);
  if (!proposal) throw new ProposalActionError("Proposal not found.", 404);
  if (!["pending", "needs_changes"].includes(proposal.status)) {
    throw new ProposalActionError("This proposal is no longer open.", 409);
  }
  if (!canWithdrawProposal(session, proposal, submitterName)) {
    throw new ProposalActionError(
      "Not allowed to withdraw this proposal.",
      403,
    );
  }

  const withdrawnBy =
    session?.displayName || session?.username || proposal.submitterName;

  const [updated] = await db
    .update(editProposalsTable)
    .set({
      status: "withdrawn",
      reviewedBy: withdrawnBy,
      reviewedAt: sql`now()`,
      adminNote: null,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(editProposalsTable.id, id),
        inArray(editProposalsTable.status, [
          "pending",
          "needs_changes",
        ] as const),
      ),
    )
    .returning();

  if (!updated) {
    throw new ProposalActionError("This proposal is no longer open.", 409);
  }
  return withEntityLabel(updated);
}
