<script lang="ts">
  import { fade } from "svelte/transition";
  import { X, Lock } from "@lucide/svelte";
  import { adminAuthStore, toastStore } from "../../lib/store.svelte";

  let username = $state("admin");
  let password = $state("");
  let error: string | null = $state(null);

  async function submit(e: Event) {
    e.preventDefault();
    error = null;
    const err = await adminAuthStore.login(username, password);
    if (err) {
      error = err;
      return;
    }
    password = "";
    toastStore.show("Logged in as admin.", "success");
  }

  function close() {
    adminAuthStore.closeLogin();
    error = null;
    password = "";
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="login-overlay" transition:fade={{ duration: 140 }}>
  <div class="login-frame" role="dialog" aria-modal="true">
    <header class="login-header">
      <div class="login-title">
        <Lock size={16} />
        <span>Editor login</span>
      </div>
      <button class="login-close" onclick={close} aria-label="Close login">
        <X size={18} />
      </button>
    </header>
    <form class="login-body" onsubmit={submit}>
      <label class="field">
        <span>Username</span>
        <input
          type="text"
          autocomplete="username"
          bind:value={username}
          required
        />
      </label>
      <label class="field">
        <span>Password</span>
        <input
          type="password"
          autocomplete="current-password"
          bind:value={password}
          required
        />
      </label>
      {#if error}
        <p class="error">{error}</p>
      {/if}
      <button class="submit" type="submit" disabled={adminAuthStore.loading}>
        {adminAuthStore.loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  </div>
</div>

<style>
  .login-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(8, 12, 22, 0.55);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .login-frame {
    width: min(22rem, 100%);
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 18px 38px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }
  .login-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid hsl(0, 0%, 92%);
  }
  .login-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: hsl(0, 0%, 15%);
  }
  .login-close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.375rem;
    color: hsl(0, 0%, 30%);
    display: flex;
  }
  .login-close:hover {
    background-color: hsl(0, 0%, 95%);
  }
  .login-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8125rem;
    color: hsl(0, 0%, 25%);
  }
  .field input {
    font: inherit;
    padding: 0.5rem 0.625rem;
    border: 1px solid hsl(0, 0%, 85%);
    border-radius: 0.5rem;
    background: white;
    color: hsl(0, 0%, 15%);
  }
  .field input:focus {
    border-color: hsl(5, 53%, 32%);
    outline: 2px solid transparent;
    outline-offset: 2px;
  }
  .error {
    margin: 0;
    color: hsl(5, 65%, 38%);
    font-size: 0.8125rem;
  }
  .submit {
    background-color: hsl(5, 53%, 32%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.55rem 0.75rem;
    font: inherit;
    cursor: pointer;
  }
  .submit:hover:not(:disabled) {
    background-color: hsl(5, 53%, 27%);
  }
  .submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
