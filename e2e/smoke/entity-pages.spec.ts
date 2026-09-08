import { test, expect } from "@playwright/test";
import { campusSearchBox, waitForAppBoot } from "../helpers/app";
import {
  buildingPagePath,
  eventPagePath,
  roomPagePath,
} from "../helpers/search";
import { E2E_FIXTURES } from "../../scripts/e2e-reset-db";

test.describe("entity pages", () => {
  test("seeded building page 200", async ({ page }) => {
    const res = await page.goto(buildingPagePath());
    expect(res?.status()).toBeLessThan(400);
    // The SSR name is replaced when the client app takes over; assert the
    // rendered name after boot (panel + data load), not the transient SSR HTML.
    await waitForAppBoot(page);
    await expect(page.locator("body")).toContainText(
      E2E_FIXTURES.buildingName,
      {
        timeout: 30_000,
      },
    );
    await expect(page.locator("body")).toContainText("3D view", {
      timeout: 30_000,
    });
  });

  test("seeded room page 200", async ({ page }) => {
    const res = await page.goto(roomPagePath());
    expect(res?.status()).toBeLessThan(400);
    await waitForAppBoot(page);
    await expect(page.locator("body")).toContainText(E2E_FIXTURES.roomCode, {
      timeout: 30_000,
    });
    await expect(page.locator("body")).toContainText("Move in 3D", {
      timeout: 30_000,
    });
  });

  test("seeded event page 200", async ({ page }) => {
    const res = await page.goto(eventPagePath());
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toContainText(E2E_FIXTURES.eventTitle);
  });

  test("sitemap returns 200", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
  });
});

test.describe("landing", () => {
  test("Get Started dismisses modal", async ({ page }) => {
    await page.goto("/");
    const getStarted = page.getByRole("button", { name: "Get Started" });
    if (await getStarted.isVisible({ timeout: 3000 }).catch(() => false)) {
      await getStarted.click();
    }
    await expect(campusSearchBox(page)).toBeVisible();
  });

  test("auto-open marks the tour seen, so it stays closed after reload", async ({
    page,
  }) => {
    // The checkbox is gone: auto-opening the welcome tour now writes
    // hideLandingModal itself, once per browser.
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("hideLandingModal"));
    await page.reload();
    const getStarted = page.getByRole("button", { name: "Get Started" });
    if (await getStarted.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect
        .poll(() =>
          page.evaluate(() => localStorage.getItem("hideLandingModal")),
        )
        .toBe("true");
      await getStarted.click();
      await page.reload();
      await waitForAppBoot(page);
      await expect(getStarted).not.toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe("bootstrap", () => {
  test("map canvas loads after boot", async ({ page }) => {
    await page.goto("/");
    await waitForAppBoot(page);
    await expect(page.locator(".maplibregl-canvas")).toBeVisible({
      timeout: 20_000,
    });
  });
});
