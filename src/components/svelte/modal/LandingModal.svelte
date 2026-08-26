<script lang="ts">
  import { modalStore } from "@lib/store.svelte";
  import type { BeforeInstallPromptEvent } from "@lib/types";
  import { designers } from "@constants/contributors";
  import {
    UPLB_TOOLS_URL,
    DISCORD_URL,
    MESSENGER_CONTRIBUTE_TARGET,
    MESSENGER_MAINTAIN_TARGET,
    DONATE_URL,
  } from "@constants/community-links";
  import Search from "@lucide/svelte/icons/search";
  import MapIcon from "@lucide/svelte/icons/map";
  import ClipboardPenLine from "@lucide/svelte/icons/clipboard-pen-line";
  import Heart from "@lucide/svelte/icons/heart";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import CommunityPlatformLink from "@ui/community/CommunityPlatformLink.svelte";
  import {
    fetchGithubContributors,
    type GithubContributor,
  } from "@lib/github-contributors";
  import { fetchGithubStarCountCached } from "@lib/github-stars";
  import PeopleAvatarGrid from "./PeopleAvatarGrid.svelte";
  import GithubContributorsSection from "./GithubContributorsSection.svelte";
  import LandingGuideSteps from "./LandingGuideSteps.svelte";
  import VisitorCounter from "@ui/VisitorCounter.svelte";
  import GithubStarLink from "@ui/GithubStarLink.svelte";
  import { GITHUB_ROOM_TBA_URL } from "@constants/community-links";
  import Download from "@lucide/svelte/icons/download";
  import { untrack } from "svelte";

  type LandingTab = "welcome" | "campus";
  // "how" is a lean-modal secondary view reached from the footer link, never
  // an auto-open target, so it stays local and out of the store's tab type.
  type LandingView = LandingTab | "how";

  let activeTab = $state<LandingView>("welcome");
  let installPrompt = $state<
    | (Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      })
    | null
  >(null);
  let isInstalled = $state(false);

  let githubContributors = $state<GithubContributor[]>([]);
  let githubLoading = $state(false);
  let githubError = $state<string | null>(null);
  let githubLoaded = $state(false);
  let githubRepoStars = $state<number | null>(null);
  type EditorCredit = {
    name: string;
    avatarUrl: string | null;
    profileUrl: string | null;
  };
  let campusCredits = $state<EditorCredit[]>([]);
  let creditsLoading = $state(false);
  let creditsLoaded = $state(false);


  function toAvatarPeople(list: typeof designers) {
    return list.map((person) => ({
      name: person.name,
      href: person.href,
      imageSrc: "",
    }));
  }

  const designerPeople = $derived(toAvatarPeople(designers));
  const campusCreditPeople = $derived(
    campusCredits.map((person) => ({
      name: person.name,
      href: person.profileUrl ?? undefined,
      imageSrc: person.avatarUrl ?? "/profile.svg",
    })),
  );

  async function loadCampusCredits() {
    if (creditsLoaded || creditsLoading) return;
    creditsLoading = true;
    try {
      const res = await fetch("/api/editor-credits");
      campusCredits = res.ok ? ((await res.json()) as EditorCredit[]) : [];
      creditsLoaded = true;
    } catch {
      campusCredits = [];
    } finally {
      creditsLoading = false;
    }
  }

  async function loadGithubData() {
    if (githubLoaded || githubLoading) return;
    githubLoading = true;
    githubError = null;
    try {
      const [contributorsRes, repoStarsRes] = await Promise.all([
        fetchGithubContributors(),
        fetchGithubStarCountCached(),
      ]);
      githubContributors = contributorsRes;
      githubRepoStars = repoStarsRes;
      githubLoaded = true;
    } catch (err) {
      githubError =
        err instanceof Error ? err.message : "Could not load GitHub data";
    } finally {
      githubLoading = false;
    }
  }

  function retryGithubData() {
    githubLoaded = false;
    void loadGithubData();
  }

  function goTo(view: LandingView) {
    activeTab = view;
    if (view === "campus") {
      void loadGithubData();
      void loadCampusCredits();
    }
  }

  function handleGetStarted() {
    if (installPrompt) {
      void installPrompt.prompt();
      installPrompt.userChoice.then(({ outcome }) => {
        if (outcome === "accepted") isInstalled = true;
      });
      installPrompt = null;
      return;
    }
    modalStore.closeModal();
  }

  $effect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installPrompt = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", handler);
    const iosStandalone =
      "standalone" in window.navigator &&
      (window.navigator as unknown as { standalone: boolean }).standalone ===
        true;
    isInstalled =
      iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
    return () => window.removeEventListener("beforeinstallprompt", handler);
  });

  $effect(() => {
    if (!modalStore.open) return;
    activeTab = untrack(() => modalStore.landingTab) ?? "welcome";
    if (untrack(() => activeTab) === "campus") {
      void loadGithubData();
      void loadCampusCredits();
    }
  });
</script>

<div class="landing-content">
  <header class="landing-header">
    <div class="hero-image">
      <div class="hero-overlay" class:collapse-hero={activeTab !== "welcome"}>
        {#if activeTab !== "welcome"}
          <button type="button" class="landing-back" onclick={() => goTo("welcome")}>
            <ChevronLeft size={16} aria-hidden="true" />
            Back
          </button>
        {/if}
        <h2>
          <span class="hero-title" id="landing-modal-title">
            <img
              src="/logo.png"
              alt=""
              class="hero-logo"
              aria-hidden="true"
              width="512"
              height="512"
              decoding="async"
            />
            Room TBA
          </span>
        </h2>
        <p class="hero-tagline">
          {#if activeTab === "campus"}
            The students who keep the campus data current.
          {:else if activeTab === "how"}
            How suggested edits become live campus data.
          {:else}
            Find rooms, plan classes, and explore UPLB.
          {/if}
        </p>
      </div>
    </div>
  </header>

  <div class="scroll-region map-chrome-scroll">
    {#if activeTab === "welcome"}
      <div class="tab-panel welcome-lean">
        <ul class="core-list">
          <li>
            <span class="core-list__icon"><Search size={20} aria-hidden="true" /></span>
            <span class="core-list__text">
              <span class="core-list__label">Find a room or building</span>
              <span class="core-list__sub">Search room codes, buildings, and offices.</span>
            </span>
          </li>
          <li>
            <span class="core-list__icon"><MapIcon size={20} aria-hidden="true" /></span>
            <span class="core-list__text">
              <span class="core-list__label">Explore the campus map</span>
              <span class="core-list__sub">Dorms, colleges, jeepney routes, and events.</span>
            </span>
          </li>
          <li>
            <span class="core-list__icon"><ClipboardPenLine size={20} aria-hidden="true" /></span>
            <span class="core-list__text">
              <span class="core-list__label">Plan your classes</span>
              <span class="core-list__sub">Build a draft schedule from the course list.</span>
            </span>
          </li>
        </ul>

        <aside class="donate-card">
          <div class="donate-card__body">
            <span class="donate-card__title">
              <Heart size={16} aria-hidden="true" fill="currentColor" />
              Keep Room TBA free
            </span>
            <p class="donate-card__note">
              Student-run, no paywall. A small gift covers the map tiles and
              servers for everyone.
            </p>
          </div>
          <a href={DONATE_URL} class="donate-card__btn">Donate</a>
        </aside>
      </div>
    {:else if activeTab === "how"}
      <div class="tab-panel">
        <LandingGuideSteps />
      </div>
    {:else}
      <div class="tab-panel">
        <section class="people-block">
          <h3>Campus editors &amp; contributors</h3>
          <p class="section-note">
            People credited for published campus data changes.
          </p>
          {#if creditsLoading}
            <p class="section-note">Loading credits…</p>
          {:else if campusCredits.length > 0}
            <PeopleAvatarGrid people={campusCreditPeople} />
          {:else if creditsLoaded}
            <p class="section-note">No public credits yet.</p>
          {/if}
        </section>

        <GithubContributorsSection
          title="Developers"
          note="From GitHub commit history on the Room TBA repo."
          contributors={githubContributors}
          loading={githubLoading}
          loaded={githubLoaded}
          error={githubError}
          onRetry={retryGithubData}
        />

        <section class="people-block">
          <h3>Design</h3>
          <p class="section-note">
            Visual and UX design (manual credits, not from GitHub commits).
          </p>
          <PeopleAvatarGrid
            people={designerPeople}
            imageFolder="contributors"
          />
        </section>

        <div class="github-cta">
          <p class="cta-text">
            Like the project? Support us by starring the repository!
          </p>
          <a
            href="https://github.com/uplbtools/room-tba"
            target="_blank"
            rel="noopener noreferrer"
            class="cta-button"
          >
            <span class="cta-button__icon">★</span>
            <span class="cta-button__text">Star on GitHub</span>
            {#if githubRepoStars !== null}
              <span class="cta-button__count"
                >{githubRepoStars.toLocaleString()}</span
              >
            {/if}
          </a>
        </div>

        <section class="community-block">
          <h3>Join the community</h3>
          <p class="section-note">
            Suggest fixes in the map, or chat on Discord or Messenger if you
            want to help verify data.
          </p>
          <ul class="community-links">
            <li>
              <a
                href={UPLB_TOOLS_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-link">UPLB Tools</a
              >
            </li>
            <li>
              <CommunityPlatformLink
                brand="discord"
                href={DISCORD_URL}
                label="Discord"
              />
            </li>
            <li>
              <CommunityPlatformLink
                brand="messenger"
                href={MESSENGER_CONTRIBUTE_TARGET}
                label="Messenger (contribute)"
              />
            </li>
            <li>
              <CommunityPlatformLink
                brand="messenger"
                href={MESSENGER_MAINTAIN_TARGET}
                label="Maintainer chat"
              />
            </li>
          </ul>
        </section>

        <section class="inspiration-block">
          <h3>Inspiration &amp; similar tools</h3>
          <ul class="inspiration-links">
            <li>
              <a
                href="https://upsked.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-link">Upsked.com</a
              >
              by John Paul Poliquit
            </li>
            <li>
              <a
                href="https://uplb-trail.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-link">UPLB Trail</a
              >
              by Bernard Jezua Tandang
            </li>
            <li>
              <a
                href="https://chromewebstore.google.com/detail/amissu/mkdgckblaojfigmbnknehcmnjpkcehcj"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-link">AMISSU</a
              >
              by Garth Hendrich Lapitan
            </li>
          </ul>
        </section>
      </div>
    {/if}

    <div class="scroll-footer">
      {#if activeTab === "welcome"}
        <nav class="footer-links" aria-label="About Room TBA">
          <button type="button" class="footer-link" onclick={() => goTo("campus")}>
            Campus team
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" class="footer-link" onclick={() => goTo("how")}>
            How it works
          </button>
          <span aria-hidden="true">·</span>
          <a href="/privacy" class="footer-link">Privacy</a>
        </nav>
      {:else if activeTab === "campus"}
        <div class="footer-meta">
          <VisitorCounter />
          <GithubStarLink />
        </div>
        <p class="legal-hint">
          <a href="/privacy" class="inline-link">Privacy</a>
          ·
          <a href="/terms" class="inline-link">Terms</a>
        </p>
      {:else}
        <p class="legal-hint">
          <a href="/privacy" class="inline-link">Privacy</a>
          ·
          <a href="/terms" class="inline-link">Terms</a>
        </p>
      {/if}
    </div>
  </div>

  <footer class="actions">
    {#if installPrompt && !isInstalled}
      <button class="primary-btn install-btn" onclick={handleGetStarted}>
        <Download size={16} aria-hidden="true" />
        Install Room TBA
      </button>
    {:else}
      <button class="primary-btn" onclick={handleGetStarted}>Get Started</button
      >
    {/if}
  </footer>
</div>

<style>
  .landing-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1;
    min-height: 0;
    width: 100%;
    border-radius: inherit;
    background-color: white;
  }

  .landing-header {
    flex-shrink: 0;
  }

  .hero-image {
    background-image: url("/uplb-bg.webp");
    background-size: cover;
    background-position: center;
    display: flex;
  }

  .hero-overlay {
    background-color: rgba(123, 17, 19, 0.85);
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 0.25rem;
    color: white;
    padding: 0.75rem 1rem;
    min-height: 0;
  }

  .hero-overlay h2 {
    font-size: clamp(1.25rem, 3.5vw, 1.625rem);
    font-weight: 600;
    margin: 0;
    color: white;
    font-family: "Raleway", sans-serif;
    line-height: 1;
  }

  .hero-title {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .hero-logo {
    width: clamp(1.5rem, 4vw, 1.75rem);
    height: clamp(1.5rem, 4vw, 1.75rem);
    object-fit: contain;
  }

  .hero-tagline {
    font-size: 0.8125rem;
    margin: 0;
    font-weight: 500;
    max-width: 24rem;
    line-height: 1.35;
  }

  .tab-bar {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem 0.875rem 0;
    border-bottom: 1px solid hsl(0, 0%, 90%);
    background: hsl(0, 0%, 99%);
  }

  .tab-btn {
    flex: 1;
    min-width: 0;
    min-height: 2.75rem;
    border: none;
    background: transparent;
    color: hsl(0, 0%, 32%);
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.45rem 0.5rem;
    border-radius: 0.5rem 0.5rem 0 0;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab-btn.active {
    color: hsl(5, 53%, 28%);
    background: white;
    border-bottom-color: hsl(5, 53%, 35%);
  }

  .tab-btn:focus-visible {
    outline: 2px solid hsl(5, 53%, 35%);
    outline-offset: 1px;
  }

  .scroll-region {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 0.875rem 1rem 0.5rem;
  }

  .tab-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    max-width: 36rem;
    margin: 0 auto;
  }

  /* Lean welcome: lead with the core use, left-aligned rows (not boxed cards),
     then one deliberate donation card. */
  .welcome-lean {
    align-items: stretch;
    gap: 1rem;
    max-width: 30rem;
  }

  .core-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .core-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .core-list__icon {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.625rem;
    background: hsl(5, 45%, 95%);
    color: hsl(5, 60%, 32%);
  }

  .core-list__text {
    display: flex;
    flex-direction: column;
    gap: 0.0625rem;
    min-width: 0;
  }

  .core-list__label {
    font-size: 0.9375rem;
    font-weight: 650;
    color: hsl(5, 25%, 16%);
  }

  .core-list__sub {
    font-size: 0.8125rem;
    line-height: 1.4;
    color: hsl(0, 0%, 34%);
  }

  .donate-card {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    border: 1px solid hsl(5, 45%, 86%);
    border-radius: 0.875rem;
    background: hsl(5, 55%, 97%);
  }

  .donate-card__body {
    display: flex;
    flex-direction: column;
    gap: 0.1875rem;
    min-width: 0;
  }

  .donate-card__title {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    font-weight: 700;
    color: hsl(5, 55%, 30%);
  }

  .donate-card__note {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: hsl(5, 25%, 28%);
  }

  .donate-card__btn {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 0.625rem;
    background: hsl(5, 75%, 28%);
    color: #fff;
    font-size: 0.875rem;
    font-weight: 650;
    text-decoration: none;
    white-space: nowrap;
  }

  .donate-card__btn:hover {
    background: hsl(5, 75%, 22%);
  }

  .donate-card__btn:focus-visible {
    outline: 2px solid hsl(5, 75%, 22%);
    outline-offset: 2px;
  }

  .landing-back {
    position: absolute;
    top: 0.5rem;
    left: 0.625rem;
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    padding: 0.25rem 0.5rem 0.25rem 0.375rem;
    border: 0;
    border-radius: 0.5rem;
    background: hsl(0, 0%, 100%, 0.18);
    color: #fff;
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
  }

  .landing-back:hover {
    background: hsl(0, 0%, 100%, 0.28);
  }

  .landing-back:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  .footer-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: hsl(0, 0%, 45%);
  }

  .footer-link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    color: hsl(5, 53%, 32%);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .footer-link:hover {
    color: hsl(5, 53%, 24%);
  }

  .footer-link:focus-visible {
    outline: 2px solid hsl(5, 53%, 35%);
    outline-offset: 2px;
    border-radius: 0.25rem;
  }

  .people-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  .people-block h3 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 700;
    color: hsl(5, 53%, 28%);
  }

  .inspiration-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
  }

  .inspiration-block h3 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 700;
    color: hsl(5, 53%, 28%);
  }

  .inspiration-links {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 0.25rem;
    margin: 0;
    padding: 0;
    font-size: 0.8125rem;
    color: hsl(0, 0%, 30%);
  }

  .section-note {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.45;
    color: hsl(0, 0%, 30%);
    max-width: 28rem;
    text-align: center;
  }

  .inline-link {
    color: hsl(5, 53%, 32%);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .github-cta {
    margin: 1.25rem 0 0.5rem;
    padding: 1rem;
    background: hsl(0, 0%, 98%);
    border: 1px solid hsl(0, 0%, 90%);
    border-radius: 0.75rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    box-sizing: border-box;
  }

  .cta-text {
    margin: 0;
    font-size: 0.875rem;
    color: hsl(0, 0%, 25%);
    font-weight: 500;
  }

  .cta-button {
    display: inline-flex;
    align-items: center;
    background-color: #24292e;
    color: white;
    padding: 0.5rem 1.125rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-size: 0.9375rem;
    font-weight: 600;
    transition: background-color 0.2s ease;
  }

  .cta-button:hover {
    background-color: hsl(0, 0%, 12%);
  }

  .cta-button:active {
    background-color: hsl(0, 0%, 18%);
  }

  .cta-button__icon {
    margin-right: 0.5rem;
    font-size: 1.1em;
  }

  .cta-button__count {
    margin-left: 0.625rem;
    padding-left: 0.625rem;
    border-left: 1px solid rgba(255, 255, 255, 0.3);
    font-weight: 700;
  }

  .community-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
  }

  .community-block h3 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 700;
    color: hsl(5, 53%, 28%);
  }

  .community-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  .footer-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    justify-content: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.125rem 0 0.25rem;
  }

  .legal-hint {
    margin: 0;
    font-size: 0.75rem;
    color: hsl(0, 0%, 38%);
  }

  .scroll-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.625rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid hsl(0, 0%, 92%);
    width: 100%;
  }

  .actions {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.625rem;
    padding: 0.875rem 1rem 1rem;
    border-top: 1px solid hsl(0, 0%, 92%);
    background: white;
    width: 100%;
    box-sizing: border-box;
  }

  .primary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-radius: 0.5rem;
    min-height: 2.75rem;
    padding: 0.6875rem 1.75rem;
    font-size: 0.9375rem;
    font-weight: 700;
    cursor: pointer;
    background-color: hsl(5, 75%, 28%);
    color: white;
    border: none;
    box-shadow: 0 2px 4px rgba(123, 17, 19, 0.2);
    width: min(100%, 16rem);
    box-sizing: border-box;
  }

  .primary-btn:hover {
    background-color: hsl(5, 75%, 22%);
  }

  .primary-btn:focus-visible {
    outline: 2px solid hsl(5, 75%, 22%);
    outline-offset: 2px;
  }

  .install-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: hsl(5, 75%, 28%);
  }

  @media screen and (max-width: 48rem) {
    .scroll-region {
      padding: 0.75rem 0.875rem 0.375rem;
    }

    .actions {
      padding: 0.625rem 0.875rem 0.875rem;
    }

    /* Phones read the header as a title bar, not a splash screen: the tagline
       is the only pitch here, the rest are cards in the panel below. */
    .hero-overlay {
      padding: 0.5rem 0.875rem;
    }

    .tab-bar {
      padding-top: 0.25rem;
    }

    .hero-overlay.collapse-hero {
      padding: 0.5rem 0.875rem;
    }

    .hero-overlay.collapse-hero .hero-tagline {
      display: none;
    }
  }
</style>
