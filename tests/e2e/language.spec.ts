import { test, expect } from "@playwright/test";

test("switches language, preserves event data, and persists the preference", async ({ page }) => {
  await page.route("**/api/v1/settings**", (route) =>
    route.fulfill({
      json: {
        outlookStammordner: "Auftraege26",
        outlookJahresordner: [],
        jahresSites: [],
        outlookMailbox: null,
        outlookRootFolderId: null,
      },
    }),
  );
  await page.route("**/api/v1/events**", (route) =>
    route.fulfill({
      json: [
        {
          id: "e2",
          eventCode: "260820_demo_event",
          name: "Demo Event",
          status: "ZUGESAGT",
          startAt: "2026-08-30",
          endAt: "2026-08-30",
          location: "Linz",
          responsible: "Andi",
          participantForecast: 100,
          participantCurrent: null,
          notes: "",
          archived: false,
        },
      ],
    }),
  );
  await page.addInitScript(() => localStorage.removeItem("t2w-locale"));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Übersicht" })).toBeVisible();

  await page.getByRole("button", { name: "Englisch" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("t2w-locale"))).toBe("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "Events" })).toBeVisible();
  await expect(page.getByLabel("Tasks: In preparation")).toBeVisible();
  await expect(page.getByRole("link", { name: "Contacts & customers" })).toBeVisible();
  await expect(page.getByLabel("Offers: In preparation")).toBeVisible();
  await expect(page.getByLabel("Invoices: In preparation")).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.getByLabel("Status filtern")).toContainText("Confirmed");
  await expect(page.getByLabel("Status filtern")).toContainText("All statuses");
  await expect(page.locator("table").getByRole("link", { name: "Demo Event", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "German" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("link", { name: "Übersicht" })).toBeVisible();
});

test("loads the event detail page", async ({ page }) => {
  await page.route("**/api/v1/settings**", (route) =>
    route.fulfill({ json: { outlookJahresordner: [], jahresSites: [] } }),
  );
  await page.route("**/api/v1/events**", (route) =>
    route.fulfill({
      json: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          eventCode: "260820_demo_event",
          name: "Bestehendes Event",
          status: "ANFRAGE",
          startAt: "2026-08-20T00:00:00.000Z",
          endAt: "2026-08-20T00:00:00.000Z",
          location: "Wien",
          responsible: "Andi",
          participantForecast: 10,
          participantCurrent: null,
          notes: "",
          archived: false,
          organizer: { name: "Alter Veranstalter" },
          sport: null,
          outlookFolder: null,
          outlookWebUrl: null,
          sharepointFolder: null,
        },
      ],
    }),
  );
  await page.goto("/events/260820_demo_event");
  await expect(page.getByRole("tab", { name: "Stammdaten" })).toBeVisible({ timeout: 10000 });
  await page.goto("/events/260820_demo_event");
  await page.getByRole("button", { name: "Englisch" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("tab", { name: "STAMMDATEN" })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Basic data", { exact: true })).toBeVisible();
});

test("renders every application route in English", async ({ page }) => {
  test.setTimeout(60_000);
  await page.route("**/api/v1/settings**", (route) =>
    route.fulfill({ json: { outlookJahresordner: [], jahresSites: [] } }),
  );
  await page.route("**/api/v1/events**", (route) => route.fulfill({ json: [] }));
  const routes = [
    ["/", "Overview"],
    ["/veranstaltungen", "Events"],
    ["/kalender", "Calendar"],
    ["/aufgaben", "Tasks"],
    ["/kontakte", "Customers & contacts"],
    ["/angebote", "Offers"],
    ["/rechnungen", "Invoices"],
    ["/einstellungen", "Settings"],
    ["/gantt", "Events"],
    ["/styleguide", "Style guide"],
  ] as const;
  for (const [path, heading] of routes) {
    await page.goto(path);
    await page.getByRole("button", { name: "Englisch" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText(heading, { exact: true }).first()).toBeVisible({ timeout: 10000 });
  }
});
