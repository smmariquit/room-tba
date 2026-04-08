<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";

  let { message, type = "info", onclose } = $props<{
    message: string;
    type?: "info" | "error" | "success";
    onclose: () => void;
  }>();

  onMount(() => {
    const timer = setTimeout(() => {
      onclose();
    }, 5000);
    return () => clearTimeout(timer);
  });
</script>

<div
  class="toast {type}"
  in:fly={{ y: 20, duration: 300 }}
  out:fade={{ duration: 200 }}
>
  <div class="icon">
    {#if type === "error"}
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    {:else if type === "success"}
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    {/if}
  </div>
  <div class="message">{message}</div>
  <button class="close-btn" onclick={onclose} aria-label="Close">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
</div>

<style>
  .toast {
    position: fixed;
    bottom: 7.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 280px;
    max-width: 90vw;
    pointer-events: auto;
  }

  .toast.error {
    border-left: 4px solid #ef4444;
    color: #b91c1c;
  }

  .toast.info {
    border-left: 4px solid #3b82f6;
    color: #1e40af;
  }

  .toast.success {
    border-left: 4px solid #10b981;
    color: #065f46;
  }

  .icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .message {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .close-btn {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: currentColor;
    opacity: 0.6;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
  }

  .close-btn:hover {
    opacity: 1;
  }

  @media (max-width: 640px) {
    .toast {
      bottom: 5rem;
      width: calc(100% - 2rem);
    }
  }
</style>
