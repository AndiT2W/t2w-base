export type OutlookFolder = { id: string; displayName: string; webUrl?: string };

export type OutlookMessage = {
  id: string;
  conversationId?: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  sentDateTime?: string;
  from?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: { emailAddress?: { name?: string; address?: string } }[];
  hasAttachments?: boolean;
  webLink?: string;
};

export class OutlookGraphError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly retryAfter?: string,
  ) {
    super(message);
    this.name = "OutlookGraphError";
  }
}

export interface OutlookGraphClient {
  listChildFolders(mailbox: string, parentId: string): Promise<OutlookFolder[]>;
  createChildFolder(mailbox: string, parentId: string, displayName: string): Promise<OutlookFolder>;
  listMessages(mailbox: string, folderId: string): Promise<OutlookMessage[]>;
  listMessagesByConversationIds(
    mailbox: string,
    folderId: string,
    conversationIds: string[],
  ): Promise<OutlookMessage[]>;
  moveMessage(
    mailbox: string,
    messageId: string,
    destinationFolderId: string,
  ): Promise<OutlookMessage>;
}
