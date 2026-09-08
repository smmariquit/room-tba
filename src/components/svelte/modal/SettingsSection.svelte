<script lang="ts">
  import type { Snippet } from "svelte";

  /**
   * One settings card: a titled group of related controls with its own save.
   *
   * This is the shape every settings page the user already knows uses (GitHub,
   * Stripe, Vercel): a heading, a line saying what the group is for, the
   * fields, then the action for those fields in a footer of its own. Sharing
   * one component is what keeps them from drifting, which is how the account
   * modal ended up with the contributions list and the email flow both buried
   * inside the profile form.
   */
  type Props = {
    title: string;
    /** One line on what this group controls. Skip it when the title says it. */
    description?: string;
    /** Read-only facts about the section, e.g. the current email. */
    meta?: Snippet;
    children: Snippet;
    /** The action for these fields. Omitted by read-only sections. */
    footer?: Snippet;
    /** Destructive group: red frame, so it reads as a different kind of place. */
    danger?: boolean;
    labelledBy?: string;
  };

  let {
    title,
    description,
    meta,
    children,
    footer,
    danger = false,
    labelledBy,
  }: Props = $props();

  const fallbackId = `settings-section-${crypto.randomUUID()}`;
  const headingId = $derived(labelledBy ?? fallbackId);
</script>

<section
  class="settings-section"
  class:settings-section--danger={danger}
  aria-labelledby={headingId}
>
  <div class="settings-section__head">
    <h3 id={headingId} class="settings-section__title">{title}</h3>
    {#if description}
      <p class="settings-section__description">{description}</p>
    {/if}
    {#if meta}
      <div class="settings-section__meta">{@render meta()}</div>
    {/if}
  </div>

  <div class="settings-section__body entity-editor-form">
    {@render children()}
  </div>

  {#if footer}
    <div class="settings-section__footer">{@render footer()}</div>
  {/if}
</section>

<style>
  .settings-section {
    display: flex;
    flex-direction: column;
    border: 1px solid hsl(0, 0%, 90%);
    border-radius: 0.625rem;
    background: #fff;
    overflow: hidden;
  }

  .settings-section__head {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.875rem 1rem 0;
  }

  .settings-section__title {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 700;
    color: hsl(0, 0%, 12%);
  }

  .settings-section__description {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.45;
    color: hsl(0, 0%, 42%);
  }

  .settings-section__meta {
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    color: hsl(0, 0%, 30%);
  }

  .settings-section__body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
  }

  /* A body with nothing but a meta line above it would carry dead padding. */
  .settings-section__body:empty {
    display: none;
  }

  /* Tinted and separated so the save for this group cannot be mistaken for
     the save of the group below it. */
  .settings-section__footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border-top: 1px solid hsl(0, 0%, 92%);
    background: hsl(0, 0%, 98%);
  }

  .settings-section--danger {
    border-color: #edc9c9;
  }

  .settings-section--danger .settings-section__title {
    color: #8f1d1d;
  }

  .settings-section--danger .settings-section__footer {
    border-top-color: #f2d5d5;
    background: #fdf7f7;
  }
</style>
