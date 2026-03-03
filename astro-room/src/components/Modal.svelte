<script lang="ts">
  import { currentRoomStore } from "../lib/store.svelte";
  import { fade, fly } from "svelte/transition";

  const { currentRoomStore: roomStore, closeModal } = currentRoomStore;
</script>

{#if roomStore.open}
  <div class="modal-set">
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      class="overlay"
      onclick={() => closeModal()}
      transition:fade={{ duration: 100 }}
    ></button>
    <div
      class="room-modal"
      in:fly={{
        duration: 200,
        delay: 50,
        y: 50,
      }}
      out:fade={{
        duration: 75,
      }}
    >
      {roomStore.roomData?.code}
    </div>
  </div>
{/if}

<style>
  .modal-set {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    padding: 0.75rem;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .room-modal {
    flex: 0 1 1024px;
    height: 75%;
    background-color: white;
    z-index: 3;
    border-radius: 1rem;
    padding: 1rem;
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
