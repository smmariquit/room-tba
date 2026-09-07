import { test, expect } from "@playwright/test";
import { waitForAppBoot } from "../helpers/app";
import { openBuilding, openDorm, openEvent, openRoom } from "../helpers/search";

test.describe("side panel parity", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppBoot(page);
  });

  test("building panel header visible", async ({ page }) => {
    await openBuilding(page);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("room panel header visible", async ({ page }) => {
    await openRoom(page);
    await expect(page.getByText(/E2E-101/i).first()).toBeVisible();
  });

  test("dorm panel header visible", async ({ page }) => {
    await openDorm(page);
    await expect(page.getByText(/E2E Test Dorm/i).first()).toBeVisible();
  });

  test("event panel header visible", async ({ page }) => {
    await openEvent(page);
    await expect(page.getByText(/E2E Test Event/i).first()).toBeVisible();
  });

  test("building panel no horizontal overflow @mobile", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile only");
    await openBuilding(page);
    // Mobile shows details in the bottom sheet, desktop in the drawer card.
    const panel = page.locator(".drawer-card, .bottom-sheet").first();
    await expect(panel).toBeVisible();
    const overflow = await panel.evaluate(
      (el) => el.scrollWidth <= el.clientWidth + 2,
    );
    expect(overflow).toBe(true);
  });
});
