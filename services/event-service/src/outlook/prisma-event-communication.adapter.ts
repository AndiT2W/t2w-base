import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { EventRecordRetrieval } from "../event-record-retrieval.js";
import type {
  CommunicationMessage,
  EventCommunicationRepository,
} from "./event-communication.hub.js";

@Injectable()
export class PrismaEventCommunicationAdapter implements EventCommunicationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly records: EventRecordRetrieval,
  ) {}

  async start(eventId: string) {
    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { outlookMailbox: true, outlookFolderId: true },
    });
    if (!event.outlookMailbox || !event.outlookFolderId)
      throw new Error("OUTLOOK_EVENT_FOLDER_MISSING");
    await this.prisma.event.update({
      where: { id: eventId },
      data: { outlookMessageSyncStatus: "SYNCING", outlookMessageLastError: null },
    });
    return { mailbox: event.outlookMailbox, folderId: event.outlookFolderId };
  }

  async conflictingConversationIds(eventId: string, mailbox: string, conversationIds: string[]) {
    if (conversationIds.length === 0) return [];
    const conflicts = await this.prisma.eventCommunicationMessage.findMany({
      where: {
        mailbox,
        conversationId: { in: conversationIds },
        eventId: { not: eventId },
      },
      distinct: ["conversationId"],
      select: { conversationId: true },
    });
    return conflicts
      .map(({ conversationId }) => conversationId)
      .filter((conversationId): conversationId is string => Boolean(conversationId));
  }

  async complete(eventId: string, messages: CommunicationMessage[], at: Date) {
    await this.prisma.$transaction([
      ...messages.map((message) =>
        this.prisma.eventCommunicationMessage.upsert({
          where: {
            mailbox_externalId: { mailbox: message.mailbox, externalId: message.externalId },
          },
          create: { eventId, ...message },
          update: { eventId, ...message },
        }),
      ),
      this.prisma.event.update({
        where: { id: eventId },
        data: {
          outlookMessageSyncStatus: "SUCCESS",
          outlookMessageLastSuccessAt: at,
          outlookMessageLastError: null,
        },
      }),
    ]);
    return this.records.read(eventId);
  }

  async fail(eventId: string, error: string) {
    await this.prisma.event.update({
      where: { id: eventId },
      data: { outlookMessageSyncStatus: "ERROR", outlookMessageLastError: error },
    });
    return this.records.read(eventId);
  }
}
