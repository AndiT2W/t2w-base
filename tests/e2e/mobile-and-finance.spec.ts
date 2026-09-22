import { expect, test } from "@playwright/test";
import { mockEventManagementApi } from "./support/event-management-api";

test("hält die Kennzahlkacheln auf dem Telefon im Bild", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  // Vier Kacheln nebeneinander brachen den Text auf drei Zeilen und die
  // letzte ragte aus dem Bild. Mit Mindestbreite bricht die Reihe um.
  const kacheln = page.getByRole("button", { name: /Events nächste 14 Tage|Ordner fehlt/ });
  for (const kachel of await kacheln.all()) {
    const box = await kachel.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  }
  expect(await page.locator("body").evaluate((b) => b.scrollWidth <= window.innerWidth)).toBe(true);
});

test("zeigt die Modulleiste am unteren Rand nur auf dem Telefon", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const leiste = page.getByRole("navigation", { name: "Hauptbereiche" });
  await expect(leiste).toBeVisible();
  await expect(leiste.getByRole("link")).toHaveCount(5);
  // Das aktive Feld trägt nicht nur Farbe: Kante und Halbfett tragen mit.
  const aktiv = leiste.getByRole("link", { name: "Übersicht" });
  await expect(aktiv).toHaveAttribute("data-status", "active");
  await expect(aktiv).toHaveCSS("font-weight", "700");

  await leiste.getByRole("link", { name: "Hardware" }).click();
  await expect(page).toHaveURL(/\/hardware$/);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(leiste).toBeHidden();
});

test("fasst die Auszahlungen des Events als Kennzahlen zusammen", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.route("**/api/v1/payouts**", (route) =>
    route.fulfill({
      json: [
        {
          id: "p1",
          payoutNumber: "T260001",
          amount: "2140.00",
          currency: "EUR",
          mailStatus: "VERSENDEN",
          paymentStatus: "OFFEN",
          mailRecipient: "finanz@example.test",
          recipient: { name: "Nordwerk GmbH" },
        },
        {
          id: "p2",
          payoutNumber: "T260002",
          amount: "860.00",
          currency: "EUR",
          mailStatus: "GESENDET",
          paymentStatus: "AUSBEZAHLT",
          mailRecipient: "finanz@example.test",
          recipient: { name: "Nordwerk GmbH" },
        },
      ],
    }),
  );

  await page.goto("/events/260820_demo_event");
  await page.getByRole("tab", { name: "Finanz", exact: true }).click();

  // Die Zahlen kommen aus den geladenen Belegen, nicht aus einem zweiten Aufruf.
  // Die Tausenderstelle trennt im Österreichischen ein Leerzeichen, kein Punkt.
  await expect(page.getByRole("button", { name: /Auszahlung offen/ })).toContainText(
    /2\s140,00 EUR/,
  );
  await expect(page.getByRole("button", { name: /Bereits ausbezahlt/ })).toContainText(
    "860,00 EUR",
  );
  await expect(page.getByRole("button", { name: /Belege gesamt/ })).toContainText("2");
});

test("trägt den Seitentitel auf dem Telefon in der Kopfzeile und die Suche als Lupe", async ({
  page,
}) => {
  await mockEventManagementApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/veranstaltungen");

  // Das Artboard führt Titel und Suche auf dem Telefon in der dunklen
  // Leiste; Brotkrume und große Überschrift darunter entfallen. Der Titel
  // steht dabei genau einmal im Baum, nicht zweimal mit „hidden".
  const kopfzeile = page.getByRole("banner").first();
  await expect(kopfzeile.getByRole("heading", { name: "Veranstaltungen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Veranstaltungen" })).toHaveCount(1);
  await expect(page.getByLabel("Breadcrumb")).toHaveCount(0);

  // Das Suchfeld klappt erst auf Druck auf.
  await expect(page.getByRole("combobox", { name: "Global suchen" })).toHaveCount(0);
  await page.getByRole("button", { name: "Suchen" }).click();
  await expect(page.getByRole("combobox", { name: "Global suchen" })).toBeVisible();
  await page.getByRole("button", { name: "Suche schließen" }).click();
  await expect(page.getByRole("combobox", { name: "Global suchen" })).toHaveCount(0);

  // Breit bleibt alles wie gehabt: Brotkrume, große Überschrift, offenes Feld.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByLabel("Breadcrumb")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Global suchen" })).toBeVisible();
});

test("zeigt Eventkarten auf dem Telefon mit Statuspunkt, Eventcode und Aufgabenlage", async ({
  page,
}) => {
  await mockEventManagementApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/veranstaltungen");

  // Nach dem Artboard: die ganze Karte führt ins Event, der Status steht als
  // Punkt vor dem Namen statt als Chip in einer eigenen Zeile.
  const karte = page.getByLabel("Veranstaltungen mobile Liste").locator("article").first();
  await expect(karte.getByRole("link", { name: /Bestehendes Event/ })).toHaveAttribute(
    "href",
    "/events/260820_demo_event",
  );
  await expect(karte.locator("[data-status-dot]")).toBeVisible();
  await expect(karte).toContainText("260820_demo_event");
  await expect(karte).toContainText("offen");
});
