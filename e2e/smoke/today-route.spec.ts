import { test, expect, type Page } from "@playwright/test";
import { suppressLandingModal, waitForAppBoot } from "../helpers/app";
import { openAppMenu } from "../helpers/map-tools";
import { E2E_FIXTURES } from "../../scripts/e2e-reset-db";

// #839: one-tap day route from /today. Class matching runs against the seeded
// E2E classes (MWF, scripts/e2e-reset-db.ts), so the clock is pinned to a
// Monday inside the fixture term; OSRM is an external service, so the route
// fetch is mocked and the asserted totals derive from the mocked leg below.
const FIXED_MONDAY = new Date("2026-08-03T09:00:00+08:00");

const OSRM_DAY_ROUTE = {
  code: "Ok",
  routes: [
    {
      distance: 1200,
      duration: 900,
      // polyline5 of building coords → a point ~250 m north-east.
      geometry: "kumuAo|~bV_I{J",
      legs: [{ distance: 1200, duration: 900, steps: [], summary: "" }],
    },
  ],
  waypoints: [
    { location: [E2E_FIXTURES.buildingLon, E2E_FIXTURES.buildingLat] },
    { location: [121.2431, 14.1671] },
  ],
};

const PLANNER_SEED = JSON.stringify({
  v: 1,
  plans: [
    {
      id: "e2e-day-route",
      label: "A",
      termId: E2E_FIXTURES.termId,
      sections: [
        {
          courseCode: "E2E 101",
          section: "AB",
          type: "LEC",
          schedule: ["MWF 08:00AM-09:00AM"],
          roomCode: E2E_FIXTURES.roomCode,
          courseTitle: "E2E Course",
        },
        {
          courseCode: "E2E 102",
          section: "AB",
          type: "LEC",
          schedule: ["MWF 09:00AM-10:00AM"],
          roomCode: E2E_FIXTURES.roomCode,
          courseTitle: "E2E Course 2",
        },
      ],
    },
  ],
  activePlanIdByTerm: { [String(E2E_FIXTURES.termId)]: "e2e-day-route" },
});

async function prepareDayRoutePage(page: Page) {
  await page.clock.setFixedTime(FIXED_MONDAY);
  await page.route("**/routed-foot/**", (route) =>
    route.fulfill({ json: OSRM_DAY_ROUTE }),
  );
  await suppressLandingModal(page);
  await page.addInitScript(
    (planner) => localStorage.setItem("room-tba-planner", planner),
    PLANNER_SEED,
  );
}

async function waitForTodayScreen(page: Page) {
  const shell = page.locator("#app-loading-shell");
  if ((await shell.count()) > 0) {
    await shell.waitFor({ state: "detached", timeout: 120_000 });
  }
  return page.getByRole("dialog", { name: "Today" });
}

test.describe("today day route", () => {
  test("Route my day routes today's classes on the map and shows walking totals", async ({
    page,
  }) => {
    await prepareDayRoutePage(page);
    await page.goto("/today");
    const today = await waitForTodayScreen(page);
    await expect(today).toBeVisible();

    const routeButton = today.getByRole("button", { name: "Route my day" });
    await expect(routeButton).toBeEnabled();
    await routeButton.click();

    // Routing leaves the agenda so the map with the route is visible.
    await expect(today).toBeHidden({ timeout: 30_000 });
    await expect(page.locator(".schedule-route-stop-pin")).toHaveCount(2, {
      timeout: 15_000,
    });

    // Totals from the mocked OSRM legs surface back on the agenda screen.
    const menu = await openAppMenu(page);
    await menu.getByRole("button", { name: "Today" }).click();
    await expect(page.getByRole("dialog", { name: "Today" })).toBeVisible();
    await expect(page.getByText(/15 min walk\s*·\s*1\.2 km/)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Map tools routes today's classes from the map", async ({ page }) => {
    await prepareDayRoutePage(page);
    await page.goto("/");
    await waitForAppBoot(page);

    // The day route moved into the Map tools toolbox with the chrome
    // redesign. Hidden-not-disabled: the tool only exists with routable
    // classes today.
    await page.getByRole("button", { name: "Map tools" }).first().click();
    const tool = page.getByRole("button", { name: /Route my day/ });
    await expect(tool).toBeVisible({ timeout: 30_000 });
    await tool.click();
    await expect(page.locator(".schedule-route-stop-pin")).toHaveCount(2, {
      timeout: 30_000,
    });
  });

  test("/today?route=1 deep link routes the day on load", async ({ page }) => {
    await prepareDayRoutePage(page);
    await page.goto("/today?route=1");
    await waitForTodayScreen(page);

    // The agenda auto-routes and hands over to the map.
    await expect(page.getByRole("dialog", { name: "Today" })).toBeHidden({
      timeout: 30_000,
    });
    await expect(page.locator(".schedule-route-stop-pin")).toHaveCount(2, {
      timeout: 15_000,
    });
  });
});
