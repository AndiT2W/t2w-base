import { expect, test } from "@playwright/test";
import readXlsxFile from "read-excel-file/node";
import { mockEventManagementApi } from "./support/event-management-api";

test("exportiert die sichtbare Tabelle als Excel-Arbeitsmappe", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.route("**/api/v1/table-preferences/**", (route) =>
    route.fulfill({ json: { value: null } }),
  );

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Bestehendes Event" }).first()).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Übersicht als Excel exportieren" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("uebersicht.xlsx");
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const [{ data: rows }] = await readXlsxFile(downloadPath!);

  expect(rows[0]).toEqual([
    "Status",
    "Event",
    "Veranstalter",
    "Sportart",
    "Services",
    "Zeitraum",
    "Tage",
    "Aufgaben",
    "Ordner",
    "TIME2WIN",
  ]);
  expect(rows.some((row) => row.includes("Bestehendes Event"))).toBe(true);
});

test("lädt Tabellenspalten aus dem Konto und speichert Änderungen zurück", async ({ page }) => {
  await mockEventManagementApi(page);
  let preference: { version: 1; visible: string[]; sort: { key: string; direction: string } } = {
    version: 1,
    visible: ["Status", "Event", "Veranstalter", "Zeitraum", "Aufgaben", "Ordner"],
    sort: { key: "Zeitraum", direction: "asc" },
  };
  let putBody: unknown;
  await page.route("**/api/v1/table-preferences/**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { value: preference } });
    if (route.request().method() === "PUT") {
      putBody = route.request().postDataJSON();
      preference = putBody as typeof preference;
      return route.fulfill({ json: { value: preference } });
    }
    return route.fallback();
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Tage sortieren" })).toHaveCount(0);

  await page.getByRole("button", { name: "Spalten auswählen" }).click();
  const days = page.getByRole("checkbox", { name: "Tage" });
  await expect(days).not.toBeChecked();
  await days.check();
  await expect.poll(() => putBody).toMatchObject({ visible: expect.arrayContaining(["Tage"]) });
});

test("hebt kompakte Tabellenköpfe mit der ausgewogenen Kontrastvariante ab", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.route("**/api/v1/table-preferences/**", (route) =>
    route.fulfill({ json: { value: null } }),
  );

  await page.goto("/");
  const table = page.locator('[data-density="compact"] table').first();
  const header = table.locator("thead");

  await expect(header).toHaveCSS("font-size", "12px");
  await expect(header).toHaveCSS("text-transform", "none");
  await expect(header.locator("tr")).toHaveCSS("border-bottom-width", "2px");

  const surfaces = await table.evaluate((element) => {
    const tableElement = element as HTMLTableElement;
    const tableHeader = tableElement.tHead;
    const tableContainer = tableElement.parentElement;
    if (!tableHeader || !tableContainer)
      throw new Error("Tabelle ist nicht vollständig gerendert.");
    return {
      header: getComputedStyle(tableHeader).backgroundColor,
      body: getComputedStyle(tableContainer).backgroundColor,
    };
  });

  expect(surfaces.header).not.toBe("rgba(0, 0, 0, 0)");
  expect(surfaces.header).not.toBe(surfaces.body);
});
