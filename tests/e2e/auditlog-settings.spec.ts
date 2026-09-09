import { expect, test } from "@playwright/test";

test("zeigt den Auditlog in den Einstellungen und filtert nach Entität", async ({ page }) => {
  await page.route("**/api/v1/auth/login", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/v1/events", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/v1/settings", (route) =>
    route.fulfill({ json: { outlookJahresordner: [], jahresSites: [], outlookMailbox: null } }),
  );
  const entries = [
    {
      id: "audit-1",
      entity: "Payout",
      entityId: "payout-42",
      action: "UPDATED",
      details: { status: "GESENDET" },
      createdAt: "2026-09-09T10:00:00.000Z",
      user: { id: "u1", displayName: "Andi", email: "andi@example.test" },
    },
  ];
  await page.route("**/api/v1/audit-log**", (route) => route.fulfill({ json: entries }));

  await page.goto("/einstellungen?tab=auditlog");
  if (await page.getByRole("button", { name: "Anmelden" }).isVisible()) {
    await page.getByLabel("Passwort").fill("test");
    await page.getByRole("button", { name: "Anmelden" }).click();
  }
  await expect(page.getByText("Unveränderliche Aufzeichnungen über relevante Änderungen im System.")).toBeVisible();
  await expect(page.getByText("payout-42")).toBeVisible();
  await expect(page.getByText("Andi")).toBeVisible();
  await page.getByLabel("Auditlog durchsuchen").fill("nicht vorhanden");
  await expect(page.getByText("Keine Auditlog-Einträge gefunden.")).toBeVisible();
  await page.getByLabel("Auditlog durchsuchen").fill("payout-42");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Exportieren/ }).click();
  await expect((await downloadPromise).suggestedFilename()).toMatch(/^auditlog-.*\.csv$/);
  await page.getByLabel("Auditlog nach Entität filtern").selectOption("Payout");
  await expect(page).toHaveURL(/tab=auditlog/);
});
