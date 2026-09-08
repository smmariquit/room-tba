import { test, expect } from "@playwright/test";
import { campusSearchBox, waitForAppBoot } from "../helpers/app";
import { E2E_FIXTURES } from "../../scripts/e2e-reset-db";

test.describe("mobile search collapse", () => {
  test("app menu blur preserves query and panel @mobile", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await waitForAppBoot(page);

    // The redesigned mobile chrome layers the details sheet over the bottom
    // nav, so the old journey (entity open, then menu) no longer exists by
    // design. The regression this guards is the menu roundtrip wiping the
    // typed query, so type without committing a result.
    const search = campusSearchBox(page);
    await search.fill(E2E_FIXTURES.buildingName);
    await search.blur();

    await page.getByRole("button", { name: /app menu/i }).click();
    await expect(page.getByRole("dialog", { name: /app menu/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /app menu/i })).toBeHidden();

    await expect(search).toHaveValue(E2E_FIXTURES.buildingName);
    await search.click();
    await expect(
      page.getByRole("listbox", { name: /search suggestions/i }),
    ).toBeVisible();
  });
});
