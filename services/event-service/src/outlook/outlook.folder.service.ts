import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import type { OutlookFolder, OutlookGraphClient } from "./outlook.types.js";

@Injectable()
export class OutlookFolderService {
  constructor(private readonly prisma: PrismaService, private readonly graph: OutlookGraphClient) {}

  async ensureFolder(mailbox: string, parentId: string, name: string): Promise<OutlookFolder> {
    const existing = (await this.graph.listChildFolders(mailbox, parentId)).find((folder) => folder.displayName === name);
    return existing ?? this.graph.createChildFolder(mailbox, parentId, name);
  }

  async checkConnection(mailbox: string, rootFolderId: string) {
    await this.graph.listChildFolders(mailbox, rootFolderId);
    return { connected: true, mailbox, rootFolderId };
  }

  async ensureEventFolder(eventId: string, mailbox: string, rootFolderId: string) {
    const event = await this.prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    try {
      const year = String(event.startAt.getUTCFullYear());
      const quarter = `Q${Math.floor(event.startAt.getUTCMonth() / 3) + 1}`;
      const yearFolder = await this.ensureFolder(mailbox, rootFolderId, year);
      const quarterFolder = await this.ensureFolder(mailbox, yearFolder.id, quarter);
      const eventFolder = await this.ensureFolder(mailbox, quarterFolder.id, event.eventCode);
      return this.prisma.event.update({ where: { id: eventId }, data: { outlookMailbox: mailbox, outlookRootFolderId: rootFolderId, outlookYearFolderId: yearFolder.id, outlookQuarterFolderId: quarterFolder.id, outlookFolderId: eventFolder.id, outlookFolder: eventFolder.displayName, outlookWebUrl: eventFolder.webUrl, outlookFolderSyncStatus: "SUCCESS", outlookFolderLastSuccessAt: new Date(), outlookFolderLastError: null } });
    } catch (error) {
      await this.prisma.event.update({ where: { id: eventId }, data: { outlookMailbox: mailbox, outlookRootFolderId: rootFolderId, outlookFolderSyncStatus: "ERROR", outlookFolderLastError: error instanceof Error ? error.message : "OUTLOOK_FOLDER_SYNC_FAILED" } });
      throw error;
    }
  }
}
