<script lang="ts">
  import LoadingIndicator from "@ui/LoadingIndicator.svelte";
  import { adminAuthStore, toastStore } from "@lib/store.svelte";
  import Dialog from "@ui/modal/Dialog.svelte";
  import SettingsSection from "@ui/modal/SettingsSection.svelte";
  import EntityEditorFormField from "@ui/editor/EntityEditorFormField.svelte";
  import EntityEditorSubmitButton from "@ui/editor/EntityEditorSubmitButton.svelte";
  import EntityEditorMessage from "@ui/editor/EntityEditorMessage.svelte";
  import "./editor/entity-editor.css";

  type Profile = {
    username: string;
    displayName: string;
    email: string | null;
    role: "admin" | "editor" | "contributor";
    hasPassword: boolean;
    linkedGoogle: boolean;
    avatarUrl: string | null;
    profileUrl: string | null;
    showInCredits: boolean;
  };

  type Contribution = {
    id: number;
    entityLabel: string;
    createdAt: string;
  };

  let profile = $state<Profile | null>(null);
  let loadError = $state<string | null>(null);
  let contributions = $state<Contribution[]>([]);
  let contributionsError = $state<string | null>(null);

  let displayNameDraft = $state("");
  let avatarUrlDraft = $state("");
  let profileUrlDraft = $state("");
  let showInCreditsDraft = $state(true);
  let savingProfile = $state(false);
  let profileError = $state<string | null>(null);
  let profileSaved = $state(false);

  let newEmailDraft = $state("");
  let showChangeEmail = $state(false);
  let emailRequestPending = $state(false);
  let emailRequestSent = $state(false);
  let emailError = $state<string | null>(null);

  let currentPasswordDraft = $state("");
  let newPasswordDraft = $state("");
  let savingPassword = $state(false);
  let passwordError = $state<string | null>(null);
  let passwordSaved = $state(false);

  let unlinkingGoogle = $state(false);
  let identityError = $state<string | null>(null);

  let showDeleteConfirm = $state(false);
  let deletePasswordDraft = $state("");
  let deleting = $state(false);
  let deleteError = $state<string | null>(null);

  async function loadProfile() {
    loadError = null;
    contributionsError = null;
    contributions = [];
    try {
      const res = await fetch("/api/account/me", { credentials: "same-origin" });
      if (!res.ok) {
        loadError = "Could not load your account.";
        return;
      }
      profile = (await res.json()) as Profile;
      displayNameDraft = profile.displayName;
      avatarUrlDraft = profile.avatarUrl ?? "";
      profileUrlDraft = profile.profileUrl ?? "";
      showInCreditsDraft = profile.showInCredits;

      const contributionsRes = await fetch("/api/contributions/mine", {
        credentials: "same-origin",
      });
      if (contributionsRes.ok) {
        const data = (await contributionsRes.json()) as {
          contributions?: Contribution[];
        };
        contributions = data.contributions ?? [];
      } else {
        contributionsError = "Could not load your contributions.";
      }
    } catch {
      loadError = "Network error loading your account.";
    }
  }

  $effect(() => {
    if (adminAuthStore.accountSettingsOpen) void loadProfile();
  });

  function close() {
    adminAuthStore.closeAccountSettings();
  }

  const profileDirty = $derived(
    profile
      ? displayNameDraft.trim() !== profile.displayName ||
          avatarUrlDraft.trim() !== (profile.avatarUrl ?? "") ||
          profileUrlDraft.trim() !== (profile.profileUrl ?? "") ||
          showInCreditsDraft !== profile.showInCredits
      : false,
  );

  async function saveProfile() {
    if (!profile) return;
    savingProfile = true;
    profileError = null;
    profileSaved = false;
    try {
      const res = await fetch("/api/account/me", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayNameDraft,
          avatarUrl: avatarUrlDraft,
          profileUrl: profileUrlDraft,
          showInCredits: showInCreditsDraft,
        }),
      });
      const data = await res.json().catch(() => ({}) as { error?: string });
      if (!res.ok) {
        profileError = data.error ?? "Could not save profile.";
        return;
      }
      profile = {
        ...profile,
        displayName: displayNameDraft.trim(),
        avatarUrl: avatarUrlDraft.trim() || null,
        profileUrl: profileUrlDraft.trim() || null,
        showInCredits: showInCreditsDraft,
      };
      await adminAuthStore.refresh();
      profileSaved = true;
      setTimeout(() => {
        profileSaved = false;
      }, 1800);
    } catch {
      profileError = "Network error. Try again.";
    } finally {
      savingProfile = false;
    }
  }

  async function requestEmailChange() {
    emailRequestPending = true;
    emailError = null;
    emailRequestSent = false;
    try {
      const res = await fetch("/api/account/request-email-change", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmailDraft }),
      });
      const data = await res.json().catch(() => ({}) as { error?: string });
      if (!res.ok) {
        emailError = data.error ?? "Could not send confirmation email.";
        return;
      }
      emailRequestSent = true;
      newEmailDraft = "";
    } catch {
      emailError = "Network error. Try again.";
    } finally {
      emailRequestPending = false;
    }
  }

  async function savePassword() {
    if (!profile) return;
    savingPassword = true;
    passwordError = null;
    passwordSaved = false;
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: profile.hasPassword ? currentPasswordDraft : undefined,
          newPassword: newPasswordDraft,
        }),
      });
      const data = await res.json().catch(() => ({}) as { error?: string });
      if (!res.ok) {
        passwordError = data.error ?? "Could not change password.";
        return;
      }
      currentPasswordDraft = "";
      newPasswordDraft = "";
      profile = { ...profile, hasPassword: true };
      passwordSaved = true;
      setTimeout(() => {
        passwordSaved = false;
      }, 1800);
    } catch {
      passwordError = "Network error. Try again.";
    } finally {
      savingPassword = false;
    }
  }

  async function connectGoogle() {
    identityError = null;
    const err = await adminAuthStore.linkGoogle();
    if (err) identityError = err;
  }

  async function disconnectGoogle() {
    if (!profile) return;
    unlinkingGoogle = true;
    identityError = null;
    try {
      const res = await fetch("/api/account/unlink-google", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}) as { error?: string });
      if (!res.ok) {
        identityError = data.error ?? "Could not disconnect Google.";
        return;
      }
      profile = { ...profile, linkedGoogle: false };
      toastStore.show("Google account disconnected.", "success");
    } catch {
      identityError = "Network error. Try again.";
    } finally {
      unlinkingGoogle = false;
    }
  }

  function downloadExport() {
    window.open("/api/account/export", "_blank", "noopener,noreferrer");
  }

  async function confirmDelete() {
    if (!profile) return;
    deleting = true;
    deleteError = null;
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: profile.hasPassword ? deletePasswordDraft : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}) as { error?: string });
      if (!res.ok) {
        deleteError = data.error ?? "Could not delete account.";
        return;
      }
      close();
      await adminAuthStore.logout();
      toastStore.show("Your account has been deleted.", "success");
    } catch {
      deleteError = "Network error. Try again.";
    } finally {
      deleting = false;
    }
  }
</script>

<Dialog
  open={adminAuthStore.accountSettingsOpen}
  onclose={close}
  size="reading"
  ariaLabel="Account settings"
  closeLabel="Close account settings"
>
  <div class="settings-scroll">
    <header class="settings-masthead">
      <h2 class="settings-masthead__title">Account settings</h2>
      {#if profile}
        <p class="settings-masthead__identity">
          <span class="settings-username">{profile.username}</span>
          <span class="settings-role">{profile.role}</span>
        </p>
      {/if}
    </header>

    {#if loadError}
      <EntityEditorMessage variant="error" message={loadError} />
    {:else if !profile}
      <p class="settings-loading"><LoadingIndicator /></p>
    {:else}
      <SettingsSection
        title="Profile"
        description="How you appear to other people on the map."
      >
        <EntityEditorFormField
          label="Display name"
          inputId="account-display-name"
        >
          {#snippet control()}
            <input
              id="account-display-name"
              bind:value={displayNameDraft}
              disabled={savingProfile}
            />
          {/snippet}
        </EntityEditorFormField>
        <EntityEditorFormField
          label="Avatar URL"
          inputId="account-avatar-url"
          hint="Optional HTTPS image URL shown in public credits."
        >
          {#snippet control()}
            <input
              id="account-avatar-url"
              type="url"
              placeholder="https://example.com/avatar.png"
              bind:value={avatarUrlDraft}
              disabled={savingProfile}
            />
          {/snippet}
        </EntityEditorFormField>
        <EntityEditorFormField
          label="Profile URL"
          inputId="account-profile-url"
          hint="Optional HTTPS link shown from your public credit."
        >
          {#snippet control()}
            <input
              id="account-profile-url"
              type="url"
              placeholder="https://example.com"
              bind:value={profileUrlDraft}
              disabled={savingProfile}
            />
          {/snippet}
        </EntityEditorFormField>
        <label class="credits-visibility">
          <input
            type="checkbox"
            bind:checked={showInCreditsDraft}
            disabled={savingProfile}
          />
          Show my contributions in public credits
        </label>
        {#if profileError}
          <EntityEditorMessage variant="error" message={profileError} />
        {/if}
        {#if profileSaved}
          <EntityEditorMessage variant="success" message="Profile saved." />
        {/if}

        {#snippet footer()}
          <EntityEditorSubmitButton
            label="Save profile"
            savingLabel="Saving…"
            saving={savingProfile}
            disabled={!profileDirty}
            onclick={saveProfile}
          />
        {/snippet}
      </SettingsSection>

      <SettingsSection
        title="Email"
        description="Used for sign-in and for replies about your suggested edits."
      >
        {#snippet meta()}
          <span class="settings-current">{profile.email ?? "No email set"}</span>
        {/snippet}

        {#if !showChangeEmail}
          <button
            type="button"
            class="settings-link-btn"
            onclick={() => (showChangeEmail = true)}
          >
            Change email
          </button>
        {:else}
          <EntityEditorFormField label="New email" inputId="account-new-email">
            {#snippet control()}
              <input
                id="account-new-email"
                type="email"
                bind:value={newEmailDraft}
                disabled={emailRequestPending}
              />
            {/snippet}
          </EntityEditorFormField>
          {#if emailError}
            <EntityEditorMessage variant="error" message={emailError} />
          {/if}
          {#if emailRequestSent}
            <EntityEditorMessage
              variant="success"
              message="Check your new inbox for a confirmation link."
            />
          {/if}
          <EntityEditorSubmitButton
            label="Send confirmation link"
            savingLabel="Sending…"
            saving={emailRequestPending}
            disabled={!newEmailDraft.trim()}
            onclick={requestEmailChange}
          />
        {/if}
      </SettingsSection>

      <SettingsSection
        title={profile.hasPassword ? "Password" : "Set a password"}
        description={profile.hasPassword
          ? "Change the password you sign in with."
          : "Add a password so you can sign in without Google."}
      >
        {#if profile.hasPassword}
          <EntityEditorFormField
            label="Current password"
            inputId="account-current-password"
          >
            {#snippet control()}
              <input
                id="account-current-password"
                type="password"
                autocomplete="current-password"
                bind:value={currentPasswordDraft}
                disabled={savingPassword}
              />
            {/snippet}
          </EntityEditorFormField>
        {/if}
        <EntityEditorFormField
          label="New password"
          inputId="account-new-password"
          hint="At least 10 characters."
        >
          {#snippet control()}
            <input
              id="account-new-password"
              type="password"
              autocomplete="new-password"
              bind:value={newPasswordDraft}
              disabled={savingPassword}
            />
          {/snippet}
        </EntityEditorFormField>
        {#if passwordError}
          <EntityEditorMessage variant="error" message={passwordError} />
        {/if}
        {#if passwordSaved}
          <EntityEditorMessage variant="success" message="Password saved." />
        {/if}

        {#snippet footer()}
          <EntityEditorSubmitButton
            label={profile.hasPassword ? "Change password" : "Set password"}
            savingLabel="Saving…"
            saving={savingPassword}
            disabled={newPasswordDraft.length < 10 ||
              (profile.hasPassword && !currentPasswordDraft)}
            onclick={savePassword}
          />
        {/snippet}
      </SettingsSection>

      <SettingsSection
        title="Connected accounts"
        description="Sign in with Google instead of a password."
      >
        {#snippet meta()}
          <span class="settings-current">
            {profile.linkedGoogle ? "Google is connected." : "No account connected."}
          </span>
        {/snippet}

        {#if identityError}
          <EntityEditorMessage variant="error" message={identityError} />
        {/if}
        {#if profile.linkedGoogle && !profile.hasPassword}
          <p class="field-hint">Set a password first to disconnect Google.</p>
        {/if}

        {#snippet footer()}
          {#if profile.linkedGoogle}
            <EntityEditorSubmitButton
              label="Disconnect Google"
              savingLabel="Disconnecting…"
              saving={unlinkingGoogle}
              disabled={!profile.hasPassword}
              variant="secondary"
              onclick={disconnectGoogle}
            />
          {:else}
            <EntityEditorSubmitButton
              label="Connect Google"
              variant="secondary"
              onclick={connectGoogle}
            />
          {/if}
        {/snippet}
      </SettingsSection>

      <SettingsSection
        title="Your contributions"
        description="Edits of yours that reviewers have published."
      >
        {#if contributionsError}
          <p class="settings-empty">{contributionsError}</p>
        {:else if contributions.length === 0}
          <p class="settings-empty">Your approved edits will appear here.</p>
        {:else}
          <ul class="contributions-list">
            {#each contributions as contribution (contribution.id)}
              <li>
                <span>{contribution.entityLabel}</span>
                <time datetime={contribution.createdAt}>
                  {new Date(contribution.createdAt).toLocaleDateString()}
                </time>
              </li>
            {/each}
          </ul>
        {/if}
      </SettingsSection>

      <SettingsSection
        title="Data and privacy"
        description="Take a copy of your data, or close the account."
        danger={showDeleteConfirm}
      >
        {#if showDeleteConfirm}
          <p class="settings-delete-warning">
            This deactivates your account and removes your email, display name,
            and password. Your past proposals and edit history stay on record,
            attributed to a deleted user.
          </p>
          {#if profile.hasPassword}
            <EntityEditorFormField
              label="Confirm password"
              inputId="account-delete-password"
            >
              {#snippet control()}
                <input
                  id="account-delete-password"
                  type="password"
                  bind:value={deletePasswordDraft}
                  disabled={deleting}
                />
              {/snippet}
            </EntityEditorFormField>
          {/if}
          {#if deleteError}
            <EntityEditorMessage variant="error" message={deleteError} />
          {/if}
        {/if}

        {#snippet footer()}
          {#if showDeleteConfirm}
            <EntityEditorSubmitButton
              label="Cancel"
              variant="secondary"
              disabled={deleting}
              onclick={() => (showDeleteConfirm = false)}
            />
            <EntityEditorSubmitButton
              label="Permanently delete my account"
              savingLabel="Deleting…"
              saving={deleting}
              disabled={profile.hasPassword && !deletePasswordDraft}
              variant="danger"
              onclick={confirmDelete}
            />
          {:else}
            <EntityEditorSubmitButton
              label="Download my data"
              variant="secondary"
              onclick={downloadExport}
            />
            <button
              type="button"
              class="settings-link-btn settings-link-btn--danger"
              onclick={() => (showDeleteConfirm = true)}
            >
              Delete my account
            </button>
          {/if}
        {/snippet}
      </SettingsSection>
    {/if}
  </div>
</Dialog>

<style>
  /* Grid, not a flex column: as flex items the cards shrank below their own
     content and overlapped once the list outgrew the dialog. Grid rows size to
     content and the scroll container takes the overflow. */
  .settings-scroll {
    display: grid;
    grid-auto-rows: min-content;
    gap: 0.75rem;
    padding: 0.25rem 0.75rem 0.75rem;
    overflow-y: auto;
    min-height: 0;
    flex: 1 1 auto;
  }

  .settings-masthead {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    /* Clears the dialog's own close button, which sits top right. */
    padding: 0.5rem 2.25rem 0.25rem 0.25rem;
  }

  .settings-masthead__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: hsl(0, 0%, 12%);
  }

  .settings-masthead__identity {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.8125rem;
    color: hsl(0, 0%, 42%);
  }

  .settings-username {
    font-weight: 600;
    color: hsl(0, 0%, 28%);
  }

  .settings-role {
    padding: 0.0625rem 0.375rem;
    border-radius: 999px;
    background: hsl(0, 0%, 94%);
    font-size: 0.75rem;
    text-transform: capitalize;
  }

  .settings-loading {
    margin: 0;
    color: hsl(0, 0%, 45%);
  }

  .settings-current {
    font-weight: 500;
  }

  .settings-empty {
    margin: 0;
    font-size: 0.875rem;
    color: hsl(0, 0%, 40%);
  }

  /* Shared entity-editor input geometry comes from entity-editor.css via the
     entity-editor-form class on each section body; these only add what it
     lacks. */
  .settings-scroll :global(.field-hint) {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.4;
    color: hsl(0, 0%, 45%);
  }

  .settings-scroll :global(.editor-field input:disabled) {
    background: hsl(0, 0%, 96%);
    color: hsl(0, 0%, 38%);
  }

  .settings-scroll :global(.editor-field input:focus-visible) {
    outline: 2px solid hsl(5, 53%, 32%);
    outline-offset: 1px;
  }

  .settings-link-btn {
    background: none;
    border: none;
    padding: 0;
    color: hsl(5, 53%, 32%);
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .settings-link-btn--danger {
    color: #9a1b1b;
  }

  .credits-visibility {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .settings-delete-warning {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: hsl(0, 0%, 30%);
  }

  .contributions-list {
    display: grid;
    gap: 0.375rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .contributions-list li {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.875rem;
  }

  .contributions-list time {
    flex: 0 0 auto;
    color: hsl(0, 0%, 40%);
  }
</style>
