import { expect, test } from "@playwright/test";
import { mockEventManagementApi } from "./support/event-management-api";

const KONTEN = [
  {
    id: "u9",
    displayName: "Nordwerk Zugang",
    firstName: "Nord",
    lastName: "Werk",
    email: "zugang@nordwerk.de",
    pendingEmail: null,
    role: "ORGANIZER",
    status: "ACTIVE",
    financeAccess: false,
    organizerId: "c1",
  },
  {
    id: "u1",
    displayName: "Event Admin",
    firstName: "Event",
    lastName: "Admin",
    email: "admin@time2win.cloud",
    pendingEmail: null,
    role: "ADMIN",
    status: "ACTIVE",
    financeAccess: true,
    organizerId: null,
  },
];

test("filtert Kontakte nach Rolle, Event und Kundenbezug", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.route("**/api/v1/users**", (route) => route.fulfill({ json: KONTEN }));
  await page.goto("/kontakte");

  const zeilen = page.locator("tbody tr");
  await expect(zeilen).toHaveCount(3);

  // Marion Kessler trägt die Eventrollen Anmeldung und Finanz.
  await page.getByLabel("Rolle filtern").selectOption("Anmeldung");
  await expect(zeilen).toHaveCount(1);
  await expect(zeilen.first()).toContainText("Marion Kessler");
  await page.getByLabel("Rolle filtern").selectOption("alle");

  // Eva Beispiel hängt an keinem Kunden.
  await page.getByRole("button", { name: "Ohne Kundenbezug" }).click();
  await expect(zeilen).toHaveCount(1);
  await expect(zeilen.first()).toContainText("Eva Beispiel");
  await page.getByRole("button", { name: "Ohne Kundenbezug" }).click();
  await expect(zeilen).toHaveCount(3);
});

test("zeigt Veranstalterkonten als dritten Reiter", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.route("**/api/v1/users**", (route) => route.fulfill({ json: KONTEN }));
  await page.goto("/kontakte");

  // Nur Konten mit der Rolle ORGANIZER; das Adminkonto gehört nicht hierher.
  const reiter = page.getByRole("tab", { name: /Veranstalterkonten/ });
  await expect(reiter).toContainText("(1)");
  await reiter.click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr").first()).toContainText("Nordwerk GmbH");
  await expect(page.locator("tbody tr").first()).toContainText("Aktiv");
});

test("blendet Veranstalterkonten aus, wo das Konto sie nicht lesen darf", async ({ page }) => {
  await mockEventManagementApi(page);
  // Die Benutzerliste ist Adminsache. Ausgegraut wäre eine Tür, die sich nie
  // öffnet, also gibt es Reiter und Filter für andere Rollen gar nicht.
  // Nach dem Sammel-Mock registriert, damit diese Sitzung gewinnt.
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      json: {
        id: "user-2",
        email: "sachbearbeitung@time2win.cloud",
        displayName: "Sachbearbeitung",
        role: "USER",
        financeAccess: false,
        organizerId: null,
      },
    }),
  );
  await page.goto("/kontakte");

  await expect(page.getByRole("tab", { name: "Kontakte", exact: false }).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: /Veranstalterkonten/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Nur mit Veranstalterkonto" })).toHaveCount(0);
});

test("übernimmt die Frage der globalen Suche und lässt sie abwählen", async ({ page }) => {
  await mockEventManagementApi(page);
  // Die globale Suche schickt einen Personentreffer als "?q=" hierher.  Bis
  // 22.09.2026 las die Seite den Parameter nicht: der Klick landete auf der
  // ungefilterten Liste, und ohne eigenes Suchfeld tat sich gar nichts.
  await page.goto("/kontakte?q=Marion");

  const chip = page.getByRole("button", { name: /Suche: Marion/ });
  const liste = page.locator("table tbody");
  await expect(chip).toBeVisible();
  await expect(liste.getByText("Marion Kessler", { exact: true })).toBeVisible();
  await expect(liste.getByText("Jonas Feld", { exact: true })).toHaveCount(0);

  await chip.click();
  await expect(chip).toHaveCount(0);
  await expect(liste.getByText("Jonas Feld", { exact: true })).toBeVisible();
});
