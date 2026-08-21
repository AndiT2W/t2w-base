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
  let settings = { outlookStammordner: "Auftraege26", outlookJahresordner: [], jahresSites: [{ jahr: "2026", url: "https://old.example.com/sites/old" }] };
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
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ...event, id: "22222222-2222-4222-8222-222222222222", eventCode: "260821_neues_event", name: body.name, organizer: { name: body.organizerName } }) });
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
  await expect(page).toHaveURL(/\/kalender$/);
  await expect(page.getByRole("heading", { name: "Kalender" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Veranstaltungsansichten" }).getByRole("link", { name: "Liste" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Veranstaltungsansichten" }).getByRole("link", { name: "Kalender" })).toHaveAttribute("aria-current", "page");
  await page.goto("/gantt");
  await expect(page.getByRole("link", { name: "Gantt" })).toHaveAttribute("aria-current", "page");
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
  await page.getByRole("button", { name: "Event anlegen" }).last().click();
  await expect(page).toHaveURL(/\/events\/260821_neues_event$/);
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
  await page.getByLabel("Fallback-Stammordner").fill("Auftraege");
  await page.getByLabel("Site-URL").fill("https://example.sharepoint.com/sites/Auftraege26");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  expect(requests.some((request) => request.method === "PATCH" && request.url.endsWith("/api/v1/settings") && request.body?.includes("Auftraege"))).toBeTruthy();
  await expect(page.getByText("Einstellungen gespeichert.")).toBeVisible();
});
