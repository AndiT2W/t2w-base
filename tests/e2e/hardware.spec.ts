import { test, expect } from "@playwright/test";
import { mockEventManagementApi } from "./support/event-management-api";

test("shows central hardware cases, filters them, and links to the event", async ({ page }) => {
  await page.route("**/api/v1/settings**", (route) =>
    route.fulfill({ json: { outlookJahresordner: [], jahresSites: [], outlookMailbox: null } }),
  );
  await page.route("**/api/v1/events**", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/v1/events/hardware**", (route) =>
    route.fulfill({
      json: [
        {
          id: "h1",
          recipientName: "Max Mustermann",
          issueType: "PARTICIPANT",
          objectName: "Active Transponder",
          objectNumberSingle: "T2W101",
          quantity: 1,
          status: "NOTIFIED",
          dueDate: "2026-09-12",
          event: { eventCode: "260820_demo_event", name: "Demo Event" },
        },
        {
          id: "h2",
          recipientName: "Timer XY",
          issueType: "RENTAL",
          objectName: "GPS Tracker",
          objectNumberPrefix: "T2W",
          objectNumberFrom: 1,
          objectNumberTo: 100,
          quantity: 100,
          status: "OPEN",
          dueDate: "2026-09-20",
          event: { eventCode: "270821_demo_event", name: "Zweites Event" },
        },
        {
          id: "h3",
          recipientName: "Ohne Event",
          issueType: "OTHER",
          objectName: "Unbekanntes Gerät",
          quantity: 1,
          status: "OPEN",
          event: null,
        },
      ],
    }),
  );
  await page.goto("/hardware");
  await expect(page.getByRole("heading", { name: "Hardware" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hardware-Ausgabe anlegen" })).toBeVisible();
  await page.getByRole("button", { name: "Hardware-Ausgabe anlegen" }).click();
  await expect(page.getByText("Hardware-Ausgabe anlegen", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("Max Mustermann")).toBeVisible();
  await expect(page.getByText("Timer XY")).toBeVisible();
  await expect(page.getByText("Kein Event zugeordnet")).toBeVisible();
  await page.getByPlaceholder("Event filtern …").fill("Zweites");
  await expect(page.getByText("Timer XY")).toBeVisible();
  await expect(page.getByText("Max Mustermann")).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Zweites Event" })).toHaveAttribute(
    "href",
    "/events/270821_demo_event",
  );
});

test("keeps the event detail page usable when hardware API returns an error payload", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.route("**/api/v1/events/*/hardware", (route) =>
    route.fulfill({ status: 500, json: { message: "Database unavailable" } }),
  );
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "HARDWARE" }).click();
  await expect(page.getByRole("button", { name: "Hardware-Ausgabe anlegen" })).toBeVisible();
  await expect(page.getByText("Diese Seite konnte nicht geladen werden")).not.toBeVisible();
});

test("manages hardware from the Event detail tab", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.route("**/api/v1/events/*/hardware", (route) => route.fulfill({ json: [] }));
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "HARDWARE" }).click();
  await expect(page.getByText("Ausgaben und Rückläufer dieses Events verwalten.")).toBeVisible();
  await page.getByRole("button", { name: "Hardware-Ausgabe anlegen" }).click();
  await page.getByPlaceholder("Empfänger").fill("Max Mustermann");
  await page.getByPlaceholder("Objekt").fill("Active Transponder");
  await page.route("**/api/v1/events/*/hardware", (route) =>
    route.fulfill({
      json: [
        {
          id: "h1",
          recipientName: "Max Mustermann",
          issueType: "PARTICIPANT",
          objectName: "Active Transponder",
          objectNumberType: "SINGLE",
          objectNumberSingle: "T2W101",
          quantity: 1,
          status: "OPEN",
          event: { eventCode: "260820_demo_event", name: "Bestehendes Event" },
        },
      ],
    }),
  );
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Max Mustermann")).toBeVisible();
});
