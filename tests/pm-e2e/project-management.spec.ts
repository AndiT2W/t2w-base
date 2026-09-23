import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID, scryptSync } from "node:crypto";
const prisma = new PrismaClient({ datasourceUrl: process.env.PM_TEST_DATABASE_URL });
const email = `pm-browser-${randomUUID()}@test.invalid`,
  password = "browser-test-only";
test.beforeAll(async () => {
  if (!process.env.PM_TEST_DATABASE_URL?.includes("pm_"))
    throw new Error("Set PM_TEST_DATABASE_URL to an isolated pm_ test database.");
  await prisma.user.create({
    data: {
      email,
      displayName: "Browser Admin",
      role: "ADMIN",
      passwordHash: `test:${scryptSync(password, "test", 64).toString("hex")}`,
    },
  });
});
test.afterAll(() => prisma.$disconnect());
async function fixture(page: Page) {
  expect(
    (await page.request.post("/api/v1/auth/login", { data: { email, password } })).ok(),
  ).toBeTruthy();
  const response = await page.request.post("/api/v1/events", {
    data: {
      name: `PM Browser ${randomUUID().slice(0, 8)}`,
      eventCode: `PM-${randomUUID()}`,
      startAt: "2026-09-20T08:00:00Z",
      endAt: "2026-09-20T18:00:00Z",
    },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}
async function create(page: Page, eventId: string, title: string) {
  const state = await (await page.request.get(`/api/v1/pm/events/${eventId}`)).json();
  const response = await page.request.post(`/api/v1/pm/events/${eventId}/commands`, {
    data: { type: "create", graphVersion: state.event.pmGraphVersion, task: { title } },
  });
  expect(response.ok()).toBeTruthy();
  const next = await response.json();
  expect(next.affectedTaskId).toEqual(expect.any(String));
  return next.tasks.find((task: { id: string }) => task.id === next.affectedTaskId);
}

test("keeps a duplicate-title Aufgabe selected after creation and reload", async ({ page }) => {
  await fixture(page);
  const title = `Doppelte Aufgabe ${randomUUID().slice(0, 6)}`;

  await page.goto("/aufgaben");
  await page
    .locator("header")
    .getByRole("button", { name: "Globale Aufgabe", exact: true })
    .click();
  await page.getByLabel("Titel").fill(title);
  await page.getByRole("button", { name: "Aufgabe anlegen" }).click();
  await page.getByLabel("Beschreibung").fill("Erste gleichnamige Aufgabe");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await page.getByRole("button", { name: "Detail schließen" }).click();
  await expect(page.getByRole("dialog", { name: "Aufgabe bearbeiten" })).toHaveCount(0);

  await page
    .locator("header")
    .getByRole("button", { name: "Globale Aufgabe", exact: true })
    .click();
  await page.getByLabel("Titel").fill(title);
  await page.getByRole("button", { name: "Aufgabe anlegen" }).click();
  await expect(page.getByLabel("Beschreibung")).toHaveValue("");
  await page.getByLabel("Beschreibung").fill("Zweite gleichnamige Aufgabe");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await page.reload();
  await expect(page.getByTestId("task-overview").getByText(title, { exact: true })).toHaveCount(2);
});
test("keeps categories closed, expands the sequential table and blocks premature completion", async ({
  page,
}) => {
  const event = await fixture(page);
  const suffix = randomUUID().slice(0, 6),
    designTitle = `Startnummerndesign einholen ${suffix}`,
    setupTitle = `Startnummerndesign einrichten ${suffix}`,
    printTitle = `Startnummern drucken ${suffix}`;
  const design = await create(page, event.id, designTitle);
  let setup = await create(page, event.id, setupTitle);
  let state = await (await page.request.get(`/api/v1/pm/events/${event.id}`)).json();
  let response = await page.request.post(`/api/v1/pm/events/${event.id}/commands`, {
    data: {
      type: "add-dependency",
      graphVersion: state.event.pmGraphVersion,
      taskId: setup.id,
      taskVersion: setup.version,
      predecessorId: design.id,
    },
  });
  expect(response.ok()).toBeTruthy();
  const print = await create(page, event.id, printTitle);
  state = await (await page.request.get(`/api/v1/pm/events/${event.id}`)).json();
  setup = state.tasks.find((task: { id: string }) => task.id === setup.id);
  response = await page.request.post(`/api/v1/pm/events/${event.id}/commands`, {
    data: {
      type: "add-dependency",
      graphVersion: state.event.pmGraphVersion,
      taskId: print.id,
      taskVersion: print.version,
      predecessorId: setup.id,
    },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto(`/events/${event.eventCode}?tab=aufgaben`);
  const planning = page.getByRole("region", { name: "Projektmanagement" });
  await expect(planning).toBeVisible();
  await expect(planning.getByRole("table")).toHaveCount(0);
  const category = planning.getByRole("button", { name: /Ohne Kategorie.*warten auf Vorgänger/ });
  await category.click();
  await expect(planning).toContainText(printTitle);
  await planning.getByRole("button", { name: printTitle }).click();
  await expect(page.getByRole("dialog", { name: "Aufgabe bearbeiten" })).toContainText(setupTitle);
  await page.getByLabel("Beschreibung").fill("Freigabe: https://example.test/print");
  await page.getByRole("textbox", { name: "Start", exact: true }).fill("2026-09-15");
  await page.getByRole("textbox", { name: "Ende", exact: true }).fill("2026-09-18");
  await expect(page.getByLabel("Beschreibung")).toHaveValue(/example\.test/);
});
test("shows dependent and independent category tasks separately", async ({ page }) => {
  const event = await fixture(page);
  const suffix = randomUUID().slice(0, 6),
    designTitle = `Startnummerndesign einrichten ${suffix}`,
    printTitle = `Startnummern drucken ${suffix}`,
    allocationTitle = `Startnummernzuteilung ${suffix}`;
  const design = await create(page, event.id, designTitle);
  const print = await create(page, event.id, printTitle);
  await create(page, event.id, allocationTitle);
  const state = await (await page.request.get(`/api/v1/pm/events/${event.id}`)).json();
  const response = await page.request.post(`/api/v1/pm/events/${event.id}/commands`, {
    data: {
      type: "add-dependency",
      graphVersion: state.event.pmGraphVersion,
      taskId: print.id,
      taskVersion: print.version,
      predecessorId: design.id,
    },
  });
  expect(response.ok()).toBeTruthy();

  await page.goto(`/events/${event.eventCode}?tab=aufgaben`);
  const planning = page.getByRole("region", { name: "Projektmanagement" });
  await planning.getByRole("button", { name: /Ohne Kategorie/ }).click();
  await expect(
    planning.getByRole("button", { name: new RegExp(`^${designTitle} `) }),
  ).toBeVisible();
  await expect(planning.getByRole("button", { name: new RegExp(`^${printTitle} `) })).toBeVisible();
  await expect(planning.getByRole("table", { name: /Aufgaben ohne Vorgänger/ })).toContainText(
    allocationTitle,
  );
  await expect(planning.getByRole("table", { name: /Aufgaben ohne Vorgänger/ })).not.toContainText(
    printTitle,
  );
});
test("creates a successor as one intent and keeps the draft after a conflict", async ({ page }) => {
  const event = await fixture(page);
  const first = await create(page, event.id, "Briefing vorbereiten");
  const last = await create(page, event.id, "Briefing freigeben");
  const beforeLink = await (await page.request.get(`/api/v1/pm/events/${event.id}`)).json();
  const linked = await page.request.post(`/api/v1/pm/events/${event.id}/commands`, {
    data: {
      type: "add-dependency",
      graphVersion: beforeLink.event.pmGraphVersion,
      taskId: last.id,
      taskVersion: last.version,
      predecessorId: first.id,
    },
  });
  expect(linked.ok()).toBeTruthy();

  await page.goto(`/events/${event.eventCode}?tab=aufgaben`);
  await page.getByRole("button", { name: /Ohne Kategorie/ }).click();
  await page.getByRole("button", { name: "Nachfolger", exact: true }).click();
  const input = page.getByLabel("Nachfolger von Briefing freigeben");
  const title = `Druck beauftragen ${randomUUID().slice(0, 6)}`;
  await input.fill(title);

  let rejected = false;
  await page.route(`**/api/v1/pm/events/${event.id}/commands`, async (route) => {
    if (!rejected && route.request().postDataJSON()?.type === "create-successor") {
      rejected = true;
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ message: "Event wurde geändert. Aktuellen Stand laden." }),
      });
      return;
    }
    await route.continue();
  });
  await input.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Event wurde geändert");
  await expect(input).toHaveValue(title);
  expect(
    (await (await page.request.get(`/api/v1/pm/events/${event.id}`)).json()).tasks,
  ).toHaveLength(2);

  await input.press("Enter");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.reload();
  const state = await (await page.request.get(`/api/v1/pm/events/${event.id}`)).json();
  const successor = state.tasks.find((task: { title: string }) => task.title === title);
  expect(successor).toBeTruthy();
  expect(state.edges).toContainEqual({ predecessorId: last.id, successorId: successor.id });
});
test("keeps an Event Task detail editable from the Event and combined planning views", async ({
  page,
}) => {
  const event = await fixture(page);
  const title = `Gemeinsames Detail ${randomUUID().slice(0, 6)}`;
  const detail = "Freigabe für beide Planungsansichten";
  await create(page, event.id, title);

  await page.goto(`/events/${event.eventCode}?tab=aufgaben`);
  await page.getByRole("button", { name: /Ohne Kategorie/ }).click();
  await page.getByRole("table").getByRole("button", { name: title }).click();
  await page.getByLabel("Beschreibung").fill(detail);
  await page.getByRole("button", { name: "Änderungen speichern" }).click();

  await page.goto("/aufgaben");
  const taskOverview = page.getByTestId("task-overview");
  await taskOverview.getByRole("button", { name: new RegExp(title) }).click();
  await expect(page.getByLabel("Beschreibung")).toHaveValue(detail);

  await page.getByLabel("Kommentar").fill("Im gemeinsamen Detail ergänzt.");
  await page.getByRole("button", { name: "Kommentieren" }).click();
  await expect(page.getByText("Im gemeinsamen Detail ergänzt.")).toBeVisible();
  await page.reload();
  await taskOverview.getByRole("button", { name: new RegExp(title) }).click();
  await expect(page.getByText("Im gemeinsamen Detail ergänzt.")).toBeVisible();
});

test("projects canonical Event tasks into the Event list after reload", async ({ page }) => {
  const event = await fixture(page);
  const title = `Readiness ${randomUUID().slice(0, 6)}`;
  await create(page, event.id, title);

  const record = await page.request.get(`/api/v1/events/${event.id}`);
  expect(record.ok()).toBeTruthy();
  await expect(record.json()).resolves.toMatchObject({
    taskReadiness: { openCount: 1, overdueCount: 0 },
  });

  await page.goto("/veranstaltungen");
  const row = page.getByRole("row").filter({ hasText: event.name });
  await expect(row).toContainText("1");
});
test("groups the combined overview by event and category, then retains filters and Gantt", async ({
  page,
}) => {
  const event = await fixture(page);
  await create(page, event.id, "Event-Aufgabe");
  const categoryName = `Hardware Kategorie ${randomUUID().slice(0, 6)}`;
  const category = await page.request.post("/api/v1/pm/groups", {
    data: { name: categoryName, active: true, sortOrder: 1 },
  });
  expect(category.ok()).toBeTruthy();
  const group = await category.json();
  const globalTitle = `Globale Planung ${randomUUID().slice(0, 6)}`;
  const global = await page.request.post("/api/v1/pm/commands", {
    data: {
      type: "create",
      task: {
        title: globalTitle,
        startDate: "2026-09-15",
        endDate: "2026-09-24",
        priority: "HIGH",
        groupId: group.id,
      },
    },
  });
  expect(global.ok()).toBeTruthy();
  await page.goto("/aufgaben");
  await expect(page.getByRole("heading", { name: "Aufgaben", exact: true })).toBeVisible();
  const taskOverview = page.getByTestId("task-overview");
  await expect(taskOverview).toContainText(globalTitle);
  await expect(taskOverview).toContainText("Event-Aufgabe");
  await expect(taskOverview).toContainText(categoryName);
  await expect(taskOverview.getByRole("button", { name: globalTitle })).toBeVisible();
  await page.getByRole("combobox", { name: "Priorität" }).selectOption("HIGH");
  await expect(taskOverview).toContainText(globalTitle);
  await expect(taskOverview).not.toContainText("Event-Aufgabe");
  await page.getByRole("button", { name: "Gantt", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Gantt", exact: true })).toBeVisible();
  await expect(page.getByTestId("gantt-category").filter({ hasText: categoryName })).toBeVisible();
  await page.getByLabel("Zeitraum").selectOption("6");
  await expect(page.getByLabel("Zeitraum")).toHaveValue("6");
  await expect(page.getByLabel(new RegExp(globalTitle))).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("button", { name: "Gantt", exact: true })).toHaveCount(0);
  await expect(page.getByText(globalTitle, { exact: true })).toBeVisible();
});
