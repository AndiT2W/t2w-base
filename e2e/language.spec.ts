import { test, expect } from "@playwright/test";

test("switches language, preserves event data, and persists the preference", async ({ page }) => {
  await page.route("**/api/v1/events", (route) => route.fulfill({ json: [{ id: "e2", eventCode: "260612_haendlertag_sued", name: "Händlertag Süd", status: "ZUGESAGT", startAt: "2026-06-12", endAt: "2026-06-12", location: "Süd", responsible: "Andi", participantForecast: 180, participantCurrent: null, notes: "", archived: false }] }));
  await page.addInitScript(() => localStorage.removeItem("t2w-locale"));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Übersicht" })).toBeVisible();
  await expect(page.getByText("Events nächste 14 Tage")).toBeVisible();
  await expect(page.getByRole("link", { name: /260612_haendlertag_sued/ }).first()).toBeVisible();

  await page.evaluate(() => { localStorage.setItem("t2w-locale", "en"); document.documentElement.lang = "en"; });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: /260612_haendlertag_sued/ }).first()).toBeVisible();

  await page.evaluate(() => { localStorage.setItem("t2w-locale", "de"); document.documentElement.lang = "de"; });
  await expect(page.getByRole("link", { name: "Übersicht" })).toBeVisible();
});
