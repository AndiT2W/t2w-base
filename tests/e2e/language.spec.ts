import { test, expect } from "@playwright/test";

test("switches language, preserves event data, and persists the preference", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("t2w-locale"));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Übersicht" })).toBeVisible();

  await page.getByRole("link", { name: "Englisch" }).click();
  await page.goto("/?locale=en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "Events" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tasks" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contacts" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Offers" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Invoices" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Calendar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Design variants" })).toBeVisible();
  await expect(page.getByRole("link", { name: "English" })).toBeVisible();

  await page.goto("/events/260612_haendlertag_sued?locale=en");
  await expect(page.getByText("Basic data")).toBeVisible();
  await expect(page.getByText("Contacts")).toBeVisible();
  await expect(page.getByText("Tasks")).toBeVisible();
  await expect(page.getByText("Files")).toBeVisible();
  await expect(page.getByText("Communication")).toBeVisible();

  await page.goto("/?locale=de");
  await page.getByRole("link", { name: "Deutsch" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("link", { name: "Übersicht" })).toBeVisible();
});
