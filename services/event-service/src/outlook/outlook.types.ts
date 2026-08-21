export type OutlookFolder = { id: string; displayName: string; webUrl?: string };

export class OutlookGraphError extends Error {
  constructor(public readonly status: number, message: string, public readonly retryAfter?: string) {
    super(message);
    this.name = "OutlookGraphError";
  }
}

export interface OutlookGraphClient {
  listChildFolders(mailbox: string, parentId: string): Promise<OutlookFolder[]>;
  createChildFolder(mailbox: string, parentId: string, displayName: string): Promise<OutlookFolder>;
}
