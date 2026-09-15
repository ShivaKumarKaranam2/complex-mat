import { type Page, expect } from "@playwright/test";

import { ADMIN_MAIL_ID, ADMIN_PASSWORD } from "../playwright.config";

export { ADMIN_MAIL_ID, ADMIN_PASSWORD };

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Employee Mail ID").fill(ADMIN_MAIL_ID);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/calendar$/);
}
