import { describe, expect, it, vi } from "vitest";
import {
  MailClassifierService,
  type MailClassificationInput,
  type OllamaChatClient,
} from "./mail-classifier.service.js";

const candidate = {
  eventCode: "260918_mountain-attack",
  name: "Mountain Attack 2026",
  startAt: "2026-09-18T00:00:00.000Z",
  endAt: "2026-09-19T00:00:00.000Z",
  organizerName: "Mountain Attack Verein",
  organizerEmail: "office@mountain-attack.example",
  folderId: "event-folder-1",
};

const input: MailClassificationInput = {
  mail: {
    subject: "Frage zur Startnummernausgabe",
    body: "Können die Startnummern am Freitag bereits ab 15 Uhr ausgegeben werden?",
    from: "athlete@example.com",
    to: ["info@time2win.at"],
  },
  eventCandidates: [candidate],
};

function clientWith(response: string): OllamaChatClient {
  return { chat: vi.fn().mockResolvedValue(response) };
}

describe("MailClassifierService", () => {
  it("turns the model proposal into an event-safe marking plan", async () => {
    const service = new MailClassifierService(
      clientWith(
        JSON.stringify({
          category: "EVENT_QUESTION",
          categoryConfidence: 0.96,
          eventCode: candidate.eventCode,
          eventConfidence: 0.93,
          isQuestion: true,
          questionSummary: "Dürfen Startnummern am Freitag ab 15 Uhr ausgegeben werden?",
          reasons: ["Startnummernausgabe", "explizite Frage"],
        }),
      ),
    );

    const result = await service.classify(input);

    expect(result.category).toBe("EVENT_QUESTION");
    expect(result.event).toEqual({
      eventCode: candidate.eventCode,
      name: candidate.name,
      confidence: 0.93,
    });
    expect(result.outlookPlan).toMatchObject({
      categories: ["T2W | Event", "T2W | Frage"],
      subject: `[${candidate.name}] ${input.mail.subject}`,
      moveToFolderId: candidate.folderId,
      flag: "flagged",
      requiresApproval: true,
    });
    expect(result.forwardPlan).toEqual({
      recipient: candidate.organizerEmail,
      subject: `Frage zu ${candidate.name}: ${input.mail.subject}`,
      summary: "Dürfen Startnummern am Freitag ab 15 Uhr ausgegeben werden?",
      requiresApproval: true,
    });
  });

  it("does not trust an event code that is outside the supplied candidate list", async () => {
    const service = new MailClassifierService(
      clientWith(
        JSON.stringify({
          category: "EVENT_UPDATE",
          categoryConfidence: 0.88,
          eventCode: "made-up-event",
          eventConfidence: 0.99,
          isQuestion: false,
          reasons: ["unbekannte Modellzuordnung"],
        }),
      ),
    );

    const result = await service.classify(input);

    expect(result.event).toBeNull();
    expect(result.outlookPlan.moveToFolderId).toBeNull();
    expect(result.outlookPlan.subject).toBe(input.mail.subject);
    expect(result.outlookPlan.categories).toEqual(["T2W | Prüfung"]);
    expect(result.reviewRequired).toBe(true);
  });

  it("keeps a malformed cloud response reviewable instead of applying a guess", async () => {
    const service = new MailClassifierService(clientWith("not-json"));

    const result = await service.classify(input);

    expect(result.category).toBe("OTHER");
    expect(result.event).toBeNull();
    expect(result.reviewRequired).toBe(true);
    expect(result.outlookPlan.requiresApproval).toBe(true);
  });
});
