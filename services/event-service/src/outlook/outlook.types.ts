export type OutlookFolder = { id: string; displayName: string; webUrl?: string };

export interface OutlookGraphClient {
  listChildFolders(mailbox: string, parentId: string): Promise<OutlookFolder[]>;
  createChildFolder(mailbox: string, parentId: string, displayName: string): Promise<OutlookFolder>;
}
