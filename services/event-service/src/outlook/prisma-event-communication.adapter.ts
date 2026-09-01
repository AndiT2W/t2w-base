import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import type {
  CommunicationMessage,
  EventCommunicationRepository,
} from "./event-communication.hub.js";

export const eventCommunicationInclude = {
  organizer: true,
  sport: true,
  contacts: { include: { contact: true } },
  payoutRecipient: true,
  invoiceRecipients: { include: { organizer: true } },
  tasks: true,
  files: true,
  activities: true,
  communicationMessages: { orderBy: { occurredAt: "desc" as const } },
};

@Injectable()
export class PrismaEventCommunicationAdapter implements EventCommunicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async source(eventId: string) {
    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { outlookMailbox: true, outlookFolderId: true },
    });
    if (!event.outlookMailbox || !event.outlookFolderId)
      throw new Error("OUTLOOK_EVENT_FOLDER_MISSING");
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

  begin(eventId: string) {
    return this.prisma.event.update({
      where: { id: eventId },
      data: { outlookMessageSyncStatus: "SYNCING", outlookMessageLastError: null },
    });
  }

  async store(eventId: string, messages: CommunicationMessage[]) {
    await this.prisma.$transaction(
      messages.map((message) =>
        this.prisma.eventCommunicationMessage.upsert({
          where: {
            mailbox_externalId: { mailbox: message.mailbox, externalId: message.externalId },
          },
          create: { eventId, ...message },
          update: { eventId, ...message },
        }),
      ),
    );
  }

  async succeed(eventId: string, at: Date) {
    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        outlookMessageSyncStatus: "SUCCESS",
        outlookMessageLastSuccessAt: at,
        outlookMessageLastError: null,
      },
    });
    return this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      include: eventCommunicationInclude,
    });
  }

  fail(eventId: string, error: string) {
    return this.prisma.event.update({
      where: { id: eventId },
      data: { outlookMessageSyncStatus: "ERROR", outlookMessageLastError: error },
    });
  }
}
