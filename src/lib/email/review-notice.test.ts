import { describe, expect, it } from "vitest";
import { reviewRecipients } from "./review-notice";

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
