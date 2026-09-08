import { adminUsersTable } from "@drizzle/schema";
import { db } from "@lib/db";
import { isResendConfigured, sendEmail } from "@lib/email/resend";
import {
  buildReviewEmail,
  type ReviewOutcome,
  reviewRecipients,
} from "@lib/email/review-notice-core";
import { listDigestRecipients } from "@lib/services/digest-service";
import { eq } from "drizzle-orm";

export type { ReviewOutcome } from "@lib/email/review-notice-core";

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
 *
 * The wording and the To/CC split live in review-notice-core so bun test can
 * load them: this file reaches astro:env/server through resend.ts, and that
 * import is what a unit test cannot resolve.
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

    const { subject, text } = buildReviewEmail(input);
    await sendEmail({ to, cc, subject, text });
  } catch (err) {
    console.error("Review notice email failed:", err);
  }
}
