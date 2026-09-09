import { describe, expect, it } from "vitest";
import { buildReviewEmail, reviewRecipients } from "./review-notice-core";

describe("reviewRecipients", () => {
  it("contributor in To, core in CC", () => {
    expect(reviewRecipients("a@x.ph", ["core@x.ph", "b@x.ph"])).toEqual({
      to: ["a@x.ph"],
      cc: ["core@x.ph", "b@x.ph"],
    });
  });
  it("core-only when contributor has no email", () => {
    expect(reviewRecipients(null, ["core@x.ph"])).toEqual({
      to: ["core@x.ph"],
      cc: [],
    });
  });
  it("never CCs the contributor to themselves", () => {
    expect(reviewRecipients("core@x.ph", ["core@x.ph", "b@x.ph"])).toEqual({
      to: ["core@x.ph"],
      cc: ["b@x.ph"],
    });
  });
});

describe("buildReviewEmail", () => {
  it("names the edit in the subject", () => {
    const { subject } = buildReviewEmail({
      outcome: "approved",
      entityLabel: "Humanities Building",
      submitterName: "Ana",
      reviewedBy: "stimmie",
    });
    expect(subject).toBe(
      "Your Room TBA edit was approved: Humanities Building",
    );
  });

  it("falls back to neutral wording when the contributor is anonymous", () => {
    const { subject, text } = buildReviewEmail({
      outcome: "rejected",
      entityLabel: null,
      submitterName: null,
      reviewedBy: "stimmie",
    });
    expect(subject).toContain("a map entry");
    expect(text).toContain("Hi there,");
  });

  it("includes a reviewer note only when one was written", () => {
    const withNote = buildReviewEmail({
      outcome: "needs_changes",
      entityLabel: "CAS Annex",
      submitterName: "Ana",
      reviewedBy: "stimmie",
      note: "  Room code looks like a typo.  ",
    });
    expect(withNote.text).toContain(
      "Reviewer note:\nRoom code looks like a typo.",
    );

    const blankNote = buildReviewEmail({
      outcome: "needs_changes",
      entityLabel: "CAS Annex",
      submitterName: "Ana",
      reviewedBy: "stimmie",
      note: "   ",
    });
    expect(blankNote.text).not.toContain("Reviewer note:");
  });
});
