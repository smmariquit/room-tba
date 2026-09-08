<script lang="ts">
  import Menu from "@lucide/svelte/icons/menu";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import Keyboard from "@lucide/svelte/icons/keyboard";
  import ChartColumn from "@lucide/svelte/icons/chart-column";
  import FileText from "@lucide/svelte/icons/file-text";
  import LifeBuoy from "@lucide/svelte/icons/life-buoy";
  import CircleHelp from "@lucide/svelte/icons/circle-help";
  import Inbox from "@lucide/svelte/icons/inbox";
  import CalendarDays from "@lucide/svelte/icons/calendar-days";
  import CalendarClock from "@lucide/svelte/icons/calendar-clock";
  import ClipboardPenLine from "@lucide/svelte/icons/clipboard-pen-line";
  import CloudDownload from "@lucide/svelte/icons/cloud-download";
  import Map from "@lucide/svelte/icons/map";
  import Megaphone from "@lucide/svelte/icons/megaphone";
  import UserRound from "@lucide/svelte/icons/user-round";
  import Phone from "@lucide/svelte/icons/phone";
  import University from "@lucide/svelte/icons/university";
  import Users from "@lucide/svelte/icons/users";
  import BookText from "@lucide/svelte/icons/book-text";
  import { onMount } from "svelte";
  import { APP_VERSION_LABEL } from "@constants/version";
  import OnlineCounter from "../OnlineCounter.svelte";
  import { statusBarNavGroups } from "@constants/status-bar-links";
  import { trapFocus } from "@lib/focus-trap";
  import { openShortcutsHelp } from "@lib/keyboard-shortcuts";
  import { openBrowseClasses, openCampusBrowse } from "@lib/browse-campus";
  import { portal } from "@lib/portal";
  import {
    registerEphemeralOverlayDismisser,
    openEphemeralOverlay,
  } from "@lib/overlay-stack";
  import { rafThrottle } from "@lib/layout-css-vars";
  import {
    adminAuthStore,
    mapToolsStore,
    modalStore,
    proposalsStore,
    queryStore,
    sidePanelStore,
    sidebarStore,
    toastStore,
  } from "@lib/store.svelte";
  import PWAInstallPrompt from "@ui/PWAInstallPrompt.svelte";
  import MapChromeSession from "@ui/map-chrome/MapChromeSession.svelte";
  import KeyboardShortcutsChip from "@ui/map-chrome/KeyboardShortcutsPopup.svelte";
  import StatusBarLinkGroups from "./StatusBarLinkGroups.svelte";
  import "../map-chrome/map-chrome.css";

  type Props = {
    /** Optional so the menu can be dropped into any chrome without each host
        re-implementing sign-out. */
    onSignOut?: () => void | Promise<void>;
  };

  const { onSignOut = defaultSignOut }: Props = $props();

  async function defaultSignOut() {
    await adminAuthStore.logout();
    toastStore.show("Signed out.", "info");
  }

  function handleScreen(
    id: "map" | "today" | "planner" | "finals" | "calendar",
  ) {
    sidebarStore.changeOpened(id);
    closePanel();
  }

  function handleSignIn() {
    if (adminAuthStore.username) {
      adminAuthStore.openAccountSettings();
    } else {
      adminAuthStore.openLogin("signin");
    }
    closePanel();
  }

  let open = $state(false);
  let triggerEl = $state<HTMLButtonElement | null>(null);
  let panelEl = $state<HTMLDivElement | null>(null);
  let panelStyle = $state("");

  const contributorSession = $derived(
    adminAuthStore.isLoggedIn &&
      !adminAuthStore.canPublish &&
      !adminAuthStore.canReview,
  );
  const sessionDisplayName = $derived(
    adminAuthStore.displayName ?? adminAuthStore.username ?? "Contributor",
  );
  const sessionRoleLabel = $derived(
    adminAuthStore.role === "admin"
      ? "Admin"
      : adminAuthStore.role === "editor"
        ? "Editor"
        : "Contributor",
  );
  const navGroups = $derived(
    statusBarNavGroups({
      versionLabel: APP_VERSION_LABEL,
      showEditorLogin: !adminAuthStore.isLoggedIn,
    }),
  );

  onMount(() => {
    const unregisterDismiss = registerEphemeralOverlayDismisser(() => {
      open = false;
    });
    return unregisterDismiss;
  });

  function updatePanelPosition() {
    if (!open || !triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const width = Math.min(22 * 16, window.innerWidth - 16);
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - width - 8,
    );
    // Anchor away from whichever edge the trigger sits against. Fixed `bottom`
    // is right for a bottom bar but throws the panel off the top of the screen
    // when the trigger lives in the desktop top bar.
    if (rect.top < window.innerHeight / 2) {
      const top = Math.min(rect.bottom + 8, window.innerHeight - 8);
      panelStyle = `left: ${left}px; top: ${top}px; bottom: auto; max-height: ${Math.max(120, window.innerHeight - top - 8)}px; width: ${width}px;`;
      return;
    }
    const bottom = Math.max(8, window.innerHeight - rect.top + 8);
    panelStyle = `left: ${left}px; bottom: ${bottom}px; width: ${width}px;`;
  }

  $effect(() => {
    if (!open) return;
    updatePanelPosition();
    const handleLayout = rafThrottle(updatePanelPosition);
    window.addEventListener("resize", handleLayout);
    window.addEventListener("scroll", handleLayout, true);
    return () => {
      window.removeEventListener("resize", handleLayout);
      window.removeEventListener("scroll", handleLayout, true);
    };
  });

  function toggleOpen() {
    if (!open) {
      openEphemeralOverlay(() => {
        mapToolsStore.close();
        open = true;
        queueMicrotask(updatePanelPosition);
      });
      return;
    }
    open = false;
  }

  function closePanel() {
    open = false;
  }

  $effect(() => {
    if (!open || !panelEl) return;
    return trapFocus(panelEl, { onEscape: closePanel });
  });

  function handleDocumentPointerDown(event: PointerEvent) {
    if (!open) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (triggerEl?.contains(target)) return;
    if (panelEl?.contains(target)) return;
    if (target instanceof Element && target.closest("#offline-maps-dialog")) {
      return;
    }
    closePanel();
  }

  function handleNavAction(
    id: "contributors" | "editor-login" | "leaderboard" | "sign-up",
  ) {
    if (id === "contributors") {
      modalStore.openModal("landing", { landingTab: "campus" });
      closePanel();
      return;
    }
    if (id === "leaderboard") {
      modalStore.openModal("leaderboard");
      closePanel();
      return;
    }
    adminAuthStore.openLogin(id === "sign-up" ? "signup" : "signin");
    closePanel();
  }

  function handleShortcutsHelp() {
    closePanel();
    openShortcutsHelp();
  }

  function handleWhatsNew() {
    closePanel();
    modalStore.openModal("changelog");
  }

  function handleSettings() {
    closePanel();
    modalStore.openModal("settings");
  }

  function handleCoverage() {
    closePanel();
    modalStore.openModal("coverage");
  }

  function handleBrowse(id: "colleges" | "organizations" | "classes") {
    if (id === "classes") {
      openBrowseClasses(queryStore, sidePanelStore);
    } else {
      openCampusBrowse(queryStore, sidePanelStore, id);
    }
    closePanel();
  }

  function handleHowItWorks() {
    closePanel();
    modalStore.openModal("landing", { landingTab: "welcome" });
  }

  function handleReview() {
    closePanel();
    modalStore.openModal("review");
  }
</script>

<svelte:window onpointerdown={handleDocumentPointerDown} />

<div class="app-menu">
  <button
    bind:this={triggerEl}
    type="button"
    class="app-menu__trigger map-chrome-chip"
    aria-expanded={open}
    aria-haspopup="dialog"
    aria-controls="app-menu-panel"
    aria-label="App menu"
    onclick={toggleOpen}
  >
    <Menu size={14} aria-hidden="true" />
    <span>Menu</span></button
  >

  <div class="app-menu__shortcuts-host" aria-hidden="true">
    <KeyboardShortcutsChip compact />
  </div>

  {#if open}
    <div
      bind:this={panelEl}
      id="app-menu-panel"
      class="app-menu__panel map-chrome-popover"
      style={panelStyle}
      role="dialog"
      aria-modal="true"
      aria-label="App menu"
      use:portal
    >
      <!-- Live presence lost its bottom-band chip in the Aug 2026 chrome
           redesign; the menu is its passive-status home now. -->
      <div class="app-menu__presence">
        <OnlineCounter />
      </div>
      {#if contributorSession}
        <section class="app-menu__section" aria-label="Signed in">
          <MapChromeSession
            roleLabel={sessionRoleLabel}
            displayName={sessionDisplayName}
            utilities
            {onSignOut}
          />
        </section>
      {/if}

      {#if !contributorSession}
        <section class="app-menu__section" aria-label="Account">
          <button
            type="button"
            class="app-menu__action map-chrome-chip"
            onclick={handleSignIn}
          >
            <UserRound size={14} aria-hidden="true" />
            <span>
              {adminAuthStore.username
                ? "Account settings"
                : "Contributor sign in"}
            </span>
          </button>
        </section>
      {/if}

      <section
        class="app-menu__section"
        aria-labelledby="app-menu-go-heading"
      >
        <h3 id="app-menu-go-heading" class="app-menu__heading">Go to</h3>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => handleScreen("map")}
        >
          <Map size={18} aria-hidden="true" />
          <span>Campus map</span>
        </button>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => handleScreen("today")}
        >
          <CalendarClock size={18} aria-hidden="true" />
          <span>Today</span>
        </button>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => handleScreen("planner")}
        >
          <ClipboardPenLine size={18} aria-hidden="true" />
          <span>Course planner</span>
        </button>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => handleScreen("finals")}
        >
          <FileText size={18} aria-hidden="true" />
          <span>Final exams</span>
        </button>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => handleScreen("calendar")}
        >
          <CalendarDays size={18} aria-hidden="true" />
          <span>Academic calendar</span>
        </button>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => {
            closePanel();
            modalStore.openModal("announcements");
          }}
        >
          <Megaphone size={18} aria-hidden="true" />
          <span>Announcements</span>
        </button>
      </section>

      <section
        class="app-menu__section"
        aria-labelledby="app-menu-tools-heading"
      >
        <h3 id="app-menu-tools-heading" class="app-menu__heading">Tools</h3>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => {
            closePanel();
            modalStore.openModal("hotlines");
          }}
        >
          <Phone size={18} aria-hidden="true" />
          <span>Emergency hotlines</span>
        </button>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={handleSettings}
        >
          <SettingsIcon size={18} aria-hidden="true" />
          <span>Settings</span>
        </button>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => {
            closePanel();
            modalStore.openModal("offline-maps");
          }}
        >
          <CloudDownload size={18} aria-hidden="true" />
          <span>Offline maps</span>
        </button>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={handleCoverage}
        >
          <ChartColumn size={18} aria-hidden="true" />
          <span>Campus data coverage</span>
        </button>
      </section>

      <section
        class="app-menu__section"
        aria-labelledby="app-menu-browse-heading"
      >
        <h3 id="app-menu-browse-heading" class="app-menu__heading">Browse</h3>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => handleBrowse("colleges")}
        >
          <University size={18} aria-hidden="true" />
          <span>Colleges</span>
        </button>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => handleBrowse("organizations")}
        >
          <Users size={18} aria-hidden="true" />
          <span>Student organizations</span>
        </button>
        <button
          type="button"
          class="app-menu__nav-action"
          onclick={() => handleBrowse("classes")}
        >
          <BookText size={18} aria-hidden="true" />
          <span>Classes</span>
        </button>
      </section>

      {#if adminAuthStore.canReview}
        <section class="app-menu__section" aria-label="Review">
          <button
            type="button"
            class="app-menu__action map-chrome-chip"
            onclick={handleReview}
          >
            <Inbox size={14} aria-hidden="true" />
            <span>
              Review suggested edits
              {#if proposalsStore.pendingCount > 0}
                <span class="app-menu__badge"
                  >{proposalsStore.pendingCount}</span
                >
              {/if}
            </span>
          </button>
        </section>
      {/if}

      <section
        class="app-menu__section"
        aria-labelledby="app-menu-help-heading"
      >
        <h3 id="app-menu-help-heading" class="app-menu__heading">Help</h3>
        <a
          class="app-menu__action map-chrome-chip"
          href="/faq"
          onclick={closePanel}
        >
          <CircleHelp size={14} aria-hidden="true" />
          <span>Help &amp; FAQ</span>
        </a>
        <button
          type="button"
          class="app-menu__action map-chrome-chip"
          onclick={handleHowItWorks}
        >
          <LifeBuoy size={14} aria-hidden="true" />
          <span>How Room TBA works</span>
        </button>
        <button
          type="button"
          class="app-menu__action map-chrome-chip"
          onclick={handleWhatsNew}
        >
          <FileText size={14} aria-hidden="true" />
          <span>What's new</span>
        </button>
        <button
          type="button"
          class="app-menu__action map-chrome-chip"
          aria-keyshortcuts="?"
          onclick={handleShortcutsHelp}
        >
          <Keyboard size={14} aria-hidden="true" />
          <span>Keyboard shortcuts</span>
        </button>
      </section>

      <details class="app-menu__more">
        <summary>Community &amp; project links</summary>
        <nav aria-label="Community and project links">
          <StatusBarLinkGroups groups={navGroups} onAction={handleNavAction} />
        </nav>
      </details>

      <section
        class="app-menu__section app-menu__section--install"
        aria-label="Install app"
      >
        <PWAInstallPrompt />
      </section>
    </div>
  {/if}
</div>

<style>
  .app-menu__presence {
    display: flex;
    justify-content: flex-end;
    padding: 0.25rem 0.25rem 0;
  }

  .app-menu__presence :global(.online-counter) {
    height: auto;
    padding: 0.25rem 0.625rem;
    box-shadow: none;
    font-size: 0.75rem;
  }

  .app-menu {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
  }

  .app-menu__trigger {
    cursor: pointer;
  }

  .app-menu__shortcuts-host {
    position: absolute;
    left: 0;
    bottom: 100%;
    width: 0;
    height: 0;
    overflow: visible;
    opacity: 0;
    pointer-events: none;
  }

  .app-menu__shortcuts-host :global(.shortcuts-chip__trigger) {
    position: fixed;
    left: var(--map-ui-padding, 0.5rem);
    bottom: calc(var(--status-bar-block-height, 2.75rem) + 0.25rem);
  }

  .app-menu__action {
    align-self: flex-start;
    cursor: pointer;
    text-decoration: none;
  }

  .app-menu__nav-action {
    /* No global border-box reset in this app: without this, min-height +
       padding stack to 64px-tall rows and width: 100% + padding overflows
       the panel sideways (stray horizontal scrollbar). */
    box-sizing: border-box;
    width: 100%;
    min-height: 2.75rem;
    border: 0;
    border-radius: 0.5rem;
    padding: 0.625rem 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    background: transparent;
    color: var(--map-chrome-text, hsl(5 20% 18%));
    font: inherit;
    font-size: 0.875rem;
    font-weight: 650;
    line-height: 1.15;
    text-align: left;
    cursor: pointer;
  }

  .app-menu__nav-action:hover {
    background: var(--map-chrome-hover, hsl(5 25% 96%));
  }

  .app-menu__nav-action:focus-visible {
    outline: 2px solid var(--color-brand, hsl(345 75% 31%));
    outline-offset: 2px;
  }

  .app-menu__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.1rem;
    margin-left: 0.25rem;
    padding: 0 0.3rem;
    border-radius: 999px;
    background: hsl(5, 53%, 32%);
    color: white;
    font-size: 0.6875rem;
    font-weight: 700;
  }

  .app-menu__panel {
    position: fixed;
    z-index: var(--z-chrome-popover, 17);
    border-radius: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: min(70vh, 28rem);
    overflow-y: auto;
    padding: 0.75rem;
  }

  .app-menu__section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.25rem;
    border-top: 1px solid var(--map-chrome-divider, hsl(5 12% 88%));
  }

  .app-menu__section:first-child {
    border-top: none;
    padding-top: 0;
  }

  .app-menu__heading {
    margin: 0;
    font: inherit;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: hsl(0, 0%, 40%);
  }

  .app-menu__section--install :global(.pwa-install-prompt) {
    max-width: none;
    width: 100%;
  }

  .app-menu__section--install:not(:has(:global(.pwa-install-prompt))) {
    display: none;
  }

  .app-menu__section :global(.status-bar__nav-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
  }

  .app-menu__section :global(.status-bar__nav-group + .status-bar__nav-group) {
    margin-top: 0.25rem;
    padding-top: 0.375rem;
    border-top: 1px dashed hsl(0, 0%, 88%);
  }

  .app-menu__more {
    padding-top: 0.625rem;
    border-top: 1px solid var(--map-chrome-divider, hsl(5 12% 88%));
    color: hsl(0, 0%, 35%);
    font-size: 0.75rem;
  }

  .app-menu__more summary {
    cursor: pointer;
    font-weight: 650;
  }

  .app-menu__more nav {
    margin-top: 0.625rem;
  }
</style>
