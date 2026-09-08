import type { Locator, Page } from "@playwright/test";
// (Locator used by clickIfAppears below.)

export function campusSearchBox(page: Page): Locator {
  return page.getByRole("searchbox", { name: /search campus/i });
}

/** Skip landing modal auto-open for this browser context (call before first goto). */
export async function suppressLandingModal(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("hideLandingModal", "true");
    } catch {
      // ignore private mode / blocked storage
    }
  });
}

export async function dismissLandingIfPresent(page: Page) {
  await page.evaluate(() => {
    try {
      localStorage.setItem("hideLandingModal", "true");
    } catch {
      // ignore
    }
  });

  const getStarted = page.getByRole("button", { name: "Get Started" });
  if (await getStarted.isVisible({ timeout: 5000 }).catch(() => false)) {
    await getStarted.click();
  }

  const closeDialog = page.getByRole("button", { name: "Close dialog" });
  if (await closeDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeDialog.click();
  }

  const modal = page.locator(".modal-set");
  await modal.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});
}

/** Wait until map chrome is interactive (loading shell gone, search ready). */
export async function waitForAppBoot(page: Page, timeout = 120_000) {
  await dismissLandingIfPresent(page);

  const shell = page.locator("#app-loading-shell");
  if ((await shell.count()) > 0) {
    await shell.waitFor({ state: "detached", timeout });
  }

  await dismissLandingIfPresent(page);

  // Search is present in every map mode. The retired term chip was removed
  // from the chrome, so it must not gate the entire E2E suite.
  // Do not focus it: since the Aug 2026 chrome redesign a focused search
  // hides the map filter chips, which broke every browse test that opened
  // a directory right after boot.
  const search = campusSearchBox(page);
  await search.waitFor({ state: "visible", timeout: 30_000 });
}

/** Wait briefly for a locator, then click it. False if it never showed.
 * isVisible() ignores its timeout and reports instantly, which silently
 * skipped steps mid-render; always gate optional clicks on waitFor. */
export async function clickIfAppears(
  locator: Locator,
  timeout = 3000,
): Promise<boolean> {
  const appeared = await locator
    .waitFor({ state: "visible", timeout })
    .then(() => true)
    .catch(() => false);
  if (appeared) await locator.click();
  return appeared;
}

/** Mobile details live in a bottom sheet; expand it so panel content is
 * reachable. Panel-identity changes snap the sheet back to peek right after
 * a toggle lands, so retry until the expanded label sticks. */
export async function expandDetailsSheet(page: Page) {
  const expand = page.getByRole("button", {
    name: "Expand details",
    exact: true,
  });
  const collapse = page.getByRole("button", {
    name: "Collapse details",
    exact: true,
  });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!(await clickIfAppears(expand, attempt === 0 ? 2000 : 500))) return;
    const expanded = await collapse
      .waitFor({ state: "visible", timeout: 1500 })
      .then(() => true)
      .catch(() => false);
    if (expanded) {
      // Give any pending peek-reset effect a beat, then confirm it held.
      await page.waitForTimeout(400);
      if (await collapse.isVisible().catch(() => false)) return;
    }
  }
}

export async function gotoHome(page: Page) {
  await suppressLandingModal(page);
  await page.goto("/");
}
