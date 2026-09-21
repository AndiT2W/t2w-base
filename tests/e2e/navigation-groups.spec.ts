import { expect, test } from "@playwright/test";
import { mockEventManagementApi } from "./support/event-management-api";

const sitzung = (patch: Record<string, unknown>) => ({
  id: "user-1",
  email: "admin@time2win.cloud",
  displayName: "Event Admin",
  role: "ADMIN",
  financeAccess: true,
  organizerId: null,
  ...patch,
});

test("ordnet die Navigation in Module, Finanzen und System", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.goto("/");

  const leiste = page.getByRole("complementary").first();
  for (const gruppe of ["Module", "Finanzen", "System"])
    await expect(leiste.getByText(gruppe, { exact: true })).toBeVisible();

  // Die Bausteine gehören zu System, nicht in einen Anhang „Weitere".
  await expect(leiste.getByRole("link", { name: "Bausteine" })).toBeVisible();
  await expect(leiste.getByText("Weitere", { exact: true })).toHaveCount(0);

  // Der Fuß nennt die Rolle, nicht die Adresse — die eigene E-Mail kennt man.
  await expect(leiste.getByText("Admin · Finanzzugriff")).toBeVisible();
  await expect(leiste.getByText("admin@time2win.cloud")).toHaveCount(0);
});

test("lässt die Finanzgruppe ohne Finanzzugriff ganz weg", async ({ page }) => {
  await mockEventManagementApi(page);
  // Nach dem Sammel-Mock registriert, damit diese Sitzung gewinnt.
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ json: sitzung({ role: "USER", financeAccess: false }) }),
  );
  await page.goto("/");

  const leiste = page.getByRole("complementary").first();
  await expect(leiste.getByText("Module", { exact: true })).toBeVisible();
  // Gesperrtes wird weggelassen, nicht ausgegraut: keine Überschrift ohne Inhalt.
  await expect(leiste.getByText("Finanzen", { exact: true })).toHaveCount(0);
  await expect(leiste.getByRole("link", { name: "Auszahlungen" })).toHaveCount(0);
});
