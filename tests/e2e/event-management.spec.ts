import { expect, test } from "@playwright/test";
import { event, mockEventManagementApi as mockApi } from "./support/event-management-api";

test("pflegt Sportarten in den Auswahllisten der Einstellungen", async ({ page }) => {
  await mockApi(page);
  await page.goto("/einstellungen?tab=auswahllisten");
  await expect(page.getByRole("tab", { name: "Auswahllisten" })).toBeVisible();
  await expect(page.getByLabel("Sportart Triathlon")).toBeVisible();
  await page.getByLabel("Neue Sportart").fill("Radfahren");
  await page.getByRole("button", { name: "Hinzufügen" }).first().click();
  await expect(page.getByText("Sportart angelegt.")).toBeVisible();
  await expect(page.getByLabel("Sportart Radfahren")).toBeVisible();
  await page.getByRole("button", { name: "Deaktivieren" }).first().click();
  await expect(page.getByRole("button", { name: "Aktivieren" }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Sportart Radfahren")).toBeVisible();
});

test("pflegt Eventrollen und verwendet sie bei Eventkontakten", async ({ page }) => {
  await mockApi(page);
  await page.goto("/einstellungen?tab=auswahllisten");
  await expect(page.getByLabel("Eventrolle Anmeldung")).toBeVisible();
  await expect(page.getByLabel("Eventrolle Finanz")).toBeVisible();
  await page.getByLabel("Neue Eventrolle").fill("Presse");
  await page.getByRole("button", { name: "Hinzufügen" }).last().click();
  await expect(page.getByLabel("Eventrolle Presse")).toBeVisible();
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "KONTAKTE" }).click();
  await page.getByLabel("Eventrolle").click();
  await expect(page.getByRole("option", { name: "Anmeldung" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Finanz" })).toBeVisible();
});

test("ändert eine bestehende Eventkontakt-Rolle per Dropdown und behält sie nach Reload", async ({
  page,
}) => {
  const requests = await mockApi(page, {
    contacts: [
      {
        role: "Anmeldung",
        contact: {
          id: "p1",
          name: "Marion Kessler",
          email: "m.kessler@nordwerk.de",
          phone: "+49 40",
        },
      },
    ],
  });
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "KONTAKTE" }).click();
  await page.getByLabel("Eventrolle für Marion Kessler").click();
  await page.getByRole("option", { name: "Finanz" }).click();
  await expect(page.getByText("Eventrolle gespeichert.")).toBeVisible();
  expect(
    requests.some(
      (request) =>
        request.method === "PATCH" &&
        request.url.includes("/contacts/p1/Anmeldung") &&
        request.body?.includes('"role":"Finanz"'),
    ),
  ).toBeTruthy();

  await page.reload();
  await page.getByRole("tab", { name: "KONTAKTE" }).click();
  await expect(page.getByLabel("Eventrolle für Marion Kessler")).toHaveText(/Finanz/);
});

test("zeigt vor und nach Outlook-Sync, ob der Ordner neu erstellt oder bereits vorhanden ist", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await expect(page.getByLabel("Outlook-Ordnerstatus")).toContainText(
    "Ordner nicht vorhanden",
  );

  await page.getByRole("button", { name: "Outlook-Ordner synchronisieren" }).click();
  await expect(page.getByLabel("Outlook-Ordnerstatus")).toContainText("Ordner vorhanden");
});

test("zeigt Events aus der zentralen API in der Übersicht", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await expect(page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
  await expect(page.locator("table").getByText("Alter Veranstalter")).toBeVisible();
});

test("zeigt die kompakten Veranstaltungsansichten als Reiter", async ({ page }) => {
  await mockApi(page);
  await page.goto("/veranstaltungen");
  await expect(page.getByRole("navigation", { name: "Veranstaltungsansichten" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Liste" })).toHaveAttribute("aria-current", "page");
  await page
    .getByRole("navigation", { name: "Veranstaltungsansichten" })
    .getByRole("link", { name: "Kalender" })
    .click();
  await expect(page).toHaveURL(/\/veranstaltungen\?ansicht=kalender(?:&q=)?$/);
  await expect(page.getByRole("heading", { name: "Veranstaltungen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kalender" })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Veranstaltungsansichten" })
      .getByRole("link", { name: "Liste" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Veranstaltungsansichten" })
      .getByRole("link", { name: "Kalender" }),
  ).toHaveAttribute("aria-current", "page");
  await page.goto("/veranstaltungen?ansicht=gantt");
  await expect(page.getByRole("link", { name: "Gantt" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Bestehendes Event", { exact: true })).toBeVisible();
  await expect(page.getByText(/KW \d+/).first()).toBeVisible();
  await expect(page.locator(".border-b").filter({ hasText: /2026/ }).first()).toBeVisible();
});

test("filtert die Übersicht über den Status-Dropdown und zeigt Ordner nur als Symbole", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/");
  await expect(page.getByLabel("Status filtern")).toBeVisible();
  await page.getByLabel("Status filtern").selectOption("zugesagt");
  await expect(page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
  await page.getByLabel("Status filtern").selectOption("alle");
  await expect(page.getByLabel("Status filtern")).toHaveValue("alle");
  await expect(page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
  await expect(page.getByLabel("Statuslegende")).toBeVisible();
  await expect(page.locator("table").getByLabel("Outlook: nicht verknüpft")).toBeVisible();
  await expect(page.locator("table").getByLabel("SharePoint: nicht verknüpft")).toBeVisible();
  await expect(page.getByText("Outlook-Ordner", { exact: true })).toHaveCount(0);
  await expect(page.getByText("SharePoint-Ordner", { exact: true })).toHaveCount(0);
});

test("zeigt Kalender-Tagesansicht und Gantt-Zoom mit Eventzählung", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto("/veranstaltungen?ansicht=kalender");
  await expect(page.getByText("Mariä Himmelfahrt", { exact: true })).toBeVisible();
  const calendarScroller = page.locator(".overflow-x-auto").last();
  await expect
    .poll(() => calendarScroller.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  await page.getByRole("button", { name: "Tag" }).click();
  await expect(page.getByRole("heading", { name: "Kalender" })).toBeVisible();
  await expect(page.getByText("Keine Events", { exact: true })).not.toBeVisible();

  await page.goto("/veranstaltungen?ansicht=gantt");
  const ganttZoom = page.locator("#gantt-zoom").last();
  await ganttZoom.selectOption("monat");
  await expect(ganttZoom).toHaveValue("monat");
  await expect(page.locator(".overflow-x-auto").last()).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".overflow-x-auto")
        .last()
        .evaluate((element) => element.scrollWidth > element.clientWidth),
    )
    .toBe(true);
  await expect(page.locator("text=1").first()).toBeVisible();
});

test("reduziert die Navigation und verwendet das Bearbeiten-Symbol", async ({ page }) => {
  await mockApi(page);
  await page.goto("/veranstaltungen");
  await expect(page.getByRole("link", { name: "Kalender", exact: true })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Design-Varianten", exact: true })).toHaveCount(0);
  await expect(page.getByText("Zentrale Datenquelle: Event-Service", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: /Event bearbeiten: Bestehendes Event/ }),
  ).toBeVisible();
  for (const modul of ["Aufgaben", "Angebote", "Rechnungen"]) {
    await expect(page.getByRole("link", { name: modul, exact: true })).toHaveCount(0);
    await expect(page.getByLabel(`${modul}: In Vorbereitung`)).toBeVisible();
  }
});

test("pflegt Personen und Kunden im Menü Kunden & Kontakte", async ({ page }) => {
  await mockApi(page);
  await page.goto("/kontakte");
  await expect(page.getByRole("heading", { name: "Kunden & Kontakte" })).toBeVisible();
  await page.getByRole("link", { name: "Neu anlegen" }).click();
  await page.getByLabel("Vorname").fill("Neue");
  await page.getByLabel("Nachname").fill("Kontaktperson");
  await page.getByRole("textbox", { name: "E-Mail" }).fill("neu@example.com");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.waitForTimeout(100);
  await page.getByLabel("Suche").first().fill("Kontaktperson");
  await expect(page.getByText("Neue Kontaktperson")).toBeVisible();
  await page.getByText("Neue Kontaktperson").click();
  const email = page.getByLabel("E-Mail").last();
  await email.fill("geändert@example.com");
  await email.blur();
  await expect(page.getByText("E-Mail gespeichert")).toBeVisible();
  await page.reload();
  await page.getByLabel("Suche").first().fill("geändert@example.com");
  await expect(page.getByText("Neue Kontaktperson")).toBeVisible();
  await page.getByRole("button", { name: /Kunden \(2\)/ }).click();
  await expect(page.getByText("Nordwerk GmbH")).toBeVisible();
  await page.getByText("Nordwerk GmbH").click();
  await expect(page.getByLabel("Kundenname")).toHaveValue("Nordwerk GmbH");
  await page.getByRole("button", { name: "Detail schließen" }).click();
  await page.getByLabel("Suche").first().fill("Jonas Feld");
  await page.getByText("Jonas Feld").click();
  const contactSearch = page.getByRole("combobox", { name: "Kontakt zuordnen" });
  await contactSearch.fill("Marion");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "Marion Kessler" })).toBeVisible();
  await contactSearch.press("ArrowDown");
  await contactSearch.press("Enter");
  await expect(page.getByRole("button", { name: "Marion Kessler", exact: true })).toBeVisible();
  await contactSearch.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Detail schließen" })).toHaveCount(0);
  await page.getByRole("link", { name: "Neu anlegen" }).click();
  await expect(page.getByText("Zahlungsziel", { exact: true })).toHaveCount(0);
});

test("fügt einen per Combobox angeklickten Kontakt im Kundenprofil hinzu", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("t2w-crm-v1"));
  await mockApi(page);
  await page.goto("/kontakte");
  await page.getByRole("button", { name: /Kunden \(2\)/ }).click();
  await page.getByLabel("Suche").first().fill("Jonas Feld");
  await page.getByText("Jonas Feld").click();
  await expect(page.getByRole("heading", { name: "Jonas Feld" })).toBeVisible();
  const search = page.getByRole("combobox", { name: "Kontakt zuordnen" });
  await search.fill("Marion");
  await page.getByRole("option", { name: "Marion Kessler" }).click();
  await expect(page.getByRole("button", { name: "Marion Kessler ×" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Kunden \(2\)/ }).click();
  await page.getByLabel("Suche").first().fill("Jonas Feld");
  await page.getByText("Jonas Feld").click();
  await expect(page.getByRole("button", { name: "Marion Kessler ×" })).toBeVisible();
});

test("fügt einen per Combobox angeklickten Kunden im Kontakt hinzu", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("t2w-crm-v1"));
  const requests = await mockApi(page);
  await page.goto("/kontakte");
  await page.getByLabel("Suche").first().fill("Marion Kessler");
  await page.getByText("Marion Kessler").click();
  await expect(page.getByRole("heading", { name: "Marion Kessler" })).toBeVisible();
  const search = page.getByRole("combobox", { name: "Kunde zuordnen" });
  await search.fill("Jonas Feld");
  await page.getByRole("option", { name: "Jonas Feld" }).click();
  await expect(page.getByText("Kundenzuordnung gespeichert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Jonas Feld", exact: true })).toBeVisible();
  expect(
    requests.some(
      ({ method, url }) => method === "PUT" && url.endsWith("/api/v1/organizers/c2/contacts/p1"),
    ),
  ).toBeTruthy();
  await page.reload();
  await page.getByLabel("Suche").first().fill("Marion Kessler");
  await page.getByText("Marion Kessler").click();
  await expect(page.getByRole("button", { name: "Jonas Feld", exact: true })).toBeVisible();
});

test("verwendet in Veranstaltungen dieselbe schlanke Eventtabelle wie in der Übersicht", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/veranstaltungen");
  const table = page.locator("table");
  await expect(table).toBeVisible();
  await expect(table.locator("thead th")).toHaveCount(8);
  await expect(table.locator("thead")).toContainText("St");
  await expect(table.locator("thead")).toContainText("Aufgaben");
  await expect(table.locator("[title='Outlook und SharePoint']")).toBeVisible();
  await expect(table.getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
});

test("ordnet die Spaltenauswahl in Veranstaltungen bei den Filtern ein", async ({ page }) => {
  await mockApi(page);
  await page.goto("/veranstaltungen");

  const filterZeile = page.getByRole("group", { name: "Eventfilter und Tabellenspalten" });
  await expect(filterZeile.getByRole("button", { name: "Spalten auswählen" })).toBeVisible();
  await expect(filterZeile).toContainText("Alle Status");
  await expect(filterZeile).toContainText("Alle Zeiträume");
  await expect(filterZeile).toContainText("Nur aktive");
});

test("legt ein Event über POST an und öffnet den API-Datensatz", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/");
  await expect(page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
  const openButton = page.getByRole("button", { name: "Event anlegen", exact: true }).first();
  await expect(openButton).toBeVisible();
  await openButton.click();
  await expect(page.getByText("Neues Event anlegen", { exact: true })).toBeVisible();
  const startDate = page.getByLabel(/Startdatum/);
  const endDate = page.getByLabel(/Enddatum/);
  await expect(startDate).toBeVisible();
  await expect(endDate).toBeVisible();
  expect(
    Math.abs(((await startDate.boundingBox())?.y ?? 0) - ((await endDate.boundingBox())?.y ?? 0)),
  ).toBeLessThan(1);
  await page.getByLabel(/Eventname/).fill("Neues E2E Event");
  await page.getByLabel("Veranstalter aus Stammdaten").fill("Jonas");
  await page.getByRole("button", { name: "Jonas Feld", exact: true }).click();
  await page.getByLabel("Sportart").click();
  await page.getByRole("option", { name: "Triathlon" }).click();
  await page.getByLabel(/Startdatum/).fill("2026-08-21");
  const code = page.getByLabel("Eventcode-Vorschau");
  await expect(code).toHaveValue("260821_neues_e2e_event");
  await code.fill("260821_sondercode");
  await page.getByRole("button", { name: "Event anlegen" }).last().click();
  await expect(page).toHaveURL(/\/events\/260821_sondercode$/);
  await expect(page.getByRole("heading", { name: "Neues E2E Event", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Veranstalter aus Stammdaten" })).toHaveText(
    "Jonas Feld",
  );
  expect(
    requests.some(
      (request) => request.method === "POST" && request.body?.includes('"organizerId":"c2"'),
    ),
  ).toBeTruthy();
});

test("öffnet das Anlage-Modal im Kalender, sucht Veranstalter und legt das Event an", async ({
  page,
}) => {
  const requests = await mockApi(page);
  await page.goto("/veranstaltungen");
  await page
    .getByRole("navigation", { name: "Veranstaltungsansichten" })
    .getByRole("link", { name: "Kalender" })
    .click();
  await expect(page).toHaveURL(/\/veranstaltungen\?ansicht=kalender(?:&q=)?$/);
  await expect(page.getByRole("heading", { name: "Kalender" })).toBeVisible();
  await expect(page.getByText("Bestehendes Event", { exact: true })).toBeVisible();
  const trigger = page.getByRole("button", { name: "Event anlegen", exact: true }).first();
  await trigger.click();

  // Radix rendert den Inhalt in einem Portal, daher wird über seinen Titel
  // auf die tatsächliche, sichtbare Modal-Instanz synchronisiert.
  await expect(page.getByText("Neues Event anlegen", { exact: true })).toBeVisible();
  await page.getByLabel(/Eventname/).fill("Kalender Event");
  await page.getByLabel("Veranstalter aus Stammdaten").fill("Jonas");
  await expect(page.getByRole("button", { name: "Jonas Feld", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Jonas Feld", exact: true }).click();
  await page.getByLabel("Sportart").click();
  await page.getByRole("option", { name: "Laufen" }).click();
  await page.getByLabel(/Startdatum/).fill("2026-08-21");
  await page.getByRole("button", { name: "Event anlegen", exact: true }).last().click();
  await expect(page).toHaveURL(/\/events\/260821_kalender_event$/);
  expect(
    requests.some(({ method, url, body }) => {
      if (method !== "POST" || !url.endsWith("/api/v1/events")) return false;
      const payload = JSON.parse(body ?? "{}");
      return payload.organizerId === "c2" && payload.sportId === "s2";
    }),
  ).toBeTruthy();
});

test("validiert Veranstalter und Sportart im Anlage-Modal", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await expect(page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Event anlegen", exact: true }).first().click();
  await page.getByLabel(/Eventname/).fill("Pflichtfeldtest");
  await page.getByLabel(/Startdatum/).fill("2026-08-22");
  await page.getByRole("button", { name: "Event anlegen" }).last().click();
  await expect(page.getByText("Bitte einen Veranstalter auswählen.")).toBeVisible();
  await page.getByLabel("Veranstalter aus Stammdaten").fill("Nordwerk");
  await page.getByRole("button", { name: "Nordwerk GmbH", exact: true }).click();
  await page.getByRole("button", { name: "Event anlegen" }).last().click();
  await expect(page.getByText("Bitte eine Sportart auswählen.")).toBeVisible();
});

test("speichert den Veranstalter der Detailseite über seine Stammdaten-ID", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await page.getByLabel("Veranstalter aus Stammdaten").click();
  await page.getByRole("option", { name: "Jonas Feld" }).click();
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Änderungen gespeichert.")).toBeVisible();
  expect(
    requests.some(
      (request) =>
        request.method === "PATCH" &&
        request.body?.includes('"organizerId":"c2"') &&
        request.body.includes('"payoutRecipientId":"c2"') &&
        request.body.includes('"invoiceRecipientIds":["c2"]'),
    ),
  ).toBeTruthy();
});

test("zeigt die Unveränderlichkeit direkt am Eventcode-Feld", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await expect(
    page.getByText("Der Eventcode ist unveränderlich.", { exact: true }),
  ).not.toBeVisible();
  await expect(page.getByText("(unveränderlich)", { exact: true })).toBeVisible();
});

test("speichert die Hauptansprechperson eines Kunden", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/kontakte");
  await page.getByRole("button", { name: /Kunden \(2\)/ }).click();
  await page.getByText("Nordwerk GmbH", { exact: true }).click();
  await page.getByRole("combobox", { name: "Hauptansprechperson" }).selectOption("p1");

  await expect
    .poll(() =>
      requests.some(
        ({ method, url, body }) =>
          method === "PATCH" &&
          url.endsWith("/api/v1/organizers/c1") &&
          JSON.parse(body ?? "{}").primaryContactId === "p1",
      ),
    )
    .toBeTruthy();
  await page.reload();
  await page.getByRole("button", { name: /Kunden \(2\)/ }).click();
  await page.getByText("Nordwerk GmbH", { exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Hauptansprechperson" })).toHaveValue("p1");
});

test("sortiert Kunden und Kontakte über die Tabellenüberschriften", async ({ page }) => {
  await mockApi(page);
  await page.goto("/kontakte");

  const contactRows = page.locator("tbody tr");
  await expect(contactRows.first()).toContainText("Jonas Feld");
  await page.getByRole("button", { name: "E-Mail sortieren" }).click();
  await page.getByRole("button", { name: "E-Mail sortieren" }).click();
  await expect(contactRows.first()).toContainText("Marion Kessler");

  await page.getByRole("button", { name: /Kunden \(2\)/ }).click();
  const customerRows = page.locator("tbody tr");
  await expect(customerRows.first()).toContainText("Jonas Feld");
  await page.getByRole("button", { name: "UID sortieren" }).click();
  await page.getByRole("button", { name: "UID sortieren" }).click();
  await expect(customerRows.first()).toContainText("Nordwerk GmbH");
});

test("speichert die gewählte Kunden-Tabellenspalten im Browser", async ({ page }) => {
  await mockApi(page);
  await page.goto("/kontakte");
  await page.evaluate(() => localStorage.removeItem("t2w-customer-table-columns"));
  await page.reload();
  await page.getByRole("button", { name: /Kunden \(2\)/ }).click();
  await expect(page.getByRole("button", { name: "E-Mail sortieren" })).toBeVisible();

  await page.getByRole("button", { name: "Spalten auswählen" }).click();
  await page.getByRole("checkbox", { name: "E-Mail" }).click();
  await expect(page.getByRole("button", { name: "E-Mail sortieren" })).toHaveCount(0);

  await page.reload();
  await page.getByRole("button", { name: /Kunden \(2\)/ }).click();
  await expect(page.getByRole("button", { name: "E-Mail sortieren" })).toHaveCount(0);
});

test("navigiert mobil durch Kalender und Gantt ohne verlorenes Hauptmenü", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/kalender");
  const heading = page.getByRole("heading", { name: "Kalender" });
  await expect(heading).toBeVisible();
  const calendar = page.getByTestId("calendar-scroll-area");
  await expect
    .poll(() => calendar.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  await expect(page.getByLabel("Navigation öffnen")).toBeVisible();
  await page.goto("/gantt");
  const gantt = page.getByTestId("gantt-scroll-area");
  await gantt.evaluate((element) => {
    element.scrollLeft = element.scrollWidth / 2;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(() => gantt.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  await expect(page.getByLabel("Navigation öffnen")).toBeVisible();
  expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("zeigt Events mobil priorisiert und hält wichtige Touch-Ziele sowie Sticky-Header getrennt", async ({
  page,
}) => {
  await mockApi(page);
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/");

  const mobileList = page.getByLabel("Veranstaltungen mobile Liste");
  await expect(mobileList).toBeVisible();
  await expect(mobileList.getByText("Bestehendes Event")).toBeVisible();
  await expect(mobileList.getByText("Alter Veranstalter")).toBeVisible();
  await expect(page.locator("table").first()).toBeHidden();

  for (const target of [
    page.getByLabel("Navigation öffnen"),
    page.getByRole("button", { name: "Alle aktiven" }),
    mobileList.getByRole("link", { name: "Bestehendes Event" }),
  ]) {
    const box = await target.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }

  const appHeader = page.locator("div.sticky.top-0").first();
  const pageHeader = page.locator("header.sticky").first();
  const positions = await Promise.all([appHeader.boundingBox(), pageHeader.boundingBox()]);
  expect((positions[1]?.y ?? 0) + 1).toBeGreaterThanOrEqual(
    (positions[0]?.y ?? 0) + (positions[0]?.height ?? 0),
  );
  expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("trennt Tabellen-Detailnavigation von Outlook-, SharePoint- und Bearbeiten-Aktionen", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/");
  await expect(page.locator('tbody tr[role="link"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Event bearbeiten: Bestehendes Event/ })).toBeVisible();
});

test("schließt Kontakt-Dialog und Detail-Sheet per Escape mit Fokus-Rückgabe", async ({ page }) => {
  await mockApi(page);
  await page.goto("/kontakte");

  const createTrigger = page.getByRole("link", { name: "Neu anlegen" });
  await createTrigger.click();
  await expect(page.getByRole("dialog", { name: "Neu anlegen" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Neu anlegen" })).toHaveCount(0);
  await expect(createTrigger).toBeFocused();

  await page.getByText("Marion Kessler", { exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Marion Kessler" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Marion Kessler" })).toHaveCount(0);
});

test("speichert Funktion und Ort eines neuen Kontakts auch nach Reload", async ({ page }) => {
  await mockApi(page);
  await page.goto("/kontakte");
  await page.getByRole("link", { name: "Neu anlegen" }).click();
  await page.getByLabel("Vorname").fill("Eva");
  await page.getByLabel("Nachname").fill("Persistenz");
  await page.getByRole("textbox", { name: "Funktion" }).fill("Projektleitung");
  await page.getByRole("textbox", { name: "Ort" }).fill("Graz");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Datensatz angelegt")).toBeVisible();
  await page.getByLabel("Suche").first().fill("Eva Persistenz");
  await page.getByText("Eva Persistenz").click();
  await expect(page.getByLabel("Funktion").last()).toHaveValue("Projektleitung");
  await expect(page.getByLabel("Ort").last()).toHaveValue("Graz");
  await page.reload();
  await page.getByLabel("Suche").first().fill("Eva Persistenz");
  await page.getByText("Eva Persistenz").click();
  await expect(page.getByLabel("Funktion").last()).toHaveValue("Projektleitung");
  await expect(page.getByLabel("Ort").last()).toHaveValue("Graz");
});

test("zeigt die getrennte TIME2WIN-Verknüpfung im Event-Workspace", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "TIME2WIN" }).click();
  await expect(page.getByLabel("Event Id")).toBeVisible();
  await expect(page.getByText("Gemeldete TN:")).toBeVisible();
  await expect(page.getByText("Status: NEVER")).toBeVisible();
});

test("pflegt Auszahlungs- und mehrere Rechnungsempfänger im Finanz-Reiter", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "FINANZ" }).click();
  await page.getByRole("combobox", { name: "Auszahlungsempfänger" }).click();
  await page.getByRole("option", { name: "Jonas Feld" }).click();
  const recipientDetails = page.getByLabel("Stammdaten Auszahlungsempfänger");
  await expect(recipientDetails).toContainText("Jonas Feld");
  await expect(recipientDetails).toContainText("Hauptstraße 4, 1010 Wien, Österreich");
  await expect(recipientDetails).toContainText("AT611904300234573201");
  await expect(recipientDetails).toContainText("BKAUATWW");
  await page.getByRole("button", { name: "Rechnungsempfänger auswählen" }).click();
  await page.getByLabel("Rechnungsempfänger suchen").fill("Jonas");
  await page.getByText("Jonas Feld", { exact: true }).last().click();
  const invoiceDetails = page.getByLabel("Stammdaten Rechnungsempfänger");
  await expect(invoiceDetails).toContainText("Nordwerk GmbH");
  await expect(invoiceDetails).toContainText("Jonas Feld");
  await expect(invoiceDetails).toContainText("BKAUATWW");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Änderungen gespeichert.")).toBeVisible();
  expect(
    requests.some(
      (request) =>
        request.method === "PATCH" &&
        request.body?.includes('"payoutRecipientId":"c2"') &&
        request.body.includes('"invoiceRecipientIds":["c1","c2"]'),
    ),
  ).toBeTruthy();
});

test("zeigt Veranstalterkontakte und übernimmt sie als Eventkontakt", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "KONTAKTE" }).click();
  await expect(page.getByRole("heading", { name: "Kontakte des Veranstalters" })).toBeVisible();
  await expect(page.getByText("Marion Kessler", { exact: true })).toBeVisible();
  await page
    .getByText("Marion Kessler", { exact: true })
    .locator("xpath=../..")
    .getByRole("button", { name: "Als Eventkontakt übernehmen" })
    .click();
  await expect(page.getByRole("button", { name: "Bereits Eventkontakt" })).toBeVisible();
  await expect(page.getByText("Marion Kessler", { exact: true })).toHaveCount(2);
  expect(
    requests.some(
      (request) =>
        request.method === "POST" &&
        request.url.includes(`/api/v1/events/${event.id}/contacts/p1`) &&
        request.body?.includes('"role":"Kontakt"'),
    ),
  ).toBeTruthy();
});

test("prüft Mail- und Telefonnummern im Kontakt-Detailformular", async ({ page }) => {
  await mockApi(page);
  await page.goto("/kontakte");
  await page.getByText("Marion Kessler", { exact: true }).click();
  const email = page.getByRole("textbox", { name: "E-Mail" });
  await email.fill("keine-mail");
  await email.blur();
  await expect(page.getByRole("alert")).toHaveText("Bitte eine gültige Mail-Adresse angeben.");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  const phone = page.getByLabel("Telefon privat");
  await phone.fill("nicht-erlaubt");
  await phone.blur();
  await expect(phone.locator("xpath=..").getByRole("alert")).toHaveText(
    "Bitte eine gültige Telefonnummer angeben.",
  );
  await expect(phone).toHaveAttribute("aria-invalid", "true");
});

test("zeigt Outlook und SharePoint als Symbole in der Übersicht", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  const ordnerSpalte = page.locator("thead th").nth(6).locator("[title='Outlook und SharePoint']");
  await expect(ordnerSpalte).toHaveAttribute("title", "Outlook und SharePoint");
  await expect(page.locator("table").getByLabel("Outlook: nicht verknüpft")).toBeVisible();
  await expect(page.locator("table").getByLabel("SharePoint: nicht verknüpft")).toBeVisible();
});

test("öffnet den Outlook-Ordner per Deep Link in Übersicht und Veranstaltungen", async ({
  page,
}) => {
  const outlookFolderUrl = "https://outlook.office.com/mail/deeplink/folder/AQMkADAwATM0MDA=";
  await mockApi(page, {
    outlookFolder: "06_auftraege_26/Q3/260820_demo_event",
    outlookWebUrl: outlookFolderUrl,
  });

  await page.goto("/");
  await expect(page.locator("table").getByTitle("Outlook öffnen")).toHaveAttribute("href", outlookFolderUrl);

  await page.goto("/veranstaltungen");
  await expect(page.locator("table").getByTitle("Outlook öffnen")).toHaveAttribute("href", outlookFolderUrl);
});

test("zeigt den Eventcode in der Metadatenzeile des Events", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  const metadaten = page.locator("h1 + div");
  await expect(metadaten).toContainText("260820_demo_event");
  await expect(metadaten).toContainText("Alter Veranstalter");
  await expect(metadaten).toContainText("20.08.2026");
});

test("speichert Outlook- und SharePoint-Einstellungen persistent über PATCH", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/einstellungen?tab=outlook");
  await page.locator('input[aria-label="Jahr"]').last().fill("2026");
  await page.locator('input[aria-label="Jahresordnername"]').fill("06_auftraege_26");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  expect(
    requests.some(
      (request) =>
        request.method === "PATCH" &&
        request.url.endsWith("/api/v1/settings") &&
        request.body?.includes("06_auftraege_26"),
    ),
  ).toBeTruthy();
  await expect(page.getByText("Einstellungen gespeichert.")).toBeVisible();
});

test("synchronisiert ein Event mit dem konfigurierten Shared-Mailbox-Stammordner", async ({
  page,
}) => {
  const requests: { method: string; url: string; body?: string }[] = [];
  const syncedEvent = {
    ...event,
    outlookFolder: "2026 / Q3 / 260820_demo_event",
    outlookWebUrl: "https://outlook.office.com/mail/",
    outlookMailbox: "info@time2win.at",
    outlookFolderSyncStatus: "SUCCESS",
    outlookFolderLastSuccessAt: "2026-08-21T12:00:00.000Z",
    outlookFolderLastError: null,
  };

  await page.route("**/api/v1/settings**", async (route) => {
    requests.push({
      method: route.request().method(),
      url: route.request().url(),
      body: route.request().postData() ?? undefined,
    });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        outlookJahresordner: [],
        jahresSites: [],
        outlookMailbox: "info@time2win.at",
        outlookJahresordner: [{ jahr: "2026", url: "06_auftraege_26" }],
      }),
    });
  });
  await page.route("**/api/v1/events**", async (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([event]),
    });
  });
  await page.route("**/api/v1/events/260820_demo_event*", async (route) => {
    const request = route.request();
    requests.push({
      method: request.method(),
      url: request.url(),
      body: request.postData() ?? undefined,
    });
    if (request.method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(event),
      });
    }
    return route.fallback();
  });
  await page.route(
    "**/api/v1/events/11111111-1111-4111-8111-111111111111/outlook-folder/sync",
    async (route) => {
      const request = route.request();
      requests.push({
        method: request.method(),
        url: request.url(),
        body: request.postData() ?? undefined,
      });
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(syncedEvent),
      });
    },
  );

  await page.goto("/events/260820_demo_event");
  await page.getByRole("button", { name: "Outlook-Ordner synchronisieren" }).click();
  await expect(page.getByRole("status")).toContainText("Outlook-Ordner synchronisiert.");
  expect(
    requests.some(
      (request) => request.method === "POST" && request.url.endsWith("/outlook-folder/sync"),
    ),
  ).toBeTruthy();
});
