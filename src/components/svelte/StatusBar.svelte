<script lang="ts">
  import { getAppData } from "../../lib/context";

  const { directionCount, totalRooms } = getAppData();
  let isOpen = $state(false);
</script>

<div class="status-bar" class:is-open={isOpen}>
  <button class="status-toggle" onclick={() => (isOpen = !isOpen)}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-info"
      ><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path
        d="M12 8h.01"
      /></svg
    >
    <span>Status</span>
  </button>

  <div class="content-wrapper">
    <div class="directions-progress">
      Rooms with directions
      <div class="progress-bar">
        <div
          class="progress-bar__value"
          data-value={Math.floor((directionCount / totalRooms) * 100)}
        ></div>
      </div>
      <div>
        {directionCount} / {totalRooms}
      </div>
    </div>
    <div class="metadata">
      <div class="data-updated">
        Data sourced from <strong>UPLB AMIS</strong>. Last updated:
        <strong>January 2026.</strong>
      </div>
      <div>Contributors</div>
      <div class="app-version">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-git-fork-icon lucide-git-fork"
          ><circle cx="12" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"
          ></circle><circle cx="18" cy="6" r="3"></circle><path
            d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"
          ></path><path d="M12 12v3"></path></svg
        >
        <div>v1.0.0</div>
      </div>
    </div>
  </div>
</div>

<style>
  * {
    pointer-events: auto;
  }
  div.status-bar {
    display: flex;
    font-size: 0.875rem;
    font-weight: 600;
    gap: 1rem;
    background-color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 2px 0.5rem 0 hsla(0, 0%, 0%, 0.2);
    transition: all 0.2s ease;

    .status-toggle {
      display: none;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      font: inherit;
      padding: 0;
      cursor: pointer;
    }

    .content-wrapper {
      display: flex;
      gap: 1rem;
      flex: 1;
    }

    .metadata {
      margin-left: auto;
      flex: 0 0 auto;
      display: flex;
      & > *:not(:last-child) {
        border-right: 2px solid #aaa;
        padding-right: 0.75rem;
      }
      & > *:not(:first-child) {
        padding-left: 0.75rem;
      }
    }
    .app-version {
      display: flex;
      gap: 0.25rem;
    }
    .data-updated {
      margin-left: auto;
    }
    .directions-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 1;

      .progress-bar {
        height: 0.75rem;
        flex: 1 0 0;
        border-radius: 0.5rem;
        background-color: #ddd;
        position: relative;
        .progress-bar__value {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background-color: #000;
          border-radius: 0.5rem;
          width: calc(attr(data-value number) * 1%);
        }
      }
    }
  }

  @media (max-width: 768px) {
    div.status-bar {
      padding: 0.5rem 1rem;
      flex-direction: column;
      max-width: calc(100% - 1rem);

      .status-toggle {
        display: flex;
      }

      .content-wrapper {
        display: none;
        flex-direction: column;
        gap: 0.75rem;
        padding-top: 0.5rem;
        border-top: 1px solid #eee;
        width: 100%;
      }

      &.is-open .content-wrapper {
        display: flex;
      }

      .directions-progress {
        width: 100%;
        justify-content: space-between;
      }

      .metadata {
        width: 100%;
        flex-direction: column;
        gap: 0.25rem;

        & > *:not(:last-child),
        & > *:not(:first-child) {
          border-right: none;
          padding: 0;
        }

        .data-updated {
          margin-left: 0;
          font-size: 0.75rem;
          color: #666;
        }

        .app-version {
          justify-content: flex-start;
          font-size: 0.75rem;
          opacity: 0.8;
        }
      }
    }
  }
</style>
