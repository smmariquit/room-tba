<script lang="ts">
  import {
    additionProposalStore,
    queryStore,
    adminAuthStore,
    sidePanelStore,
    toastStore,
  } from "@lib/store.svelte";
  import { getAppActions, getAppData } from "@lib/context";
  import { persistEntityChange } from "@lib/proposals/client";
  import {
    PLACE_CATEGORIES,
    PLACE_CATEGORY_LABELS,
    isLandmarkPlaceCategory,
    placeDirectoryLabel,
  } from "@constants/place-categories";
  import type { PlaceData } from "@lib/types";
  import EntityEditorPinRow from "@ui/editor/EntityEditorPinRow.svelte";
  import EntityEditorToggle from "@ui/editor/EntityEditorToggle.svelte";
  import EntityDirectionsChip from "./EntityDirectionsChip.svelte";
  import EntityGoogleMapsLink from "./EntityGoogleMapsLink.svelte";
  import EntityPrintableMapLink from "./EntityPrintableMapLink.svelte";
  import EntityStreetAddress from "./EntityStreetAddress.svelte";
  import EntityShareCopyLink from "./EntityShareCopyLink.svelte";
  import EntityExternalLink from "./EntityExternalLink.svelte";
  import EntityBackToList from "./EntityBackToList.svelte";
  import { getPlaceShareUrl } from "@lib/share-links";

  const appData = getAppData();
  const appActions = getAppActions();
  const app = $derived(appData());
  const place = $derived(
    app.loaded
      ? (app.places.find((p) => p.name === queryStore.queryValue) ?? null)
      : null,
  );
  const canPublish = $derived(adminAuthStore.canPublish);
  const draftPin = $derived(additionProposalStore.draftPin);
  const placeShareUrl = $derived(place ? getPlaceShareUrl(place) : "");

  let editing = $state(false);
  let submitting = $state(false);
  let nameDraft = $state("");
  let categoryDraft = $state("");
  let descriptionDraft = $state("");
  let hoursDraft = $state("");
  let websiteDraft = $state("");
  let facebookDraft = $state("");
  let submitterName = $state("");

  function startEdit() {
    if (!place) return;
    nameDraft = place.name;
    categoryDraft = place.category;
    descriptionDraft = place.description ?? "";
    hoursDraft = place.hours ?? "";
    websiteDraft = place.websiteLink ?? "";
    facebookDraft = place.facebookLink ?? "";
    additionProposalStore.setDraftPin(
      place.lat !== null && place.lon !== null
        ? { lat: place.lat, lon: place.lon }
        : null,
    );
    editing = true;
  }

  async function pickOnMap() {
    sidePanelStore.collapse();
    try {
      await additionProposalStore.requestMapPin();
    } catch {
      // The map picker was cancelled.
    } finally {
      sidePanelStore.expand();
    }
  }

  async function submit() {
    const current = place;
    if (!current || submitting) return;

    const patch: Record<string, unknown> = {};
    if (nameDraft.trim() && nameDraft.trim() !== current.name)
      patch.name = nameDraft.trim();
    if (categoryDraft && categoryDraft !== current.category)
      patch.category = categoryDraft;
    if (descriptionDraft.trim() !== (current.description ?? ""))
      patch.description = descriptionDraft.trim() || null;
    if (hoursDraft.trim() !== (current.hours ?? ""))
      patch.hours = hoursDraft.trim() || null;
    if (websiteDraft.trim() !== (current.websiteLink ?? ""))
      patch.websiteLink = websiteDraft.trim() || null;
    if (facebookDraft.trim() !== (current.facebookLink ?? ""))
      patch.facebookLink = facebookDraft.trim() || null;
    if (draftPin?.lat !== current.lat || draftPin?.lon !== current.lon) {
      patch.lat = draftPin?.lat ?? null;
      patch.lon = draftPin?.lon ?? null;
    }

    if (Object.keys(patch).length === 0) {
      editing = false;
      additionProposalStore.clearDraftPin();
      return;
    }

    submitting = true;
    try {
      const result = await persistEntityChange({
        entityType: "place",
        entityId: current.id,
        baseVersion: current.version,
        patch,
        entityLabel: current.name,
        canPublish,
        submitterName:
          adminAuthStore.displayName ??
          adminAuthStore.username ??
          submitterName,
      });
      if (result.ok) {
        if (result.published) {
          appActions.upsertPlace(result.published as PlaceData);
          toastStore.show(`${current.name} updated.`, "success");
        } else {
          toastStore.show(
            `Suggestion for ${current.name} submitted for review.`,
            "success",
          );
        }
        editing = false;
        additionProposalStore.clearDraftPin();
      } else {
        toastStore.show(result.error ?? "Could not save changes.", "error");
      }
    } catch {
      toastStore.show("Could not save changes.", "error");
    } finally {
      submitting = false;
    }
  }
</script>

{#if place}
  <div class="entity-detail">
    <header class="entity-header">
      {#if isLandmarkPlaceCategory(place.category)}
        <EntityBackToList tab="landmarks" label="Back to landmarks" />
      {:else}
        <EntityBackToList tab="services" label="Back to establishments" />
      {/if}
      <h2 class="entity-header__title">{place.name}</h2>
      {#if placeDirectoryLabel(place.category)}
        <span class="place-category-badge"
          >{placeDirectoryLabel(place.category)}</span
        >
      {/if}
      <div class="entity-actions">
        {#if place.lat != null && place.lon != null}
          <EntityDirectionsChip
            lat={place.lat}
            lon={place.lon}
            destinationLabel={place.name}
          />
          <EntityGoogleMapsLink
            lat={place.lat}
            lon={place.lon}
            name={place.name}
            ariaLabel={`Open ${place.name} in Google Maps`}
          />
          <EntityPrintableMapLink placeName={place.name} />
        {/if}
        <EntityShareCopyLink url={placeShareUrl} entityLabel={place.name} />
        <EntityEditorToggle
          expanded={editing}
          {canPublish}
          publishOpenLabel="Edit place"
          closeLabel={canPublish ? "Close editor" : "Close"}
          variant="toolbar"
          onclick={() => {
            if (editing) {
              editing = false;
              additionProposalStore.clearDraftPin();
            } else {
              startEdit();
            }
          }}
        />
      </div>
    </header>

    {#if !editing}
      {#if place.lat != null && place.lon != null}
        <EntityStreetAddress lat={place.lat} lon={place.lon} />
      {/if}
      {#if place.description}
        <p class="entity-directions__text">{place.description}</p>
      {/if}
      <ul class="place-facts">
        {#if place.hours}
          <li><strong>Hours:</strong> {place.hours}</li>
        {/if}
        {#if place.websiteLink}
          <li>
            <EntityExternalLink href={place.websiteLink} label="Website" />
          </li>
        {/if}
        {#if place.facebookLink}
          <li>
            <EntityExternalLink href={place.facebookLink} label="Facebook" />
          </li>
        {/if}
      </ul>
    {:else}
      <div class="place-form">
        <label>Name<input bind:value={nameDraft} /></label>
        <label
          >Category
          <select bind:value={categoryDraft}>
            {#each PLACE_CATEGORIES as cat (cat)}
              <option value={cat}>{PLACE_CATEGORY_LABELS[cat]}</option>
            {/each}
          </select>
        </label>
        <label
          >Description<textarea bind:value={descriptionDraft} rows="2"
          ></textarea></label
        >
        <label>Hours<input bind:value={hoursDraft} /></label>
        <label>Website<input bind:value={websiteDraft} /></label>
        <label>Facebook<input bind:value={facebookDraft} /></label>
        <EntityEditorPinRow
          label={draftPin
            ? `Pin set · ${draftPin.lat.toFixed(5)}, ${draftPin.lon.toFixed(5)}`
            : "Drop a pin on the map"}
          pickLabel={draftPin ? "Move pin" : "Pick on map"}
          disabled={submitting}
          onclick={pickOnMap}
        />
        {#if !canPublish}
          <label
            >Your name (optional)<input bind:value={submitterName} /></label
          >
        {/if}
        <div class="place-form__actions">
          <button
            type="button"
            class="place-edit-btn"
            disabled={submitting}
            onclick={submit}
          >
            {canPublish ? "Save" : "Submit for review"}
          </button>
          <button
            type="button"
            class="place-cancel-btn"
            disabled={submitting}
            onclick={() => {
              editing = false;
              additionProposalStore.clearDraftPin();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <p class="place-empty">Select a place on the map to see details.</p>
{/if}

<style>
  @import "./entity-detail.css";

  .place-category-badge {
    display: inline-block;
    align-self: flex-start;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    background: hsl(162, 45%, 92%);
    color: #0d7a5f;
    font-size: 0.6875rem;
    font-weight: 600;
  }
  .place-facts {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #27272a;
  }
  .place-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .place-form label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .place-form input,
  .place-form select,
  .place-form textarea {
    font: inherit;
    padding: 0.375rem 0.5rem;
    border: 1px solid hsl(0, 0%, 80%);
    border-radius: 0.375rem;
  }
  .place-form__actions {
    display: flex;
    gap: 0.5rem;
  }
  .place-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .place-edit-btn {
    padding: 0.375rem 0.75rem;
    border: none;
    border-radius: 0.375rem;
    background: #0d7a5f;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }
  .place-edit-btn:hover:not(:disabled) {
    background: #0b6851;
  }
  .place-cancel-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid hsl(0, 0%, 80%);
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
  }
  .place-cancel-btn:hover:not(:disabled) {
    border-color: #c58f91;
    background: #fdf3f3;
  }
  .place-empty {
    padding: 1rem;
    color: hsl(0, 0%, 45%);
  }
</style>
