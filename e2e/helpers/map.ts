import { expect, type Locator, type Page } from "@playwright/test";
import { expandDetailsSheet } from "./app";

const DRAG_DELTA_PX = 120;
const DRAG_STEPS = 16;

type MapEditEntity = "building" | "dorm";

const EDIT_ENTITY_BUTTON: Record<MapEditEntity, RegExp> = {
  building: /^Edit building$/i,
  dorm: /^Edit dorm$/i,
};

function entityMarker(page: Page, entityLabel: string): Locator {
  return page
    .locator(".maplibregl-marker")
    .filter({ has: page.locator(`[aria-label="${entityLabel}"]`) });
}

/** Collapse the entity details sheet so map pins are visible for drag. */
async function revealMapForPinDrag(page: Page) {
  // Desktop drawer handle and mobile bottom-sheet handle carry different
  // labels; either way, collapse an expanded details surface off the map.
  const collapse = page.getByRole("button", {
    name: /collapse details( panel)?/i,
  });
  const appeared = await collapse
    .waitFor({ state: "visible", timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (appeared && (await collapse.getAttribute("aria-expanded")) === "true") {
    await collapse.click();
    // Wait for the sheet/drawer to actually retract before dragging pins.
    await page
      .getByRole("button", { name: /expand details( panel)?/i })
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => {});
  }
}

async function isMobileViewport(page: Page) {
  return page.evaluate(() => window.matchMedia("(max-width: 48rem)").matches);
}

async function enableMapEditViaEditorShelf(page: Page) {
  const editorTools = page.getByRole("button", { name: /open editor tools/i });
  await editorTools.click({ timeout: 10_000 });

  const shelfRoot = page.getByRole("dialog", { name: "Editor tools" });
  await expect(shelfRoot).toBeVisible({ timeout: 10_000 });

  const mapEditToggle = shelfRoot.getByRole("button", {
    name: /turn (on|off) map edit/i,
  });
  if ((await mapEditToggle.getAttribute("aria-pressed")) !== "true") {
    await mapEditToggle.click();
    // Toggling map edit closes the editor tools dialog (EditorShelf onclose).
    await expect(shelfRoot).toBeHidden({ timeout: 10_000 });
  } else {
    await page.keyboard.press("Escape");
    await expect(shelfRoot).toBeHidden({ timeout: 10_000 });
  }
}

async function openEntityMapEditControls(page: Page, entity: MapEditEntity) {
  // At the mobile peek snap the editor's controls sit below the fold and
  // cannot scroll into the viewport; expand the sheet first.
  await expandDetailsSheet(page);
  const enableInPanel = page.getByRole("button", {
    name: /^Enable map edit$/i,
  });
  if (await enableInPanel.isVisible({ timeout: 1500 }).catch(() => false)) {
    return enableInPanel;
  }

  const editEntity = page.getByRole("button", {
    name: EDIT_ENTITY_BUTTON[entity],
  });
  const editVisible = await editEntity
    .waitFor({ state: "visible", timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (editVisible) {
    await editEntity.click();
    // Opening the editor drops the mobile sheet back to peek; re-expand so
    // the editor's map controls can actually enter the viewport.
    await expandDetailsSheet(page);
  }

  await expect(enableInPanel).toBeVisible({ timeout: 10_000 });
  return enableInPanel;
}

async function assertMapEditEnabled(page: Page) {
  if (await isMobileViewport(page)) {
    // Mobile uses the compact edit dock (undo/redo), not the desktop "Editing map" banner.
    await expect(
      page.getByRole("button", { name: /undo last pin move/i }),
    ).toBeVisible({ timeout: 15_000 });
    return;
  }

  const editingBanner = page.getByText("Editing map");
  const turnOffMapEdit = page.getByRole("button", {
    name: /turn off map edit/i,
  });
  await expect(editingBanner.or(turnOffMapEdit)).toBeVisible({
    timeout: 10_000,
  });
}

/** Enable map edit from the entity panel or editor shelf. */
export async function enableMapEdit(
  page: Page,
  entity: MapEditEntity = "building",
) {
  const enableInPanel = await openEntityMapEditControls(page, entity).catch(
    () => null,
  );
  if (enableInPanel) {
    await enableInPanel.click();
  } else {
    await enableMapEditViaEditorShelf(page);
  }

  await assertMapEditEnabled(page);
}

/** Wait until an entity pin is on the map (bootstrap + sync). */
export async function waitForEntityPin(page: Page, entityLabel: string) {
  await expect(page.locator(`[aria-label="${entityLabel}"]`)).toBeAttached({
    timeout: 60_000,
  });
}

async function dragMarkerLocator(page: Page, marker: Locator) {
  await marker.waitFor({ state: "attached", timeout: 20_000 });
  await marker.scrollIntoViewIfNeeded();
  const box = await marker.boundingBox();
  if (!box || box.width < 1 || box.height < 1) return false;

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const endX = startX + DRAG_DELTA_PX;
  const endY = startY + DRAG_DELTA_PX * 0.65;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: DRAG_STEPS });
  await page.mouse.up();
  return true;
}

/**
 * Drag a building/dorm pin by accessible label; returns whether PATCH 200 was observed.
 */
export async function dragEntityMapMarker(
  page: Page,
  entityLabel: string,
  patchUrlPart: string,
): Promise<boolean> {
  await revealMapForPinDrag(page);

  const patchPromise = page
    .waitForResponse(
      (res) =>
        res.request().method() === "PATCH" &&
        res.url().includes(patchUrlPart) &&
        res.status() === 200,
      { timeout: 30_000 },
    )
    .then(() => true)
    .catch(() => false);

  const marker = entityMarker(page, entityLabel);
  await expect(marker).toBeVisible({ timeout: 20_000 });
  const dragged = await dragMarkerLocator(page, marker);
  if (!dragged) return false;
  return patchPromise;
}

/** Assert pin drag persisted; fails the test instead of skipping. */
export async function expectPinDragSave(
  page: Page,
  entityLabel: string,
  patchUrlPart: string,
) {
  const saved = await dragEntityMapMarker(page, entityLabel, patchUrlPart);
  expect(saved, `Pin drag for ${entityLabel} did not trigger PATCH`).toBe(true);
}
