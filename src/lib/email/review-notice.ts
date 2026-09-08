import { adminUsersTable } from "@drizzle/schema";
import { db } from "@lib/db";
import { isResendConfigured, sendEmail } from "@lib/email/resend";
import { listDigestRecipients } from "@lib/services/digest-service";
import { eq } from "drizzle-orm";

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

type ReviewNoticeInput = {
  outcome: ReviewOutcome;
  entityLabel: string | null;
  submitterName: string | null;
  submitterUserId: number | null;
  reviewedBy: string;
  note?: string | null;
};

/**
 * Email the contributor about a review outcome, core team in CC. Best
 * effort: review actions must never fail because mail did (#nagger). A
 * contributor without an account email still triggers the core CC copy.
 */
export async function sendReviewNotice(input: ReviewNoticeInput) {
  if (!isResendConfigured()) return;
  try {
    let contributorEmail: string | null = null;
    if (input.submitterUserId) {
      const [row] = await db
        .select({ email: adminUsersTable.email })
        .from(adminUsersTable)
        .where(eq(adminUsersTable.id, input.submitterUserId));
      contributorEmail = row?.email?.trim() || null;
    }
    const core = await listDigestRecipients();
    const { to, cc } = reviewRecipients(contributorEmail, core);
    if (to.length === 0) return;

    const copy = OUTCOME_COPY[input.outcome];
    const label = input.entityLabel ?? "a map entry";
    const who = input.submitterName ?? "there";
    const noteBlock = input.note?.trim()
      ? `\n\nReviewer note:\n${input.note.trim()}`
      : "";
    const text = `Hi ${who},\n\n${copy.lead}\n\nEdit: ${label}\nReviewed by: ${input.reviewedBy}${noteBlock}\n\nSuggest more edits any time at https://room-tba.uplb.tools\n`;
    await sendEmail({
      to,
      cc,
      subject: `${copy.subject}: ${label}`,
      text,
    });
  } catch (err) {
    console.error("Review notice email failed:", err);
  }
}
