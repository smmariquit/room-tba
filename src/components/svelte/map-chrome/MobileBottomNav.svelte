<script lang="ts">
  import { editorChromeStore, sidebarStore } from "@lib/store.svelte";
  import AppMenu from "../status-bar/AppMenu.svelte";
  import CalendarClock from "@lucide/svelte/icons/calendar-clock";
  import ClipboardPen from "@lucide/svelte/icons/clipboard-pen";
  import Map from "@lucide/svelte/icons/map";

  type TabId = "map" | "planner" | "today";

  const active = $derived(sidebarStore.panelOpen);

  function go(id: TabId) {
    sidebarStore.changeOpened(id);
  }
</script>

<nav class="mobile-bottom-nav" aria-label="Primary">
  <button
    type="button"
    class="mobile-bottom-nav__item"
    class:mobile-bottom-nav__item--active={active === "map"}
    aria-current={active === "map" ? "page" : undefined}
    onclick={() => go("map")}
  >
    <Map size={24} aria-hidden="true" />
    <span>Map</span>
  </button>

  <button
    type="button"
    class="mobile-bottom-nav__item"
    class:mobile-bottom-nav__item--active={active === "planner"}
    aria-current={active === "planner" ? "page" : undefined}
    onclick={() => go("planner")}
  >
    <ClipboardPen size={24} aria-hidden="true" />
    <span>Planner</span>
  </button>

  <button
    type="button"
    class="mobile-bottom-nav__fab"
    aria-label="Add something to the map"
    onclick={() => editorChromeStore.openAdditionModal()}
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path
        d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      />
      <path d="M12 7v6" />
      <path d="M9 10h6" />
    </svg>
  </button>

  <button
    type="button"
    class="mobile-bottom-nav__item"
    class:mobile-bottom-nav__item--active={active === "today"}
    aria-current={active === "today" ? "page" : undefined}
    onclick={() => go("today")}
  >
    <CalendarClock size={24} aria-hidden="true" />
    <span>Today</span>
  </button>

  <!-- Menu, not Account: this is the only mobile entry point to Final Exams,
       the academic calendar, the changelog, coverage, the leaderboard and the
       review queue (#951). Sign in / account settings sits inside it. Finals
       lives here rather than the bar because it is seasonal (#951 follow-up:
       daily-relevant Today earns the slot). -->
  <AppMenu />
</nav>

<style>
  .mobile-bottom-nav {
    pointer-events: auto;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr 1fr auto 1fr 1fr;
    align-items: center;
    column-gap: 0.15rem;
    width: 100%;
    min-height: 3.75rem;
    padding: 0.4rem 0.4rem calc(0.4rem + env(safe-area-inset-bottom, 0px));
    border: none;
    border-top: 1px solid #f0eaeb;
    background: #fff;
    box-shadow: 0 -2px 12px rgb(0 0 0 / 0.06);
  }

  .mobile-bottom-nav__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    min-width: 0;
    min-height: 3rem;
    margin: 0;
    padding: 0.3rem 0.1rem;
    border: none;
    border-radius: 0.75rem;
    background: transparent;
    color: #3a3032;
    font: inherit;
    font-size: 0.625rem;
    font-weight: 500;
    line-height: 1.1;
    cursor: pointer;
  }

  .mobile-bottom-nav__item img,
  .mobile-bottom-nav__item svg {
    width: 1.5rem;
    height: 1.5rem;
    opacity: 0.92;
  }

  .mobile-bottom-nav__item span {
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-bottom-nav__item--active {
    background: #feeaea;
    color: #8d1437;
  }

  .mobile-bottom-nav__fab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    margin: 0 0.15rem;
    padding: 0;
    border: none;
    border-radius: 1.05rem;
    background: #8d1437;
    color: #fff;
    box-shadow: 0 3px 10px rgb(141 20 55 / 0.35);
    cursor: pointer;
    transform: translateY(-0.65rem);
  }

  .mobile-bottom-nav__fab:hover {
    background: #7a1130;
  }

  /* AppMenu ships its own chip styling for the status bar; here it has to read
     as the fifth tab, so strip the chip chrome and match .mobile-bottom-nav__item. */
  .mobile-bottom-nav :global(.app-menu) {
    display: flex;
    min-width: 0;
    justify-content: center;
    /* The wrapper is the grid cell; stretch it so the trigger can fill the same
       row box as the sibling tabs and their labels sit on one baseline. */
    align-self: stretch;
  }

  .mobile-bottom-nav :global(.app-menu__trigger) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    width: 100%;
    min-width: 0;
    /* map-chrome-chip pins a fixed height; unpin it so the trigger grows to the
       same 58px as its siblings instead of sitting 10px short. */
    height: 100%;
    min-height: 3rem;
    margin: 0;
    padding: 0.3rem 0.1rem;
    border: none;
    border-radius: 0.75rem;
    background: transparent;
    box-shadow: none;
    color: #3a3032;
    font: inherit;
    font-size: 0.625rem;
    font-weight: 500;
    line-height: 1.1;
  }

  .mobile-bottom-nav :global(.app-menu__trigger svg) {
    width: 1.5rem;
    height: 1.5rem;
    opacity: 0.92;
  }

  .mobile-bottom-nav :global(.app-menu__trigger span) {
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-bottom-nav :global(.app-menu__trigger[aria-expanded="true"]) {
    background: #feeaea;
    color: #8d1437;
  }
</style>
