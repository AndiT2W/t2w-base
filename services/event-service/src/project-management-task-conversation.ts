import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Prisma, type User } from "@prisma/client";
import { AuditService } from "./audit.service.js";
import type { PmActor } from "./project-management.service.js";
import { PrismaService } from "./prisma.service.js";

type Tx = Prisma.TransactionClient;
type TaskAccess = (tx: Tx, taskId: string, actor: PmActor) => Promise<User>;
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

/** Task conversation and attachment implementation behind the planning facade seam. */
export class ProjectManagementTaskConversation {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ensureTaskAccess: TaskAccess,
  ) {}

  async comments(taskId: string, actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureTaskAccess(tx, taskId, actor);
      return tx.pmComment.findMany({
        where: { taskId },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, displayName: true } } },
      });
    });
  }

  async comment(
    taskId: string,
    input: { id?: string; text?: string; delete?: boolean },
    actor: PmActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureTaskAccess(tx, taskId, actor);
      const before = input.id ? await tx.pmComment.findUnique({ where: { id: input.id } }) : null;
      if (before && before.taskId !== taskId)
        throw new NotFoundException("Kommentar nicht gefunden.");
      if (before && before.authorId !== actor.id)
        throw new ForbiddenException("Nur eigene Kommentare dürfen geändert werden.");
      if (input.delete) {
        if (!before) throw new NotFoundException("Kommentar nicht gefunden.");
        await tx.pmActivity.deleteMany({
          where: { taskId, details: { path: ["commentId"], equals: before.id } },
        });
        await tx.pmComment.delete({ where: { id: before.id } });
        await this.audit.append(
          {
            entity: "PmComment",
            entityId: before.id,
            action: "delete",
            userId: actor.id,
            details: { taskId },
          },
          tx,
        );
        return null;
      }
      if (!input.text?.trim() || input.text.length > 10000)
        throw new BadRequestException("Kommentartext erforderlich.");
      const saved = before
        ? await tx.pmComment.update({ where: { id: before.id }, data: { text: input.text } })
        : await tx.pmComment.create({ data: { taskId, authorId: actor.id, text: input.text } });
      await tx.pmActivity.create({
        data: {
          taskId,
          actorId: actor.id,
          action: before ? "comment-update" : "comment-create",
          details: json({ commentId: saved.id, before: before?.text ?? null, after: saved.text }),
        },
      });
      return saved;
    });
  }

  activities(taskId: string, actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      const user = await this.ensureTaskAccess(tx, taskId, actor);
      if (user.role === "ORGANIZER") return [];
      return tx.pmActivity.findMany({
        where: { taskId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });
    });
  }

  async attachments(taskId: string, actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureTaskAccess(tx, taskId, actor);
      return tx.pmAttachment.findMany({
        where: { taskId },
        select: {
          id: true,
          taskId: true,
          authorId: true,
          fileName: true,
          mimeType: true,
          size: true,
          createdAt: true,
          author: { select: { id: true, displayName: true } },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
    });
  }

  async uploadAttachment(
    taskId: string,
    input: { fileName?: string; mimeType?: string; contentBase64?: string },
    actor: PmActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureTaskAccess(tx, taskId, actor);
      const fileName = input.fileName?.trim().replace(/[\\/]/g, "_") ?? "";
      const mimeType = input.mimeType?.trim().toLowerCase() ?? "";
      const allowed = new Set([
        "application/pdf",
        "image/jpeg",
        "image/png",
        "text/plain",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]);
      if (!fileName || fileName.length > 180 || !allowed.has(mimeType) || !input.contentBase64)
        throw new BadRequestException("Dateiname oder Dateityp ist ungültig.");
      const content = Buffer.from(input.contentBase64, "base64");
      if (!content.length || content.length > 5 * 1024 * 1024)
        throw new BadRequestException("Datei muss zwischen 1 Byte und 5 MB groß sein.");
      return tx.pmAttachment.create({
        data: { taskId, authorId: actor.id, fileName, mimeType, size: content.length, content },
        select: {
          id: true,
          taskId: true,
          authorId: true,
          fileName: true,
          mimeType: true,
          size: true,
          createdAt: true,
          author: { select: { id: true, displayName: true } },
        },
      });
    });
  }

  async attachment(taskId: string, attachmentId: string, actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureTaskAccess(tx, taskId, actor);
      const file = await tx.pmAttachment.findFirst({ where: { id: attachmentId, taskId } });
      if (!file) throw new NotFoundException("Datei nicht gefunden.");
      return file;
    });
  }
}
