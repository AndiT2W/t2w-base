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
          subject: "[260820_demo_event · Bestehendes Event] Frage zur Startnummernausgabe",
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
