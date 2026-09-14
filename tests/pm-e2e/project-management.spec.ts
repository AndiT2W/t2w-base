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
  return next.tasks.find((task: { title: string }) => task.title === title);
}
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
  await expect(page.getByRole("heading", { name: "Aufgaben", exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  const category = page.getByRole("button", { name: /Ohne Kategorie.*Blockiert oder überfällig/ });
  await category.click();
  await expect(page.getByRole("table")).toContainText(printTitle);
  await page.getByRole("table").getByRole("button", { name: printTitle }).click();
  await expect(page.getByText(`Blockiert durch ${setupTitle}`, { exact: true })).toBeVisible();
  await page.getByLabel("Beschreibung").fill("Freigabe: https://example.test/print");
  await page.getByLabel("Start").fill("2026-09-15");
  await page.getByLabel("Ende").fill("2026-09-18");
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
  const dependentFlow = page.getByRole("group", { name: "Abhängiger Ablauf" });
  await expect(dependentFlow).toContainText(designTitle);
  await expect(dependentFlow).toContainText(printTitle);
  await expect(dependentFlow).not.toContainText(allocationTitle);
  await expect(page.getByRole("group", { name: "Weitere Aufgaben" })).toContainText(
    allocationTitle,
  );
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
test("shows the combined overview, desktop Gantt and global work", async ({ page }) => {
  const event = await fixture(page);
  await create(page, event.id, "Event-Aufgabe");
  const categoryName = `Gantt Kategorie ${randomUUID().slice(0, 6)}`;
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
  await expect(page.getByText("Globale Aufgaben", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: event.name, exact: true })).toBeVisible();
  await page.getByText("Weitere Filter", { exact: true }).click();
  await page.locator("#task-priority").selectOption("HIGH");
  await expect(page.getByRole("heading", { name: event.name, exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Gantt", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Gantt", exact: true })).toBeVisible();
  await expect(page.getByTestId("gantt-category").filter({ hasText: categoryName })).toBeVisible();
  await page.getByLabel("Zeitraum").selectOption("6");
  await expect(page.getByLabel("Zeitraum")).toHaveValue("6");
  await expect(page.getByLabel(new RegExp(globalTitle))).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("button", { name: "Gantt", exact: true })).toHaveCount(0);
  await expect(page.getByText("Globale Aufgaben", { exact: true })).toBeVisible();
});
