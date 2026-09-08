import { test, expect } from "@playwright/test";
import { suppressLandingModal } from "../helpers/app";

// /calendar is a deep link that must open the Academic Calendar screen
// directly. Same trap set as /planner and /final-exams: bare island props,
// trailing slash, SW denylist (see planner-route.spec.ts). Full-screen
// dialog, so wait on the loading shell detaching rather than waitForAppBoot
// (which needs the map).
async function waitForScreenBoot(page: import("@playwright/test").Page) {
  const shell = page.locator("#app-loading-shell");
  if ((await shell.count()) > 0) {
    await shell.waitFor({ state: "detached", timeout: 120_000 });
  }
}

test.describe("academic calendar route", () => {
  test("/calendar opens the Academic Calendar screen", async ({ page }) => {
    await suppressLandingModal(page);
    await page.goto("/calendar");
    await waitForScreenBoot(page);

    const dialog = page.getByRole("dialog", { name: "Academic Calendar" });
    await expect(dialog).toBeVisible();
    // Disclaimer is part of the MVP acceptance criteria (#408).
    await expect(
      dialog.getByText(/official UPLB academic calendar/),
    ).toBeVisible();
    // The seeded E2E term (1252) must appear as a term card. Cards are
    // native disclosures and only the in-session term starts open, so
    // expand the seeded term's card before asserting its CRS id.
    const card = dialog.locator("details.acal-card", {
      hasText: "CRS 1252",
    });
    await expect(card).toHaveCount(1);
    if (!(await card.getByText("CRS 1252").isVisible())) {
      await card.locator("summary").click();
    }
    await expect(card.getByText("CRS 1252")).toBeVisible();
    await expect(page).toHaveURL(/\/calendar(\/|\?|$)/);
  });
});
