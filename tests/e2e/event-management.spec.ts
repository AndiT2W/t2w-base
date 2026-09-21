import { expect, test } from "@playwright/test";
import { event, mockEventManagementApi as mockApi } from "./support/event-management-api";

// Seit der verpflichtenden Anmeldung landet jeder Ablauf ohne Sitzung auf der
// Loginseite. Wie in hardware.spec.ts stellt der Hook eine Admin-Sitzung bereit.
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

test("pflegt Sportarten in den Auswahllisten der Einstellungen", async ({ page }) => {
  await mockApi(page);
  await page.goto("/einstellungen?tab=auswahllisten&liste=sportarten");
  await expect(page.getByRole("link", { name: "Auswahllisten", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Sportarten", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Sportart Triathlon" })).toBeVisible();
  await expect(page.getByLabel("Sportartvorschau: Triathlon")).toContainText("Triathlon");
  await page.getByRole("button", { name: "Darstellung für Sportart Triathlon" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Radfahren" }).click();
  await expect(page.getByText("Sportart gespeichert.").last()).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("Neue Sportart").first().fill("Radfahren");
  await page.getByRole("button", { name: "Hinzufügen" }).first().click();
  await expect(page.getByText("Sportart angelegt.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Sportart Radfahren" })).toBeVisible();
  await page.getByRole("button", { name: "Deaktivieren" }).first().click();
  await expect(page.getByRole("button", { name: "Aktivieren" }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Sportart Radfahren" })).toBeVisible();
});

test("pflegt Hardware-Objekte als persistente Auswahlliste", async ({ page }) => {
  await mockApi(page);
  await page.goto("/einstellungen?tab=auswahllisten&liste=hardwareobjekte");
  await expect(page.getByRole("tab", { name: "Hardware-Objekte" })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Hardware-Objekt Active Transponder (T2W)" }),
  ).toBeVisible();
  await page.getByLabel("Neues Hardware-Objekt").first().fill("Decoder");
  await page.getByRole("button", { name: "Hardware-Objekt hinzufügen" }).first().click();
  await expect(page.getByRole("textbox", { name: "Hardware-Objekt Decoder" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Hardware-Objekt Decoder" })).toBeVisible();
});

test("pflegt Services in den Auswahllisten und speichert mehrere Services beim Event", async ({
  page,
}) => {
  const requests = await mockApi(page);
  await page.goto("/einstellungen?tab=auswahllisten&liste=services");
  await expect(page.getByRole("textbox", { name: "Service UHF", exact: true })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Service Video (iRewind)", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Servicevorschau: UHF")).toContainText("UHF");
  await page.getByRole("button", { name: "Darstellung für Service UHF" }).click();
  // 35 Symbole (ein Satz für alle Listen) + 8 Farben + Schließen.
  await expect(page.getByRole("dialog").getByRole("button")).toHaveCount(44);
  await page.getByRole("dialog").getByRole("button", { name: "Video" }).click();
  await expect(page.getByText("Service gespeichert.").last()).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Violett" }).click();
  await expect(page.getByText("Service gespeichert.").last()).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.getByLabel("Servicevorschau: UHF")).toContainText("UHF");
  const uhfName = await page
    .getByRole("textbox", { name: "Service UHF", exact: true })
    .boundingBox();
  const videoName = await page
    .getByRole("textbox", { name: "Service Video (iRewind)", exact: true })
    .boundingBox();
  expect(uhfName?.x).toBe(videoName?.x);
  await page.getByLabel("Neuer Service").first().fill("Drohne");
  await page.getByRole("button", { name: "Hinzufügen" }).nth(1).click();
  await expect(page.getByRole("textbox", { name: "Service Drohne", exact: true })).toBeVisible();

  await page.goto("/events/260820_demo_event");
  await page.getByRole("button", { name: "Services auswählen" }).click();
  await page.getByRole("checkbox", { name: "UHF" }).click();
  await page.getByRole("checkbox", { name: "Video (iRewind)" }).click();
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Änderungen gespeichert.")).toBeVisible();
  expect(
    requests.some(
      (request) =>
        request.method === "PATCH" &&
        JSON.parse(request.body ?? "{}")
          .serviceIds?.sort()
          .join(",") === "service-1,service-5",
    ),
  ).toBeTruthy();
  await page.reload();
  const selectedServices = page.getByRole("button", { name: "Services auswählen" });
  await expect(selectedServices).toContainText("UHF");
  await expect(selectedServices).toContainText("Video (iRewind)");
  await expect(selectedServices.locator("svg")).toHaveCount(2);
});

test("zeigt Sportarten, Services und Hardware-Objekte im einheitlichen verschiebbaren Layout", async ({
  page,
}) => {
  await mockApi(page);
  // Vier Spalten: Vorschau, Name, Darstellung, Aktivschalter. Die frühere
  // Klasse deklarierte fünf — der fünfte Track blieb immer leer.
  const rowClass = "lg:grid-cols-[10rem_minmax(12rem,1fr)_9rem_9rem]";

  for (const [liste, textboxName] of [
    ["sportarten", "Sportart Triathlon"],
    ["services", "Service UHF"],
    ["hardwareobjekte", "Hardware-Objekt Active Transponder (T2W)"],
  ] as const) {
    await page.goto(`/einstellungen?tab=auswahllisten&liste=${liste}`);
    const row = page.locator('[draggable="true"]').filter({
      has: page.getByRole("textbox", { name: textboxName, exact: true }),
    });
    await expect(row).toHaveCount(1);
    await expect.poll(async () => row.getAttribute("class")).toContain(rowClass);
    await expect(row).toHaveAttribute("draggable", "true");
  }
});

test("pflegt Eventrollen und verwendet sie bei Eventkontakten", async ({ page }) => {
  await mockApi(page);
  await page.goto("/einstellungen?tab=auswahllisten&liste=eventrollen");
  await expect(page.getByRole("textbox", { name: "Eventrolle Anmeldung" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Eventrolle Finanz" })).toBeVisible();
  await expect(page.getByLabel("Eventrollenvorschau: Anmeldung")).toContainText("Anmeldung");
  await page.getByRole("button", { name: "Darstellung für Eventrolle Anmeldung" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Rot" }).click();
  await expect(page.getByText("Eventrolle gespeichert.").last()).toBeVisible();
  await page.getByRole("button", { name: "Darstellung für Eventrolle Anmeldung" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Euro" }).click();
  await expect(page.getByText("Eventrolle gespeichert.").last()).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("Neue Eventrolle").fill("Presse");
  await page.getByRole("button", { name: "Hinzufügen" }).last().click();
  await expect(page.getByRole("textbox", { name: "Eventrolle Presse" })).toBeVisible();
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Kontakte" }).click();
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
  await page.getByRole("tab", { name: "Kontakte" }).click();
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
  await page.getByRole("tab", { name: "Kontakte" }).click();
  await expect(page.getByLabel("Eventrolle für Marion Kessler")).toHaveText(/Finanz/);
});

test("zeigt vor und nach Outlook-Sync, ob der Ordner neu erstellt oder bereits vorhanden ist", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await expect(page.getByLabel("Outlook-Ordnerstatus")).toContainText("Ordner nicht vorhanden");

  await page.getByRole("button", { name: "Outlook-Ordner synchronisieren" }).click();
  await expect(page.getByLabel("Outlook-Ordnerstatus")).toContainText("Ordner vorhanden");
});

test("zeigt synchronisierte TIME2WIN-Teilnehmer im Event", async ({ page }) => {
  await mockApi(page, { t2wEventId: 1082, time2winSyncStatus: "NEVER" });
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Anmeldung" }).click();

  await page.getByRole("button", { name: "Jetzt synchronisieren" }).click();

  await expect(page.getByText("Gemeldete TN:", { exact: false }).first()).toContainText("300");
  const participantTable = page.getByRole("table", { name: "TIME2WIN Teilnehmer nach Bewerb" });
  await expect(participantTable.getByRole("columnheader", { name: "Bewerb" })).toBeVisible();
  await expect(participantTable.getByRole("columnheader", { name: "Gemeldete TN" })).toBeVisible();
  await expect(participantTable.getByRole("cell", { name: "OstseeMan Langdistanz" })).toBeVisible();
  await expect(participantTable.getByRole("cell", { name: "300" })).toHaveCount(2);
});

test("zeigt Events aus der zentralen API in der Übersicht", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await expect(
    page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true }),
  ).toBeVisible();
  await expect(page.locator("table").getByText("Alter Veranstalter").first()).toBeVisible();
});

test("verlinkt angezeigte Veranstalter mit ihrem Kundendatensatz", async ({ page }) => {
  await mockApi(page);

  for (const path of ["/", "/veranstaltungen", "/angebote", "/rechnungen"] as const) {
    await page.goto(path);
    if (path === "/") await page.getByRole("button", { name: "Alle aktiven" }).click();
    const organizers = page.getByRole("link", { name: "Alter Veranstalter", exact: true });
    await expect(organizers.first()).toBeVisible();
    for (const organizer of await organizers.all()) {
      await expect(organizer).toHaveAttribute("href", "/kontakte?kunde=c1");
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Alle aktiven" }).click();
  await expect(
    page.getByRole("link", { name: "Alter Veranstalter", exact: true }).first(),
  ).toHaveAttribute("href", "/kontakte?kunde=c1");

  await page.goto("/events/260820_demo_event");
  const organizer = page.getByRole("link", { name: "Alter Veranstalter", exact: true });
  await expect(organizer).toHaveAttribute("href", "/kontakte?kunde=c1");
  await organizer.click();

  await expect(page).toHaveURL(/\/kontakte\?kunde=c1$/);
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Nordwerk GmbH" }),
  ).toBeVisible();
});

test("lädt Events in 500er-Seiten und zeigt standardmäßig das aktuelle Jahr", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/veranstaltungen");

  // Der Zeitraum steht als Auswahlchip mit nativem select; geprüft wird sein Wert.
  await expect(page.getByLabel("Zeitraum", { exact: true })).toHaveValue("jahr");
  await expect(page.getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
  await expect(page.getByText("Folgetermin", { exact: true })).toHaveCount(0);
  await expect
    .poll(() =>
      requests.some(
        (request) =>
          request.method === "GET" && request.url.endsWith("/api/v1/events?limit=500&offset=0"),
      ),
    )
    .toBe(true);
});

test("filtert Veranstaltungen nach dem nächsten Kalenderjahr", async ({ page }) => {
  await mockApi(page, {}, {}, [
    {
      id: "66666666-6666-4666-8666-666666666666",
      eventCode: "270115_naechstes_jahr",
      name: "Nächstes Jahr Event",
      startAt: "2027-01-15T00:00:00.000Z",
      endAt: "2027-01-15T00:00:00.000Z",
    },
  ]);
  await page.goto("/veranstaltungen");

  const table = page.locator("table");
  await expect(table.getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
  await expect(table.getByRole("link", { name: "Nächstes Jahr Event", exact: true })).toHaveCount(
    0,
  );

  const zeitraum = page.getByLabel("Zeitraum", { exact: true });
  await expect(zeitraum).toHaveValue("jahr");
  await zeitraum.selectOption("naechstes-jahr");

  await expect(zeitraum).toHaveValue("naechstes-jahr");
  await expect(table.getByRole("link", { name: "Nächstes Jahr Event", exact: true })).toBeVisible();
  await expect(table.getByRole("link", { name: "Bestehendes Event", exact: true })).toHaveCount(0);
});

test("verknüpft mehrere Events per Mehrfachauswahl und zeigt die Seriennachbarn als Badges", async ({
  page,
}) => {
  const thirdEvent = {
    ...event,
    id: "44444444-4444-4444-8444-444444444444",
    eventCode: "280822_demo_event",
    name: "Dritter Termin",
    startAt: "2028-08-22T00:00:00.000Z",
    endAt: "2028-08-22T00:00:00.000Z",
  };
  const requests = await mockApi(page, {}, {}, [thirdEvent]);
  await page.goto("/events/260820_demo_event");
  await page.getByRole("button", { name: "Eventserie verwalten" }).click();
  await page.getByLabel("Events dieser Serie auswählen").click();
  await page.getByRole("checkbox", { name: /Folgetermin/ }).check();
  await page.getByRole("checkbox", { name: /Dritter Termin/ }).check();
  await expect(page.getByLabel("Events dieser Serie auswählen")).toContainText(
    "2 Events ausgewählt",
  );
  await expect(page.getByLabel("Ausgewählte Serientermine")).toContainText("Folgetermin");
  await expect(page.getByLabel("Ausgewählte Serientermine")).toContainText("Dritter Termin");
  await page.getByRole("button", { name: "Auswahl übernehmen" }).click();
  await page.getByRole("button", { name: "Eventserie speichern" }).click();
  await expect(page.getByText("Eventserie gespeichert.")).toBeVisible();
  await expect(page.getByTestId("next-series-event")).toContainText("Folgetermin");

  const seriesRequest = requests.find(
    (request) =>
      request.method === "PATCH" &&
      request.url.endsWith("/api/v1/events/11111111-1111-4111-8111-111111111111/series"),
  );
  expect(JSON.parse(seriesRequest?.body ?? "{}").targetEventIds).toEqual([
    "33333333-3333-4333-8333-333333333333",
    "44444444-4444-4444-8444-444444444444",
  ]);

  await page.reload();
  await expect(page.getByTestId("next-series-event")).toContainText("Folgetermin");

  await page.goto("/events/270821_demo_event");
  await expect(page.getByTestId("previous-series-event")).toContainText("Bestehendes Event");
  await expect(page.getByTestId("next-series-event")).toContainText("Dritter Termin");
  await expect(page.getByTestId("previous-series-event")).toHaveClass(/rounded-/);
  await expect(page.getByTestId("next-series-event")).toHaveClass(/rounded-/);
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
  await expect(page).toHaveURL(/\/veranstaltungen\?(?:q=[^&]*&)?ansicht=kalender$/);
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
  await expect(
    page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Status filtern").selectOption("alle");
  await expect(page.getByLabel("Status filtern")).toHaveValue("alle");
  await expect(
    page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Statuslegende")).toBeVisible();
  await expect(page.locator("table").getByLabel("Outlook: nicht verknüpft").first()).toBeVisible();
  await expect(
    page.locator("table").getByLabel("SharePoint: nicht verknüpft").first(),
  ).toBeVisible();
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

test("reduziert die Navigation und öffnet das Event über seinen Namen", async ({ page }) => {
  await mockApi(page);
  await page.goto("/veranstaltungen");
  await expect(page.getByRole("link", { name: "Kalender", exact: true })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Design-Varianten", exact: true })).toHaveCount(0);
  await expect(page.getByText("Zentrale Datenquelle: Event-Service", { exact: true })).toHaveCount(
    0,
  );
  // Die Aktionsspalte entfällt (Nutzerwunsch 19.09.2026): der Eventname führt
  // ins Detail, ein zweites Bearbeiten-Symbol daneben trug nichts bei.
  await expect(page.getByRole("link", { name: /Event bearbeiten:/ })).toHaveCount(0);
  await expect(
    page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true }),
  ).toHaveAttribute("href", "/events/260820_demo_event");
  await expect(page.getByRole("link", { name: "Aufgaben", exact: true })).toBeVisible();
  for (const modul of ["Angebote", "Rechnungen"]) {
    await expect(page.getByRole("link", { name: modul, exact: true })).toHaveCount(0);
    await expect(page.getByLabel(`${modul}: In Vorbereitung`)).toBeVisible();
  }
});

test("pflegt Personen und Kunden im Menü Kunden & Kontakte", async ({ page }) => {
  await mockApi(page);
  await page.goto("/kontakte");
  await expect(page.getByRole("heading", { name: "Kunden & Kontakte" })).toBeVisible();
  await expect(
    page.getByLabel("Breadcrumb").getByRole("link", { name: "Übersicht" }),
  ).toHaveAttribute("href", "/");
  await expect(
    page.getByText(
      "Stammdaten: Kontakte pflegen und Kundenprofile für Organisationen und Abrechnung verwalten",
    ),
  ).toBeVisible();
  await page.getByRole("link", { name: "Neu anlegen" }).click();
  await page.getByLabel("Vorname").fill("Neue");
  await page.getByLabel("Nachname").fill("Kontaktperson");
  await page.getByRole("textbox", { name: "E-Mail" }).fill("neu@example.com");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page.waitForTimeout(100);
  await page.getByLabel("Suche", { exact: true }).first().fill("Kontaktperson");
  await expect(page.getByText("Neue Kontaktperson")).toBeVisible();
  await page.getByText("Neue Kontaktperson").click();
  const email = page.getByLabel("E-Mail").last();
  await email.fill("geändert@example.com");
  await email.blur();
  await expect(page.getByText("E-Mail gespeichert")).toBeVisible();
  await page.reload();
  await page.getByLabel("Suche", { exact: true }).first().fill("geändert@example.com");
  await expect(page.getByText("Neue Kontaktperson")).toBeVisible();
  // Die Seitensuche filtert beide Reiter; ohne Leeren zeigt "Kunden" null.
  await page.getByLabel("Suche", { exact: true }).first().fill("");
  await page.getByRole("tab", { name: /Kunden \(2\)/ }).click();
  await expect(page.getByText("Nordwerk GmbH")).toBeVisible();
  await page.getByText("Nordwerk GmbH").click();
  await expect(page.getByLabel("Kundenname")).toHaveValue("Nordwerk GmbH");
  await page.getByRole("button", { name: "Detail schließen" }).click();
  await page.getByLabel("Suche", { exact: true }).first().fill("Jonas Feld");
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

test("bündelt Eventrollen je Event in Kunden- und Kontaktdetails", async ({ page }) => {
  await mockApi(page);
  await page.goto("/kontakte");

  await page.getByRole("tab", { name: /Kunden \(2\)/ }).click();
  await page.getByText("Nordwerk GmbH", { exact: true }).click();
  const customerEvents = page.locator('a[href="/events/260820_demo_event"]');
  await expect(customerEvents).toHaveCount(1);
  await expect(customerEvents).toContainText("Veranstalter");
  await expect(customerEvents).toContainText("Auszahlungsempfänger");

  await page.getByRole("button", { name: "Detail schließen" }).click();
  await page.getByText("Marion Kessler", { exact: true }).click();
  const personEvents = page.locator('a[href="/events/260820_demo_event"]');
  await expect(personEvents).toHaveCount(1);
  await expect(personEvents).toContainText("Anmeldung");
  await expect(personEvents).toContainText("Finanz");
});

test("fügt einen per Combobox angeklickten Kontakt im Kundenprofil hinzu", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("t2w-crm-v1"));
  await mockApi(page);
  await page.goto("/kontakte");
  await page.getByRole("tab", { name: /Kunden \(2\)/ }).click();
  await page.getByLabel("Suche", { exact: true }).first().fill("Jonas Feld");
  await page.getByText("Jonas Feld").click();
  await expect(page.getByRole("heading", { name: "Jonas Feld" })).toBeVisible();
  const search = page.getByRole("combobox", { name: "Kontakt zuordnen" });
  await search.fill("Marion");
  await page.getByRole("option", { name: "Marion Kessler" }).click();
  await expect(page.getByRole("button", { name: "Marion Kessler ×" })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: /Kunden \(2\)/ }).click();
  await page.getByLabel("Suche", { exact: true }).first().fill("Jonas Feld");
  await page.getByText("Jonas Feld").click();
  await expect(page.getByRole("button", { name: "Marion Kessler ×" })).toBeVisible();
});

test("fügt einen per Combobox angeklickten Kunden im Kontakt hinzu", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("t2w-crm-v1"));
  const requests = await mockApi(page);
  await page.goto("/kontakte");
  await page.getByLabel("Suche", { exact: true }).first().fill("Marion Kessler");
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
  await page.getByLabel("Suche", { exact: true }).first().fill("Marion Kessler");
  await page.getByText("Marion Kessler").click();
  await expect(page.getByRole("button", { name: "Jonas Feld", exact: true })).toBeVisible();
});

test("verwendet in Veranstaltungen dieselbe schlanke Eventtabelle wie in der Übersicht", async ({
  page,
}) => {
  await mockApi(page, {
    sport: { id: "s1", name: "Triathlon" },
    services: [
      { service: { id: "service-1", name: "UHF" } },
      { service: { id: "service-5", name: "Video (iRewind)" } },
    ],
  });
  await page.goto("/veranstaltungen");
  const table = page.locator("table");
  await expect(table).toBeVisible();
  await expect(table.locator("thead th")).toHaveCount(10);
  await expect(table.locator("thead")).toContainText("St");
  await expect(table.locator("thead")).toContainText("Aufgaben");
  await expect(table.getByRole("columnheader", { name: "Sportart sortieren" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Services sortieren" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "TIME2WIN sortieren" })).toBeVisible();
  await expect(table.locator("thead img[src='/time2win_logo_button.svg']")).toBeVisible();
  const eventRow = table.locator("tbody tr").filter({ hasText: "Bestehendes Event" });
  await expect(eventRow.getByRole("cell").nth(4)).toHaveText("Triathlon");
  await expect(eventRow.getByRole("cell").nth(4).locator("svg")).toHaveCount(1);
  await expect(eventRow.getByRole("cell").nth(5)).toContainText("UHF");
  await expect(eventRow.getByRole("cell").nth(5)).toContainText("Video (iRewind)");
  await expect(eventRow.getByRole("cell").nth(5).locator("svg")).toHaveCount(2);
  await expect(table.locator("[title='Outlook und SharePoint']")).toBeVisible();
  await expect(table.getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
  await expect(table.locator("tbody")).toContainText("20.08.2026");

  await page.goto("/");
  const overviewTable = page.locator("table");
  await expect(
    overviewTable.getByRole("columnheader", { name: "Sportart sortieren" }),
  ).toBeVisible();
  await expect(
    overviewTable.getByRole("columnheader", { name: "Services sortieren" }),
  ).toBeVisible();
  const overviewRow = overviewTable.locator("tbody tr").filter({ hasText: "Bestehendes Event" });
  await expect(overviewRow.getByRole("cell").nth(4)).toHaveText("Triathlon");
  await expect(overviewRow.getByRole("cell").nth(4).locator("svg")).toHaveCount(1);
  await expect(overviewRow.getByRole("cell").nth(5)).toContainText("UHF");
  await expect(overviewRow.getByRole("cell").nth(5)).toContainText("Video (iRewind)");
  await expect(overviewRow.getByRole("cell").nth(5).locator("svg")).toHaveCount(2);
});

test("markiert nur Active- und UHF-Events am gleichen Starttag", async ({ page }) => {
  await mockApi(
    page,
    {
      startAt: "2026-01-01T00:00:00.000Z",
      endAt: "2026-03-01T00:00:00.000Z",
    },
    {
      startAt: "2026-01-02T00:00:00.000Z",
      endAt: "2026-01-02T00:00:00.000Z",
      services: [{ service: { id: "service-1", name: "UHF" } }],
    },
    [
      {
        id: "44444444-4444-4444-8444-444444444444",
        eventCode: "260102_gleicher_start",
        name: "Gleicher Start",
        startAt: "2026-01-02T00:00:00.000Z",
        endAt: "2026-01-02T00:00:00.000Z",
        services: [{ service: { id: "service-2", name: "Active" } }],
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        eventCode: "260102_anderer_service",
        name: "Anderer Service",
        startAt: "2026-01-02T00:00:00.000Z",
        endAt: "2026-01-02T00:00:00.000Z",
        services: [{ service: { id: "service-5", name: "Video (iRewind)" } }],
      },
    ],
  );
  await page.goto("/veranstaltungen");

  const table = page.locator("table");
  const existingEvent = table.locator("tbody tr").filter({ hasText: "Bestehendes Event" });
  const followUpEvent = table.locator("tbody tr").filter({ hasText: "Folgetermin" });
  const sameStartEvent = table.locator("tbody tr").filter({ hasText: "Gleicher Start" });
  const otherServiceEvent = table.locator("tbody tr").filter({ hasText: "Anderer Service" });

  expect(await existingEvent.getAttribute("data-date-collision-group")).toBeNull();
  await expect(followUpEvent).toHaveAttribute("data-date-collision-group", "1");
  await expect(sameStartEvent).toHaveAttribute("data-date-collision-group", "1");
  await expect(existingEvent.locator("[data-date-collision-count]")).toHaveCount(0);
  await expect(followUpEvent.getByLabel(/Gleicher Starttag: 2 Active-\/UHF-Events/)).toContainText(
    "2×",
  );
  await expect(sameStartEvent.getByLabel(/Gleicher Starttag: 2 Active-\/UHF-Events/)).toContainText(
    "2×",
  );
  expect(await otherServiceEvent.getAttribute("data-date-collision-group")).toBeNull();
  await expect(otherServiceEvent.locator("[data-date-collision-count]")).toHaveCount(0);
  await expect(page.getByLabel("Legende für Terminkollisionen")).toBeVisible();

  const rowColors = await Promise.all(
    [followUpEvent, sameStartEvent].map((row) =>
      row.evaluate((element) => getComputedStyle(element).backgroundColor),
    ),
  );
  expect(rowColors[0]).toBe(rowColors[1]);
  expect(rowColors[0]).not.toBe("rgba(0, 0, 0, 0)");

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileList = page.getByLabel("Veranstaltungen mobile Liste");
  await expect(mobileList.locator("article").filter({ hasText: "Folgetermin" })).toHaveAttribute(
    "data-date-collision-group",
    "1",
  );
  await expect(mobileList.locator("article").filter({ hasText: "Gleicher Start" })).toHaveAttribute(
    "data-date-collision-group",
    "1",
  );
});

test("hält die Statusspalte der Eventtabellen kompakt", async ({ page }) => {
  await mockApi(page);

  for (const path of ["/", "/veranstaltungen"]) {
    await page.goto(path);
    const statusHeader = page.getByRole("columnheader", { name: "Status sortieren" });
    await expect(statusHeader).toBeVisible();
    expect((await statusHeader.boundingBox())?.width).toBeLessThanOrEqual(56);
    const eventRow = page.locator("table tbody tr").filter({ hasText: "Bestehendes Event" });
    await expect(eventRow.getByRole("cell").first()).toContainText("Anfrage");
  }
});

test("platziert die schmale TIME2WIN-Spalte nach dem Status und verlinkt die Event-ID", async ({
  page,
}) => {
  await mockApi(page, { t2wEventId: 57 });

  for (const path of ["/", "/veranstaltungen"]) {
    await page.goto(path);
    const table = page.locator("table");
    const eventRow = table.locator("tbody tr").filter({ hasText: "Bestehendes Event" });
    const backendLink = eventRow.getByRole("link", {
      name: "TIME2WIN Event-ID 57 im Backend öffnen",
    });
    const columnHeaders = table.getByRole("columnheader");
    const time2winHeader = columnHeaders.nth(1);

    await expect(columnHeaders.nth(0)).toHaveAccessibleName("Status sortieren");
    await expect(time2winHeader).toHaveAccessibleName("TIME2WIN sortieren");
    await expect(columnHeaders.nth(2)).toHaveAccessibleName("Event sortieren");
    expect((await time2winHeader.boundingBox())?.width).toBeLessThanOrEqual(56);
    await expect(table.locator("thead img[src='/time2win_logo_button.svg']")).toBeVisible();
    await expect(eventRow.getByRole("cell").nth(1)).toContainText("57");
    await expect(backendLink).toHaveText("57");
    await expect(backendLink).toHaveAttribute("href", "https://time2win.at/backend/event/57");
    await expect(backendLink).toHaveAttribute("target", "_blank");
  }
});

test("zeigt die Schnellfilter der Übersicht als schaltbare Chips mit Zurücksetzen", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/");

  const filterZeile = page.getByRole("group", { name: "Liste filtern" });
  const alleAktiven = filterZeile.getByRole("button", { name: "Alle aktiven" });
  const offene = filterZeile.getByRole("button", { name: "Offene Aufgaben", exact: true });

  // Grundstellung: „Alle aktiven" gesetzt, nichts zurückzusetzen.
  await expect(alleAktiven).toHaveAttribute("aria-pressed", "true");
  await expect(offene).toHaveAttribute("aria-pressed", "false");
  await expect(filterZeile.getByRole("button", { name: /Filter zurücksetzen/ })).toHaveCount(0);

  await offene.click();
  await expect(offene).toHaveAttribute("aria-pressed", "true");
  await expect(alleAktiven).toHaveAttribute("aria-pressed", "false");

  // Der Statusfilter ist ein Auswahlchip und zählt mit.
  await filterZeile.getByLabel("Status filtern").selectOption("zugesagt");
  const zuruecksetzen = filterZeile.getByRole("button", { name: "2 Filter zurücksetzen" });
  await expect(zuruecksetzen).toBeVisible();

  await zuruecksetzen.click();
  await expect(alleAktiven).toHaveAttribute("aria-pressed", "true");
  await expect(filterZeile.getByLabel("Status filtern")).toHaveValue("alle");
});

test("macht auch die Tabellen ohne Spaltenpräferenz sortierbar", async ({ page }) => {
  await mockApi(page, {}, {}, [
    {
      id: "88888888-8888-4888-8888-888888888888",
      eventCode: "260101_alpha",
      name: "Alpha Cup",
      startAt: "2026-01-01T00:00:00.000Z",
      endAt: "2026-01-01T00:00:00.000Z",
    },
  ]);
  await page.goto("/angebote");

  const kopf = page.getByRole("button", { name: "Event sortieren" });
  await expect(kopf).toBeVisible();
  const namen = () => page.locator("table tbody tr td:nth-child(2)").allTextContents();

  await kopf.click();
  const aufsteigend = await namen();
  expect(aufsteigend[0]).toBe("Alpha Cup");

  await kopf.click();
  const absteigend = await namen();
  expect(absteigend[0]).not.toBe("Alpha Cup");
  expect([...absteigend].reverse()).toEqual(aufsteigend);
});

test("stellt Spalten und Export in Kontakten und Kunden auf Höhe der Tab-Leiste", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/kontakte");

  // Nutzerwunsch 19.09.2026: keine eigene Werkzeugzeile, die Symbole stehen in
  // der Zeile über der Tabelle — hier ist das die Tab-Leiste.
  const spalten = page.getByRole("button", { name: "Spalten auswählen" });
  await expect(spalten).toBeVisible();
  await expect(page.getByRole("button", { name: "Kontakte als Excel exportieren" })).toBeVisible();

  const [leisteBox, werkzeugBox] = await Promise.all([
    page.getByRole("tablist").boundingBox(),
    spalten.boundingBox(),
  ]);
  expect(Math.abs(werkzeugBox!.y - leisteBox!.y)).toBeLessThan(24);

  // Der Wechsel des Reiters wechselt auch den Exportnamen der Leiste.
  await page.getByRole("tab", { name: /Kunden/ }).click();
  await expect(page.getByRole("button", { name: "Kunden als Excel exportieren" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kontakte als Excel exportieren" })).toHaveCount(0);
});

test("erklärt die Statusfarben unter beiden Eventtabellen und hält sie unterscheidbar", async ({
  page,
}) => {
  await mockApi(page);

  for (const path of ["/", "/veranstaltungen"]) {
    await page.goto(path);
    const legende = page.getByLabel("Statuslegende");
    await expect(legende).toBeVisible();
    await expect(legende).toContainText("Anfrage");
    await expect(legende).toContainText("Zugesagt");
    await expect(legende).toContainText("Datum prüfen");

    // Nutzerentscheidung 19.09.2026: jeder Status hat eine eigene Farbe. Vorher
    // trugen Anfrage, Angebot gesendet, Akquise und Datum prüfen dasselbe Amber.
    const farben = await legende
      .locator("[data-status-dot]")
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).backgroundColor));
    expect(farben).toHaveLength(6);
    expect(new Set(farben).size).toBe(6);

    // Die Farbe trägt die Bedeutung nie allein: die Zelle nennt den Status als Text.
    const statusZelle = page
      .locator("table tbody tr")
      .filter({ hasText: "Bestehendes Event" })
      .getByRole("cell")
      .first();
    await expect(statusZelle).toContainText("Anfrage");
  }

  // Schmal zeigen die Karten Punkt und Text nebeneinander; die Legende entfällt.
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/veranstaltungen");
  await expect(page.getByLabel("Veranstaltungen mobile Liste")).toBeVisible();
  await expect(page.getByLabel("Statuslegende")).toBeHidden();
});

test("zeigt ohne TIME2WIN-Event-ID keinen Backend-Link in den Eventtabellen", async ({ page }) => {
  await mockApi(page);

  for (const path of ["/", "/veranstaltungen"]) {
    await page.goto(path);
    await expect(page.locator("table a[href^='https://time2win.at/backend/event/']")).toHaveCount(
      0,
    );
  }
});

test("ordnet die Spaltenauswahl in Veranstaltungen bei den Filtern ein", async ({ page }) => {
  await mockApi(page);
  await page.goto("/veranstaltungen");

  const filterZeile = page.getByRole("group", { name: "Liste filtern" });
  await expect(filterZeile).toContainText("Alle Status");
  await expect(filterZeile).toContainText("Alle Zeiträume");
  await expect(filterZeile).toContainText("Nur aktive");
  // Spalten und Export sind Symbole und stehen auf Filterhöhe, damit die
  // Tabelle keine eigene Werkzeugzeile braucht (Nutzerwunsch 19.09.2026).
  await expect(filterZeile.getByRole("button", { name: "Spalten auswählen" })).toBeVisible();
});

test("führt Eventfilter, Spalten und Excel-Export in einer Kompaktzeile und setzt sie zurück", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/veranstaltungen");

  const filterZeile = page.getByRole("group", { name: "Liste filtern" });
  const status = filterZeile.getByLabel("Status", { exact: true });
  const table = page.locator("table");

  // Filter, Spalten und Export teilen sich eine Zeile — keine zweite Reihe.
  await expect(
    filterZeile.getByRole("button", { name: "Veranstaltungen als Excel exportieren" }),
  ).toBeVisible();
  const [filterBox, tabellenBox] = await Promise.all([
    filterZeile.boundingBox(),
    page.locator("table").boundingBox(),
  ]);
  expect(tabellenBox!.y).toBeLessThan(filterBox!.y + filterBox!.height + 32);

  // Ohne gesetzten Filter gibt es nichts zurückzusetzen.
  await expect(filterZeile.getByRole("button", { name: /Filter zurücksetzen/ })).toHaveCount(0);
  await expect(table.getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();

  // Gesetzte Auswahlchips tragen den Markenakzent und zählen im Zurücksetzen mit.
  const neutral = await status.evaluate(
    (node) => getComputedStyle(node.parentElement!).backgroundColor,
  );
  await status.selectOption("zugesagt");
  const aktiv = await status.evaluate(
    (node) => getComputedStyle(node.parentElement!).backgroundColor,
  );
  expect(aktiv).not.toBe(neutral);

  const zuruecksetzen = filterZeile.getByRole("button", { name: "1 Filter zurücksetzen" });
  await expect(zuruecksetzen).toBeVisible();
  await expect(table.getByRole("link", { name: "Bestehendes Event", exact: true })).toHaveCount(0);

  await zuruecksetzen.click();
  await expect(status).toHaveValue("alle");
  await expect(filterZeile.getByRole("button", { name: /Filter zurücksetzen/ })).toHaveCount(0);
  await expect(table.getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
});

test("zeigt Sportart und Services auch in den mobilen Eventkarten", async ({ page }) => {
  await mockApi(page, {
    sport: { id: "s1", name: "Triathlon" },
    services: [{ service: { id: "service-1", name: "UHF" } }],
  });
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/veranstaltungen");

  const karte = page
    .getByLabel("Veranstaltungen mobile Liste")
    .locator("article")
    .filter({ hasText: "Bestehendes Event" });
  await expect(karte).toContainText("Triathlon");
  await expect(karte).toContainText("UHF");
  expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("legt ein Event über POST an und öffnet den API-Datensatz", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/");
  await expect(
    page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true }),
  ).toBeVisible();
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
  await page.getByLabel("Sportart", { exact: true }).click();
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
  await expect(page).toHaveURL(/\/veranstaltungen\?(?:q=[^&]*&)?ansicht=kalender$/);
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
  await page.getByLabel("Sportart", { exact: true }).click();
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
  await expect(
    page.locator("table").getByRole("link", { name: "Bestehendes Event", exact: true }),
  ).toBeVisible();
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

test("kopiert ein Event als editierbare Vorlage und zeigt die Seriennachbarn nach Reload", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await page.getByRole("button", { name: "Event kopieren" }).click();
  await page.locator("#copy-name").fill("Bestehendes Event 2027");
  await page.locator("#copy-start").fill("2027-08-26");
  await page.getByRole("button", { name: "Kopie speichern" }).click();
  await expect(page.getByRole("heading", { name: "Bestehendes Event 2027" })).toBeVisible();
  const seriesNavigation = page.getByTestId("event-series-navigation");
  await expect(seriesNavigation).toBeVisible();
  await expect(seriesNavigation.getByRole("link", { name: /Bestehendes Event/ })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Eventserie:")).toBeVisible();
});

test("kopiert ein Event ohne Serienverknüpfung als reine Vorlage", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await page.getByRole("button", { name: "Event kopieren" }).click();
  await page.locator("#copy-name").fill("Unabhängige Vorlage");
  await page.getByRole("checkbox", { name: "Als Eventserie verknüpfen" }).click();
  await page.getByRole("button", { name: "Kopie speichern" }).click();
  await expect(page.getByRole("heading", { name: "Unabhängige Vorlage" })).toBeVisible();
  await expect(page.getByText("Eventserie:")).toHaveCount(0);
});

test("zeigt und speichert die Sportart im Event-Detailformular", async ({ page }) => {
  const requests = await mockApi(page, { sport: { id: "s1", name: "Triathlon" } });
  await page.goto("/events/260820_demo_event");

  const sportart = page.getByLabel("Sportart");
  await expect(sportart).toHaveText("Triathlon");
  await sportart.click();
  await page.getByRole("option", { name: "Laufen" }).click();
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Änderungen gespeichert.")).toBeVisible();
  expect(
    requests.some(
      (request) => request.method === "PATCH" && JSON.parse(request.body ?? "{}").sportId === "s2",
    ),
  ).toBeTruthy();

  await page.reload();
  await expect(page.getByLabel("Sportart")).toHaveText("Laufen");
});

test("zeigt die Unveränderlichkeit direkt am Eventcode-Feld", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await expect(
    page.getByText("Der Eventcode ist unveränderlich.", { exact: true }),
  ).not.toBeVisible();
  await expect(page.getByText("(unveränderlich)", { exact: true })).toBeVisible();
});

test("zeigt die technische ClickUp-ID nicht in den Event-Stammdaten", async ({ page }) => {
  await mockApi(page, { clickUpId: "86abc-clickup-intern" });
  await page.goto("/events/260820_demo_event");

  await expect(page.getByText("86abc-clickup-intern", { exact: true })).toHaveCount(0);
  await expect(page.getByText("ClickUp-ID", { exact: true })).toHaveCount(0);
});

test("zeigt die Event-Stammdaten kompakt und den Zeitraum in einer Zeile", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");

  await expect(page.getByRole("heading", { name: "Identität & Zeitraum" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Organisation & Einordnung" })).toBeVisible();

  const eventcodeLabel = await page.getByText("Eventcode", { exact: false }).first().boundingBox();
  const eventcodeInput = await page.locator("#d-code").boundingBox();
  const dateRange = await page.getByTestId("event-date-range").boundingBox();
  const startInput = await page.locator("#d-start").boundingBox();
  const endInput = await page.locator("#d-ende").boundingBox();
  const organizerSelect = await page.getByLabel("Veranstalter aus Stammdaten").boundingBox();

  expect(eventcodeLabel).not.toBeNull();
  expect(eventcodeInput).not.toBeNull();
  expect(dateRange).not.toBeNull();
  expect(startInput).not.toBeNull();
  expect(endInput).not.toBeNull();
  expect(organizerSelect).not.toBeNull();
  expect(Math.abs(eventcodeLabel!.y - eventcodeInput!.y)).toBeLessThan(12);
  await expect(page.getByTestId("event-date-range")).toContainText("–");
  expect(Math.abs(startInput!.y - endInput!.y)).toBeLessThan(1);
  expect(endInput!.x).toBeGreaterThan(startInput!.x + startInput!.width);
  expect(Math.abs(dateRange!.x - eventcodeInput!.x)).toBeLessThan(1);
  expect(Math.abs(dateRange!.width - eventcodeInput!.width)).toBeLessThan(1);
  expect(organizerSelect!.x).toBeGreaterThan(dateRange!.x + dateRange!.width);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileEventcodeInput = await page.locator("#d-code").boundingBox();
  const mobileDateRange = await page.getByTestId("event-date-range").boundingBox();
  const mobileStartInput = await page.locator("#d-start").boundingBox();
  const mobileEndInput = await page.locator("#d-ende").boundingBox();

  expect(mobileEventcodeInput).not.toBeNull();
  expect(mobileDateRange).not.toBeNull();
  expect(mobileStartInput).not.toBeNull();
  expect(mobileEndInput).not.toBeNull();
  expect(Math.abs(mobileStartInput!.y - mobileEndInput!.y)).toBeLessThan(1);
  expect(Math.abs(mobileDateRange!.x - mobileEventcodeInput!.x)).toBeLessThan(1);
  expect(Math.abs(mobileDateRange!.width - mobileEventcodeInput!.width)).toBeLessThan(1);
  expect(mobileDateRange!.x + mobileDateRange!.width).toBeLessThanOrEqual(390);
});

test("zeigt den Eventstatus in den Stammdaten mit farbigem Kreis und Text", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");

  const statusSelect = page.getByRole("combobox", { name: "Status", exact: true });
  await expect(statusSelect).toContainText("Anfrage");
  await expect(statusSelect.locator('[data-status-dot="anfrage"]')).toBeVisible();

  await statusSelect.click();
  const confirmedOption = page.getByRole("option", { name: "Zugesagt" });
  await expect(confirmedOption.locator('[data-status-dot="zugesagt"]')).toBeVisible();
  await confirmedOption.click();

  await expect(statusSelect).toContainText("Zugesagt");
  await expect(statusSelect.locator('[data-status-dot="zugesagt"]')).toBeVisible();
});

test("ordnet die Archivierung kompakt beim Eventnamen ein", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");

  const eventName = await page.locator("#d-name").boundingBox();
  const archiveToggle = page.getByTestId("event-archive-toggle");
  const archiveBox = await archiveToggle.boundingBox();

  expect(eventName).not.toBeNull();
  expect(archiveBox).not.toBeNull();
  expect(Math.abs(eventName!.y - archiveBox!.y)).toBeLessThan(16);
  expect(archiveBox!.x).toBeGreaterThan(eventName!.x + eventName!.width);
  await expect(archiveToggle).toContainText("Archiviert");
  await expect(
    archiveToggle.getByText("Archivierte Events erscheinen nur im Archivfilter."),
  ).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Event archivieren" })).toBeVisible();
});

test("speichert die Hauptansprechperson eines Kunden", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/kontakte");
  await page.getByRole("tab", { name: /Kunden \(2\)/ }).click();
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
  await page.getByRole("tab", { name: /Kunden \(2\)/ }).click();
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

  await page.getByRole("tab", { name: /Kunden \(2\)/ }).click();
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
  await page.getByRole("tab", { name: /Kunden \(2\)/ }).click();
  await expect(page.getByRole("button", { name: "E-Mail sortieren" })).toBeVisible();

  await page.getByRole("button", { name: "Spalten auswählen" }).click();
  await page.getByRole("checkbox", { name: "E-Mail" }).click();
  await expect(page.getByRole("button", { name: "E-Mail sortieren" })).toHaveCount(0);

  await page.reload();
  await page.getByRole("tab", { name: /Kunden \(2\)/ }).click();
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

test("filtert archivierte Events im Kalender und öffnet deren Detailseite", async ({ page }) => {
  const today = new Date();
  const currentMonthDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-20T00:00:00.000Z`;
  await mockApi(page, { archived: true, startAt: currentMonthDate, endAt: currentMonthDate });
  const eventsLoaded = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/events" &&
      response.request().method() === "GET",
  );
  await page.goto("/kalender");
  await eventsLoaded;

  await expect(page.getByText("Bestehendes Event", { exact: true })).toHaveCount(0);
  await page.getByLabel("Archiv filtern").selectOption("archiv");
  await expect(page.getByLabel("Archiv filtern")).toHaveValue("archiv");
  await page.getByRole("link", { name: "Bestehendes Event", exact: true }).click();

  await expect(page).toHaveURL(/\/events\/260820_demo_event$/);
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
  await expect(mobileList.getByText("Alter Veranstalter").first()).toBeVisible();
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

test("trennt Tabellen-Detailnavigation von Outlook- und SharePoint-Aktionen", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  // Die Zeile selbst ist kein Link; jede Navigation hat ihr eigenes Ziel.
  await expect(page.locator('tbody tr[role="link"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Bestehendes Event", exact: true })).toBeVisible();
  await expect(page.locator("table").getByLabel("Outlook: nicht verknüpft").first()).toBeVisible();
  await expect(
    page.locator("table").getByLabel("SharePoint: nicht verknüpft").first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Event bearbeiten:/ })).toHaveCount(0);
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
  await page.getByLabel("Suche", { exact: true }).first().fill("Eva Persistenz");
  await page.getByText("Eva Persistenz").click();
  await expect(page.getByLabel("Funktion").last()).toHaveValue("Projektleitung");
  await expect(page.getByLabel("Ort").last()).toHaveValue("Graz");
  await page.reload();
  await page.getByLabel("Suche", { exact: true }).first().fill("Eva Persistenz");
  await page.getByText("Eva Persistenz").click();
  await expect(page.getByLabel("Funktion").last()).toHaveValue("Projektleitung");
  await expect(page.getByLabel("Ort").last()).toHaveValue("Graz");
});

test("zeigt die getrennte TIME2WIN-Verknüpfung im Event-Workspace", async ({ page }) => {
  await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Anmeldung" }).click();
  await expect(page.getByText("Event Id", { exact: true })).toBeVisible();
  await expect(page.locator("#d-t2w")).toBeVisible();
  await expect(page.getByText("Gemeldete TN:")).toBeVisible();
  await expect(page.getByText("Status: NEVER")).toBeVisible();
});

test("ändert die TIME2WIN-Event-ID in den Stammdaten und behält sie nach Reload", async ({
  page,
}) => {
  const requests = await mockApi(page, { t2wEventId: 42 });
  await page.goto("/events/260820_demo_event");

  await page.getByLabel("Event Id").fill("1082");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Änderungen gespeichert.")).toBeVisible();
  expect(
    requests.some(
      (request) =>
        request.method === "PATCH" && JSON.parse(request.body ?? "{}").t2wEventId === 1082,
    ),
  ).toBeTruthy();

  await page.reload();
  await expect(page.getByLabel("Event Id")).toHaveValue("1082");
});

test("synchronisiert TIME2WIN-Bewerbe ohne die lokale Prognose zu überschreiben", async ({
  page,
}) => {
  await mockApi(page, { t2wEventId: 42, participantForecast: 10, participantCurrent: 4 });
  await page.route(
    "**/api/v1/events/11111111-1111-4111-8111-111111111111/time2win/sync",
    async (route) =>
      route.fulfill({
        json: {
          kind: "synced",
          event: {
            ...event,
            t2wEventId: 42,
            participantForecast: 10,
            participantCurrent: 21,
            time2winSyncStatus: "SUCCESS",
            time2winLastSuccessAt: "2026-08-28T12:00:00.000Z",
            time2winLastError: null,
            time2winSnapshot: {
              eventId: 42,
              name: "TIME2WIN Testevent",
              sportName: "Laufen",
              races: [{ id: 7, name: "Hauptbewerb", participantCount: 21 }],
            },
          },
        },
      }),
  );
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Anmeldung" }).click();
  await page.getByRole("button", { name: "Jetzt synchronisieren" }).click();
  await expect(page.getByText("TIME2WIN Testevent")).toBeVisible();
  await expect(page.getByText("Hauptbewerb")).toBeVisible();
  await expect(page.getByText("Gemeldete TN: 21")).toBeVisible();
  await expect(page.getByRole("table", { name: "TIME2WIN Teilnehmer nach Bewerb" })).toContainText(
    "21",
  );
  await expect(page.getByText("TIME2WIN-Teilnehmer synchronisiert.")).toBeVisible();
});

test("pflegt Auszahlungs- und mehrere Rechnungsempfänger im Finanz-Reiter", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Finanz" }).click();
  await page.getByRole("combobox", { name: "Auszahlungsempfänger" }).click();
  await page.getByRole("option", { name: "Jonas Feld" }).click();
  const recipientDetails = page.getByLabel("Stammdaten Auszahlungsempfänger");
  await expect(recipientDetails).toContainText("Jonas Feld");
  await expect(recipientDetails).toContainText("Hauptstraße 4, 1010 Wien, Österreich");
  await expect(recipientDetails).toContainText("AT611904300234573201");
  await expect(recipientDetails).toContainText("BKAUATWW");
  await expect(recipientDetails.locator("dl > div")).toHaveCount(4);
  await expect(recipientDetails.getByText("IBAN / BIC", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Rechnungsempfänger auswählen" }).click();
  await page.getByLabel("Rechnungsempfänger suchen").fill("Jonas");
  await page.getByText("Jonas Feld", { exact: true }).last().click();
  const invoiceDetails = page.getByLabel("Stammdaten Rechnungsempfänger");
  await expect(invoiceDetails).toContainText("Nordwerk GmbH");
  await expect(invoiceDetails).toContainText("Jonas Feld");
  await expect(invoiceDetails).toContainText("BKAUATWW");
  await page
    .getByRole("textbox", { name: "Finanznotizen" })
    .fill("Zahlung nach Freigabe durch den Veranstalter.");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Änderungen gespeichert.")).toBeVisible();
  expect(
    requests.some(
      (request) =>
        request.method === "PATCH" &&
        request.body?.includes('"payoutRecipientId":"c2"') &&
        request.body.includes('"invoiceRecipientIds":["c1","c2"]') &&
        request.body.includes('"financeNotes":"Zahlung nach Freigabe durch den Veranstalter."'),
    ),
  ).toBeTruthy();
});

test("zeigt Veranstalterkontakte und übernimmt sie als Eventkontakt", async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Kontakte" }).click();
  await expect(page.getByRole("heading", { name: "Kontakte des Veranstalters" })).toBeVisible();
  await expect(page.getByText("Marion Kessler", { exact: true })).toBeVisible();
  await page
    .getByText("Marion Kessler", { exact: true })
    .locator("xpath=../..")
    .getByRole("button", { name: "Als Eventkontakt übernehmen" })
    .click();
  await expect(page.getByRole("button", { name: "Bereits Eventkontakt" })).toBeVisible();
  await expect(page.getByText("Marion Kessler", { exact: true })).toHaveCount(2);
  await page.getByLabel("Kontaktnotizen").fill("Kontakt bevorzugt per E-Mail.");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Änderungen gespeichert.")).toBeVisible();
  expect(
    requests.some(
      (request) =>
        request.method === "POST" &&
        request.url.includes(`/api/v1/events/${event.id}/contacts/p1`) &&
        request.body?.includes('"role":"Kontakt"'),
    ),
  ).toBeTruthy();
  expect(
    requests.some(
      (request) =>
        request.method === "PATCH" &&
        request.body?.includes('"contactsNotes":"Kontakt bevorzugt per E-Mail."'),
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
  const ordnerSpalte = page.locator("thead th [title='Outlook und SharePoint']");
  await expect(ordnerSpalte).toHaveAttribute("title", "Outlook und SharePoint");
  await expect(page.locator("table").getByLabel("Outlook: nicht verknüpft").first()).toBeVisible();
  await expect(
    page.locator("table").getByLabel("SharePoint: nicht verknüpft").first(),
  ).toBeVisible();
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
  await expect(page.locator("table").getByTitle("Outlook öffnen")).toHaveAttribute(
    "href",
    outlookFolderUrl,
  );

  await page.goto("/veranstaltungen");
  await expect(page.locator("table").getByTitle("Outlook öffnen")).toHaveAttribute(
    "href",
    outlookFolderUrl,
  );
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

test("synchronisiert Outlook-Nachrichten als persistente Event-Timeline ohne Duplikate", async ({
  page,
}) => {
  const requests = await mockApi(page, {
    outlookFolder: "06_auftraege_26/Q3/260820_demo_event",
    outlookFolderId: "event-folder-id",
    outlookFolderSyncStatus: "SUCCESS",
  });

  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Kommunikation" }).click();
  await page.getByRole("button", { name: "Synchronisieren" }).click();

  await expect(page.getByRole("button", { name: "Startzeit bestätigt" })).toBeVisible();
  await expect(page.getByRole("img", { name: "E-Mail, eingehend" })).toBeVisible();
  await expect(page.getByText("Eva Beispiel <eva@example.at>", { exact: true })).toBeVisible();
  await expect(page.getByText("Der Start bleibt um 09:00 Uhr.").first()).toBeVisible();
  await expect(page.getByRole("img", { name: "E-Mail, ausgehend von TIME2WIN" })).toBeVisible();
  await expect(page.getByText("An Eva Beispiel <eva@example.at>", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zeitplan an das Team gesendet" })).toBeVisible();

  // Der Outlook-Deeplink liegt im Nachrichtenpanel, nicht in der Zeile.
  await page.getByRole("button", { name: "Startzeit bestätigt" }).click();
  const nachrichtenpanel = page.getByRole("dialog");
  await expect(nachrichtenpanel.getByRole("link", { name: "In Outlook öffnen" })).toHaveAttribute(
    "href",
    "https://outlook.office.com/mail/deeplink/read/mail-1",
  );
  await nachrichtenpanel.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(nachrichtenpanel).toBeHidden();

  await page.getByRole("button", { name: "Synchronisieren" }).click();
  await expect(page.getByRole("button", { name: "Startzeit bestätigt" })).toHaveCount(1);
  await page.reload();
  await page.getByRole("tab", { name: "Kommunikation" }).click();
  await expect(page.getByRole("button", { name: "Startzeit bestätigt" })).toBeVisible();
  expect(requests.filter((request) => request.url.endsWith("/outlook-messages/sync"))).toHaveLength(
    2,
  );
});

test("pflegt Nachrichtenarten als Auswahlliste und zieht sie in die Kommunikation nach", async ({
  page,
}) => {
  await mockApi(page, {
    outlookFolder: "06_auftraege_26/Q3/260820_demo_event",
    outlookFolderId: "event-folder-id",
    outlookFolderSyncStatus: "SUCCESS",
  });

  await page.goto("/einstellungen?tab=auswahllisten&liste=nachrichtenarten");
  await expect(page.getByLabel("Nachrichtenart E-Mail", { exact: true })).toHaveValue("E-Mail");

  await page.getByLabel("Neue Nachrichtenart").fill("WhatsApp");
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await expect(page.getByLabel("Nachrichtenart WhatsApp", { exact: true })).toHaveValue("WhatsApp");

  // Eine Art ohne Einträge verschwindet nach dem Deaktivieren aus der Filterleiste.
  await page
    .locator("div")
    .filter({ has: page.getByLabel("Nachrichtenart Notiz", { exact: true }) })
    .last()
    .getByRole("button", { name: "Deaktivieren" })
    .click();

  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Kommunikation" }).click();
  await page.getByRole("button", { name: "Synchronisieren" }).click();

  await expect(page.getByRole("button", { name: "E-Mail 2" })).toBeVisible();
  await expect(page.getByRole("button", { name: "WhatsApp 0" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Telefon 0" })).toBeVisible();
  // Nur die Filterleiste prüfen: "Notiz erfassen" im Kopf bleibt davon unberührt.
  await expect(
    page.getByLabel("Kommunikation filtern").getByRole("button", { name: /^Notiz/ }),
  ).toHaveCount(0);
});

test("ordnet einer Sammelmail ein Thema zu und behält es nach dem Reload", async ({ page }) => {
  await mockApi(page, {
    outlookFolder: "06_auftraege_26/Q3/260820_demo_event",
    outlookFolderId: "event-folder-id",
    outlookFolderSyncStatus: "SUCCESS",
  });

  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Kommunikation" }).click();
  await page.getByRole("button", { name: "Synchronisieren" }).click();

  // Vor der Zuordnung trägt die Zeile nur die erkannte Person, kein Thema.
  const ersteZeile = page
    .locator("[data-communication-row]")
    .filter({ hasText: "Startzeit bestätigt" });
  await expect(ersteZeile).toContainText("Eva Beispiel");
  await expect(ersteZeile).not.toContainText("Teilnehmer");

  await page.getByRole("button", { name: "Startzeit bestätigt" }).click();
  const nachrichtenpanel = page.getByRole("dialog");
  await nachrichtenpanel.getByLabel("Thema").click();
  await page.getByRole("option", { name: "Teilnehmer" }).click();
  await expect(page.getByText("Thema zugeordnet.")).toBeVisible();
  await nachrichtenpanel.getByRole("button", { name: "Schließen", exact: true }).click();

  // Das Thema steht als eigener Bezug in der Zeile, neben der Person.
  await expect(ersteZeile).toContainText("Teilnehmer");
  await expect(ersteZeile).toContainText("Eva Beispiel");

  // Der Themenfilter grenzt auf genau diesen Eintrag ein.
  await page.getByLabel("Nach Thema filtern").click();
  await page.getByRole("option", { name: "Teilnehmer" }).click();
  await expect(page.locator("[data-communication-row]")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Startzeit bestätigt" })).toBeVisible();

  // Nach dem Reload ist die Zuordnung noch da.
  await page.reload();
  await page.getByRole("tab", { name: "Kommunikation" }).click();
  await page.getByRole("button", { name: "Startzeit bestätigt" }).click();
  await expect(page.getByRole("dialog").getByLabel("Thema")).toContainText("Teilnehmer");
});

test("findet Kommunikation über Suche, Artenfilter und Konversationen", async ({ page }) => {
  await mockApi(page, {
    outlookFolder: "06_auftraege_26/Q3/260820_demo_event",
    outlookFolderId: "event-folder-id",
    outlookFolderSyncStatus: "SUCCESS",
    contacts: [
      {
        role: "Anmeldung",
        contact: { id: "p4", name: "Eva Beispiel", email: "eva@example.at", phone: null },
      },
    ],
  });

  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Kommunikation" }).click();
  await page.getByRole("button", { name: "Synchronisieren" }).click();

  // Verlauf ist der Einstieg: eine Zeitgruppe, zwei Zeilen, kein Bearbeitungszustand.
  const filterleiste = page.getByLabel("Kommunikation filtern");
  await expect(page.getByRole("button", { name: "Verlauf" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("[data-communication-row]")).toHaveCount(2);
  await expect(page.locator('section[aria-label^="Kommunikation "]')).toHaveCount(1);
  await expect(page.getByText("Wartet seit")).toHaveCount(0);

  // Art und Richtung stehen als Symbol mit barrierefreiem Namen, nicht als Textspalte.
  await expect(page.getByRole("img", { name: "E-Mail, eingehend" })).toBeVisible();
  await expect(page.getByRole("img", { name: "E-Mail, ausgehend von TIME2WIN" })).toBeVisible();

  // Die Artenfilter tragen ihre Anzahl und schalten die Liste um.
  await expect(page.getByRole("button", { name: "E-Mail 2" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Notiz 0" })).toBeVisible();
  await page.getByRole("button", { name: "Notiz 0" }).click();
  await expect(page.getByText("Keine Einträge für diese Auswahl.")).toBeVisible();
  await filterleiste.getByRole("button", { name: "1 Filter zurücksetzen" }).click();
  await expect(page.locator("[data-communication-row]")).toHaveCount(2);

  const contactLink = page.locator('a[href="/kontakte?person=p4"]').first();
  await expect(contactLink).toHaveText("Eva Beispiel · Anmeldung");

  // Die Suche zählt ihre Treffer und hebt sie hervor.
  await page.getByLabel("Kommunikation durchsuchen").fill("Zeitplan");
  await expect(page.getByText("1 Treffer für „Zeitplan“")).toBeVisible();
  await expect(page.locator("[data-communication-row]")).toHaveCount(1);
  await expect(page.locator("mark").first()).toHaveText("Zeitplan");
  await page.getByLabel("Kommunikation durchsuchen").fill("");
  await expect(page.locator("[data-communication-row]")).toHaveCount(2);

  // Der Richtungsfilter bleibt ein eigener Chip.
  await page.getByLabel("Nach Richtung filtern").click();
  await page.getByRole("option", { name: "Ausgehend" }).click();
  await expect(page.locator("[data-communication-row]")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Zeitplan an das Team gesendet" })).toBeVisible();
  await filterleiste.getByRole("button", { name: "1 Filter zurücksetzen" }).click();

  // Das Nachrichtenpanel zeigt Text, Bezug und die ganze Konversation.
  await page.getByRole("button", { name: "Startzeit bestätigt" }).click();
  const nachrichtenpanel = page.getByRole("dialog");
  await expect(nachrichtenpanel).toContainText("Der Start bleibt um 09:00 Uhr.");
  await expect(nachrichtenpanel).toContainText("Nachricht 1 von 2 in dieser Konversation");
  await expect(
    nachrichtenpanel.getByRole("link", { name: "Eva Beispiel · Anmeldung" }),
  ).toBeVisible();
  await nachrichtenpanel
    .getByRole("button", { name: /Im Anhang findet ihr den aktuellen Zeitplan/ })
    .click();
  await expect(nachrichtenpanel).toContainText("Im Anhang findet ihr den aktuellen Zeitplan.");
  await nachrichtenpanel.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(nachrichtenpanel).toBeHidden();

  // Konversationen bündeln denselben Bestand zu einem Thema.
  await page.getByRole("button", { name: "Konversationen" }).click();
  const konversation = page.getByRole("button", { name: /Startzeit bestätigt/ }).first();
  await expect(konversation).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("[data-communication-row]")).toHaveCount(0);
  await konversation.click();
  await expect(konversation).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("[data-communication-row]")).toHaveCount(2);

  // Der Bezug bleibt ein Link auf die Person.
  await page.getByRole("button", { name: "Verlauf" }).click();
  await contactLink.click();
  await expect(page.getByRole("heading", { name: "Eva Beispiel" })).toBeVisible();
});
