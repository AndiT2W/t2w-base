import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID, scryptSync } from "node:crypto";

const prisma = new PrismaClient({ datasourceUrl: process.env.PM_TEST_DATABASE_URL });
const email = `pm-browser-${randomUUID()}@test.invalid`;
const password = "browser-test-only";
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
  const login = await page.request.post("/api/v1/auth/login", { data: { email, password } });
  expect(login.ok()).toBeTruthy();
  const result = await page.request.post("/api/v1/events", {
    data: {
      name: `PM Browser ${randomUUID().slice(0, 8)}`,
      eventCode: `PM-${randomUUID()}`,
      startAt: "2026-10-01T08:00:00Z",
      endAt: "2026-10-01T18:00:00Z",
    },
  });
  expect(result.ok()).toBeTruthy();
  const event = await result.json();
  await page.goto(`/events/${event.eventCode}?tab=aufgaben`);
  await expect(page.getByRole("heading", { name: "Projektmanagement", exact: true })).toBeVisible();
  return event;
}
async function add(page: Page, title: string) {
  await page.getByLabel("Neue Aufgabe", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Aufgabe anlegen", exact: true }).click();
  await expect(page.getByLabel("Neue Aufgabe", { exact: true })).toHaveValue("");
}
async function edit(page: Page, title: string) {
  const category = page.getByRole("button", {
    name: /Ohne Kategorie.*Alle Kategorieaufgaben öffnen/,
  });
  if (await category.isVisible()) await category.click();
  await page.getByRole("table").getByRole("button", { name: title, exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
async function prepare(page: Page) {
  await page.getByLabel("Owner", { exact: true }).selectOption({ label: "Browser Admin" });
  await page
    .getByLabel("Kategorie", { exact: true })
    .selectOption({ label: "Startnummern & Anmeldung" });
  await page.getByLabel("Nächster Schritt", { exact: true }).fill("Prüfen und ausführen");
  await save(page);
}
async function save(page: Page) {
  const response = page.waitForResponse(
    (r) => r.url().includes("/commands") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  expect((await response).ok()).toBeTruthy();
}
async function close(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
}

test("creates, assigns, links, starts, completes and reopens tasks with real persistence", async ({
  page,
}) => {
  const event = await fixture(page);
  await add(page, "Druck prüfen");
  await edit(page, "Druck prüfen");
  await prepare(page);
  await close(page);
  await add(page, "Versand beauftragen");
  await edit(page, "Versand beauftragen");
  await prepare(page);
  await page
    .getByLabel("Vorgängeraufgabe")
    .selectOption({ label: "Druck prüfen · Startnummern & Anmeldung" });
  await page.getByLabel("Abschlussergebnis").fill("Entwurf bleibt erhalten");
  await page.getByRole("button", { name: "Abhängigkeit hinzufügen" }).click();
  await expect(page.getByRole("button", { name: "Begründet entfernen" })).toBeVisible();
  await expect(page.getByLabel("Abschlussergebnis")).toHaveValue("Entwurf bleibt erhalten");
  await page.getByLabel("Arbeitsstatus").selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Voraussetzung offen");
  await close(page);
  await page.reload();
  await page.getByRole("button", { name: "Druck prüfen · Neu", exact: true }).click();
  await page.getByRole("table").getByRole("button", { name: "Druck prüfen", exact: true }).click();
  await page.getByLabel("Arbeitsstatus").selectOption("IN_PROGRESS");
  await save(page);
  await page.getByLabel("Arbeitsstatus").selectOption("DONE");
  await page.getByLabel("Abschlussergebnis").fill("Druck freigegeben");
  await save(page);
  await close(page);
  await page
    .getByRole("table")
    .getByRole("button", { name: "Versand beauftragen", exact: true })
    .click();
  await page.getByLabel("Arbeitsstatus").selectOption("IN_PROGRESS");
  await save(page);
  await close(page);
  await page.reload();
  await expect(
    page.getByRole("table").getByRole("row").filter({ hasText: "Versand beauftragen" }),
  ).toContainText("In Arbeit");
  await page.getByRole("table").getByRole("button", { name: "Druck prüfen", exact: true }).click();
  await page.getByLabel("Arbeitsstatus").selectOption("NEW");
  await page.getByLabel(/Begründung/).fill("Nachprüfung nötig");
  await save(page);
  await close(page);
  await page.reload();
  await expect(
    page.getByRole("table").getByRole("row").filter({ hasText: "Versand beauftragen" }),
  ).toContainText("Voraussetzung erneut prüfen");
  await page.screenshot({ path: ".playwright/pm-desktop.png", fullPage: true });
  await page.goto(`/aufgaben?view=tasks&event=${event.id}`);
  await expect(
    page.getByRole("table").getByRole("row").filter({ hasText: "Versand beauftragen" }),
  ).toContainText("In Arbeit");
  await page.reload();
  await expect(page.getByRole("link", { name: "Druck prüfen", exact: true })).toBeVisible();
});

test("keeps inputs on version conflicts and supports mobile category deep links", async ({
  page,
  browser,
}) => {
  const event = await fixture(page);
  await add(page, "Konflikttest");
  await edit(page, "Konflikttest");
  const context = await browser.newContext({ storageState: await page.context().storageState() });
  const other = await context.newPage();
  const state = await (await other.request.get(`/api/v1/pm/events/${event.id}`)).json();
  const task = state.tasks[0];
  expect(
    (
      await other.request.post(`/api/v1/pm/events/${event.id}/commands`, {
        data: {
          type: "update",
          graphVersion: state.event.pmGraphVersion,
          taskVersion: task.version,
          taskId: task.id,
          task: { title: "Andere Änderung" },
        },
      })
    ).ok(),
  ).toBeTruthy();
  await page.getByLabel("Titel", { exact: true }).fill("Meine Eingabe");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("geändert");
  await expect(page.getByLabel("Titel", { exact: true })).toHaveValue("Meine Eingabe");
  await page.getByRole("button", { name: "Konflikt mit aktuellem Stand vergleichen" }).click();
  await expect(page.getByText("Aktueller Stand: Andere Änderung", { exact: false })).toBeVisible();
  await page
    .getByRole("button", { name: "Eigene Eingaben zur erneuten Prüfung übernehmen" })
    .click();
  await save(page);
  await close(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`/events/${event.eventCode}?tab=aufgaben&pmGroup=none&pmTask=${task.id}`);
  await expect(
    page.getByRole("table").getByRole("button", { name: "Meine Eingabe" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("table").getByRole("button", { name: "Meine Eingabe" }),
  ).toBeVisible();
  await page.screenshot({ path: ".playwright/pm-mobile.png", fullPage: true });
  const categoryButton = page.getByRole("button", { name: /Ohne Kategorie.*Schließen/ });
  await categoryButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await page.getByRole("button", { name: /Ohne Kategorie.*Alle Kategorieaufgaben öffnen/ }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("table").getByRole("button", { name: "Meine Eingabe" }),
  ).toBeVisible();
  await context.close();
});

test("cancels predecessors, removes dependencies with a reason, and closes the flow table", async ({
  page,
}) => {
  await fixture(page);
  await add(page, "Druck");
  await edit(page, "Druck");
  await prepare(page);
  await close(page);
  await add(page, "Sendung");
  await edit(page, "Sendung");
  await prepare(page);
  await page
    .getByLabel("Vorgängeraufgabe")
    .selectOption({ label: "Druck · Startnummern & Anmeldung" });
  await page.getByRole("button", { name: "Abhängigkeit hinzufügen" }).click();
  await expect(page.getByRole("button", { name: "Begründet entfernen" })).toBeVisible();
  await close(page);
  const flow = page.getByRole("button", { name: /Ablauf ·.*Aufgaben dieser Kategorie öffnen/ });
  await flow.click();
  await expect(page.getByRole("table")).toBeVisible();
  await flow.click();
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.getByRole("button", { name: "Druck · Neu", exact: true }).click();
  await page.getByRole("table").getByRole("button", { name: "Druck", exact: true }).click();
  await page.getByLabel("Arbeitsstatus").selectOption("CANCELLED");
  await page.getByLabel(/Begründung/).fill("Wird extern erledigt");
  await save(page);
  await close(page);
  await page.reload();
  await expect(
    page.getByRole("table").getByRole("row").filter({ hasText: "Sendung" }),
  ).toContainText("Vorgänger storniert");
  await page.getByRole("table").getByRole("button", { name: "Sendung", exact: true }).click();
  await page.getByRole("button", { name: "Begründet entfernen" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Entfernungsgrund");
  await page.getByLabel(/Begründung/).fill("Externe Freigabe liegt vor");
  await page.getByRole("button", { name: "Begründet entfernen" }).click();
  await expect(page.getByRole("button", { name: "Begründet entfernen" })).toHaveCount(0);
  await page.getByLabel("Arbeitsstatus").selectOption("IN_PROGRESS");
  await save(page);
  await close(page);
  await page.reload();
  await page.getByRole("button", { name: /Startnummern.*Alle Kategorieaufgaben öffnen/ }).click();
  await expect(
    page.getByRole("table").getByRole("row").filter({ hasText: "Sendung" }),
  ).toContainText("In Arbeit");
});

test("persists references and deadlines, and manages categories without changing task status", async ({
  page,
}) => {
  const event = await fixture(page);
  await page.getByText("Eventzeitzone: Europe/Vienna", { exact: true }).click();
  await page.getByLabel("IANA-Zeitzone").fill("Europe/Berlin");
  await page.getByRole("button", { name: "Zeitzone speichern" }).click();
  await page.reload();
  await expect(page.getByText("Eventzeitzone: Europe/Berlin", { exact: true })).toBeVisible();
  await prisma.eventFile.create({ data: { eventId: event.id, name: "Freigabe.pdf" } });
  await add(page, "Referenz prüfen");
  await edit(page, "Referenz prüfen");
  await prepare(page);
  await page.getByRole("group", { name: "Fachreferenzen" }).getByRole("checkbox").check();
  await page.getByLabel(/Fristtyp/).selectOption("DATE");
  await page.getByLabel("Tagesfrist", { exact: true }).fill("2020-01-01");
  await page.getByLabel(/Begründung/).fill("Historische Frist erfassen");
  await save(page);
  await close(page);
  await page.reload();
  await page.getByRole("button", { name: /Startnummern.*Alle Kategorieaufgaben öffnen/ }).click();
  await page
    .getByRole("table")
    .getByRole("button", { name: "Referenz prüfen", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Fachreferenzen" }).getByRole("checkbox"),
  ).toBeChecked();
  await expect(page.getByLabel("Tagesfrist", { exact: true })).toHaveValue("2020-01-01");
  await page.getByLabel("Arbeitsstatus").selectOption("IN_PROGRESS");
  await save(page);
  await page.getByLabel("Arbeitsstatus").selectOption("DONE");
  await page.getByLabel("Abschlussergebnis").fill("Trotz Verzug erfolgreich geprüft");
  await save(page);
  await close(page);
  await page.reload();
  await expect(
    page.getByRole("table").getByRole("row").filter({ hasText: "Referenz prüfen" }),
  ).not.toContainText("Überfällig");
  await page.goto("/aufgaben");
  await page.getByText("Kategorien verwalten (Admin)", { exact: true }).click();
  const name = `Sonderbereich ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Kategoriename").fill(name);
  await page.getByRole("button", { name: "Kategorie speichern" }).click();
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  await page.getByRole("button", { name, exact: true }).click();
  await page.getByLabel("Aktiv", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Kategorie speichern" }).click();
  await page.reload();
  await page.getByText("Kategorien verwalten (Admin)", { exact: true }).click();
  await expect(page.getByRole("button", { name: `${name} (inaktiv)`, exact: true })).toBeVisible();
});

test("verifies a protected legacy snapshot before starting fresh tasks", async ({ page }) => {
  const event = await fixture(page);
  await prisma.eventTask.create({
    data: { eventId: event.id, title: "Alte Checkbox", responsible: "Freitext" },
  });
  await page.reload();
  await expect(page.getByText(/1 bisherige Checkbox-Aufgaben/)).toBeVisible();
  await page.getByRole("button", { name: "Als Admin sichern und umstellen" }).click();
  await expect(page.getByLabel("Neue Aufgabe", { exact: true })).toBeVisible();
  await page.getByText("Gesicherte bisherige Aufgaben", { exact: true }).click();
  const link = page.getByRole("link", { name: /Snapshot vom/ });
  const snapshot = await (await page.request.get((await link.getAttribute("href"))!)).json();
  expect(JSON.parse(snapshot.payload)).toMatchObject([
    { title: "Alte Checkbox", responsible: "Freitext" },
  ]);
  await add(page, "Frische Aufgabe");
  await page.reload();
  await expect(page.getByText(/Alte Checkbox/)).toHaveCount(0);
  await expect(page.getByText(/Frische Aufgabe/).first()).toBeVisible();
});

test("rolls back all writes when audit fails and keeps the browser draft", async ({ page }) => {
  const event = await fixture(page);
  await prisma.$executeRawUnsafe(
    `CREATE OR REPLACE FUNCTION pm_test_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.entity = 'PmTask' AND NEW.details->'after'->>'title' = 'PM ATOMIC TEST FAILURE' THEN RAISE EXCEPTION 'Injected audit failure'; END IF; RETURN NEW; END; $$`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE TRIGGER pm_test_audit_failure BEFORE INSERT ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION pm_test_fail_audit()`,
  );
  try {
    await page.getByLabel("Neue Aufgabe", { exact: true }).fill("PM ATOMIC TEST FAILURE");
    await page.getByRole("button", { name: "Aufgabe anlegen", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Internal server error");
    await expect(page.getByLabel("Neue Aufgabe", { exact: true })).toHaveValue(
      "PM ATOMIC TEST FAILURE",
    );
    await page.reload();
    const state = await (await page.request.get(`/api/v1/pm/events/${event.id}`)).json();
    expect(state.tasks).toEqual([]);
    expect(state.event.pmGraphVersion).toBe(0);
  } finally {
    await prisma.$executeRawUnsafe(`DROP TRIGGER pm_test_audit_failure ON "AuditLog"`);
    await prisma.$executeRawUnsafe(`DROP FUNCTION pm_test_fail_audit()`);
  }
});

test("enforces member permissions and event history protection", async ({ page, browser }) => {
  const event = await fixture(page);
  await add(page, "Offene Arbeit");
  expect(
    (await page.request.patch(`/api/v1/events/${event.id}`, { data: { archived: true } })).status(),
  ).toBe(409);
  expect((await page.request.delete(`/api/v1/events/${event.id}`)).status()).toBe(409);
  const memberEmail = `${randomUUID()}@test.invalid`;
  const member = await prisma.user.create({
    data: {
      email: memberEmail,
      displayName: "Member",
      role: "MITARBEITER",
      passwordHash: `test:${scryptSync(password, "test", 64).toString("hex")}`,
    },
  });
  const context = await browser.newContext();
  const memberPage = await context.newPage();
  expect(
    (
      await context.request.post("http://127.0.0.1:4175/api/v1/auth/login", {
        data: { email: memberEmail, password },
      })
    ).ok(),
  ).toBeTruthy();
  await memberPage.goto("http://127.0.0.1:4175/aufgaben");
  await memberPage.getByText("Kategorien verwalten (Admin)", { exact: true }).click();
  await memberPage.getByLabel("Kategoriename").fill("Unerlaubte Kategorie");
  await memberPage.getByRole("button", { name: "Kategorie speichern" }).click();
  await expect(memberPage.getByRole("alert")).toContainText("Keine Berechtigung");
  await prisma.user.update({ where: { id: member.id }, data: { active: false } });
  expect(
    (await context.request.get(`http://127.0.0.1:4175/api/v1/pm/events/${event.id}`)).status(),
  ).toBe(401);
  await context.close();
});

test("finds an unloaded event and paginates complete server results", async ({ page }) => {
  const event = await fixture(page);
  await prisma.event.createMany({
    data: Array.from({ length: 205 }, (_, i) => ({
      eventCode: `OLDER-${randomUUID()}`,
      name: `Earlier ${i}`,
      startAt: new Date("2000-01-01"),
      endAt: new Date("2000-01-02"),
    })),
  });
  for (let i = 0; i < 27; i++) {
    const state = await (await page.request.get(`/api/v1/pm/events/${event.id}`)).json();
    expect(
      (
        await page.request.post(`/api/v1/pm/events/${event.id}/commands`, {
          data: {
            type: "create",
            graphVersion: state.event.pmGraphVersion,
            task: { title: `Paginated ${i}` },
          },
        })
      ).ok(),
    ).toBeTruthy();
  }
  await page.goto(`/aufgaben?event=${event.id}&view=tasks`);
  await expect(page.getByText("27 Aufgaben · vollständige gefilterte Anzahl")).toBeVisible();
  await expect(page.getByRole("table").getByRole("link")).toHaveCount(25);
  await page.getByRole("button", { name: "Nächste Seite" }).click();
  await expect(page.getByRole("table").getByRole("link")).toHaveCount(2);
  const target = await page.getByRole("table").getByRole("link").first().textContent();
  await page.getByRole("table").getByRole("link").first().click();
  await expect(
    page.getByRole("table").getByRole("button", { name: target!, exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Projektmanagement", exact: true })).toBeVisible();
});
