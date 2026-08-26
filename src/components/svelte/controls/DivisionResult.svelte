<script lang="ts">
  import EntitySkeleton from "@ui/EntitySkeleton.svelte";
  import {
    adminAuthStore,
    queryStore,
    toastStore,
    termStore,
  } from "@lib/store.svelte";
  import {
    getStoredProposalForEntity,
    persistEntityChange,
    mergeEntityRecord,
  } from "@lib/proposals/client";
  import { handlePersistEntityResult } from "@lib/editor/handle-persist-result";
  import MergeEntityPrompt from "@ui/editor/MergeEntityPrompt.svelte";
  import {
    clearEntityContributorDraft,
    readEntityContributorDraft,
    scheduleEntityContributorDraftSave,
  } from "@lib/contributor-drafts";
  import { getAppActions, getAppData } from "@lib/context";
  import type { DivisionData, RoomData } from "@lib/types";
  import {
    getDivisionRooms,
    fetchRoomClassCounts,
    fetchEntityRoomsRemote,
  } from "@lib/local/data/utils";
  import ResultDisplay from "./ResultDisplay.svelte";
  import EntityShareCopyLink from "./EntityShareCopyLink.svelte";
  import EntityBackToList from "./EntityBackToList.svelte";
  import EntityExternalLink from "./EntityExternalLink.svelte";
  import EntityLastUpdated from "../EntityLastUpdated.svelte";
  import { getDivisionShareUrl } from "@lib/share-links";
  import EntityEditorToggle from "@ui/editor/EntityEditorToggle.svelte";
  import EntityEditorPanel from "@ui/editor/EntityEditorPanel.svelte";
  import EntityEditorField from "@ui/editor/EntityEditorField.svelte";
  import { entityEditorSavedMessage } from "@lib/editor/field-action-label";
  import {
    checkLocalDivisionRoom,
    getLocalDivisionRooms,
    syncDivisionRooms,
  } from "@lib/local/data/sync";

  type DivisionPatchResponse = {
    success?: boolean;
    division?: DivisionData;
    latest?: DivisionData | null;
    error?: string;
  };

  const appData = getAppData();
  const appActions = getAppActions();
  const { divisions, colleges, loaded } = $derived(appData());

  const division = $derived(
    loaded
      ? divisions.find((d) => d.divisionName === queryStore.queryValue)
      : null,
  );

  const parentCollege = $derived.by(() => {
    const current = division;
    if (!current?.collegeId) return null;
    return colleges.find((college) => college.id === current.collegeId) ?? null;
  });

  let divisionRooms = $state<RoomData[] | null>(null);
  let classCounts = $state<Map<number, number> | null>(null);
  let editing = $state(false);
  let draftDivisionId = $state<number | null>(null);
  let draftVersion = $state<number | null>(null);
  let nameDraft = $state("");
  let collegeDraft = $state("");
  let savingField = $state<"divisionName" | "collegeId" | null>(null);
  let savedField = $state<"divisionName" | "collegeId" | null>(null);
  let fieldError = $state<string | null>(null);
  let submitterNameDraft = $state("");
  let activeProposalId = $state<number | null>(null);
  let proposalStatus = $state<string | null>(null);
  let mergePrompt = $state<{
    candidate: DivisionData;
    attemptedName: string;
    sourceVersion: number;
  } | null>(null);
  let mergingEntity = $state(false);
  const canPublish = $derived(adminAuthStore.canPublish);
  const divisionShareUrl = $derived(
    division ? getDivisionShareUrl(division.divisionName) : "",
  );

  // Reload rooms when the selected division changes; DivisionResult is not
  // remounted on switch, so key the load on division id and discard stale
  // fetches from a previous selection (#340).
  let roomLoadGeneration = 0;

  $effect(() => {
    const id = division?.id;
    if (id == null) {
      divisionRooms = null;
      return;
    }
    const gen = ++roomLoadGeneration;
    void (async () => {
      const local = (await getLocalDivisionRooms(id)) ?? [];
      if (gen === roomLoadGeneration && local.length > 0) {
        divisionRooms = local;
      }

      const divisionChecker = await checkLocalDivisionRoom(id);
      const rooms = await getDivisionRooms(divisionChecker, id);
      if (gen !== roomLoadGeneration) return;
      divisionRooms = rooms;
      await syncDivisionRooms(divisionChecker, id, rooms);

      if (!divisionChecker && local.length > 0) {
        try {
          const remote = await fetchEntityRoomsRemote("division", id);
          if (gen !== roomLoadGeneration || remote.length === 0) return;
          divisionRooms = remote;
          await syncDivisionRooms(false, id, remote);
        } catch {
          // Keep cached rows when background refresh fails.
        }
      }
    })();
  });

  // Class counts per room for the active term, batched in one request so the
  // room list preview doesn't fire N+1 /api/classes calls (#342). Re-fetches
  // when the division or the active term changes; null while loading/offline.
  let classCountGeneration = 0;

  $effect(() => {
    const id = division?.id;
    const termId = termStore.activeTermId;
    if (id == null) {
      classCounts = null;
      return;
    }
    const gen = ++classCountGeneration;
    void (async () => {
      const counts = await fetchRoomClassCounts(
        "division",
        id,
        termId ?? undefined,
      );
      if (gen !== classCountGeneration) return;
      classCounts = counts;
    })();
  });

  $effect(() => {
    const current = division;
    if (!current) return;
    if (draftDivisionId === current.id && draftVersion === current.version) {
      return;
    }

    draftDivisionId = current.id;
    draftVersion = current.version;
    nameDraft = current.divisionName;
    collegeDraft = current.collegeId === null ? "" : String(current.collegeId);
    savedField = null;
    fieldError = null;
    mergePrompt = null;
    proposalStatus = null;
    const stored = getStoredProposalForEntity("division", current.id);
    activeProposalId = stored?.id ?? null;
    if (stored) proposalStatus = stored.status;

    if (!canPublish) {
      const savedDraft = readEntityContributorDraft("division", current.id);
      if (savedDraft) {
        // if (savedDraft.editing) editing = true;
        if (typeof savedDraft.fields.nameDraft === "string") {
          nameDraft = savedDraft.fields.nameDraft;
        }
        if (typeof savedDraft.fields.collegeDraft === "string") {
          collegeDraft = savedDraft.fields.collegeDraft;
        }
      }
    }
  });

  $effect(() => {
    if (canPublish || !editing || !division) return;
    scheduleEntityContributorDraftSave("division", division.id, () => ({
      editing: true,
      fields: { nameDraft, collegeDraft },
    }));
  });

  function syncDivisionFromServer(updated: DivisionData) {
    appActions.upsertDivision(updated);
    queryStore.hydrateQuery({
      type: "result",
      category: "division",
      value: updated.divisionName,
    });
  }

  const allFieldsUnchanged = $derived.by(() => {
    const current = division;
    if (!current) return true;
    return (
      nameDraft.trim() === current.divisionName &&
      collegeDraft ===
        (current.collegeId === null ? "" : String(current.collegeId))
    );
  });

  async function submitAllChanges() {
    const current = division;
    if (!current || allFieldsUnchanged) return;

    const patch: Record<string, unknown> = {};

    if (nameDraft.trim() !== current.divisionName) {
      const trimmedName = nameDraft.trim();
      if (trimmedName.length === 0) {
        fieldError = `${current.divisionName} name cannot be empty.`;
        return;
      }
      patch.divisionName = trimmedName;
    }

    if (
      collegeDraft !==
      (current.collegeId === null ? "" : String(current.collegeId))
    ) {
      patch.collegeId = collegeDraft === "" ? null : Number(collegeDraft);
    }

    savingField = "divisionName"; // fallback indicator
    savedField = null;
    fieldError = null;

    try {
      const result = await persistEntityChange({
        entityType: "division",
        entityId: current.id,
        baseVersion: current.version,
        patch,
        entityLabel: current.divisionName,
        canPublish,
        submitterName:
          adminAuthStore.displayName ??
          adminAuthStore.username ??
          submitterNameDraft,
        proposalId: activeProposalId,
      });

      const outcome = handlePersistEntityResult<DivisionData>(result, {
        syncFromServer: syncDivisionFromServer,
        fallbackError: `${current.divisionName} could not be saved.`,
      });

      if (outcome.error) {
        if (outcome.mergeCandidate && patch.divisionName) {
          mergePrompt = {
            candidate: outcome.mergeCandidate as DivisionData,
            attemptedName: patch.divisionName as string,
            sourceVersion: current.version,
          };
          fieldError = null;
          return;
        }
        fieldError = outcome.error;
        return;
      }

      if (outcome.proposal) {
        activeProposalId = outcome.proposal.id;
        proposalStatus = outcome.proposal.status;
        clearEntityContributorDraft("division", current.id);
        toastStore.show(
          "Division change suggestion submitted for review.",
          "success",
        );
      }
      if (outcome.published) {
        savedField = "divisionName";
        setTimeout(() => {
          if (savedField === "divisionName") savedField = null;
        }, 1800);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Network error";
      fieldError = `${current.divisionName} failed to save: ${reason}`;
    } finally {
      savingField = null;
    }
  }

  function dismissMergePrompt() {
    mergePrompt = null;
    const current = division;
    if (current) nameDraft = current.divisionName;
  }

  async function confirmDivisionMerge() {
    const current = division;
    if (!current || !mergePrompt) return;

    mergingEntity = true;
    fieldError = null;

    try {
      const result = await mergeEntityRecord({
        entityType: "division",
        sourceId: current.id,
        targetId: mergePrompt.candidate.id,
        sourceVersion: mergePrompt.sourceVersion,
        preferredName: mergePrompt.attemptedName,
      });

      if (!result.ok) {
        if (result.latest)
          syncDivisionFromServer(result.latest as DivisionData);
        fieldError =
          result.error ??
          `${current.divisionName} could not be merged into ${mergePrompt.candidate.divisionName}.`;
        return;
      }

      if (result.entity) {
        syncDivisionFromServer(result.entity as DivisionData);
        toastStore.show(
          `Merged ${current.divisionName} into ${mergePrompt.candidate.divisionName}.`,
          "success",
        );
      }
      mergePrompt = null;
      editing = false;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Network error";
      fieldError = `${current.divisionName} merge failed: ${reason}`;
    } finally {
      mergingEntity = false;
    }
  }

  function openCollege(collegeName: string) {
    queryStore.updateQuery({
      type: "result",
      category: "college",
      value: collegeName,
    });
  }

  function divisionSavedMessage(
    field: "divisionName" | "collegeId" | null,
  ): string | null {
    if (!field) return null;
    if (!canPublish) {
      return entityEditorSavedMessage({ canPublish: false });
    }
    return field === "collegeId"
      ? "Parent college saved."
      : "Division name saved.";
  }
</script>

<div class="entity-detail division-query-wrapper">
  {#if division}
    <header class="entity-header">
      <EntityBackToList tab="divisions" label="Back to divisions" />
      <h2 class="entity-header__title">{division.divisionName}</h2>
      {#if parentCollege}
        <p class="entity-header__context">
          Part of
          <button
            type="button"
            class="entity-header__context-link"
            onclick={() => openCollege(parentCollege.collegeName)}
          >
            {parentCollege.collegeName}
          </button>
        </p>
      {:else}
        <p class="entity-header__context entity-header__context--muted">
          No parent college assigned
        </p>
      {/if}
      <div class="entity-actions">
        <EntityShareCopyLink
          url={divisionShareUrl}
          entityLabel={division.divisionName}
        />
        <EntityEditorToggle
          expanded={editing}
          {canPublish}
          publishOpenLabel="Edit division"
          variant="toolbar"
          onclick={() => (editing = !editing)}
        />
      </div>
    </header>

    {#if division.websiteLink}
      <div class="entity-dorm-details__links">
        <EntityExternalLink
          href={division.websiteLink}
          label="Website"
          ariaLabel={`Open ${division.divisionName} website (opens in new tab)`}
        />
      </div>
    {/if}

    <EntityLastUpdated
      updatedAt={division.updatedAt}
      entityType="division"
      entityId={division.id}
    />

    {#if editing}
      <section class="entity-editor" aria-label="Edit division details">
        <EntityEditorPanel
          {canPublish}
          showSubmitterName={!canPublish && !adminAuthStore.isLoggedIn}
          submitterNameId="division-submitter-name"
          historyEntity={division
            ? {
                entityType: "division",
                entityId: division.id,
                version: division.version,
              }
            : null}
          bind:submitterName={submitterNameDraft}
          successMessage={divisionSavedMessage(savedField)}
          errorMessage={fieldError}
        >
          <EntityEditorField
            label="Division name"
            inputId="division-name-editor"
            {canPublish}
            disabled={savingField !== null}
            fieldSaving={savingField === "divisionName"}
            unchanged={nameDraft.trim() === division.divisionName}
            onsave={submitAllChanges}
          >
            {#snippet control()}
              <input
                id="division-name-editor"
                bind:value={nameDraft}
                disabled={savingField !== null}
                autocomplete="off"
              />
            {/snippet}
          </EntityEditorField>

          {#if mergePrompt}
            <MergeEntityPrompt
              entityKind="division"
              sourceLabel={division.divisionName}
              candidateLabel={mergePrompt.candidate.divisionName}
              detail="Merge room links into the kept division;"
              merging={mergingEntity}
              disabled={savingField !== null}
              onconfirm={confirmDivisionMerge}
              ondismiss={dismissMergePrompt}
            />
          {/if}

          <EntityEditorField
            label="Parent college"
            inputId="division-college-editor"
            {canPublish}
            disabled={savingField !== null}
            fieldSaving={savingField === "collegeId"}
            unchanged={collegeDraft === String(division.collegeId ?? "")}
            onsave={submitAllChanges}
          >
            {#snippet control()}
              <select
                id="division-college-editor"
                bind:value={collegeDraft}
                disabled={savingField !== null}
              >
                <option value="">No college</option>
                {#each colleges as college (college.id)}
                  <option value={String(college.id)}
                    >{college.collegeName}</option
                  >
                {/each}
              </select>
            {/snippet}
          </EntityEditorField>
        </EntityEditorPanel>
      </section>
    {/if}
  {/if}
  {#if divisionRooms}
    <ResultDisplay
      filteredRooms={divisionRooms}
      {classCounts}
      sectionTitle="Rooms under this division"
      emptyMessage="No rooms found for this division."
      groupByBuilding
    />
  {:else if division}
    <EntitySkeleton
      variant="rooms"
      heading="Rooms under this division"
      label="Loading rooms for {division.divisionName}…"
    />
  {/if}
</div>

<style>
  @import "./entity-detail.css";
  @import "../editor/entity-editor.css";

  .division-query-wrapper {
    width: 100%;
    flex: 1 1 0;
    overflow-y: auto;
  }

  .entity-header__context--muted {
    font-style: italic;
    color: #a1a1aa;
  }
</style>
