<script lang="ts">
  import { modalStore } from "../../../lib/store.svelte";
  import { contributors, developers } from "../../../constants/contributors";

  let dontShowAgain = $state(false);

  function handleGetStarted() {
    if (dontShowAgain) {
      localStorage.setItem("hideLandingModal", "true");
    }
    modalStore.closeModal();
  }
</script>

<div class="landing-content">
  <div class="hero-image">
    <div class="hero-overlay">
      <h2>Room TBA</h2>
      <p>"Saan sa UPLB ang ___?" Finally answered.</p>
    </div>
  </div>

  <div class="content-body">
    <div class="description-container">
      <p class="description">
        Room TBA is an open-source website built to help UPLB students find
        their rooms across the Los Baños campus.
      </p>
      <a
        href="https://github.com/smmariquit/room-tba"
        target="_blank"
        rel="noopener noreferrer"
        class="github-link"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-github"
        >
          <path
            d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.18-.38 6.5-1.5 6.5-7a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5.5 3.3 6.6 6.5 7a4.8 4.8 0 0 0-1 3.02V22"
          ></path>
        </svg>
        View on GitHub
      </a>
    </div>
    <div class="people-sections">
      <div class="developers-section">
        <h3>Developers</h3>
        <div class="developers-list">
          {#each developers as { name, href }}
            {@const img_url = name.toLowerCase().split(" ").join("-")}
            {#if href}
              <a
                class="developers-profile tooltip"
                {href}
                target="_blank"
                data-tooltip={name}
              >
                <img
                  src={`/developers/${img_url}.png`}
                  alt={name}
                  title={name}
                  onerror={(event) =>
                    ((event.currentTarget as HTMLImageElement).src =
                      "/profile.svg")}
                />
                <div class="name">{name}</div>
              </a>
            {:else}
              <div class="developers-profile tooltip" data-tooltip={name}>
                <img
                  src={`/developers/${img_url}.png`}
                  alt={name}
                  title={name}
                  onerror={(event) =>
                    ((event.currentTarget as HTMLImageElement).src =
                      "/profile.svg")}
                />
                <div class="name">{name}</div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
      <div class="contributors-section">
        <h3>Contributors</h3>
        <div class="contributors-list">
          {#each contributors as { name, href }}
            {@const img_url = name.toLowerCase().split(" ").join("-")}
            {#if href}
              <a
                class="contributor-profile tooltip"
                {href}
                target="_blank"
                data-tooltip={name}
              >
                <img
                  src={`/contributors/${img_url}.png`}
                  alt={name}
                  title={name}
                  onerror={(event) =>
                    ((event.currentTarget as HTMLImageElement).src =
                      "/profile.svg")}
                />
                <div class="name">{name}</div>
              </a>
            {:else}
              <div class="contributor-profile tooltip" data-tooltip={name}>
                <img
                  src={`/contributors/${img_url}.png`}
                  alt={name}
                  title={name}
                  onerror={(event) =>
                    ((event.currentTarget as HTMLImageElement).src =
                      "/profile.svg")}
                />
                <div class="name">{name}</div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="primary-btn" onclick={handleGetStarted}>
        Get Started
      </button>
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={dontShowAgain} />
        Don't show again
      </label>
    </div>
  </div>
</div>

<style>
  .landing-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    border-radius: inherit;
    background-color: white;
  }
  .hero-image {
    background-image: url("/uplb-bg.webp");
    background-size: cover;
    background-position: center;
    position: relative;
    min-height: 16rem;
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
    gap: 0.5rem;
    color: white;
    padding: 2rem;
  }
  .hero-overlay h2 {
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
    color: white;
  }
  .hero-overlay p {
    font-size: 1rem;
    margin: 0;
    font-weight: 500;
  }
  .content-body {
    padding: 1.5rem 2rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
  }
  .description-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .description {
    font-size: 0.9375rem;
    color: #4a4a4a;
    line-height: 1.5;
    margin: 0;
    max-width: 28rem;
  }
  .github-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: #333;
    font-weight: 600;
    text-decoration: none;
    padding: 0.375rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }
  .github-link:hover {
    background-color: #f5f5f5;
    border-color: #bbb;
  }
  .contributors-section h3,
  .developers-section h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    color: #333;
    font-weight: 600;
  }
  .people-sections {
    width: 100%;
    max-width: 48rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }
  .contributors-section,
  .developers-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .contributors-list,
  .developers-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    max-width: 30rem;
  }
  .contributor-profile,
  .developers-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    text-decoration: none;
    color: inherit;
  }
  .contributor-profile img,
  .developers-profile img {
    width: 2.25rem;
    height: 2.25rem;
    border: 1px solid #ccc;
    border-radius: 50%;
    object-fit: cover;
    background-color: #f5f5f5;
    overflow: hidden;
  }

  .contributor-profile .name,
  .developers-profile .name {
    font-size: 0.65rem;
    font-weight: 500;
    max-width: 3.5rem;
    text-align: center;
    line-height: 1.1;
    display: none;
  }

  .tooltip {
    position: relative;
    outline: unset;
  }
  .tooltip::before {
    content: attr(data-tooltip);
    position: absolute;
    top: 0;
    left: 50%;
    translate: -50% calc(-1 * (100% + 8px));
    padding: 0.2rem 0.4rem;
    background-color: hsla(0, 0%, 10%, 0.8);
    color: white;
    border-radius: 6px;
    pointer-events: none;
    opacity: 0;
    width: max-content;
    transition: opacity 0.125s;
    font-size: 0.75rem;
    z-index: 50;
  }
  .tooltip::after {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    pointer-events: none;
    translate: -50% -100%;
    border-width: 4px;
    border-style: solid;
    opacity: 0;
    transition: opacity 0.125s;
    border-color: hsla(0, 0%, 10%, 0.8) transparent transparent transparent;
    z-index: 50;
  }
  .tooltip:is(:hover, :focus)::before,
  .tooltip:is(:hover, :focus)::after {
    opacity: 1;
  }

  @media screen and (max-width: 768px) {
    .people-sections {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    /* .contributor-profile .name,
    .developers-profile .name {
      display: block;
    }
    .tooltip::after,
    .tooltip::before {
      display: none;
    } */
    .hero-image {
      min-height: 12rem;
    }
    .hero-overlay {
      padding: 1.5rem 1rem;
    }
    /* .hero-overlay h2 {
      font-size: 1.5rem;
    } */
    .content-body {
      padding: 1rem;
      gap: 1rem;
    }
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.25rem;
  }
  .primary-btn {
    background-color: #7b1113;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition:
      background-color 0.2s,
      transform 0.1s;
    box-shadow: 0 2px 4px rgba(123, 17, 19, 0.2);
  }
  .primary-btn:hover {
    background-color: #5a0c0e;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(123, 17, 19, 0.3);
  }
  .primary-btn:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(123, 17, 19, 0.2);
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #4a4a4a;
    cursor: pointer;
    user-select: none;
  }
  .checkbox-label input[type="checkbox"] {
    cursor: pointer;
    width: 1rem;
    height: 1rem;
    accent-color: #7b1113;
  }
</style>
