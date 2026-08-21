import { expect, test, type Page } from "@playwright/test";

const event = {
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
  sharepointFolder: null,
};

async function mockApi(page: Page) {
  const requests: { method: string; url: string; body?: string }[] = [];
  let settings = { outlookJahresordner: [], jahresSites: [{ jahr: "2026", url: "https://old.example.com/sites/old" }] };
  await page.route("**/api/v1/settings", async (route) => {
    const request = route.request();
    requests.push({ method: request.method(), url: request.url(), body: request.postData() ?? undefined });
    if (request.method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(settings) });
    if (request.method() === "PATCH") {
      settings = JSON.parse(request.postData() ?? "{}");
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(settings) });
    }
    return route.continue();
  });
  await page.route("**/api/v1/events**", async (route) => {
    const request = route.request();
    requests.push({ method: request.method(), url: request.url(), body: request.postData() ?? undefined });
    if (request.method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([event]) });
    if (request.method() === "POST") {
      const body = JSON.parse(request.postData() ?? "{}");
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ...event, id: "22222222-2222-4222-8222-222222222222", eventCode: body.eventCode, name: body.name, organizer: { name: body.organizerName } }) });
    }
    if (request.method() === "PATCH") {
      const body = JSON.parse(request.postData() ?? "{}");
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...event, organizer: { name: body.organizerName }, name: body.name }) });
    }
    return route.continue();
  });
  return requests;
}

test("zeigt Events aus der zentralen API in der Übersicht", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await expect(page.getByText("Bestehendes Event")).toBeVisible();
  await expect(page.getByText("Alter Veranstalter")).toBeVisible();
});

test("zeigt die kompakten Veranstaltungsansichten als Reiter", async ({ page }) => {
  await mockApi(page);
  await page.goto("/veranstaltungen");
  await expect(page.getByRole("navigation", { name: "Veranstaltungsansichten" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Liste" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("navigation", { name: "Veranstaltungsansichten" }).getByRole("link", { name: "Kalender" }).click();
  await expect(page).toHaveURL(/\/veranstaltungen\?ansicht=kalender(?:&q=)?$/);
  await expect(page.getByRole("heading", { name: "Veranstaltungen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kalender" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Veranstaltungsansichten" }).getByRole("link", { name: "Liste" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Veranstaltungsansichten" }).getByRole("link", { name: "Kalender" })).toHaveAttribute("aria-current", "page");
  await page.goto("/veranstaltungen?ansicht=gantt");
  await expect(page.getByRole("link", { name: "Gantt" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Bestehendes Event")).toBeVisible();
  await expect(page.getByText(/KW \d+/).first()).toBeVisible();
  await expect(page.locator(".border-b").filter({ hasText: /2026/ }).first()).toBeVisible();
});

test("pflegt Personen und Kunden im Menü Kunden & Kontakte", async ({ page }) => {
  let contacts = [{ id: "person-1", name: "Bestehender Kontakt", email: "alt@example.com", phone: "" }];
  let customers = [{ id: "customer-1", name: "Bestehender Kunde", uid: "ATU123", iban: "" }];
  await page.route("**/api/v1/contacts", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(contacts) });
    const body = JSON.parse(route.request().postData() ?? "{}"); contacts = [...contacts, { id: "person-2", ...body }];
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(contacts.at(-1)) });
  });
  await page.route("**/api/v1/organizers", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(customers) });
    const body = JSON.parse(route.request().postData() ?? "{}"); customers = [...customers, { id: "customer-2", ...body }];
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(customers.at(-1)) });
  });
  await page.route("**/api/v1/settings", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ outlookJahresordner: [], jahresSites: [] }) }));
  await page.route("**/api/v1/events", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) }));
  await page.goto("/kontakte");
  await expect(page.getByRole("heading", { name: "Kunden & Kontakte" })).toBeVisible();
  await expect(page.getByText("Marion Kessler")).toBeVisible();
  await page.getByRole("button", { name: "Neu anlegen" }).click();
  await page.getByLabel("Vorname").fill("Neue");
  await page.getByLabel("Nachname").fill("Person");
  await page.getByLabel("E-Mail").fill("neu@example.com");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Neue Person")).toBeVisible();
  await page.getByRole("button", { name: "Kunden (" }).click();
  await expect(page.getByText("Nordwerk GmbH")).toBeVisible();
  await page.getByRole("button", { name: "Neu anlegen" }).click();
  await page.getByLabel("Name").fill("Neue Kundin");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Neue Kundin")).toBeVisible();
});

test("verwendet in Veranstaltungen dieselbe schlanke Eventtabelle wie in der Übersicht", async ({ page }) => {
  await mockApi(page);
  await page.goto("/veranstaltungen");
  const table = page.locator("table");
  await expect(table).toBeVisible();
  await expect(table.locator("thead th")).toHaveCount(8);
  await expect(table.locator("thead")).toContainText("St");
  await expect(table.locator("thead")).toContainText("Aufg.");
  await expect(table.locator("[title='Outlook und SharePoint']")).toBeVisible();
  await expect(page.getByText("Bestehendes Event")).toBeVisible();
});

test("legt ein Event über POST an und öffnet den API-Datensatz", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/");
  await expect(page.getByText("Bestehendes Event")).toBeVisible();
  const openButton = page.getByRole("button", { name: "Event anlegen", exact: true }).first();
  await expect(openButton).toBeVisible();
  await openButton.click();
  await expect(page.getByText("Neues Event anlegen", { exact: true })).toBeVisible();
  await page.getByLabel(/Eventname/).fill("Neues E2E Event");
  await page.getByLabel("Veranstalter").fill("E2E Veranstalter");
  await page.getByLabel(/Startdatum/).fill("2026-08-21");
  const code = page.getByLabel("Eventcode-Vorschau");
  await expect(code).toHaveValue("260821_neues_e2e_event");
  await code.fill("260821_sondercode");
  await page.getByRole("button", { name: "Event anlegen" }).last().click();
  await expect(page).toHaveURL(/\/events\/260821_sondercode$/);
  await expect(page.getByText("Neues E2E Event")).toBeVisible();
  expect(requests.some((request) => request.method === "POST" && request.body?.includes("E2E Veranstalter"))).toBeTruthy();
});

test("speichert den Veranstalter der Detailseite über PATCH", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await page.getByLabel("Veranstalter").fill("Neuer E2E Veranstalter");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Änderungen gespeichert.")).toBeVisible();
  expect(requests.some((request) => request.method === "PATCH" && request.body?.includes("Neuer E2E Veranstalter"))).toBeTruthy();
});

test("zeigt die Unveränderlichkeit direkt am Eventcode-Feld", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await expect(page.getByText("Der Eventcode ist unveränderlich.", { exact: true })).not.toBeVisible();
  await expect(page.getByText("(unveränderlich)", { exact: true })).toBeVisible();
});

test("zeigt Outlook und SharePoint als Symbole in der Übersicht", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  const ordnerSpalte = page.locator("thead th").nth(6).locator("[title='Outlook und SharePoint']");
  await expect(ordnerSpalte).toHaveAttribute("title", "Outlook und SharePoint");
  await expect(page.getByLabel("Outlook: nicht verknüpft")).toBeVisible();
  await expect(page.getByLabel("SharePoint: nicht verknüpft")).toBeVisible();
});

test("zeigt den Eventcode in der Metadatenzeile des Events", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  const metadaten = page.locator("h1 + div");
  await expect(metadaten).toContainText("260820_demo_event");
  await expect(metadaten).toContainText("Alter Veranstalter");
  await expect(metadaten).toContainText("20.08.2026");
});

test("speichert Outlook- und SharePoint-Einstellungen persistent über PATCH", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/einstellungen");
  await page.getByRole("button", { name: "Outlook-Jahresordner hinzufügen" }).click();
  await page.getByLabel("Jahr").last().fill("2026");
  await page.getByLabel("Jahresordnername").fill("06_auftraege_26");
  await page.getByLabel("Site-URL").fill("https://example.sharepoint.com/sites/Auftraege26");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  expect(requests.some((request) => request.method === "PATCH" && request.url.endsWith("/api/v1/settings") && request.body?.includes("06_auftraege_26"))).toBeTruthy();
  await expect(page.getByText("Einstellungen gespeichert.")).toBeVisible();
});

test("synchronisiert ein Event mit dem konfigurierten Shared-Mailbox-Stammordner", async ({ page }) => {
  const requests: { method: string; url: string; body?: string }[] = [];
  const syncedEvent = {
    ...event,
    outlookFolder: "2026 / Q3 / 260820_demo_event",
    outlookWebUrl: "https://outlook.office.com/mail/",
    outlookMailbox: "info@time2win.at",
    outlookFolderSyncStatus: "SUCCESS",
    outlookFolderLastSuccessAt: "2026-08-21T12:00:00.000Z",
    outlookFolderLastError: null,
  };

  await page.route("**/api/v1/settings**", async (route) => {
    requests.push({ method: route.request().method(), url: route.request().url(), body: route.request().postData() ?? undefined });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        outlookJahresordner: [],
        jahresSites: [],
        outlookMailbox: "info@time2win.at",
        outlookJahresordner: [{ jahr: "2026", url: "06_auftraege_26" }],
      }),
    });
  });
  await page.route("**/api/v1/events**", async (route) => {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([event]) });
  });
  await page.route("**/api/v1/events/260820_demo_event*", async (route) => {
    const request = route.request();
    requests.push({ method: request.method(), url: request.url(), body: request.postData() ?? undefined });
    if (request.method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(event) });
    }
    return route.continue();
  });
  await page.route("**/api/v1/events/260820_demo_event/outlook-folder/sync", async (route) => {
    const request = route.request();
    requests.push({ method: request.method(), url: request.url(), body: request.postData() ?? undefined });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(syncedEvent) });
  });

  await page.goto("/einstellungen");
  await page.getByRole("tab", { name: "Outlook" }).click();
  await page.getByLabel("Outlook-Mailbox").fill("info@time2win.at");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Einstellungen gespeichert.")).toBeVisible();

  await page.goto("/events/260820_demo_event");
  await page.getByRole("button", { name: "Outlook-Ordner synchronisieren" }).click();
  await expect(page.getByText("Outlook-Ordner synchronisiert.")).toBeVisible();
  expect(requests.some((request) => request.method === "POST" && request.url.endsWith("/outlook-folder/sync"))).toBeTruthy();
});
