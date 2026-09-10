import { test, expect } from "@playwright/test";
import { mockEventManagementApi } from "./support/event-management-api";

test("shows central hardware cases, filters them, and links to the event", async ({ page }) => {
  let lastEventChanges: Record<string, unknown> = {};
  const eventChanges: Record<string, unknown>[] = [];
  let lastUnassignedChanges: Record<string, unknown> = {};
  await page.route("**/api/v1/settings**", (route) =>
    route.fulfill({ json: { outlookJahresordner: [], jahresSites: [], outlookMailbox: null } }),
  );
  await page.route("**/api/v1/hardware-objects**", (route) =>
    route.fulfill({
      json: [
        { id: "hardware-1", name: "Active Transponder (T2W)", active: true },
        { id: "hardware-2", name: "GPS Tracker (T2W)", active: true },
        { id: "hardware-3", name: "Active Transponder (Lindinger)", active: true },
        { id: "hardware-4", name: "Active Transponder (BRV)", active: true },
      ],
    }),
  );
  for (const endpoint of ["sports", "event-roles", "services"]) {
    await page.route(`**/api/v1/${endpoint}**`, (route) => route.fulfill({ json: [] }));
  }
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
          email: "max@example.com",
          phone: "+43 660 123456",
          note: "Akkupack mitgeben",
          event: { id: "event-1", eventCode: "260820_demo_event", name: "Demo Event" },
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
  await page.route("**/api/v1/events/event-1/hardware/h1", async (route) => {
    const changes = route.request().postDataJSON() as Record<string, unknown>;
    lastEventChanges = changes;
    eventChanges.push(changes);
    await route.fulfill({
      json: {
        id: "h1",
        recipientName: "Max Mustermann",
        email: "max@example.com",
        issueType: "PARTICIPANT",
        objectName: "Active Transponder",
        quantity: 1,
        status: "NOTIFIED",
        dueDate: "2026-09-12",
        note: "Akkupack mitgeben",
        event: { id: "event-1", eventCode: "260820_demo_event", name: "Demo Event" },
        ...changes,
      },
    });
  });
  await page.route("**/api/v1/events/hardware/h3", async (route) => {
    const changes = route.request().postDataJSON() as Record<string, unknown>;
    lastUnassignedChanges = changes;
    await route.fulfill({
      json: {
        id: "h3",
        recipientName: "Ohne Event",
        issueType: "OTHER",
        objectName: "Unbekanntes Gerät",
        quantity: 1,
        status: "OPEN",
        event: null,
        ...changes,
      },
    });
  });
  await page.goto("/hardware");
  await expect(page.getByRole("heading", { name: "Hardware" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", {
      name: "TIME2WIN",
    }),
  ).toHaveAttribute("href", "/");
  await expect(page.getByRole("button", { name: "Hardware-Ausgabe anlegen" })).toBeVisible();
  await expect(page.getByText("Max Mustermann")).toBeVisible();
  await expect(page.getByText("max@example.com")).toBeVisible();
  await expect(page.getByText("+43 660 123456")).toBeVisible();
  await expect(page.getByText("Akkupack mitgeben")).toBeVisible();
  const hardwareRow = page.getByRole("row", { name: /Demo Event.*Max Mustermann/ });
  await hardwareRow.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Empfänger bearbeiten").fill("Max Mustermann aktualisiert");
  await page.getByLabel("Empfänger bearbeiten").press("Tab");
  await expect.poll(() => lastEventChanges.recipientName).toBe("Max Mustermann aktualisiert");
  await page.getByLabel("E-Mail bearbeiten").fill("neu@example.com");
  await page.getByLabel("E-Mail bearbeiten").press("Tab");
  await expect.poll(() => lastEventChanges.email).toBe("neu@example.com");
  const emailRequestsBeforeInvalidEmail = eventChanges.filter(
    (changes) => "email" in changes,
  ).length;
  await page.getByLabel("E-Mail bearbeiten").fill("keine-mail");
  await page.getByLabel("E-Mail bearbeiten").press("Tab");
  await expect(page.getByText("Bitte eine gültige E-Mail-Adresse angeben.")).toBeVisible();
  await expect(page.getByLabel("E-Mail bearbeiten")).toHaveAttribute("aria-invalid", "true");
  await page.waitForTimeout(100);
  expect(eventChanges.filter((changes) => "email" in changes)).toHaveLength(
    emailRequestsBeforeInvalidEmail,
  );
  await page.getByLabel("E-Mail bearbeiten").fill("gueltig@example.com");
  await page.getByLabel("E-Mail bearbeiten").press("Tab");
  await expect.poll(() => lastEventChanges.email).toBe("gueltig@example.com");
  await page.getByLabel("Telefon bearbeiten").fill("+43 660 999999");
  await page.getByLabel("Telefon bearbeiten").press("Tab");
  await expect.poll(() => lastEventChanges.phone).toBe("+43 660 999999");
  await page.getByLabel("Art bearbeiten").click();
  await page.getByRole("option", { name: "Verleih" }).click();
  await expect.poll(() => lastEventChanges.issueType).toBe("RENTAL");
  await page.getByLabel("Objekt bearbeiten").click();
  await page.getByRole("option", { name: "Active Transponder (Lindinger)" }).click();
  await expect.poll(() => lastEventChanges.objectName).toBe("Active Transponder (Lindinger)");
  await page.getByLabel("Nummer bearbeiten").fill("LINDI1066");
  await page.getByLabel("Nummer bearbeiten").press("Tab");
  await expect.poll(() => lastEventChanges.objectNumberSingle).toBe("LINDI1066");
  await page.getByLabel("Status bearbeiten").click();
  await page.getByRole("option", { name: "Offen" }).click();
  await expect.poll(() => lastEventChanges.status).toBe("OPEN");
  await page.getByLabel("Fälligkeit bearbeiten").fill("2026-09-30");
  await page.getByLabel("Fälligkeit bearbeiten").press("Tab");
  await expect.poll(() => lastEventChanges.dueDate).toBe("2026-09-30");
  await page.getByLabel("Kommentar bearbeiten").fill("Vor Ausgabe vollständig laden");
  await page.getByLabel("Kommentar bearbeiten").press("Tab");
  await expect.poll(() => lastEventChanges.note).toBe("Vor Ausgabe vollständig laden");
  await page.getByLabel("Event bearbeiten").click();
  await page.getByRole("option", { name: "Kein Event zugeordnet" }).click();
  await expect.poll(() => lastEventChanges.eventId).toBeNull();
  await page.getByRole("heading", { name: "Hardware" }).click();
  await expect(page.getByLabel("Telefon bearbeiten")).toHaveCount(0);
  await expect(page.getByText("Timer XY")).toBeVisible();
  const unassignedRow = page.getByRole("row", { name: /Kein Event zugeordnet.*Ohne Event/ });
  await unassignedRow.click();
  await page.getByLabel("Empfänger bearbeiten").fill("Ohne Event aktualisiert");
  await page.getByRole("heading", { name: "Hardware" }).click();
  await expect.poll(() => lastUnassignedChanges.recipientName).toBe("Ohne Event aktualisiert");
  await page.getByRole("textbox", { name: "Suche" }).first().fill("max@example.com");
  await expect(page.getByText("Max Mustermann")).toBeVisible();
  await page.getByRole("textbox", { name: "Suche" }).first().fill("");
  await page.getByRole("button", { name: "Spalten auswählen" }).click();
  await page.locator("label").filter({ hasText: "Telefon" }).click();
  await expect(page.getByRole("columnheader", { name: "Telefon sortieren" })).toHaveCount(0);
  await expect(page.getByText("Timer XY")).toBeVisible();
  await expect(page.getByText("Kein Event zugeordnet")).toBeVisible();
  await page.getByPlaceholder("Event filtern …").fill("Zweites");
  await expect(page.getByText("Timer XY")).toBeVisible();
  await expect(page.getByText("Max Mustermann")).not.toBeVisible();
  await page.getByRole("button", { name: "Filter zurücksetzen" }).click();
  await expect(page.getByText("Max Mustermann")).toBeVisible();
  await expect(page.getByRole("link", { name: "Zweites Event" })).toHaveAttribute(
    "href",
    "/events/270821_demo_event",
  );
});

test("keeps the event detail page usable when hardware API returns an error payload", async ({
  page,
}) => {
  await mockEventManagementApi(page);
  await page.route("**/api/v1/auth/**", (route) =>
    route.fulfill({ json: { id: "user-1", email: "admin@time2win.cloud", role: "ADMIN" } }),
  );
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
  await page.getByLabel("Objekt", { exact: true }).click();
  await page.getByRole("option", { name: "Active Transponder (T2W)" }).click();
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

test("creates a central hardware issue in the side sheet and keeps inline editing available", async ({
  page,
}) => {
  const created = {
    id: "created-hardware",
    recipientName: "Neue Ausgabe",
    issueType: "PARTICIPANT",
    objectName: "Active Transponder (T2W)",
    quantity: 1,
    status: "OPEN",
    event: { id: "event-1", eventCode: "260820_demo_event", name: "Demo Event" },
  };
  let hardware = [
    {
      id: "existing-hardware",
      recipientName: "Bestehende Ausgabe",
      issueType: "PARTICIPANT",
      objectName: "GPS Tracker (T2W)",
      quantity: 1,
      status: "OPEN",
      event: { id: "event-1", eventCode: "260820_demo_event", name: "Demo Event" },
    },
  ];
  await page.route("**/api/v1/settings**", (route) =>
    route.fulfill({ json: { outlookJahresordner: [], jahresSites: [], outlookMailbox: null } }),
  );
  await page.route("**/api/v1/hardware-objects**", (route) =>
    route.fulfill({
      json: [{ id: "hardware-1", name: "Active Transponder (T2W)", active: true }],
    }),
  );
  for (const endpoint of ["sports", "event-roles", "services"]) {
    await page.route(`**/api/v1/${endpoint}**`, (route) => route.fulfill({ json: [] }));
  }
  await page.route("**/api/v1/events**", (route) =>
    route.fulfill({
      json: [{ id: "event-1", eventCode: "260820_demo_event", name: "Demo Event" }],
    }),
  );
  await page.route("**/api/v1/events/hardware", (route) => route.fulfill({ json: hardware }));
  await page.route("**/api/v1/events/event-1/hardware", async (route) => {
    expect(route.request().method()).toBe("POST");
    hardware = [...hardware, created];
    await route.fulfill({ json: created });
  });

  await page.goto("/hardware");
  await page.getByRole("button", { name: "Hardware-Ausgabe anlegen" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Event zuordnen").click();
  await page.getByRole("option", { name: /Demo Event/ }).click();
  await page.getByLabel("Empfänger").fill("Neue Ausgabe");
  await page.getByLabel("Objekt").click();
  await page.getByRole("option", { name: "Active Transponder (T2W)" }).click();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Neue Ausgabe")).toBeVisible();
  await page.getByRole("row", { name: /Bestehende Ausgabe/ }).click();
  await expect(page.getByLabel("Empfänger bearbeiten")).toBeVisible();
});
