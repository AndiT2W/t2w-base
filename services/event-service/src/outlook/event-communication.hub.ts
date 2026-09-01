import type { OutlookGraphClient, OutlookMessage } from "./outlook.types.js";

export type CommunicationMessage = {
  mailbox: string;
  externalId: string;
  conversationId?: string;
  direction: "INCOMING" | "OUTGOING";
  author: string;
  recipients: string;
  subject: string;
  preview: string;
  occurredAt: Date;
  hasAttachments: boolean;
  webUrl?: string;
};

export interface EventCommunicationRepository {
  source(eventId: string): Promise<{ mailbox: string; folderId: string }>;
  conflictingConversationIds(
    eventId: string,
    mailbox: string,
    conversationIds: string[],
  ): Promise<string[]>;
  begin(eventId: string): Promise<unknown>;
  store(eventId: string, messages: CommunicationMessage[]): Promise<unknown>;
  succeed(eventId: string, at: Date): Promise<unknown>;
  fail(eventId: string, error: string): Promise<unknown>;
}

function address(value?: { name?: string; address?: string }) {
  if (!value) return "";
  return value.name && value.address
    ? `${value.name} <${value.address}>`
    : (value.name ?? value.address ?? "");
}

function normalize(mailbox: string, message: OutlookMessage): CommunicationMessage {
  const sender = message.from?.emailAddress;
  const outgoing = sender?.address?.toLocaleLowerCase() === mailbox.toLocaleLowerCase();
  const occurredAt = message.sentDateTime ?? message.receivedDateTime;
  return {
    mailbox,
    externalId: message.id,
    conversationId: message.conversationId,
    direction: outgoing ? "OUTGOING" : "INCOMING",
    author: address(sender),
    recipients: (message.toRecipients ?? [])
      .map((recipient) => address(recipient.emailAddress))
      .filter(Boolean)
      .join(", "),
    subject: message.subject?.trim() || "(Ohne Betreff)",
    preview: message.bodyPreview?.trim() ?? "",
    occurredAt: occurredAt ? new Date(occurredAt) : new Date(0),
    hasAttachments: message.hasAttachments ?? false,
    webUrl: message.webLink,
  };
}

export class EventCommunicationHub {
  constructor(
    private readonly repository: EventCommunicationRepository,
    private readonly graph: OutlookGraphClient,
  ) {}

  async syncEvent(eventId: string) {
    const source = await this.repository.source(eventId);
    await this.repository.begin(eventId);
    try {
      let messages = await this.graph.listMessages(source.mailbox, source.folderId);
      const conversationIds = [
        ...new Set(
          messages
            .map((message) => message.conversationId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const conflictingIds = new Set(
        await this.repository.conflictingConversationIds(eventId, source.mailbox, conversationIds),
      );
      const unambiguousIds = conversationIds.filter((id) => !conflictingIds.has(id));
      const sentReplies = await this.graph.listMessagesByConversationIds(
        source.mailbox,
        "sentitems",
        unambiguousIds,
      );
      const mailbox = source.mailbox.toLocaleLowerCase();
      const candidates = sentReplies.filter(
        (message) =>
          message.conversationId &&
          unambiguousIds.includes(message.conversationId) &&
          message.from?.emailAddress?.address?.toLocaleLowerCase() === mailbox,
      );
      for (const message of candidates) {
        await this.graph.moveMessage(source.mailbox, message.id, source.folderId);
      }
      if (candidates.length > 0) {
        messages = await this.graph.listMessages(source.mailbox, source.folderId);
      }
      await this.repository.store(
        eventId,
        messages.map((message) => normalize(source.mailbox, message)),
      );
      return await this.repository.succeed(eventId, new Date());
    } catch (error) {
      await this.repository.fail(
        eventId,
        error instanceof Error ? error.message : "OUTLOOK_MESSAGE_SYNC_FAILED",
      );
      throw error;
    }
  }
}
