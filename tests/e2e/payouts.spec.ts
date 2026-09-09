import { expect, test } from "@playwright/test";
import { event, mockEventManagementApi } from "./support/event-management-api";

test("legt eine Auszahlung im Event-Finanzreiter an und lädt sie nach Reload", async ({ page }) => {
  await mockEventManagementApi(page);
  let payouts = [] as any[];
  await page.route("**/api/v1/payouts?eventId=**", (route) => route.fulfill({ json: payouts }));
  await page.route("**/api/v1/payouts", async (route) => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() ?? "{}");
      payouts = [{ id: "p1", payoutNumber: "T260001", amount: "125.50", currency: body.currency, mailStatus: "ENTWURF", paymentStatus: "OFFEN", mailRecipient: "finance@example.test" }];
      return route.fulfill({ status: 201, json: payouts[0] });
    }
    return route.fulfill({ json: payouts });
  });
  await page.goto(`/events/${event.eventCode}`);
  await page.getByRole("tab", { name: "FINANZ" }).click();
  await page.getByLabel("Auszahlungsbetrag").fill("125,50");
  await page.getByLabel("Auszahlungswährung").selectOption("CHF");
  await page.getByRole("button", { name: "Auszahlung anlegen" }).click();
  await expect(page.getByText("T260001")).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "FINANZ" }).click();
  await expect(page.getByText("T260001")).toBeVisible();
  await expect(page.getByText("125.50 CHF")).toBeVisible();
});
