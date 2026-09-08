import { expect, test } from "@playwright/test";

/**
 * Registering the service worker precaches the whole app (~10 MB across 87
 * files at the time of writing). That is right for the map and wrong for a
 * wiki article someone reached from a search result, so src/pwa.ts registers
 * only where <html data-app-page="true"> says the app actually mounts.
 *
 * The attribute is the contract between the layout and that module. Assert it
 * rather than the worker itself: whether a worker registers at all depends on
 * how the preview build was produced, but this flag is what decides it.
 */
test.describe("service worker scope", () => {
  test("content pages do not opt into the service worker", async ({ page }) => {
    for (const path of ["/wiki", "/faq", "/privacy", "/changelog"]) {
      await page.goto(path);
      await expect(
        page.locator("html"),
        `${path} should not be marked as an app page`,
      ).not.toHaveAttribute("data-app-page", "true");
    }
  });

  test("the map app still opts in", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-app-page", "true");
  });
});
