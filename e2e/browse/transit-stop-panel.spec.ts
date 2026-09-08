import { expect, test } from "@playwright/test";
import { suppressLandingModal, waitForAppBoot } from "../helpers/app";

test.describe("transit stop deep link", () => {
  test("stop panel opens with edit affordance, and browsing away closes it @desktop-only", async ({
    page,
  }) => {
    await suppressLandingModal(page);
    await page.goto("/transit/e2e-route/e2e-stop");
    await waitForAppBoot(page);

    const stopPanel = page.locator(".jeepney-stop-panel");
    await expect(stopPanel).toBeVisible({ timeout: 30_000 });
    await expect(
      stopPanel.getByRole("heading", { name: "E2E Stop" }),
    ).toBeVisible();
    // DB-backed stops carry id/version, so the editor toggle must render.
    await expect(
      page.getByRole("button", { name: /suggest an edit|edit stop/i }),
    ).toBeVisible();

    // Regression: the jeepney deep link used to trip
    // effect_update_depth_exceeded during boot (camera moves inside the
    // reactive flush), killing the Svelte scheduler — clicks everywhere
    // stopped working while hover styles kept running. Browsing to another
    // sidebar tab must still close the stop panel.
    await page
      .getByRole("button", { name: "Class Buildings", exact: true })
      .click();
    await expect(stopPanel).toBeHidden({ timeout: 10_000 });
  });
});
