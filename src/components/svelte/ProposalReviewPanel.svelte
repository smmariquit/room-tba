<script lang="ts">
  import LoadingIndicator from "@ui/LoadingIndicator.svelte";
  import { SvelteSet } from "svelte/reactivity";
  import {
    adminAuthStore,
    proposalsStore,
    toastStore,
  } from "@lib/store.svelte";
  import { buildFieldDiffs } from "@lib/proposals/diff";
  import { appEntityNameResolver } from "@lib/proposals/entity-names";
  import { afterProposalPublished } from "@lib/proposals/apply-published-entity";
  import { syncOpenEntityQueryAfterPublish } from "@lib/proposals/sync-open-entity-query";
  import { getAppActions, getAppData } from "@lib/context";
  import type { ProposalEntityType } from "@lib/services/proposal-service";
  import { parseBundledRooms } from "@lib/proposals/create-proposal-validation";
  import EntityEditorFormField from "@ui/editor/EntityEditorFormField.svelte";
  import EntityReviewActions from "@ui/editor/EntityReviewActions.svelte";
  import Avatar from "@ui/Avatar.svelte";
  import { proposalPinChange } from "@lib/proposals/proposal-pin";
  import {
    getReviewShortcutAction,
    stepIndex,
    REVIEW_SHORTCUT_HINTS,
  } from "@lib/proposals/review-shortcuts";

  const appActions = getAppActions();
  const appData = getAppData();

  /** Turns buildingId/collegeId/divisionId into names for the diff (#873). */
  const resolveEntityName = $derived(appEntityNameResolver(appData()));

  type ReviewAction = "approve" | "reject" | "request-changes";
  /** Reject may carry a note; request-changes requires one. */
  type NoteAction = Exclude<ReviewAction, "approve">;

  const ACTION_LABELS: Record<NoteAction, string> = {
    reject: "Reject",
    "request-changes": "Request changes",
  };

  const NOTE_HINTS: Record<NoteAction, string> = {
    reject: "Optional. The contributor sees this on their suggestion.",
    "request-changes":
      "Required. Say what needs to change so the contributor can revise.",
  };

  function bundledRoomsSummary(
    entityType: ProposalEntityType,
    patch: Record<string, unknown>,
  ): string | null {
    if (entityType !== "create_building") return null;
    const rooms = parseBundledRooms(patch);
    if (rooms.length === 0) return null;
    return `Will create building + ${rooms.length} room${rooms.length === 1 ? "" : "s"}: ${rooms.map((r) => r.roomCode).join(", ")}`;
  }

  function diffsFor(proposal: {
    currentValues?: Record<string, unknown> | null;
    proposedPatch: Record<string, unknown>;
  }) {
    return buildFieldDiffs(
      proposal.currentValues ?? null,
      proposal.proposedPatch,
      resolveEntityName,
    );
  }

  function isStale(proposal: {
    currentVersion?: number | null;
    baseVersion: number;
  }) {
    return (
      proposal.currentVersion != null &&
      proposal.currentVersion !== proposal.baseVersion
    );
  }

  function submittedOn(createdAt: string | Date | null | undefined) {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  let noteById = $state<Record<number, string>>({});
  let actingId = $state<number | null>(null);
  const selectedIds = new SvelteSet<number>();
  let batchRunning = $state(false);
  // Rows render collapsed. The body is kept out of the DOM until opened so a
  // 59-item queue does not mount 59 diff lists and textareas (#873).
  let openById = $state<Record<number, boolean>>({});
  // Which per-row action is awaiting a note + confirmation, if any.
  let pendingActionById = $state<Record<number, NoteAction | null>>({});
  let bulkAction = $state<NoteAction | null>(null);
  let bulkNote = $state("");

  // Which rows have their map preview open. Off by default: each preview is a
  // WebGL map, and browsers cap live contexts, so a 59-row queue must not mount
  // one per row.
  let previewOpenById = $state<Record<number, boolean>>({});

  /**
   * Approving had no recovery path, and there is no un-approve endpoint —
   * `editor_history` revert needs publish rights a reviewer may not have. So
   * the undo window sits *before* the write: an approve is held locally for
   * UNDO_WINDOW_MS and only then POSTed. Undo cancels a request that never
   * left, which is a more reliable recovery than reverting a published row.
   */
  const UNDO_WINDOW_MS = 7000;
  type HeldApproval = { id: number; label: string };
  let heldApproval = $state<HeldApproval | null>(null);
  let undoSecondsLeft = $state(0);
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let holdTicker: ReturnType<typeof setInterval> | undefined;

  // Same submitter's suggestions review as a set: one contributor filing many
  // near-identical room edits is the common shape of this queue (#873).
  const groups = $derived.by(() => {
    const bySubmitter = new Map<string, typeof proposalsStore.proposals>();
    for (const proposal of proposalsStore.proposals) {
      // A held approve is already "gone" to the reviewer; undo brings it back.
      if (heldApproval?.id === proposal.id) continue;
      const list = bySubmitter.get(proposal.submitterName) ?? [];
      list.push(proposal);
      bySubmitter.set(proposal.submitterName, list);
    }
    return [...bySubmitter].map(([submitterName, proposals]) => ({
      submitterName,
      proposals,
    }));
  });

  /** Flat visible order — what J/K steps through. */
  const flatProposals = $derived(groups.flatMap((group) => group.proposals));
  let focusedIndex = $state<number | null>(null);
  const focusedProposal = $derived(
    focusedIndex === null ? null : (flatProposals[focusedIndex] ?? null),
  );

  // Approve a single proposal: POST + apply the published entity to local
  // state. No toast/refresh — callers (single action, batch) decide those.
  async function approveOne(
    id: number,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/admin/proposals/${id}/approve`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: noteById[id] ?? "" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (data as { error?: string }).error };
    }
    const published = (data as { published?: unknown }).published;
    const entityType = (data as { proposal?: { entityType?: string } }).proposal
      ?.entityType;
    if (entityType) {
      await afterProposalPublished(
        appActions,
        appData,
        entityType as ProposalEntityType,
        published,
      );
      syncOpenEntityQueryAfterPublish(
        appData,
        entityType as ProposalEntityType,
        published,
      );
    }
    noteById[id] = "";
    return { ok: true };
  }

  /** Reject / request-changes for one proposal. Note comes from `note`. */
  async function reviewOne(
    id: number,
    action: NoteAction,
    note: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/admin/proposals/${id}/${action}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (data as { error?: string }).error };
    }
    return { ok: true };
  }

  function clearHoldTimers() {
    if (holdTimer) clearTimeout(holdTimer);
    if (holdTicker) clearInterval(holdTicker);
    holdTimer = undefined;
    holdTicker = undefined;
  }

  /** Send the held approve for real. Called by the timer, or early on flush. */
  async function commitHeldApproval() {
    const held = heldApproval;
    clearHoldTimers();
    if (!held) return;
    heldApproval = null;
    undoSecondsLeft = 0;

    actingId = held.id;
    try {
      const result = await approveOne(held.id);
      if (!result.ok) {
        toastStore.show(
          result.error ?? `Could not approve proposal #${held.id}.`,
          "error",
        );
      } else {
        selectedIds.delete(held.id);
      }
    } finally {
      actingId = null;
      await proposalsStore.refresh();
    }
  }

  function undoHeldApproval() {
    if (!heldApproval) return;
    clearHoldTimers();
    heldApproval = null;
    undoSecondsLeft = 0;
    toastStore.show("Approve undone — the suggestion is back in the queue.", "info");
  }

  /** Hold an approve for the undo window instead of writing immediately. */
  async function holdApproval(id: number, label: string) {
    // One at a time: starting a second approve commits the first.
    if (heldApproval) await commitHeldApproval();

    heldApproval = { id, label };
    undoSecondsLeft = Math.ceil(UNDO_WINDOW_MS / 1000);
    holdTicker = setInterval(() => {
      undoSecondsLeft = Math.max(0, undoSecondsLeft - 1);
    }, 1000);
    holdTimer = setTimeout(() => void commitHeldApproval(), UNDO_WINDOW_MS);
  }

  // A pending approve must not be lost because the reviewer closed the queue or
  // the tab: flush it rather than silently dropping the contributor's edit.
  $effect(() => {
    const flush = () => {
      if (heldApproval) void commitHeldApproval();
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  });

  async function runAction(id: number, action: ReviewAction) {
    if (action === "approve") {
      const label =
        proposalsStore.proposals.find((p) => p.id === id)?.entityLabel ??
        `#${id}`;
      await holdApproval(id, label);
      return;
    }
    actingId = id;
    try {

      const result = await reviewOne(id, action, noteById[id] ?? "");
      if (!result.ok) {
        toastStore.show(
          result.error ?? `Could not ${action} proposal #${id}.`,
          "error",
        );
        return;
      }
      selectedIds.delete(id);
      pendingActionById[id] = null;
      toastStore.show(
        action === "reject"
          ? "Proposal rejected."
          : "Sent back to contributor with notes.",
        "success",
      );
      noteById[id] = "";
      await proposalsStore.refresh();
    } finally {
      actingId = null;
    }
  }

  function focusRow(index: number | null) {
    focusedIndex = index;
    if (index === null) return;
    const proposal = flatProposals[index];
    if (!proposal) return;
    // Stepping onto a row reveals it: reviewing means reading the diff.
    openById[proposal.id] = true;
    queueMicrotask(() => {
      document
        .querySelector(`[data-proposal-row="${proposal.id}"]`)
        ?.scrollIntoView({ block: "nearest" });
    });
  }

  function handleShortcut(event: KeyboardEvent) {
    // Bare keys, so the guard inside getReviewShortcutAction keeps them out of
    // the note textarea and any other typing target.
    const action = getReviewShortcutAction(event);
    if (!action) return;

    if (action === "undo") {
      if (!heldApproval) return;
      event.preventDefault();
      undoHeldApproval();
      return;
    }

    if (action === "next" || action === "previous") {
      event.preventDefault();
      focusRow(
        stepIndex(
          focusedIndex,
          flatProposals.length,
          action === "next" ? 1 : -1,
        ),
      );
      return;
    }

    const target = focusedProposal;
    if (!target || actingId === target.id) return;
    event.preventDefault();
    if (action === "approve") {
      void runAction(target.id, "approve");
    } else {
      // Reject opens the note step rather than firing immediately — a single
      // keypress must not destroy a contributor's work outright.
      openById[target.id] = true;
      pendingActionById[target.id] = "reject";
    }
  }

  $effect(() => {
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  function toggleSelected(id: number) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
  }

  const allSelected = $derived(
    proposalsStore.proposals.length > 0 &&
      proposalsStore.proposals.every((p) => selectedIds.has(p.id)),
  );

  function toggleSelectAll() {
    if (allSelected) {
      selectedIds.clear();
    } else {
      for (const p of proposalsStore.proposals) selectedIds.add(p.id);
    }
  }

  function groupSelected(proposals: { id: number }[]) {
    return proposals.length > 0 && proposals.every((p) => selectedIds.has(p.id));
  }

  function toggleGroup(proposals: { id: number }[]) {
    if (groupSelected(proposals)) {
      for (const p of proposals) selectedIds.delete(p.id);
    } else {
      for (const p of proposals) selectedIds.add(p.id);
    }
  }

  // Run one action across every selected proposal. Each request can fail
  // independently (approve conflicts on 409), so aggregate outcomes and report
  // a summary rather than failing the whole batch on the first error.
  async function runBatch(action: ReviewAction) {
    const ids = [...selectedIds];
    if (ids.length === 0 || batchRunning) return;
    if (action === "request-changes" && bulkNote.trim() === "") {
      toastStore.show("A note is required to request changes.", "error");
      return;
    }
    batchRunning = true;
    let done = 0;
    let failed = 0;
    try {
      for (const id of ids) {
        const result =
          action === "approve"
            ? await approveOne(id)
            : await reviewOne(id, action, bulkNote);
        if (result.ok) {
          done += 1;
          selectedIds.delete(id);
        } else {
          failed += 1;
        }
      }
    } finally {
      batchRunning = false;
      bulkAction = null;
      bulkNote = "";
      await proposalsStore.refresh();
    }
    const verb =
      action === "approve"
        ? "Approved"
        : action === "reject"
          ? "Rejected"
          : "Sent back";
    toastStore.show(
      failed === 0
        ? `${verb} ${done} proposal${done === 1 ? "" : "s"}.`
        : `${verb} ${done}, ${failed} failed (likely conflicts) — review the rest.`,
      failed === 0 ? "success" : "error",
    );
  }
</script>

{#snippet diffValue(text: string | null, id: number | undefined)}
  {text ?? "—"}{#if id != null}<small class="entity-review-diff-id">#{id}</small
    >{/if}
{/snippet}

{#if adminAuthStore.canReview}
  <section class="entity-review-panel" aria-label="Edit proposals review queue">
    <div class="entity-review-heading">
      <strong>Suggested edits</strong>
      {#if proposalsStore.pendingCount > 0}
        <span class="entity-review-count"
          >{proposalsStore.pendingCount} pending</span
        >
      {/if}
    </div>

    {#if proposalsStore.proposals.length > 0}
      <p class="entity-review-shortcuts">
        {#each REVIEW_SHORTCUT_HINTS as hint (hint.keys)}
          <span class="entity-review-shortcut">
            <kbd>{hint.keys}</kbd>
            {hint.description}
          </span>
        {/each}
      </p>
    {/if}

    {#if heldApproval}
      <div class="entity-review-undo" role="status">
        <span class="entity-review-undo-text">
          Approved <strong>{heldApproval.label}</strong> — publishing in {undoSecondsLeft}s
        </span>
        <div class="entity-review-undo-actions">
          <button type="button" onclick={undoHeldApproval}>Undo</button>
          <button
            type="button"
            class="entity-review-undo-now"
            onclick={() => void commitHeldApproval()}
          >
            Publish now
          </button>
        </div>
      </div>
    {/if}

    {#if proposalsStore.loading}
      <p class="entity-review-empty">
        <LoadingIndicator label="Loading proposals…" />
      </p>
    {:else if proposalsStore.proposals.length === 0}
      <p class="entity-review-empty">No pending suggestions.</p>
    {:else}
      <div class="entity-review-batch">
        <label class="entity-review-select-all">
          <input
            type="checkbox"
            checked={allSelected}
            onchange={toggleSelectAll}
            aria-label="Select all"
          />
          Select all
          <span class="entity-review-selected-count">
            {selectedIds.size} selected
          </span>
        </label>
        <div class="entity-review-batch-actions">
          <button
            type="button"
            class="entity-review-batch-approve"
            disabled={selectedIds.size === 0 || batchRunning}
            onclick={() => runBatch("approve")}
          >
            {batchRunning && bulkAction === null
              ? "Approving…"
              : "Approve selected"}
          </button>
          <button
            type="button"
            disabled={selectedIds.size === 0 || batchRunning}
            onclick={() => (bulkAction = "request-changes")}
          >
            Request changes on selected
          </button>
          <button
            type="button"
            class="entity-review-batch-reject"
            disabled={selectedIds.size === 0 || batchRunning}
            onclick={() => (bulkAction = "reject")}
          >
            Reject selected
          </button>
        </div>
      </div>

      {#if bulkAction}
        <div class="entity-review-bulk-note">
          <EntityEditorFormField
            label={`Note for ${selectedIds.size} selected`}
            inputId="proposal-bulk-note"
            hint={NOTE_HINTS[bulkAction]}
          >
            {#snippet control()}
              <textarea
                id="proposal-bulk-note"
                rows="2"
                bind:value={bulkNote}
                aria-describedby="proposal-bulk-note-hint"
              ></textarea>
            {/snippet}
          </EntityEditorFormField>
          <div class="entity-review-actions">
            <button
              type="button"
              class={bulkAction === "reject" ? "reject" : ""}
              disabled={batchRunning ||
                (bulkAction === "request-changes" && bulkNote.trim() === "")}
              onclick={() => bulkAction && runBatch(bulkAction)}
            >
              {batchRunning
                ? "Working…"
                : `${ACTION_LABELS[bulkAction]} ${selectedIds.size}`}
            </button>
            <button
              type="button"
              disabled={batchRunning}
              onclick={() => {
                bulkAction = null;
                bulkNote = "";
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      {/if}

      <ul class="entity-review-list">
        {#each groups as group (group.submitterName)}
          <li class="entity-review-group">
            <div class="entity-review-group-head">
              <label class="entity-review-select-all">
                <input
                  type="checkbox"
                  checked={groupSelected(group.proposals)}
                  onchange={() => toggleGroup(group.proposals)}
                  aria-label={`Select all ${group.proposals.length} suggestions from ${group.submitterName}`}
                />
                <Avatar name={group.submitterName} size={20} />
                {group.submitterName}
              </label>
              <span class="entity-review-count">
                {group.proposals.length} suggestion{group.proposals.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <ul class="entity-review-list entity-review-sublist">
              {#each group.proposals as proposal (proposal.id)}
                {@const diffs = diffsFor(proposal)}
                {@const stale = isStale(proposal)}
                {@const pinChange = proposalPinChange(proposal)}
                <li
                  class="entity-review-item"
                  class:entity-review-item--focused={focusedProposal?.id ===
                    proposal.id}
                  data-proposal-row={proposal.id}
                >
                  <div class="entity-review-row">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(proposal.id)}
                      onchange={() => toggleSelected(proposal.id)}
                      aria-label={`Select ${proposal.entityLabel} for batch review`}
                    />
                    <details bind:open={openById[proposal.id]}>
                      <summary>
                        <span class="entity-review-entity">
                          {proposal.entityLabel}
                        </span>
                        <span class="entity-review-summary-meta">
                          {proposal.entityType} · {diffs.length} field{diffs.length ===
                          1
                            ? ""
                            : "s"}
                          {#if submittedOn(proposal.createdAt)}
                            · {submittedOn(proposal.createdAt)}
                          {/if}
                        </span>
                        {#if proposal.status === "needs_changes"}
                          <span class="entity-review-badge">needs changes</span>
                        {/if}
                        {#if stale}
                          <span class="entity-review-badge stale">stale</span>
                        {/if}
                      </summary>

                      {#if openById[proposal.id]}
                        {#if stale}
                          <p class="entity-review-stale" role="alert">
                            Published data changed since this was submitted.
                            Compare carefully — approving may conflict.
                          </p>
                        {/if}

                        <ul class="entity-review-changes">
                          {#each diffs as diff (diff.field)}
                            <li class="entity-review-diff">
                              <span class="entity-review-diff-label"
                                >{diff.label}</span
                              >
                              <span class="entity-review-diff-values">
                                <span
                                  class="entity-review-diff-old"
                                  class:entity-review-diff-before={diff.before !=
                                    null}
                                >
                                  {#if proposal.currentValues == null && proposal.entityType.startsWith("create_")}
                                    New entry
                                  {:else}
                                    {@render diffValue(
                                      diff.before,
                                      diff.beforeId,
                                    )}
                                  {/if}
                                </span>
                                <span aria-hidden="true">→</span>
                                <span class="entity-review-diff-after">
                                  {@render diffValue(diff.after, diff.afterId)}
                                </span>
                              </span>
                            </li>
                          {/each}
                        </ul>

                        {#if pinChange}
                          <div class="entity-review-preview">
                            <button
                              type="button"
                              class="entity-review-preview-toggle"
                              aria-expanded={previewOpenById[proposal.id] ===
                                true}
                              onclick={() =>
                                (previewOpenById[proposal.id] =
                                  !previewOpenById[proposal.id])}
                            >
                              {previewOpenById[proposal.id]
                                ? "Hide map preview"
                                : "Show map preview"}
                            </button>
                            {#if previewOpenById[proposal.id]}
                              <!-- Imported on open so maplibre stays out of the
                                   review modal's bundle for reviewers who never
                                   ask for a preview. -->
                              {#await import("@ui/editor/ProposalPinPreview.svelte")}
                                <p class="entity-review-preview-loading">
                                  Loading map preview…
                                </p>
                              {:then previewModule}
                                {@const Preview = previewModule.default}
                                <Preview
                                  change={pinChange}
                                  label={proposal.entityLabel}
                                />
                              {:catch}
                                <p class="entity-review-preview-loading">
                                  Map preview could not load.
                                </p>
                              {/await}
                            {/if}
                          </div>
                        {/if}

                        {#if bundledRoomsSummary(proposal.entityType as ProposalEntityType, proposal.proposedPatch as Record<string, unknown>)}
                          <p class="entity-review-bundled">
                            {bundledRoomsSummary(
                              proposal.entityType as ProposalEntityType,
                              proposal.proposedPatch as Record<string, unknown>,
                            )}
                          </p>
                        {/if}

                        {#if proposal.submitterNote}
                          <p class="entity-review-submitter-note">
                            <strong>Note from {proposal.submitterName}:</strong>
                            {proposal.submitterNote}
                          </p>
                        {/if}

                        {#if proposal.status === "needs_changes" && proposal.adminNote}
                          <p class="entity-review-note">
                            Previous note: {proposal.adminNote}
                          </p>
                        {/if}

                        {#if pendingActionById[proposal.id]}
                          {@const action = pendingActionById[
                            proposal.id
                          ] as NoteAction}
                          <EntityEditorFormField
                            label={`Note to ${proposal.submitterName}`}
                            inputId="proposal-note-{proposal.id}"
                            hint={NOTE_HINTS[action]}
                          >
                            {#snippet control()}
                              <textarea
                                id="proposal-note-{proposal.id}"
                                rows="2"
                                bind:value={noteById[proposal.id]}
                                aria-describedby="proposal-note-{proposal.id}-hint"
                              ></textarea>
                            {/snippet}
                          </EntityEditorFormField>
                          <div class="entity-review-actions">
                            <button
                              type="button"
                              class={action === "reject" ? "reject" : ""}
                              disabled={actingId === proposal.id ||
                                (action === "request-changes" &&
                                  (noteById[proposal.id] ?? "").trim() === "")}
                              onclick={() => runAction(proposal.id, action)}
                            >
                              {actingId === proposal.id
                                ? "Working…"
                                : `Confirm ${ACTION_LABELS[action].toLowerCase()}`}
                            </button>
                            <button
                              type="button"
                              disabled={actingId === proposal.id}
                              onclick={() =>
                                (pendingActionById[proposal.id] = null)}
                            >
                              Cancel
                            </button>
                          </div>
                        {:else}
                          <EntityReviewActions
                            disabled={actingId === proposal.id}
                            onapprove={() => runAction(proposal.id, "approve")}
                            onrequestChanges={() =>
                              (pendingActionById[proposal.id] =
                                "request-changes")}
                            onreject={() =>
                              (pendingActionById[proposal.id] = "reject")}
                          />
                        {/if}
                      {/if}
                    </details>
                  </div>
                </li>
              {/each}
            </ul>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

<style>
  @import "./editor/review-panel.css";
  @import "./editor/entity-editor.css";

  .entity-review-shortcuts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.625rem;
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    color: hsl(0, 0%, 42%);
  }

  .entity-review-shortcut {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
  }

  .entity-review-shortcuts kbd {
    padding: 0.05rem 0.3rem;
    border: 1px solid hsl(0, 0%, 80%);
    border-bottom-width: 2px;
    border-radius: 4px;
    background: hsl(0, 0%, 98%);
    font-family: inherit;
    font-size: 0.6875rem;
    font-weight: 700;
    color: hsl(0, 0%, 28%);
  }

  .entity-review-undo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-bottom: 0.5rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid hsl(140, 40%, 70%);
    border-radius: 8px;
    background: hsl(140, 50%, 96%);
    font-size: 0.8125rem;
    color: hsl(140, 60%, 18%);
  }

  .entity-review-undo-text {
    min-width: 0;
  }

  .entity-review-undo-actions {
    display: flex;
    flex-shrink: 0;
    gap: 0.25rem;
  }

  .entity-review-undo-actions button {
    padding: 0.25rem 0.65rem;
    border: 1px solid hsl(140, 35%, 55%);
    border-radius: 999px;
    background: white;
    color: hsl(140, 60%, 20%);
    font: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
  }

  .entity-review-undo-actions button:hover {
    background: hsl(140, 45%, 94%);
  }

  .entity-review-undo-actions .entity-review-undo-now {
    border-color: hsl(0, 0%, 80%);
    color: hsl(0, 0%, 35%);
  }

  .entity-review-item--focused {
    border-radius: 6px;
    outline: 2px solid hsl(5, 53%, 40%);
    outline-offset: 1px;
  }

  .entity-review-preview {
    margin: 0.375rem 0 0;
  }

  .entity-review-preview-toggle {
    padding: 0.2rem 0.55rem;
    border: 1px solid hsl(0, 0%, 78%);
    border-radius: 999px;
    background: white;
    color: hsl(0, 0%, 22%);
    font: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
  }

  .entity-review-preview-toggle:hover {
    background: hsl(0, 0%, 96%);
  }

  .entity-review-preview-loading {
    margin: 0.375rem 0 0;
    font-size: 0.8rem;
    color: hsl(0, 0%, 40%);
  }

  .entity-review-batch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-bottom: 0.5rem;
    padding: 0.375rem 0.5rem;
    border: 1px solid hsl(0, 0%, 88%);
    border-radius: 8px;
    background: hsl(0, 0%, 98%);
  }

  .entity-review-batch-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .entity-review-batch-actions button {
    padding: 0.3rem 0.6rem;
    border: 1px solid hsl(0, 0%, 78%);
    border-radius: 999px;
    background: white;
    color: hsl(0, 0%, 16%);
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
  }

  .entity-review-batch-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .entity-review-batch-actions .entity-review-batch-approve {
    border-color: hsl(140, 45%, 38%);
    background: hsl(140, 45%, 38%);
    color: white;
  }

  .entity-review-batch-actions .entity-review-batch-approve:hover:not(:disabled) {
    background: hsl(140, 45%, 44%);
  }

  .entity-review-batch-actions .entity-review-batch-reject {
    border-color: hsl(0, 70%, 78%);
    color: hsl(0, 70%, 32%);
  }

  .entity-review-select-all {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: hsl(0, 0%, 30%);
    cursor: pointer;
    min-width: 0;
  }

  .entity-review-selected-count {
    font-weight: 500;
    color: hsl(0, 0%, 42%);
  }

  .entity-review-bulk-note {
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    border: 1px solid hsl(0, 0%, 88%);
    border-radius: 8px;
  }

  .entity-review-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .entity-review-group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.125rem 0.125rem 0;
  }

  .entity-review-sublist {
    max-height: none;
    overflow: visible;
  }

  .entity-review-list {
    max-height: 22rem;
  }

  .entity-review-row {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    min-width: 0;
  }

  .entity-review-row > input {
    margin-top: 0.3rem;
    flex-shrink: 0;
  }

  .entity-review-row > details {
    flex: 1;
    min-width: 0;
  }

  .entity-review-row summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.375rem;
    cursor: pointer;
    padding: 0.125rem 0;
    border-radius: 0.375rem;
  }

  .entity-review-row summary:focus-visible {
    outline: 2px solid hsl(5, 53%, 40%);
    outline-offset: 2px;
  }

  .entity-review-summary-meta {
    font-size: 0.75rem;
    color: hsl(0, 0%, 40%);
  }

  .entity-review-badge {
    padding: 0 0.3125rem;
    border-radius: 999px;
    background: hsl(0, 0%, 92%);
    color: hsl(0, 0%, 25%);
    font-size: 0.6875rem;
    font-weight: 700;
  }

  .entity-review-badge.stale {
    background: hsl(40, 90%, 88%);
    color: hsl(30, 60%, 25%);
  }

  /* Matches .entity-review-stale's shape so the two reviewer callouts read as
     one family. */
  .entity-review-submitter-note {
    margin: 0.375rem 0 0;
    padding: 0.35rem 0.5rem;
    border: 1px solid hsl(210, 45%, 82%);
    border-radius: 6px;
    background: hsl(210, 60%, 97%);
    font-size: 0.8125rem;
    line-height: 1.4;
    color: hsl(210, 40%, 22%);
  }

  .entity-review-bundled {
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.35;
  }

  .entity-review-stale {
    margin: 0.35rem 0;
    padding: 0.35rem 0.5rem;
    border-radius: 6px;
    background: hsl(40 90% 92%);
    border: 1px solid hsl(40 70% 70%);
    color: hsl(30 60% 25%);
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .entity-review-diff {
    display: flex;
    flex-wrap: wrap;
    gap: 0.15rem 0.5rem;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .entity-review-diff-label {
    font-weight: 600;
  }

  .entity-review-diff-values {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    min-width: 0;
  }

  .entity-review-diff-old {
    color: hsl(0 0% 45%);
    overflow-wrap: anywhere;
  }

  .entity-review-diff-before {
    text-decoration: line-through;
  }

  .entity-review-diff-after {
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .entity-review-diff-id {
    margin-left: 0.25rem;
    font-weight: 400;
    font-size: 0.6875rem;
    color: hsl(0, 0%, 50%);
  }
</style>
