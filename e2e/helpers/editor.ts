import { expect, type Page } from "@playwright/test";
import { expandDetailsSheet } from "./app";

type EntityKind = "building" | "dorm" | "room" | "event";

const EDITOR_TOGGLE: Record<EntityKind, RegExp> = {
  building: /edit building/i,
  dorm: /edit dorm/i,
  room: /edit room/i,
  event: /edit event/i,
};

export async function openEntityEditor(page: Page, kind: EntityKind) {
  await expandDetailsSheet(page);
  await page.getByRole("button", { name: EDITOR_TOGGLE[kind] }).click();
  await expect(page.locator(".entity-editor")).toBeVisible({ timeout: 10_000 });
  // Opening the editor drops the mobile sheet back to peek; re-expand.
  await expandDetailsSheet(page);
}

export async function expandEditorMoreFields(page: Page) {
  // Opening the editor can drop the mobile sheet back to peek; re-expand so
  // the disclosure is actually on screen before clicking it. isVisible()
  // returns immediately, so wait on attachment and only open closed ones.
  await expandDetailsSheet(page);
  const summary = page.locator("details.editor-advanced summary").first();
  const present = await summary
    .waitFor({ state: "attached", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  if (!present) return;
  const details = page.locator("details.editor-advanced").first();
  if ((await details.getAttribute("open")) === null) {
    await summary.scrollIntoViewIfNeeded();
    await summary.click();
    await expect(details).toHaveJSProperty("open", true);
  }
}

export async function fillAndSaveEditorField(
  page: Page,
  inputId: string,
  value: string,
) {
  const input = page.locator(`#${inputId}`);
  await input.scrollIntoViewIfNeeded();
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill(value);

  const row = page.locator(".editor-field").filter({ has: input });
  const save = row.getByRole("button", { name: /^save$/i });
  await expect(save).toBeEnabled({ timeout: 5_000 });
  const saveResponse = page.waitForResponse(
    (res) =>
      (res.request().method() === "PATCH" ||
        res.request().method() === "POST") &&
      /\/api\/admin\//.test(res.url()) &&
      res.status() >= 200 &&
      res.status() < 300,
    { timeout: 20_000 },
  );
  await save.click();
  await saveResponse;
  await expect(save).toBeDisabled({ timeout: 10_000 });
}
