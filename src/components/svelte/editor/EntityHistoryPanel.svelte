<script lang="ts">
  import LoadingIndicator from "@ui/LoadingIndicator.svelte";
  import { buildFieldDiffs } from "@lib/proposals/diff";
  import { appEntityNameResolver } from "@lib/proposals/entity-names";
  import { afterProposalPublished } from "@lib/proposals/apply-published-entity";
  import { syncOpenEntityQueryAfterPublish } from "@lib/proposals/sync-open-entity-query";
  import type { ProposalEntityType } from "@lib/services/proposal-service";
  import { getAppActions, getAppData } from "@lib/context";
  import { toastStore } from "@lib/store.svelte";
  import EntityEditorSubmitButton from "./EntityEditorSubmitButton.svelte";

  type HistoryEntry = {
    id: number;
    action: string;
    editedBy: string;
    summary: string | null;
    versionBefore: number | null;
    versionAfter: number | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    createdAt: string;
  };

  type Props = {
    entityType: string;
    entityId: number;
    version: number;
  };

  let { entityType, entityId, version }: Props = $props();

  const appActions = getAppActions();
  const appData = getAppData();
  const resolveEntityName = $derived(appEntityNameResolver(appData()));

  let open = $state(false);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let entries = $state<HistoryEntry[]>([]);
  let restoringId = $state<number | null>(null);
  let confirmId = $state<number | null>(null);
  let summaryDraft = $state("");

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch(
        `/api/admin/history?entityType=${encodeURIComponent(entityType)}&entityId=${entityId}`,
        { credentials: "same-origin" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        entries?: HistoryEntry[];
        error?: string;
      };
      if (!res.ok) {
        error = data.error ?? "Could not load history.";
        return;
      }
      entries = data.entries ?? [];
    } catch {
      error = "Could not load history.";
    } finally {
      loading = false;
    }
  }

  function toggle() {
    open = !open;
    if (open && entries.length === 0 && !loading) void load();
  }

  function startRestore(entry: HistoryEntry) {
    confirmId = entry.id;
    summaryDraft = "";
  }

  async function restore(entry: HistoryEntry) {
    const summary = summaryDraft.trim();
    if (!summary) return;
    restoringId = entry.id;
    try {
      const res = await fetch(`/api/admin/history/${entry.id}/revert`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: version, summary }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        entity?: unknown;
        error?: string;
      };
      if (!res.ok) {
        toastStore.show(
          data.error ?? "Could not restore this version.",
          "error",
        );
        return;
      }
      await afterProposalPublished(
        appActions,
        appData,
        entityType as ProposalEntityType,
        data.entity,
      );
      syncOpenEntityQueryAfterPublish(
        appData,
        entityType as ProposalEntityType,
        data.entity,
      );
      toastStore.show("Version restored.", "success");
      confirmId = null;
      await load();
    } finally {
      restoringId = null;
    }
  }

  function entryDiffs(entry: HistoryEntry) {
    // Same foreign-key resolution as the review queue: history entries showed
    // raw row ids for buildingId/collegeId/divisionId too (#873).
    return buildFieldDiffs(
      entry.before ?? null,
      entry.after ?? {},
      resolveEntityName,
    );
  }

  function formatWhen(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
</script>

<div class="entity-history">
  <button type="button" class="entity-history-toggle" onclick={toggle}>
    {open ? "Hide history" : "History"}
  </button>

  {#if open}
    {#if loading}
      <p class="entity-history-note">
        <LoadingIndicator label="Loading history…" />
      </p>
    {:else if error}
      <p class="entity-history-error" role="alert">{error}</p>
    {:else if entries.length === 0}
      <p class="entity-history-note">No recorded changes yet.</p>
    {:else}
      <ol class="entity-history-list">
        {#each entries as entry (entry.id)}
          <li class="entity-history-entry">
            <div class="entity-history-meta">
              <strong>{entry.editedBy}</strong>
              <span>{formatWhen(entry.createdAt)}</span>
              <span class="entity-history-action">{entry.action}</span>
            </div>
            {#if entry.summary}
              <p class="entity-history-summary">{entry.summary}</p>
            {/if}
            <ul class="entity-history-diffs">
              {#each entryDiffs(entry) as diff (diff.field)}
                <li>
                  <span class="entity-history-diff-label">{diff.label}:</span>
                  <span class="entity-history-diff-old"
                    >{diff.before ?? "—"}</span
                  >
                  <span aria-hidden="true">→</span>
                  <span>{diff.after ?? "—"}</span>
                </li>
              {/each}
            </ul>
            {#if entry.after}
              {#if confirmId === entry.id}
                <div class="entity-history-confirm">
                  <input
                    type="text"
                    maxlength="200"
                    placeholder="Why restore this version? (required)"
                    bind:value={summaryDraft}
                  />
                  <div class="entity-history-confirm-actions">
                    <EntityEditorSubmitButton
                      label="Restore"
                      savingLabel="Restoring…"
                      saving={restoringId === entry.id}
                      disabled={!summaryDraft.trim()}
                      onclick={() => restore(entry)}
                    />
                    <EntityEditorSubmitButton
                      label="Cancel"
                      variant="secondary"
                      onclick={() => (confirmId = null)}
                    />
                  </div>
                </div>
              {:else}
                <button
                  type="button"
                  class="entity-history-restore"
                  onclick={() => startRestore(entry)}
                >
                  Restore this version
                </button>
              {/if}
            {/if}
          </li>
        {/each}
      </ol>
    {/if}
  {/if}
</div>

<style>
  .entity-history {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .entity-history-toggle,
  .entity-history-restore {
    align-self: flex-start;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    color: hsl(5, 53%, 32%);
    cursor: pointer;
    text-decoration: underline;
  }

  .entity-history-toggle:hover {
    background: hsl(0, 0%, 94%);
  }

  .entity-history-restore:hover {
    background: #fdf3f3;
  }

  .entity-history-note,
  .entity-history-error {
    margin: 0;
    font-size: 0.85rem;
  }

  .entity-history-error {
    color: hsl(0, 65%, 40%);
  }

  .entity-history-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .entity-history-entry {
    border-top: 1px solid hsl(0 0% 88%);
    padding-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .entity-history-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.8rem;
    align-items: baseline;
  }

  .entity-history-action {
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    color: hsl(0 0% 45%);
  }

  .entity-history-summary {
    margin: 0;
    font-size: 0.8rem;
    font-style: italic;
  }

  .entity-history-diffs {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .entity-history-diffs li {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .entity-history-diff-label {
    font-weight: 600;
  }

  .entity-history-diff-old {
    color: hsl(0 0% 45%);
    text-decoration: line-through;
    overflow-wrap: anywhere;
  }

  .entity-history-confirm {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .entity-history-confirm input {
    font: inherit;
    font-size: 0.85rem;
    padding: 0.3rem 0.45rem;
  }

  .entity-history-confirm-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
</style>
