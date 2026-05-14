<script lang="ts">
  import { onMount } from "svelte";
  import { Lock, LogOut, ShieldCheck } from "@lucide/svelte";
  import { adminAuthStore, toastStore } from "../../lib/store.svelte";

  onMount(() => {
    adminAuthStore.hydrate();
  });

  async function handleLogout() {
    await adminAuthStore.logout();
    toastStore.show("Signed out.", "info");
  }
</script>

<div class="admin-chip">
  {#if adminAuthStore.isAdmin}
    <span class="admin-badge" title="Signed in as admin">
      <ShieldCheck size={12} /> admin
    </span>
    <button class="admin-action" onclick={handleLogout} title="Sign out">
      <LogOut size={12} />
    </button>
  {:else}
    <button
      class="admin-login"
      onclick={() => adminAuthStore.openLogin()}
      title="Editor login"
      aria-label="Editor login"
    >
      <Lock size={12} />
    </button>
  {/if}
</div>

<style>
  .admin-chip {
    position: fixed;
    bottom: 0.75rem;
    right: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    z-index: 60;
    pointer-events: auto;
  }
  .admin-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background-color: hsl(160, 84%, 26%);
    color: white;
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  }
  .admin-action,
  .admin-login {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.625rem;
    height: 1.625rem;
    border-radius: 999px;
    border: 1px solid hsl(0, 0%, 80%);
    background: white;
    color: hsl(0, 0%, 30%);
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  }
  .admin-action:hover,
  .admin-login:hover {
    background-color: hsl(0, 0%, 96%);
  }
</style>
