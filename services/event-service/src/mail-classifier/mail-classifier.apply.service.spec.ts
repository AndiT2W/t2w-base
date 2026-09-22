import { describe, expect, it, vi } from "vitest";
import { MailClassifierApplyService } from "./mail-classifier.apply.service.js";
import { MailClassifierService, type OllamaChatClient } from "./mail-classifier.service.js";

const event = {
  id: "event-1",
  eventCode: "260918_sommerfest",
  name: "Sommerfest 2026",
};

const message = {
  id: "message-1",
  mailbox: "info@time2win.at",
  externalId: "outlook-message-1",
  subject: "Einladung und Ablauf",
  preview: "Hier sind die Details zum Sommerfest 2026.",
  author: "Veranstalter <event@example.com>",
  recipients: "TIME2WIN <info@time2win.at>",
  occurredAt: new Date("2026-08-20T09:00:00.000Z"),
};

function classifierWith(eventConfidence: number) {
  const ollama: OllamaChatClient = {
    chat: vi.fn().mockResolvedValue(
      JSON.stringify({
        category: "EVENT_UPDATE",
        categoryConfidence: 1,
        eventCode: event.eventCode,
        eventConfidence,
        isQuestion: false,
        reasons: ["Eventname im Mailtext"],
      }),
    ),
  };
  return new MailClassifierService(ollama);
}

function dependencies() {
  const prisma = {
    event: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(event),
      findMany: vi.fn().mockResolvedValue([
        {
          ...event,
          startAt: new Date("2026-08-20T00:00:00.000Z"),
          endAt: new Date("2026-08-20T00:00:00.000Z"),
          location: "Wien",
          outlookFolderId: "folder-1",
          organizer: { name: "Veranstalter", email: "event@example.com" },
        },
      ]),
    },
    eventCommunicationMessage: {
      findMany: vi.fn().mockResolvedValue([message]),
      update: vi
        .fn()
        .mockResolvedValue({ ...message, subject: `[${event.name}] ${message.subject}` }),
    },
  };
  const graph = { updateMessage: vi.fn().mockResolvedValue({ id: message.externalId }) };
  const audit = { append: vi.fn().mockResolvedValue({ id: "audit-1" }) };
  return { prisma, graph, audit };
}

describe("MailClassifierApplyService", () => {
  it("updates Outlook and the local subject only for an exact event match", async () => {
    const dependenciesSet = dependencies();
    const service = new MailClassifierApplyService(
      dependenciesSet.prisma as never,
      classifierWith(1),
      dependenciesSet.graph as never,
      dependenciesSet.audit as never,
    );

    await expect(service.applyEventPrefixes(event.id, "user-1")).resolves.toMatchObject({
      total: 1,
      updated: 1,
      skipped: 0,
      failed: 0,
    });
    expect(dependenciesSet.graph.updateMessage).toHaveBeenCalledWith(
      message.mailbox,
      message.externalId,
      { subject: `[${event.name}] ${message.subject}` },
    );
    expect(dependenciesSet.prisma.eventCommunicationMessage.update).toHaveBeenCalledWith({
      where: { id: message.id },
      data: { subject: `[${event.name}] ${message.subject}` },
    });
    expect(dependenciesSet.audit.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "MAIL_SUBJECT_PREFIX_APPLIED",
        entityId: message.id,
        userId: "user-1",
      }),
    );
  });

  it("leaves a message unchanged below the 100 percent event threshold", async () => {
    const dependenciesSet = dependencies();
    const service = new MailClassifierApplyService(
      dependenciesSet.prisma as never,
      classifierWith(0.99),
      dependenciesSet.graph as never,
      dependenciesSet.audit as never,
    );

    await expect(service.applyEventPrefixes(event.id, "user-1")).resolves.toMatchObject({
      total: 1,
      updated: 0,
      skipped: 1,
      failed: 0,
      messages: [expect.objectContaining({ status: "skipped", reason: "EVENT_CONFIDENCE_0.99" })],
    });
    expect(dependenciesSet.graph.updateMessage).not.toHaveBeenCalled();
    expect(dependenciesSet.prisma.eventCommunicationMessage.update).not.toHaveBeenCalled();
  });
});
