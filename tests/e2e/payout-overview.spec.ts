import { expect, test } from "@playwright/test";
import { event } from "./support/event-management-api";

test("sucht, filtert, summiert und markiert Auszahlungen gesammelt", async ({ page }) => {
  await page.route("**/api/v1/settings**", (route) =>
    route.fulfill({ json: { outlookJahresordner: [], jahresSites: [] } }),
  );
  await page.route("**/api/v1/events**", (route) =>
    route.fulfill({
      json: [
        {
          ...event,
          id: "event-1",
          eventCode: "demo",
          name: "Demo Event",
          payoutRecipientId: "org-1",
          payoutRecipient: { email: "finance@example.test" },
        },
      ],
    }),
  );
  await page.route("**/api/v1/organizers**", (route) =>
    route.fulfill({ json: [{ id: "org-1", name: "Nordwerk" }] }),
  );
  const payouts = [
    {
      id: "p1",
      payoutNumber: "T260001",
      amount: "100.00",
      currency: "EUR",
      mailStatus: "ENTWURF",
      paymentStatus: "OFFEN",
      recipient: { name: "Nordwerk" },
      event: { eventCode: "demo", name: "Demo Event" },
    },
    {
      id: "p2",
      payoutNumber: "T260002",
      amount: "50.00",
      currency: "CHF",
      mailStatus: "GESENDET",
      paymentStatus: "OFFEN",
      recipient: { name: "Alpin" },
      event: null,
    },
  ];
  const requestsForPayouts: import("@playwright/test").Request[] = [];
  await page.route("**/api/v1/payouts**", async (route) => {
    requestsForPayouts.push(route.request());
    if (route.request().method() === "POST") return route.fulfill({ json: payouts });
    const url = new URL(route.request().url());
    const result =
      url.searchParams.get("status") === "GESENDET"
        ? [payouts[1]]
        : payouts.filter(
            (p) =>
              !url.searchParams.get("q") ||
              JSON.stringify(p).toLowerCase().includes(url.searchParams.get("q")!.toLowerCase()),
          );
    return route.fulfill({ json: result });
  });
  await page.goto("/auszahlungen");
  await expect(page.getByRole("cell", { name: "100.00 EUR" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "50.00 CHF" })).toBeVisible();
  await expect(page.getByText("Event nachzuordnen")).toBeVisible();
  await page.getByLabel("Auszahlungen durchsuchen").fill("Alpin");
  await expect(page.getByText("T260002")).toBeVisible();
  await page.getByLabel("Status filtern").selectOption("GESENDET");
  await page.getByLabel("T260002 auswählen").check();
  await expect(page.getByRole("button", { name: /Für Mailversand markieren/ })).toBeEnabled();
  await page.getByLabel("T260002 Transaktionsbestätigung").fill("TX-42");
  await page.getByLabel("T260002 Transaktionsbestätigung").blur();
  await expect
    .poll(() => requestsForPayouts.some((request) => request.method() === "PATCH"))
    .toBe(true);
  await page.getByLabel("Jahr filtern").fill("2026");
  await expect.poll(() => requestsForPayouts.at(-1)?.url()).toContain("year=2026");
  await page.getByLabel("Event für neue Auszahlung").selectOption("event-1");
  await page.getByLabel("Neuer Auszahlungsbetrag").fill("12,50");
  await page.getByRole("button", { name: "Auszahlung anlegen" }).click();
  await expect
    .poll(() => requestsForPayouts.some((request) => request.method() === "POST"))
    .toBe(true);
});
