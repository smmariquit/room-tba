<script lang="ts">
  import { onMount } from "svelte";
  import type { BeforeInstallPromptEvent } from "@lib/types";
  import { toastStore } from "@lib/store.svelte";
  import Download from "@lucide/svelte/icons/download";
  import X from "@lucide/svelte/icons/x";
  import IconButton from "@ui/IconButton.svelte";

  const INSTALL_DISMISS_KEY = "room-tba:install-dismissed";
  const INSTALL_DISMISS_DAYS = 14;

  let deferredPrompt = $state<
    | (Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      })
    | null
  >(null);
  let dismissed = $state(false);
  let isInstalled = $state(false);

  function readDismissed(): boolean {
    try {
      const raw = localStorage.getItem(INSTALL_DISMISS_KEY);
      if (!raw) return false;
      const ts = Number(raw);
      if (!Number.isFinite(ts)) return false;
      const elapsed = Date.now() - ts;
      return elapsed < INSTALL_DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  function writeDismissed() {
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }

  onMount(() => {
    // iOS Safari standalone
    const iosStandalone =
      "standalone" in window.navigator &&
      (window.navigator as unknown as { standalone: boolean }).standalone ===
        true;
    const displayStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    isInstalled = iosStandalone || displayStandalone;
    dismissed = readDismissed();

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  });

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      isInstalled = true;
      toastStore.show(
        "Room TBA installed — open it from your home screen.",
        "success",
      );
    }
    deferredPrompt = null;
  }

  function dismiss() {
    dismissed = true;
    writeDismissed();
  }

  const showPrompt = $derived(
    !isInstalled && !dismissed && deferredPrompt !== null,
  );
</script>

{#if showPrompt}
  <div class="pwa-install-prompt" role="status">
    <Download size={14} aria-hidden="true" />
    <span class="pwa-install-label">Install Room TBA for offline maps</span>
    <button class="pwa-install-action" type="button" onclick={promptInstall}>
      Install
    </button>
    <IconButton
      size="sm"
      class="pwa-install-dismiss"
      label="Dismiss install prompt"
      onclick={dismiss}
    >
      <X size={12} aria-hidden="true" />
    </IconButton>
  </div>
{/if}

<style>
  .pwa-install-prompt {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 1.5rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.75rem;
    border: 1px solid hsl(5, 34%, 82%);
    background: hsl(0, 0%, 99%);
    color: hsl(5, 53%, 32%);
    font-size: 0.8125rem;
    line-height: 1.15;
    flex: 0 1 auto;
    min-width: 0;
    max-width: min(100%, 18rem);
  }

  .pwa-install-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1 1 auto;
    min-width: 0;
  }

  .pwa-install-action {
    flex-shrink: 0;
    padding: 0.125rem 0.5rem;
    border-radius: 0.5rem;
    border: 1px solid hsl(5, 53%, 32%);
    background: hsl(5, 53%, 32%);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
  }

  .pwa-install-action:hover,
  .pwa-install-action:focus-visible {
    background: hsl(5, 53%, 28%);
  }

  /* Compact override: the prompt pill is short, keep the X small. */
  .pwa-install-prompt :global(.pwa-install-dismiss) {
    width: 1.25rem;
    height: 1.25rem;
    color: hsl(0, 0%, 50%);
  }

  .pwa-install-prompt :global(.pwa-install-dismiss:hover),
  .pwa-install-prompt :global(.pwa-install-dismiss:focus-visible) {
    color: hsl(5, 53%, 32%);
    background: hsl(5, 20%, 96%);
  }

  @media (max-width: 48rem) {
    .pwa-install-prompt {
      max-width: none;
      flex: 1 1 auto;
    }
  }
</style>
