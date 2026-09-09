import { render, screen, waitFor, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AccountSettingsModalHost from "@test/components/AccountSettingsModalHost.svelte";
import {
  expectNoHorizontalOverflow,
  mountAtWidth,
} from "@test/layout-assertions";
import { adminAuthStore } from "@lib/store.svelte";

const PROFILE = {
  username: "stimmie",
  displayName: "Stimmie",
  email: "stimmie@example.ph",
  role: "admin",
  hasPassword: true,
  linkedGoogle: false,
  avatarUrl: null,
  profileUrl: null,
  showInCredits: true,
};

function stubAccountApi(
  contributions: { id: number; entityLabel: string; createdAt: string }[] = [],
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/account/me")) {
        return new Response(JSON.stringify(PROFILE), { status: 200 });
      }
      if (url.includes("/api/contributions/mine")) {
        return new Response(JSON.stringify({ contributions }), { status: 200 });
      }
      return new Response("{}", { status: 404 });
    }),
  );
}

/**
 * The account modal used to be one flat scroll with the contributions list and
 * the email flow both nested inside the profile form, so it was never clear
 * which Save applied to what. Each concern is its own card now, with its own
 * action. These assert that grouping survives, since it is the whole point.
 */
describe("AccountSettingsModal", () => {
  beforeEach(() => {
    adminAuthStore.accountSettingsOpen = true;
  });

  test("groups settings into one card per concern", async () => {
    stubAccountApi();
    render(AccountSettingsModalHost);

    for (const section of [
      "Profile",
      "Email",
      "Password",
      "Connected accounts",
      "Your contributions",
      "Data and privacy",
    ]) {
      await waitFor(() =>
        expect(screen.getByRole("heading", { name: section })).toBeVisible(),
      );
    }
  });

  test("the contributions list is its own section, not part of the profile form", async () => {
    stubAccountApi([
      { id: 1, entityLabel: "Humanities Building", createdAt: "2026-08-01" },
    ]);
    render(AccountSettingsModalHost);

    const contributions = await screen.findByRole("region", {
      name: "Your contributions",
    });
    // The section renders as soon as the profile lands; the list arrives on
    // the second fetch, so wait for the row rather than the section.
    expect(
      await within(contributions).findByText("Humanities Building"),
    ).toBeVisible();

    const profile = screen.getByRole("region", { name: "Profile" });
    expect(
      within(profile).queryByText("Humanities Building"),
    ).not.toBeInTheDocument();
    // One save per card: the profile card owns exactly its own action.
    expect(
      within(profile).getByRole("button", { name: "Save profile" }),
    ).toBeVisible();
  });

  test("renders at 320px without horizontal overflow", async () => {
    mountAtWidth(320);
    stubAccountApi();
    const { container } = render(AccountSettingsModalHost);

    await screen.findByRole("heading", { name: "Profile" });
    expectNoHorizontalOverflow(container);
  });
});
