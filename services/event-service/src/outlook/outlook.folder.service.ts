import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { OutlookGraphError, type OutlookFolder, type OutlookGraphClient } from "./outlook.types.js";

@Injectable()
export class OutlookFolderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly graph: OutlookGraphClient,
  ) {}

  planEventFolder(
    event: { eventCode: string; startAt: Date },
    yearFolderName: string,
    currentPath?: string | null,
  ) {
    const year = String(event.startAt.getUTCFullYear());
    const quarter = `Q${Math.floor(event.startAt.getUTCMonth() / 3) + 1}`;
    const path = `${yearFolderName.trim()}/${quarter}/${event.eventCode}`;
    return {
      year,
      yearFolderName: yearFolderName.trim(),
      quarter,
      eventFolderName: event.eventCode,
      path,
      drifted: !!currentPath && currentPath !== path,
    };
  }

  async eventFolderPlan(eventId: string) {
    const [event, settings] = await Promise.all([
      this.prisma.event.findUniqueOrThrow({ where: { id: eventId } }),
      this.prisma.appSettings.findUnique({ where: { id: 1 } }),
    ]);
    const mappings = Array.isArray(settings?.outlookJahresordner)
      ? (settings.outlookJahresordner as { jahr?: string; url?: string }[])
      : [];
    const year = String(event.startAt.getUTCFullYear());
    const yearFolderName = mappings.find((entry) => entry.jahr === year)?.url?.trim();
    if (!yearFolderName) throw new Error(`OUTLOOK_YEAR_FOLDER_MISSING:${year}`);
    return this.planEventFolder(event, yearFolderName, event.outlookFolder);
  }

  async syncEventFolder(eventId: string, mailboxOverride?: string) {
    const settings = await this.prisma.appSettings.findUnique({ where: { id: 1 } });
    const mailbox = mailboxOverride?.trim() || settings?.outlookMailbox;
    if (!mailbox) throw new Error("OUTLOOK_SETTINGS_MISSING");
    const plan = await this.eventFolderPlan(eventId);
    return this.ensureEventFolder(eventId, mailbox, plan.yearFolderName);
  }

  async ensureFolder(mailbox: string, parentId: string, name: string): Promise<OutlookFolder> {
    const existing = (await this.graph.listChildFolders(mailbox, parentId)).find(
      (folder) => folder.displayName === name,
    );
    if (existing) return existing;
    try {
      return await this.graph.createChildFolder(mailbox, parentId, name);
    } catch (error) {
      // Another worker may have created the folder between list and create.
      if (error instanceof OutlookGraphError && error.status === 409) {
        const concurrent = (await this.graph.listChildFolders(mailbox, parentId)).find(
          (folder) => folder.displayName === name,
        );
        if (concurrent) return concurrent;
      }
      throw error;
    }
  }

  async checkConnection(mailbox: string) {
    await this.graph.listChildFolders(mailbox, "inbox");
    return { connected: true, mailbox, rootFolderId: "inbox" };
  }

  async ensureEventFolder(eventId: string, mailbox: string, yearFolderName: string) {
    const event = await this.prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    const rootFolderId = "inbox";
    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        outlookMailbox: mailbox,
        outlookRootFolderId: rootFolderId,
        outlookFolderSyncStatus: "SYNCING",
        outlookFolderLastError: null,
      },
    });
    try {
      if (!yearFolderName.trim())
        throw new Error(`OUTLOOK_YEAR_FOLDER_MISSING:${event.startAt.getUTCFullYear()}`);
      const plan = this.planEventFolder(event, yearFolderName, event.outlookFolder);
      const yearFolder = await this.ensureFolder(mailbox, rootFolderId, plan.yearFolderName);
      const quarterFolder = await this.ensureFolder(mailbox, yearFolder.id, plan.quarter);
      const eventFolder = await this.ensureFolder(mailbox, quarterFolder.id, plan.eventFolderName);
      return this.prisma.event.update({
        where: { id: eventId },
        data: {
          outlookMailbox: mailbox,
          outlookRootFolderId: rootFolderId,
          outlookYearFolderId: yearFolder.id,
          outlookQuarterFolderId: quarterFolder.id,
          outlookFolderId: eventFolder.id,
          outlookFolder: eventFolder.displayName,
          outlookWebUrl:
            eventFolder.webUrl ??
            `https://outlook.office.com/mail/deeplink/folder/${encodeURIComponent(eventFolder.id)}`,
          outlookFolderSyncStatus: "SUCCESS",
          outlookFolderLastSuccessAt: new Date(),
          outlookFolderLastError: null,
        },
      });
    } catch (error) {
      const message =
        error instanceof OutlookGraphError && error.status === 429
          ? `OUTLOOK_GRAPH_RATE_LIMITED${error.retryAfter ? `; retry-after=${error.retryAfter}` : ""}`
          : error instanceof Error
            ? error.message
            : "OUTLOOK_FOLDER_SYNC_FAILED";
      await this.prisma.event.update({
        where: { id: eventId },
        data: {
          outlookMailbox: mailbox,
          outlookRootFolderId: rootFolderId,
          outlookFolderSyncStatus: "ERROR",
          outlookFolderLastError: message,
        },
      });
      throw error;
    }
  }
}
