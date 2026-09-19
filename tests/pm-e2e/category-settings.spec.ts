import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID, scryptSync } from "node:crypto";

const prisma = new PrismaClient({ datasourceUrl: process.env.PM_TEST_DATABASE_URL });
const email = `pm-categories-${randomUUID()}@test.invalid`;
const password = "browser-test-only";
const settingsUrl = "/einstellungen?tab=auswahllisten&liste=aufgabenkategorien";
test.beforeAll(async () => {
  if (!process.env.PM_TEST_DATABASE_URL?.includes("pm_"))
    throw new Error("Use an isolated pm_ database.");
  await prisma.user.create({
    data: {
      email,
      displayName: "Category Admin",
      role: "ADMIN",
      passwordHash: `test:${scryptSync(password, "test", 64).toString("hex")}`,
    },
  });
});
test.afterAll(() => prisma.$disconnect());
test.beforeEach(async ({ page }) => {
  expect(
    (await page.request.post("/api/v1/auth/login", { data: { email, password } })).ok(),
  ).toBeTruthy();
});

async function addCategory(page: Page, name: string) {
  await page.getByLabel("Neue Kategorie", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Hinzufügen", exact: true }).click();
  await expect(page.getByRole("textbox", { name: `Kategorie ${name}`, exact: true })).toBeVisible();
}

test("configures categories and preserves their use in event and global tasks after reload", async ({
  page,
}) => {
  const suffix = randomUUID().slice(0, 8);
  const first = `Planung ${suffix}`,
    second = `Technik ${suffix}`,
    renamed = `Logistik ${suffix}`;
  await page.goto("/einstellungen?tab=auswahllisten");
  await expect(page.getByRole("textbox", { name: /^Service / }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Projektmanagement / Aufgaben" }).click();
  await expect(page).toHaveURL(/liste=aufgabenkategorien/);
  await addCategory(page, first);
  await addCategory(page, second);
  await page.getByRole("button", { name: `${second} nach oben`, exact: true }).click();
  const list = page.getByRole("list", { name: "Aufgabenkategorien", exact: true });
  await expect(list.getByRole("listitem").last()).toHaveAccessibleName(first);
  await page.getByRole("textbox", { name: `Kategorie ${second}`, exact: true }).fill(renamed);
  await page.getByRole("button", { name: `Kategorie ${second} speichern`, exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: `Kategorie ${renamed}`, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `Darstellung für ${renamed} bearbeiten`, exact: true })
    .click();
  const presentationDialog = page.getByRole("dialog", { name: `Darstellung: ${renamed}` });
  await presentationDialog.getByRole("button", { name: "Paket", exact: true }).click();
  await presentationDialog.getByRole("button", { name: "Türkis", exact: true }).click();
  await presentationDialog
    .getByRole("button", { name: "Darstellung speichern", exact: true })
    .click();
  await expect(presentationDialog).toBeHidden();
  await page.reload();
  await expect(page.getByRole("tab", { name: "Projektmanagement / Aufgaben" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(list.getByRole("listitem").last()).toHaveAccessibleName(first);
  await expect(
    page.getByRole("textbox", { name: `Kategorie ${renamed}`, exact: true }),
  ).toHaveValue(renamed);
  const renamedRow = list.getByRole("listitem", { name: renamed, exact: true });
  await expect(
    renamedRow.locator('[data-selection-icon="package"][data-selection-color="teal"]'),
  ).toBeVisible();
  const catalogueAfterPresentation = await (await page.request.get("/api/v1/pm/groups")).json();
  expect(
    catalogueAfterPresentation.groups.find((item: { name: string }) => item.name === renamed),
  ).toMatchObject({ icon: "package", color: "teal" });

  const eventResponse = await page.request.post("/api/v1/events", {
    data: {
      name: `Category event ${suffix}`,
      eventCode: `CAT-${randomUUID()}`,
      startAt: "2026-09-20T08:00:00Z",
      endAt: "2026-09-20T18:00:00Z",
    },
  });
  expect(eventResponse.ok()).toBeTruthy();
  const event = await eventResponse.json();
  const eventTitle = `Event Aufgabe ${suffix}`,
    globalTitle = `Globale Aufgabe ${suffix}`;
  await page.goto(`/events/${event.eventCode}?tab=aufgaben`);
  await page.getByRole("button", { name: "Neue Aufgabe", exact: true }).click();
  await page.getByLabel("Titel", { exact: true }).fill(eventTitle);
  await page.getByLabel("Kategorie", { exact: true }).selectOption({ label: renamed });
  await page.getByRole("button", { name: "Aufgabe anlegen", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Aufgabe bearbeiten" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  const category = page.getByRole("button", { name: new RegExp(renamed) }).first();
  await expect(category).toBeVisible();
  await expect(
    category.locator('[data-selection-icon="package"][data-selection-color="teal"]'),
  ).toBeVisible();
  await category.click();
  await expect(page.getByRole("button", { name: eventTitle, exact: true })).toBeVisible();

  await page.goto("/aufgaben");
  await expect(page.getByRole("button", { name: eventTitle, exact: true })).toBeVisible();
  await expect(
    page.locator('[data-selection-icon="package"][data-selection-color="teal"]', {
      hasText: renamed,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Globale Aufgabe anlegen" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Titel", { exact: true }).fill(globalTitle);
  const choice = dialog.getByLabel("Kategorie", { exact: true });
  const options = await choice.locator("option").allTextContents();
  expect(options.indexOf(renamed)).toBeLessThan(options.indexOf(first));
  await choice.selectOption({ label: renamed });
  await dialog.getByRole("button", { name: "Aufgabe anlegen", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Aufgabe bearbeiten" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.getByRole("button", { name: globalTitle, exact: true })).toBeVisible();

  await page.goto(settingsUrl);
  await page
    .getByRole("button", { name: `Kategorie ${renamed} deaktivieren`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Kategorie ${renamed} aktivieren`, exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: `Kategorie ${renamed} aktivieren`, exact: true }),
  ).toBeVisible();
  await page.goto("/aufgaben");
  await expect(page.getByRole("button", { name: globalTitle, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Globale Aufgabe anlegen" }).click();
  await expect(choice.locator("option", { hasText: renamed })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: globalTitle, exact: true }).click();
  await expect(choice.locator("option:checked")).toHaveText(renamed);
  await dialog.getByLabel("Titel", { exact: true }).fill(`${globalTitle} aktualisiert`);
  await dialog.getByRole("button", { name: "Änderungen speichern", exact: true }).click();
  await expect(dialog.getByText(/Nicht gespeichert:/)).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(
    page.getByRole("button", { name: `${globalTitle} aktualisiert`, exact: true }),
  ).toBeVisible();
  await page.goto(`/events/${event.eventCode}?tab=aufgaben`);
  await category.click();
  await expect(page.getByRole("button", { name: eventTitle, exact: true })).toBeVisible();
  await expect(page.getByLabel(`Neue Aufgabe in ${renamed}`, { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Neue Aufgabe", exact: true }).click();
  await expect(choice.locator("option", { hasText: renamed })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.goto(settingsUrl);
  await page.getByRole("button", { name: `Kategorie ${renamed} aktivieren`, exact: true }).click();
  await expect(
    page.getByRole("button", { name: `Kategorie ${renamed} deaktivieren`, exact: true }),
  ).toBeVisible();
  await page.goto("/aufgaben");
  await expect(page.getByRole("button", { name: eventTitle, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Globale Aufgabe anlegen" }).click();
  await expect(choice.locator("option", { hasText: renamed })).toHaveCount(1);
});

test("keeps category drafts on conflicts and supports narrow settings layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(settingsUrl);
  const name = `Mobil ${randomUUID().slice(0, 8)}`;
  await addCategory(page, name);
  const input = page.getByRole("textbox", { name: `Kategorie ${name}`, exact: true });
  const catalogue = await (await page.request.get("/api/v1/pm/groups")).json();
  const group = catalogue.groups.find((item: { name: string }) => item.name === name);
  expect(
    (await page.request.post("/api/v1/pm/groups", { data: { ...group, active: false } })).ok(),
  ).toBeTruthy();
  await input.fill(`${name} Entwurf`);
  await page.getByRole("button", { name: `Kategorie ${name} speichern`, exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Kategorie wurde geändert");
  await expect(input).toHaveValue(`${name} Entwurf`);
  await page.getByRole("button", { name: "Kategorien neu laden" }).click();
  await expect(
    page.getByRole("button", { name: `Kategorie ${name} aktivieren`, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: `Kategorie ${name} speichern`, exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: `Kategorie ${name} Entwurf`, exact: true }),
  ).toBeVisible();
  await page.getByLabel("Neue Kategorie", { exact: true }).fill(`${name} Entwurf`);
  await page.getByRole("button", { name: "Hinzufügen", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("bereits vorhanden");
  await page
    .getByRole("button", {
      name: `Darstellung für ${name} Entwurf bearbeiten`,
      exact: true,
    })
    .click();
  const presentationDialog = page.getByRole("dialog", {
    name: `Darstellung: ${name} Entwurf`,
  });
  await expect(
    presentationDialog.getByRole("button", { name: "Paket", exact: true }),
  ).toBeVisible();
  await expect(
    presentationDialog.getByRole("button", { name: "Türkis", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: "test-results/pm-category-presentation-mobile.png",
    fullPage: true,
  });
});
