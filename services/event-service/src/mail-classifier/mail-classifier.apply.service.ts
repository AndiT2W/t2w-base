import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { AuditService } from "../audit.service.js";
import type { OutlookGraphClient } from "../outlook/outlook.types.js";
import { MailClassifierService, type MailEventCandidate } from "./mail-classifier.service.js";

type ApplyMessageResult = {
  id: string;
  subject: string;
  status: "updated" | "skipped" | "failed";
  reason: string;
};

export type MailClassifierApplyResult = {
  total: number;
  updated: number;
  skipped: number;
  failed: number;
  messages: ApplyMessageResult[];
};

function prefixSubject(subject: string, eventName: string) {
  const prefix = `[${eventName}]`;
  return subject.startsWith(prefix) ? subject : `${prefix} ${subject}`.slice(0, 255);
}

function recipients(value: string) {
  return value
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

@Injectable()
export class MailClassifierApplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classifier: MailClassifierService,
    @Inject("OUTLOOK_GRAPH_CLIENT") private readonly graph: OutlookGraphClient,
    private readonly audit: AuditService,
  ) {}

  async applyEventPrefixes(eventId: string, userId: string): Promise<MailClassifierApplyResult> {
    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { eventCode: true, name: true },
    });
    const candidates = await this.activeEventCandidates();
    const messages = await this.prisma.eventCommunicationMessage.findMany({
      where: { eventId },
      orderBy: { occurredAt: "asc" },
      select: {
        id: true,
        mailbox: true,
        externalId: true,
        subject: true,
        preview: true,
        author: true,
        recipients: true,
        occurredAt: true,
      },
    });

    const results: ApplyMessageResult[] = [];
    for (const message of messages) {
      const currentSubject = message.subject;
      const nextSubject = prefixSubject(currentSubject, event.name);
      if (nextSubject === currentSubject) {
        results.push({
          id: message.id,
          subject: currentSubject,
          status: "skipped",
          reason: "PREFIX_ALREADY_PRESENT",
        });
        continue;
      }

      const classification = await this.classifier.classify({
        mail: {
          subject: currentSubject,
          body: message.preview,
          from: message.author,
          to: recipients(message.recipients),
          receivedAt: message.occurredAt.toISOString(),
        },
        eventCandidates: candidates,
      });
      const exactEventMatch =
        classification.event?.eventCode === event.eventCode &&
        classification.event.confidence === 1;
      if (!exactEventMatch) {
        results.push({
          id: message.id,
          subject: currentSubject,
          status: "skipped",
          reason: classification.event
            ? `EVENT_CONFIDENCE_${classification.event.confidence}`
            : "EVENT_NOT_RECOGNIZED",
        });
        continue;
      }

      try {
        await this.graph.updateMessage(message.mailbox, message.externalId, {
          subject: nextSubject,
        });
        await this.prisma.eventCommunicationMessage.update({
          where: { id: message.id },
          data: { subject: nextSubject },
        });
        await this.audit.append({
          entity: "EventCommunicationMessage",
          entityId: message.id,
          action: "MAIL_SUBJECT_PREFIX_APPLIED",
          userId,
          oldValue: { subject: currentSubject },
          newValue: { subject: nextSubject },
          details: { eventCode: event.eventCode, eventConfidence: 1 },
        });
        results.push({
          id: message.id,
          subject: nextSubject,
          status: "updated",
          reason: "EVENT_CONFIDENCE_1",
        });
      } catch (error) {
        results.push({
          id: message.id,
          subject: currentSubject,
          status: "failed",
          reason: error instanceof Error ? error.message : "MAIL_PREFIX_UPDATE_FAILED",
        });
      }
    }

    return {
      total: results.length,
      updated: results.filter((result) => result.status === "updated").length,
      skipped: results.filter((result) => result.status === "skipped").length,
      failed: results.filter((result) => result.status === "failed").length,
      messages: results,
    };
  }

  private async activeEventCandidates(): Promise<MailEventCandidate[]> {
    const events = await this.prisma.event.findMany({
      where: { archived: false },
      orderBy: { startAt: "asc" },
      select: {
        eventCode: true,
        name: true,
        startAt: true,
        endAt: true,
        location: true,
        outlookFolderId: true,
        organizer: { select: { name: true, email: true } },
      },
      take: 500,
    });
    return events.map((candidate) => ({
      eventCode: candidate.eventCode,
      name: candidate.name,
      startAt: candidate.startAt.toISOString(),
      endAt: candidate.endAt.toISOString(),
      location: candidate.location,
      folderId: candidate.outlookFolderId,
      organizerName: candidate.organizer?.name,
      organizerEmail: candidate.organizer?.email,
    }));
  }
}
