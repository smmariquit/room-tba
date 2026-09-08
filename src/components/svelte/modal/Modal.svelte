<script lang="ts">
  import { modalStore } from "@lib/store.svelte";
  import { MODAL_REGISTRY } from "@constants/modal-registry";
  import Dialog from "./Dialog.svelte";

  /**
   * Modal host. This file used to carry fifteen near-identical branches,
   * each with its own close button and a width picked by nested ternary.
   * It is now a lookup: the registry says what to render and how, Dialog
   * owns the shell. Adding a modal touches the registry only.
   */
  const entry = $derived(
    modalStore.open && modalStore.type
      ? MODAL_REGISTRY[modalStore.type]
      : undefined,
  );

  function closeDialog() {
    modalStore.closeModal();
  }
</script>

{#if entry}
  {@const Content = entry.component}
  <Dialog
    open={modalStore.open}
    onclose={closeDialog}
    size={entry.size}
    ariaLabel={entry.labelledBy ? undefined : entry.label}
    labelledBy={entry.labelledBy}
    closeLabel={entry.closeLabel ?? "Close dialog"}
    showClose={entry.showClose ?? true}
  >
    {#if entry.scroll}
      <div class="modal-scroll">
        <Content />
      </div>
    {:else}
      <Content />
    {/if}
  </Dialog>
{/if}

<style>
  .modal-scroll {
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 0.5rem 0.75rem 0.25rem;
  }
</style>
