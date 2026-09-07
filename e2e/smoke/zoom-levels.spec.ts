import { test, expect } from "@playwright/test";
import { campusSearchBox, waitForAppBoot } from "../helpers/app";
import { openCampusDirectory } from "../helpers/map-tools";

test("Layout remains functional at 150% zoom", async ({ page }) => {
  await page.goto("/");
  await waitForAppBoot(page);

  // Simulate 150% zoom (accessibility test)
  await page.evaluate(() => {
    (document.body.style as CSSStyleDeclaration & { zoom: string }).zoom =
      "1.5";
  });

  // Check if main UI elements are still accessible
  await expect(campusSearchBox(page)).toBeVisible();

  await openCampusDirectory(page, "buildings");
  await expect(
    page.locator(".side-panel-details h2, .bottom-sheet__body h2", {
      hasText: "Buildings",
    }),
  ).toBeVisible();
});
