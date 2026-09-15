import { expect, test } from "@playwright/test";

import { ADMIN_MAIL_ID, ADMIN_PASSWORD, loginAsAdmin } from "./fixtures";

test.describe("Authentication", () => {
  test("redirects an unauthenticated user to /login", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows an error for incorrect credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Employee Mail ID").fill(ADMIN_MAIL_ID);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("alert")).toHaveText("Incorrect Employee Mail ID or Password.");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logs the admin in and lands on the calendar", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByLabel("Previous month")).toBeVisible();
  });

  test("redirects an authenticated user away from /login", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/calendar$/);
  });

  test("credentials do not carry over to a fresh browser context", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/calendar");
    await expect(page).toHaveURL(/\/login$/);
    await context.close();
  });
});
