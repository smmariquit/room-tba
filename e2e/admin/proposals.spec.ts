import { test, expect } from "@playwright/test";
import { waitForAppBoot } from "../helpers/app";
import { loginAsContributor, loginAsEditor, logout } from "../helpers/users";
import { openRoom } from "../helpers/search";

test.describe("contributor proposals", () => {
  test("contributor can open suggest an edit on room", async ({ page }) => {
    await page.goto("/");
    await waitForAppBoot(page);
    await loginAsContributor(page);
    await openRoom(page);
    const suggest = page.getByRole("button", { name: /suggest an edit/i });
    await expect(suggest.first()).toBeVisible({ timeout: 10_000 });
    await logout(page);
  });

  test("contributor suggestion can be reviewed and published @desktop-only", async ({
    page,
  }) => {
    const marker = `QA-255 ${Date.now()}`;

    await page.goto("/");
    await waitForAppBoot(page);
    await loginAsContributor(page);
    await openRoom(page);

    await page
      .getByRole("button", { name: /suggest an edit/i })
      .first()
      .click();
    await page.getByLabel("Room directions").fill(marker);
    await page.getByRole("button", { name: "Submit suggestion" }).click();
    await expect(page.getByText(/submitted for review/i)).toBeVisible({
      timeout: 15_000,
    });

    await logout(page);
    await loginAsEditor(page);
    await page.getByRole("button", { name: /open editor tools/i }).click();
    await page.getByRole("button", { name: /review suggested edits/i }).click();

    const queue = page.getByRole("region", {
      name: "Edit proposals review queue",
    });
    // Rows start collapsed (#873) and keep their diff body out of the DOM, so
    // the marker is unmatchable until every row is opened.
    const summaries = queue.locator("li.entity-review-item summary");
    await expect(summaries.first()).toBeVisible({ timeout: 15_000 });
    for (let i = 0; i < (await summaries.count()); i += 1) {
      await summaries.nth(i).click();
    }

    const proposal = queue.locator("li.entity-review-item", {
      hasText: marker,
    });
    await expect(proposal).toBeVisible({ timeout: 15_000 });
    await expect(proposal.getByText(marker)).toBeVisible();
    await proposal.getByRole("button", { name: "Approve" }).click();
    await expect(proposal).toBeHidden({ timeout: 15_000 });

    // The shelf opens the review queue as a side panel now, so there is no
    // Close review button. Opening the room replaces the panel content.
    await openRoom(page);
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 });
    await logout(page);
  });
});
