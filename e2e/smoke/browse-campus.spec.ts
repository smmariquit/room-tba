import { test, expect } from "@playwright/test";
import { waitForAppBoot } from "../helpers/app";
import { openCampusDirectory } from "../helpers/map-tools";

test("Campus directory controls open browse panels", async ({ page }) => {
  await page.goto("/");
  await waitForAppBoot(page);

  await openCampusDirectory(page, "classes");

  await expect(
    page.locator(".side-panel-details h2, .bottom-sheet__body h2", {
      hasText: "All classes",
    }),
  ).toBeVisible();

  await openCampusDirectory(page, "buildings");

  await expect(
    page.locator(".side-panel-details h2, .bottom-sheet__body h2", {
      hasText: "Buildings",
    }),
  ).toBeVisible();
});
