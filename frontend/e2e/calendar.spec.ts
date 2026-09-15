import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "./fixtures";

test.describe("Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("navigates between months", async ({ page }) => {
    const monthLabel = page.locator(".month-navigator h3");
    const initialLabel = await monthLabel.textContent();

    await page.getByLabel("Next month").click();
    await expect
      .poll(async () => monthLabel.textContent())
      .not.toBe(initialLabel);

    await page.getByLabel("Previous month").click();
    await expect.poll(async () => monthLabel.textContent()).toBe(initialLabel);
  });

  test("clicking a date (as Admin) opens Create Meeting prefilled with that date", async ({ page }) => {
    const dayCell = page.locator(".cal-day", { has: page.locator(".daynum", { hasText: /^1$/ }) }).first();
    await dayCell.click();

    await expect(page).toHaveURL(/\/meetings\/new\?date=/);
    const url = new URL(page.url());
    const date = url.searchParams.get("date");
    expect(date).toMatch(/^\d{4}-\d{2}-01$/);
    await expect(page.getByLabel("Date")).toHaveValue(date ?? "");
  });
});
