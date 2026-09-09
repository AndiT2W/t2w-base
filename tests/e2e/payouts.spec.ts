import { expect, test } from "@playwright/test";
import { event, mockEventManagementApi } from "./support/event-management-api";

test("legt eine Auszahlung im Event-Finanzreiter an und lädt sie nach Reload", async ({ page }) => {
  await mockEventManagementApi(page);
  let payouts = [] as any[];
  const requests: string[] = [];
  await page.route("**/api/v1/payouts?eventId=**", (route) => route.fulfill({ json: payouts }));
  await page.route("**/api/v1/payouts", async (route) => {
    requests.push(`${route.request().method()} ${route.request().url()}`);
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() ?? "{}");
      payouts = [{ id: "p1", payoutNumber: "T260001", amount: "125.50", currency: body.currency, mailStatus: "ENTWURF", paymentStatus: "OFFEN", mailRecipient: "finance@example.test" }];
      return route.fulfill({ status: 201, json: payouts[0] });
    }
    return route.fulfill({ json: payouts });
  });
  await page.route("**/api/v1/payouts/**", async (route) => {
    requests.push(`${route.request().method()} ${route.request().url()}`);
    const id = route.request().url().split("/").pop();
    if (route.request().method() === "PATCH") {
      payouts = payouts.map((p) => ({ ...p, ...JSON.parse(route.request().postData() ?? "{}") }));
      return route.fulfill({ json: payouts[0] });
    }
    if (route.request().method() === "DELETE") { payouts = []; return route.fulfill({ json: { deleted: true } }); }
    return route.fulfill({ json: payouts.find((p) => p.id === id) ?? null });
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
  await page.getByRole("button", { name: "Für Mail markieren" }).click();
  await expect(page.getByText("Mail versenden").last()).toBeVisible();
  await page.getByRole("button", { name: "Als ausgezahlt markieren" }).click();
  await expect(page.getByText("Ausbezahlt").last()).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Löschen" }).click();
  await expect(page.getByText("T260001")).toHaveCount(0);
  expect(requests.some((request) => request.startsWith("PATCH"))).toBe(true);
  expect(requests.some((request) => request.startsWith("DELETE"))).toBe(true);
});
