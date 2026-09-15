import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "./fixtures";

test.describe("Meeting creation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("Admin creates a meeting and is taken to its details page", async ({ page }) => {
    const title = `E2E Sync ${Date.now()}`;
    const date = new Date().toISOString().slice(0, 10);

    await page.goto(`/meetings/new?date=${date}`);
    await expect(page.getByRole("heading", { name: "Create Meeting", level: 3 })).toBeVisible();

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Time").fill("14:00");
    await page.getByLabel("Agenda / Notes").fill("Discuss E2E coverage.");
    await page.getByRole("button", { name: "Save Meeting" }).click();

    await expect(page).toHaveURL(/\/meetings\/\d+$/);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("Discuss E2E coverage.")).toBeVisible();
  });

  test("shows a validation error when the title is missing", async ({ page }) => {
    const date = new Date().toISOString().slice(0, 10);
    await page.goto(`/meetings/new?date=${date}`);

    await page.getByRole("button", { name: "Save Meeting" }).click();

    await expect(page.getByRole("alert")).toHaveText("Title is required.");
    await expect(page).toHaveURL(/\/meetings\/new/);
  });

  test("a non-admin cannot reach Create Meeting", async ({ page }) => {
    // Simulate a Team Member session client-side; RequireAdmin should redirect away.
    await page.evaluate(() => {
      const session = JSON.parse(sessionStorage.getItem("mat.session") ?? "null");
      if (session) {
        session.user.role = "TEAM_MEMBER";
        sessionStorage.setItem("mat.session", JSON.stringify(session));
      }
    });
    await page.goto("/meetings/new");
    await expect(page).toHaveURL(/\/calendar$/);
  });
});
