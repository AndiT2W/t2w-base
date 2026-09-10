import { expect, test } from "@playwright/test";
import { mockEventManagementApi as mockApi } from "./support/event-management-api";

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
    await page.getByRole("menuitem", { name: "HARDWARE" }).click();
    await expect(page.getByText("Hardware-Ausgabe anlegen")).toBeVisible();
  });

  test("trennt die Tabs der Eventdetailansicht auf dem Desktop klar", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/events/260820_demo_event");

    const tabList = page.getByRole("tablist");
    await expect(tabList).toHaveCSS("gap", "8px");
    await expect(page.getByRole("tab", { name: "DATEIEN" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "KOMMUNIKATION" })).toBeVisible();
  });

  test("hält den Gefahrenbereich geschlossen und verlangt die Löschbestätigung", async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto("/events/260820_demo_event");

    await expect(page.getByRole("button", { name: "Event löschen" })).toBeHidden();
    await page.getByRole("button", { name: "Gefahrenbereich" }).click();
    await page.getByRole("button", { name: "Event löschen" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Bestehendes Event");
    await expect(dialog).toContainText("260820_demo_event");
    await dialog.getByRole("button", { name: "Abbrechen" }).click();
    await expect(dialog).toBeHidden();
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
