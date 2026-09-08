import { test, expect } from "@playwright/test";
import { waitForAppBoot } from "../helpers/app";
import { openAppMenu } from "../helpers/map-tools";

test.describe("App Menu", () => {
  test("contributors exposes the core community entries", async ({ page }) => {
    await page.goto("/");
    await waitForAppBoot(page);

    const menu = await openAppMenu(page);
    await menu.locator("summary").filter({ hasText: "Community" }).click();
    await expect(
      menu.getByRole("button", { name: /leaderboard/i }),
    ).toBeVisible();
    await expect(
      menu.getByRole("button", { name: "Contributor sign in" }),
    ).toBeVisible();
  });

  test("opens the contributor leaderboard", async ({ page }) => {
    await page.goto("/");
    await waitForAppBoot(page);

    const menu = await openAppMenu(page);
    await menu.locator("summary").filter({ hasText: "Community" }).click();
    await menu.getByRole("button", { name: /leaderboard/i }).click();
    await expect(
      page.getByRole("dialog", { name: "Contributor leaderboard" }),
    ).toBeVisible();
  });

  test("What's new opens the full changelog in one click", async ({ page }) => {
    await page.goto("/");
    await waitForAppBoot(page);

    const menu = await openAppMenu(page);
    await menu.getByRole("button", { name: /what's new/i }).click();
    const modal = page.getByRole("dialog", { name: "What's new" });
    await expect(modal).toBeVisible();

    // The changelog content itself must render in the modal — no second
    // "Full changelog" click (#5). Expect several release headings.
    const versions = modal.getByRole("heading", { level: 3 });
    await expect(versions.first()).toHaveText(/^v\d+\.\d+\.\d+/);
    expect(await versions.count()).toBeGreaterThan(1);
  });

  test("shows the live presence counter", async ({ page }) => {
    await page.goto("/");
    await waitForAppBoot(page);
    const menu = await openAppMenu(page);
    // Renders "--" until the first heartbeat lands; either way the counter
    // must be mounted, it vanished silently in the Aug 2026 redesign.
    await expect(menu.locator(".online-counter")).toBeVisible();
  });

  test("Settings opens from the support section", async ({ page }) => {
    await page.goto("/");
    await waitForAppBoot(page);

    const menu = await openAppMenu(page);
    await menu.getByRole("button", { name: "Settings", exact: true }).click();
    const modal = page.getByRole("dialog", { name: "Settings" });
    await expect(modal).toBeVisible();
  });

  test("offline maps opens from the support section", async ({ page }) => {
    await page.goto("/");
    await waitForAppBoot(page);

    const menu = await openAppMenu(page);
    await menu.getByRole("button", { name: "Offline maps" }).click();
    await expect(
      page.getByRole("dialog", { name: "Offline maps" }),
    ).toBeVisible();
  });
});
