/** Pure review-notice formatting (no astro:env/db imports) so bun test can load it. */

export type ReviewOutcome = "approved" | "rejected" | "needs_changes";

const OUTCOME_COPY: Record<ReviewOutcome, { subject: string; lead: string }> = {
  approved: {
    subject: "Your Room TBA edit was approved",
    lead: "Your suggested edit is now live on the map. Thank you!",
  },
  rejected: {
    subject: "Your Room TBA edit was closed",
    lead: "Your suggested edit was closed by a reviewer.",
  },
  needs_changes: {
    subject: "Your Room TBA edit needs a small change",
    lead: "A reviewer looked at your suggested edit and asked for a change before it can go live.",
  },
};

/** Contributor gets To; core gets CC; no contributor email means core-only To. */
export function reviewRecipients(
  contributorEmail: string | null,
  core: string[],
): { to: string[]; cc: string[] } {
  if (!contributorEmail) return { to: core, cc: [] };
  return {
    to: [contributorEmail],
    cc: core.filter((e) => e !== contributorEmail),
  };
}

export type ReviewEmailInput = {
  outcome: ReviewOutcome;
  entityLabel: string | null;
  submitterName: string | null;
  reviewedBy: string;
  note?: string | null;
};

export function buildReviewEmail(input: ReviewEmailInput): {
  subject: string;
  text: string;
} {
  const copy = OUTCOME_COPY[input.outcome];
  const label = input.entityLabel ?? "a map entry";
  const who = input.submitterName ?? "there";
  const noteBlock = input.note?.trim()
    ? `\n\nReviewer note:\n${input.note.trim()}`
    : "";
  return {
    subject: `${copy.subject}: ${label}`,
    text: `Hi ${who},\n\n${copy.lead}\n\nEdit: ${label}\nReviewed by: ${input.reviewedBy}${noteBlock}\n\nSuggest more edits any time at https://room-tba.uplb.tools\n`,
  };
}
