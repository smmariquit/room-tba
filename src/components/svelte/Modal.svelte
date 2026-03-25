<script lang="ts">
  import { modalStore } from "../../lib/store.svelte";
  import { fade, fly } from "svelte/transition";
  import RoomModalContent from "./RoomModalContent.svelte";
  import FilterModalContent from "./FilterModalContent.svelte";
</script>

{#if modalStore.open}
  <div class="modal-set">
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      class="overlay"
      onclick={() => modalStore.closeModal()}
      transition:fade={{ duration: 100 }}
    ></button>
    <div
      class="modal-content"
      id="modal-content"
      in:fly={{
        duration: 200,
        delay: 50,
        y: 50,
      }}
      out:fade={{
        duration: 75,
      }}
    >
      <!-- {#if modalStore.type === "room-details"}
        <RoomModalContent />
      {:else}
        <FilterModalContent />
      {/if} -->
    </div>
  </div>
{/if}

<style>
  :global(hr) {
    margin: 1rem 0;
    border-width: 2px;
    border-color: hsl(0, 0%, 90%);
    border-style: solid;
  }
  :global(mark) {
    background-color: hsl(5, 53%, 90%);
  }
  .modal-set {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    padding: 0.75rem;
    width: 100%;
    height: 100dvh;
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }
  .modal-content {
    flex: 0 1 64rem;
    max-height: 90dvh;
    background-color: white;
    z-index: inherit;
    border-radius: 1rem;
    padding: 1.5rem;
    display: flex;
    flex-flow: column nowrap;
  }
  @media only screen and (max-width: 31.25rem) {
    .modal-content {
      padding: 1rem;
    }
  }
  .overlay {
    all: unset;
    width: 100%;
    height: 100%;
    inset: 0;
    position: absolute;
    inset: 0;
    background-color: hsla(0, 0%, 0%, 0.2);
  }
</style>
