import { expect, test } from "@playwright/test";

// Ohne Sitzung zeigt die App die Anmeldeseite, und keine der Erwartungen
// dieser Datei findet ihr Element. Diese Suite mockt ihre Antworten selbst
// und braucht die Sitzung deshalb auch selbst.
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

test("zeigt den Auditlog in den Einstellungen und filtert nach Entität", async ({ page }) => {
  await page.route("**/api/v1/auth/login", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/v1/events**", (route) => route.fulfill({ json: [] }));
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
  await expect(
    page.getByText("Unveränderliche Aufzeichnungen über relevante Änderungen im System."),
  ).toBeVisible();
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

test("führt die fünf Einstellungsbereiche als Reiterleiste auf der Seite", async ({ page }) => {
  // Die Bereiche hingen nur im Untermenü der Seitenleiste: wer die Seite über
  // einen Link betrat, kam von dort nicht weiter. Das Artboard führt sie
  // zusätzlich als Reiterleiste.
  await page.route("**/api/v1/settings**", (route) =>
    route.fulfill({ json: { outlookJahresordner: [], jahresSites: [], outlookMailbox: null } }),
  );
  await page.goto("/einstellungen");

  const leiste = page.getByRole("tablist");
  await expect(leiste).toHaveCSS("border-bottom-width", "1px");
  for (const name of ["Allgemein", "Benutzer", "Auswahllisten", "Outlook", "Auditlog"]) {
    await expect(page.getByRole("tab", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("tab", { name: "Allgemein" })).toHaveAttribute(
    "data-state",
    "active",
  );

  await page.getByRole("tab", { name: "Auswahllisten" }).click();
  await expect(page).toHaveURL(/tab=auswahllisten/);
  await expect(page.getByRole("tab", { name: "Auswahllisten" })).toHaveAttribute(
    "data-state",
    "active",
  );
});
