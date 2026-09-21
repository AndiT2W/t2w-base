import { expect, test } from "@playwright/test";
import readXlsxFile from "read-excel-file/node";
import { mockEventManagementApi } from "./support/event-management-api";

// Seit der verpflichtenden Anmeldung landet jeder Ablauf ohne Sitzung auf der
// Loginseite, und die Tabellen dieser Datei existieren dann gar nicht. Wie in
// event-management.spec.ts stellt der Hook eine Admin-Sitzung bereit.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      json: {
        id: "user-1",
        email: "admin@time2win.cloud",
        displayName: "Event Admin",
        role: "ADMIN",
        financeAccess: true,
        organizerId: null,
      },
    }),
  );
});

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
    "TIME2WIN",
    "Event",
    "Veranstalter",
    "Sportart",
    "Services",
    "Zeitraum",
    "Tage",
    "Aufgaben",
    "Ordner",
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

test("ordnet Tabellenspalten um und behält die Reihenfolge nach dem Neuladen", async ({ page }) => {
  await mockEventManagementApi(page);
  let preference: { version: 1; visible: string[]; sort: { key: string; direction: string } } = {
    version: 1,
    visible: ["Status", "Event", "Veranstalter", "Zeitraum"],
    sort: { key: "Zeitraum", direction: "asc" },
  };
  await page.route("**/api/v1/table-preferences/**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { value: preference } });
    if (route.request().method() === "PUT") {
      preference = route.request().postDataJSON() as typeof preference;
      return route.fulfill({ json: { value: preference } });
    }
    return route.fallback();
  });

  await page.goto("/");
  const kopfNamen = async () =>
    page.locator('[data-density="compact"] table thead th').first().textContent();
  await expect.poll(kopfNamen).toContain("St.");

  // Die Liste steht in Anzeigereihenfolge: oben ist links.
  await page.getByRole("button", { name: "Spalten auswählen" }).click();
  await page.getByRole("button", { name: "Event nach links verschieben" }).click();
  await page.keyboard.press("Escape");

  await expect
    .poll(() => preference.visible)
    .toEqual(["Event", "Status", "Veranstalter", "Zeitraum"]);
  await expect.poll(kopfNamen).toContain("Event");

  await page.reload();
  await expect.poll(kopfNamen).toContain("Event");
});

test("ordnet Tabellenspalten auch per Ziehen um", async ({ page }) => {
  await mockEventManagementApi(page);
  let preference: { version: 1; visible: string[]; sort: { key: string; direction: string } } = {
    version: 1,
    visible: ["Status", "Event", "Veranstalter", "Zeitraum"],
    sort: { key: "Zeitraum", direction: "asc" },
  };
  await page.route("**/api/v1/table-preferences/**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { value: preference } });
    if (route.request().method() === "PUT") {
      preference = route.request().postDataJSON() as typeof preference;
      return route.fulfill({ json: { value: preference } });
    }
    return route.fallback();
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Spalten auswählen" }).click();

  // Ziehen ist der Mausweg, die Pfeile bleiben der Weg für die Tastatur.
  const zeitraum = page.locator('[data-column-row="Zeitraum"]');
  const status = page.locator('[data-column-row="Status"]');
  await expect(zeitraum).toHaveAttribute("draggable", "true");
  await zeitraum.dispatchEvent("dragstart");
  await status.dispatchEvent("dragover");
  await status.dispatchEvent("drop");

  await expect
    .poll(() => preference.visible)
    .toEqual(["Zeitraum", "Status", "Event", "Veranstalter"]);
  await expect
    .poll(() => page.locator('[data-density="compact"] table thead th').first().textContent())
    .toContain("Zeitraum");
});

test("hebt kompakte Tabellenköpfe mit der leichten Versalienvariante ab", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.route("**/api/v1/table-preferences/**", (route) =>
    route.fulfill({ json: { value: null } }),
  );

  await page.goto("/");
  const table = page.locator('[data-density="compact"] table').first();
  const header = table.locator("thead");

  // Tabellenstandard seit 17.09.2026: 10 px, Versalien, Haarlinie statt
  // grauem Balken. Die abgelöste Variante "Ausgewogen" stand auf 12 px,
  // ohne Versalsatz und mit 2-px-Unterkante.
  await expect(header).toHaveCSS("font-size", "10px");
  await expect(header).toHaveCSS("text-transform", "uppercase");
  await expect(header).toHaveCSS("letter-spacing", "0.8px");
  await expect(header.locator("th").first()).toHaveCSS("font-weight", "700");
  await expect(header.locator("tr")).toHaveCSS("border-bottom-width", "1px");

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

test("hält Tabellenkopf und Suchleiste beim Scrollen sichtbar", async ({ page }) => {
  await mockEventManagementApi(
    page,
    {},
    {},
    Array.from({ length: 40 }, (_, index) => ({
      id: `scroll-${index}`,
      eventCode: `2608${String(index + 1).padStart(2, "0")}_scroll_event`,
      name: `Scroll Event ${index + 1}`,
      startAt: "2026-08-20T00:00:00.000Z",
      endAt: "2026-08-20T00:00:00.000Z",
    })),
  );
  await page.route("**/api/v1/table-preferences/**", (route) =>
    route.fulfill({ json: { value: null } }),
  );

  await page.goto("/");
  const table = page.locator('[data-density="compact"] table').first();
  const tableHeader = table.locator("thead");
  // Beim Scrollen sichtbar bleibt die Kopfzeile mit der modulübergreifenden
  // Suche. Der Filter der Liste steht bei der Liste und scrollt mit ihr.
  const pageHeader = page.locator("header.sticky").first();
  const search = pageHeader.getByLabel("Global suchen");

  await expect(tableHeader).toHaveCSS("position", "sticky");
  await expect(pageHeader).toHaveCSS("position", "sticky");
  await expect(search).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const [tableHeaderBox, pageHeaderBox, searchBox] = await Promise.all([
    tableHeader.boundingBox(),
    pageHeader.boundingBox(),
    search.boundingBox(),
  ]);
  expect(tableHeaderBox).not.toBeNull();
  expect(pageHeaderBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(tableHeaderBox!.y).toBeGreaterThanOrEqual(pageHeaderBox!.y + pageHeaderBox!.height - 1);
  expect(tableHeaderBox!.y).toBeLessThan(page.viewportSize()!.height);
  expect(searchBox!.y).toBeGreaterThanOrEqual(pageHeaderBox!.y);
  expect(searchBox!.y + searchBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
});
