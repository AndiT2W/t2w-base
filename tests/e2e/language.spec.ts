import { test, expect } from "@playwright/test";

test("switches language, preserves event data, and persists the preference", async ({ page }) => {
  await page.route("**/api/v1/settings**", (route) => route.fulfill({ json: { outlookStammordner: "Auftraege26", outlookJahresordner: [], jahresSites: [], outlookMailbox: null, outlookRootFolderId: null } }));
  await page.route("**/api/v1/events**", (route) => route.fulfill({ json: [{ id: "e2", eventCode: "260820_demo_event", name: "Demo Event", status: "ZUGESAGT", startAt: "2026-08-30", endAt: "2026-08-30", location: "Linz", responsible: "Andi", participantForecast: 100, participantCurrent: null, notes: "", archived: false }] }));
  await page.addInitScript(() => localStorage.removeItem("t2w-locale"));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Übersicht" })).toBeVisible();

  await page.getByRole("link", { name: "Englisch" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "Events" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tasks" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contacts" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Offers" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Invoices" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Calendar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Design variants" })).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.getByText("Demo Event")).toBeVisible();
  await page.getByRole("link", { name: "German" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("link", { name: "Übersicht" })).toBeVisible();
});

test("loads the event detail page", async ({ page }) => {
  await page.route("**/api/v1/settings", (route) =>
    route.fulfill({ json: { outlookJahresordner: [], jahresSites: [] } }),
  );
  await page.route("**/api/v1/events**", (route) =>
    route.fulfill({ json: [{ id: "11111111-1111-4111-8111-111111111111", eventCode: "260820_demo_event", name: "Bestehendes Event", status: "ANFRAGE", startAt: "2026-08-20T00:00:00.000Z", endAt: "2026-08-20T00:00:00.000Z", location: "Wien", responsible: "Andi", participantForecast: 10, participantCurrent: null, notes: "", archived: false, organizer: { name: "Alter Veranstalter" }, sport: null, outlookFolder: null, outlookWebUrl: null, sharepointFolder: null }] }),
  );
  await page.goto("/events/260820_demo_event");
  await expect(page.getByRole("tab", { name: "Stammdaten" })).toBeVisible({ timeout: 10000 });
  await page.goto("/events/260820_demo_event?locale=en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".lang-en-only", { hasText: "Basic data" }).first()).toBeVisible();
  await expect(page.locator(".lang-en-only", { hasText: "Contacts" }).first()).toBeVisible();
});
