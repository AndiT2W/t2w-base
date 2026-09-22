import { expect, test } from "@playwright/test";
import { mockEventManagementApi as mockApi } from "./support/event-management-api";

test("testet eine Mail im Kommunikationsreiter als Dry-Run", async ({ page }) => {
  await mockApi(page);
  let requestBody: Record<string, unknown> | undefined;
  await page.route("**/api/v1/mail-classifier/test", async (route) => {
    requestBody = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
    return route.fulfill({
      json: {
        category: "EVENT_QUESTION",
        categoryConfidence: 0.96,
        event: {
          eventCode: "260820_demo_event",
          name: "Bestehendes Event",
          confidence: 0.93,
        },
        isQuestion: true,
        questionSummary: "Dürfen die Startnummern bereits am Freitag ausgegeben werden?",
        reasons: ["explizite Frage", "Startnummern"],
        reviewRequired: true,
        outlookPlan: {
          categories: ["T2W | Event", "T2W | Frage"],
          subject: "[Bestehendes Event] Frage zur Startnummernausgabe",
          flag: "flagged",
          moveToFolderId: "event-folder-id",
          requiresApproval: true,
        },
        forwardPlan: {
          recipient: "veranstalter@example.com",
          subject: "Frage zu Bestehendes Event: Frage zur Startnummernausgabe",
          summary: "Dürfen die Startnummern bereits am Freitag ausgegeben werden?",
          requiresApproval: true,
        },
      },
    });
  });

  await page.goto("/events/260820_demo_event?tab=kommunikation");
  await page.getByRole("button", { name: "Mail mit Ollama analysieren" }).click();

  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "Mail-Klassifizierung testen" })).toBeVisible();
  await sheet.getByLabel("Betreff").fill("Frage zur Startnummernausgabe");
  await sheet
    .getByLabel("Mailtext")
    .fill("Dürfen die Startnummern bereits am Freitag ausgegeben werden?");
  await sheet.getByRole("button", { name: "Analyse starten" }).click();

  await expect(sheet.getByText("Eventfrage", { exact: true })).toBeVisible();
  await expect(sheet.getByText("Bestehendes Event", { exact: true })).toBeVisible();
  await expect(sheet.getByText("Noch nicht freigegeben — kein Versand.")).toBeVisible();
  expect((requestBody?.mail as { subject?: string } | undefined)?.subject).toBe(
    "Frage zur Startnummernausgabe",
  );
  expect(requestBody?.eventCandidates).toBeUndefined();
});

test("wendet den Eventpräfix nur nach expliziter Bestätigung an", async ({ page }) => {
  await mockApi(page, {
    communicationMessages: [
      {
        id: "mail-1",
        direction: "INCOMING",
        author: "Veranstalter <event@example.com>",
        recipients: "info@time2win.at",
        subject: "Frage zum Ablauf",
        preview: "Gibt es am Freitag eine Ausgabe der Startnummern?",
        occurredAt: "2026-08-19T09:00:00.000Z",
        hasAttachments: false,
        webUrl: "https://outlook.example/mail-1",
        conversationId: "conversation-1",
        topicId: null,
      },
    ],
  });
  let applied = false;
  await page.route("**/api/v1/mail-classifier/events/*/apply-prefixes", async (route) => {
    applied = true;
    return route.fulfill({
      json: { total: 1, updated: 1, skipped: 0, failed: 0, messages: [] },
    });
  });

  await page.goto("/events/260820_demo_event?tab=kommunikation");
  await page.getByRole("button", { name: "Eventpräfixe auf E-Mails anwenden" }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("100 % Konfidenz");
  await dialog.getByRole("button", { name: "Präfixe anwenden", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(applied).toBe(true);
});
