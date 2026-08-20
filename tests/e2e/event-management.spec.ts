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
