import { test, expect, type Page } from "@playwright/test";
import { waitForAppBoot } from "../helpers/app";

// Today, the academic calendar and every App-menu destination lost their only
// entry point when the rail Sidebar stopped rendering and AppMenu was commented
// out of StatusBar (#930, #951). Nothing caught it because no blocking spec
// opens the App menu at all. These assert arrangement and reachability, not box
// geometry: #893 shipped a regression past a suite that only measured widths.

async function openMenu(page: Page) {
  const trigger = page.getByRole("button", { name: /^app menu$/i });
  await page.keyboard.press("Escape");
  await trigger.click({ force: true });
  const panel = page.getByRole("dialog", { name: /^app menu$/i });
  await expect(panel).toBeVisible();
  return panel;
}

for (const viewport of [
  { name: "desktop", width: 1512, height: 900 },
  { name: "mobile", width: 320, height: 780 },
]) {
  test.describe(`app menu reachability (${viewport.name})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");
      await waitForAppBoot(page);
    });

    test("opens fully on screen", async ({ page }) => {
      const panel = await openMenu(page);
      const box = await panel.boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      // The panel anchors upward from a bottom bar and downward from the top
      // bar; a fixed anchor throws it off one edge or the other.
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    });

    test("reaches Today", async ({ page }) => {
      const panel = await openMenu(page);
      await panel.getByRole("button", { name: /^today$/i }).click();
      await expect(page.getByRole("heading", { name: /^today$/i })).toBeVisible(
        { timeout: 10_000 },
      );
    });

    test("reaches the academic calendar", async ({ page }) => {
      const panel = await openMenu(page);
      await panel.getByRole("button", { name: /^academic calendar$/i }).click();
      await expect(
        page.getByRole("heading", { name: /academic calendar/i }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("reaches the leaderboard, coverage and changelog", async ({
      page,
    }) => {
      const panel = await openMenu(page);
      // Leaderboard lives under the collapsed community disclosure now.
      await panel.getByText("Community & project links").click();
      await expect(
        panel.getByRole("button", { name: /^leaderboard$/i }),
      ).toBeVisible();
      await expect(
        panel.getByRole("button", { name: /campus data coverage/i }),
      ).toBeVisible();
      await expect(
        panel.getByRole("button", { name: /what's new/i }),
      ).toBeVisible();
    });

    test("reaches sign in", async ({ page }) => {
      const panel = await openMenu(page);
      await expect(
        panel.getByRole("button", { name: /contributor sign in/i }),
      ).toBeVisible();
    });
  });
}

test.describe("desktop top bar", () => {
  test("sits flush against the top edge", async ({ page }) => {
    await page.setViewportSize({ width: 1512, height: 900 });
    await page.goto("/");
    await waitForAppBoot(page);

    const box = await page.locator(".desktop-top-bar").boundingBox();
    expect(box).not.toBeNull();
    // --staging-banner-gap used to apply even with no banner to clear, which
    // left an 8px strip of map above the bar on production.
    expect(box?.y).toBe(0);
  });

  test("keeps the compass, which mobile does not render", async ({ page }) => {
    await page.setViewportSize({ width: 1512, height: 900 });
    await page.goto("/");
    await waitForAppBoot(page);
    await expect(page.getByRole("button", { name: /north/i })).toBeVisible();

    await page.setViewportSize({ width: 320, height: 780 });
    await expect(page.getByRole("button", { name: /north/i })).toHaveCount(0);
  });
});
