import { expect, test } from "@playwright/test";
import { event, mockEventManagementApi as mockApi } from "./support/event-management-api";

test.describe("Eventdetail UX", () => {
  test("zeigt den Speicherdirtyzustand und bestätigt das Speichern", async ({ page }) => {
    await mockApi(page);
    await page.goto("/events/260820_demo_event");

    const save = page.getByRole("button", { name: "Änderungen speichern" });
    await expect(save).toBeDisabled();
    await page.getByRole("textbox", { name: "Ort", exact: true }).fill("Linz");
    await expect(page.getByText("Ungespeicherte Änderungen")).toBeVisible();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText("Änderungen gespeichert.")).toBeVisible();
    await expect(save).toBeDisabled();
  });

  test("stellt die Eventbereiche auf Mobile über Mehr bereit", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/events/260820_demo_event");

    await expect(page.getByRole("button", { name: "Weitere Eventbereiche" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
    await page.getByRole("button", { name: "Weitere Eventbereiche" }).click();
    await page.getByRole("menuitem", { name: "Hardware" }).click();
    await expect(page.getByText("Hardware-Ausgabe anlegen")).toBeVisible();
  });

  test("trennt die Tabs der Eventdetailansicht auf dem Desktop klar", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/events/260820_demo_event");

    // Seit dem Umbau auf das Artboard tragen die Reiter keinen eigenen
    // Kasten mehr: die Leiste hat eine Unterkante, der aktive Reiter einen
    // gruenen Unterstrich.  Geprueft wird deshalb der Zustand, nicht der
    // Abstand zwischen Pillen.
    const tabList = page.getByRole("tablist");
    await expect(tabList).toHaveCSS("border-bottom-width", "1px");
    const aktiv = page.getByRole("tab", { name: "Stammdaten" });
    await expect(aktiv).toHaveAttribute("data-state", "active");
    await expect(page.getByRole("tab", { name: "Anmeldung" })).toHaveAttribute(
      "data-state",
      "inactive",
    );
    await expect(page.getByRole("tab", { name: "Dateien" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Kommunikation" })).toBeVisible();
  });

  test("verlangt für das Löschen eine Bestätigung", async ({ page }) => {
    await mockApi(page);
    await page.goto("/events/260820_demo_event");

    // Der Gefahrenbereich ist seit dem Umbau keine Klappe mehr, sondern die
    // letzte Karte der Schiene; die Bestaetigung bleibt.
    await expect(page.getByRole("heading", { name: "Gefahrenbereich", level: 2 })).toBeVisible();
    await page.getByRole("button", { name: "Event löschen" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Bestehendes Event");
    await expect(dialog).toContainText("260820_demo_event");
    await dialog.getByRole("button", { name: "Abbrechen" }).click();
    await expect(dialog).toBeHidden();
  });

  test("löscht ein bestätigtes Event über die API und kehrt zur Übersicht zurück", async ({
    page,
  }) => {
    const requests = await mockApi(page);
    await page.goto("/events/260820_demo_event");

    await page.getByRole("button", { name: "Event löschen" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Endgültig löschen" }).click();

    await expect(page).toHaveURL(/\/$/);
    expect(
      requests.some(
        (request) =>
          request.method === "DELETE" && request.url.endsWith(`/api/v1/events/${event.id}`),
      ),
    ).toBeTruthy();
  });

  test("zeigt den Quartalswechsel als prüfbaren Vorschlag", async ({ page }) => {
    const requests = await mockApi(page, {
      outlookFolder: "06_auftraege_26/Q2/260820_demo_event",
    });
    await page.goto("/events/260820_demo_event");

    await expect(page.getByText("Der Outlook-Ordner liegt im falschen Quartal.")).toBeVisible();
    await page.getByRole("button", { name: "Vorschlag prüfen" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Outlook-Ordner verschieben?");
    await expect(dialog).toContainText("06_auftraege_26/Q3/260820_demo_event");
    await dialog.getByRole("button", { name: "Abbrechen" }).click();
    expect(requests.some((request) => request.method === "PATCH")).toBeFalsy();
  });
});
