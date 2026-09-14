import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type PmTask } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  projectTaskPortfolio,
  validateDependency,
  validateTaskChange,
  type Dependency,
  type Task,
} from "@t2w/domain/project-management";
import { PrismaService } from "./prisma.service.js";
import { AuditService } from "./audit.service.js";
type Tx = Prisma.TransactionClient;
export type PmActor = { id: string; role: string; active: boolean };
type Scope = { scope: "EVENT"; eventId: string } | { scope: "GLOBAL"; eventId?: never };
type Command = {
  graphVersion?: number;
  taskVersion?: number;
  taskId?: string;
  type: "create" | "update" | "delete" | "add-dependency" | "remove-dependency";
  task?: Partial<Task> & { scope?: "EVENT" | "GLOBAL"; eventId?: string | null };
  predecessorId?: string;
};
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
const asTask = (task: PmTask): Task => ({
  id: task.id,
  scope: task.scope as Task["scope"],
  eventId: task.eventId,
  title: task.title,
  description: task.description,
  status: task.status as Task["status"],
  priority: task.priority as Task["priority"],
  ownerId: task.ownerId,
  groupId: task.groupId,
  startDate: task.startDate,
  endDate: task.endDate,
  version: task.version,
});

@Injectable()
export class ProjectManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  private async actor(tx: Tx, actor: PmActor, admin = false) {
    const user = await tx.user.findUnique({ where: { id: actor.id } });
    if (
      !user?.active ||
      !["ADMIN", "MITARBEITER"].includes(user.role) ||
      (admin && user.role !== "ADMIN")
    )
      throw new ForbiddenException("Keine Berechtigung.");
    return user;
  }
  private catalogue(tx: Tx) {
    return Promise.all([
      tx.user.findMany({
        select: { id: true, displayName: true, active: true },
        orderBy: { displayName: "asc" },
      }),
      tx.pmGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    ]).then(([owners, groups]) => ({ owners, groups }));
  }
  private async ensureScope(tx: Tx, scope: Scope, actor: PmActor) {
    await this.actor(tx, actor);
    if (scope.scope === "EVENT") {
      const event = await tx.event.findUnique({ where: { id: scope.eventId } });
      if (!event) throw new NotFoundException("Event nicht gefunden.");
      if (event.archived) throw new ForbiddenException("Archivierte Events sind schreibgeschützt.");
      return event;
    }
    return null;
  }
  private async state(tx: Tx, scope: Scope, referenceTime = new Date().toISOString()) {
    const catalogue = await this.catalogue(tx);
    const tasks = (
      await tx.pmTask.findMany({
        where: scope.scope === "EVENT" ? { eventId: scope.eventId } : { scope: "GLOBAL" },
        orderBy: { id: "asc" },
      })
    ).map(asTask);
    const ids = tasks.map((task) => task.id);
    const edges = ids.length
      ? await tx.pmDependency.findMany({ where: { successorId: { in: ids } } })
      : [];
    return { ...projectTaskPortfolio(tasks, edges, catalogue, referenceTime), ...catalogue };
  }
  async read(eventId: string, actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureScope(tx, { scope: "EVENT", eventId }, actor);
      const event = await tx.event.findUniqueOrThrow({
        where: { id: eventId },
        select: { id: true, eventCode: true, name: true, archived: true, pmGraphVersion: true },
      });
      return {
        event,
        ...(await this.state(tx, { scope: "EVENT", eventId })),
      };
    });
  }
  async global(actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actor);
      const catalogue = await this.catalogue(tx),
        time = new Date().toISOString();
      const events = await tx.event.findMany({
        where: { archived: false },
        select: { id: true, eventCode: true, name: true, archived: true, pmGraphVersion: true },
        orderBy: { startAt: "asc" },
      });
      const all = (await tx.pmTask.findMany({ orderBy: { id: "asc" } })).map(asTask);
      const edges = all.length
        ? await tx.pmDependency.findMany({
            where: { successorId: { in: all.map((task) => task.id) } },
          })
        : [];
      return {
        referenceTime: time,
        owners: catalogue.owners,
        groups: catalogue.groups,
        eventChoices: events,
        tasks: all.map((task) => ({
          ...task,
          event: task.eventId ? (events.find((event) => event.id === task.eventId) ?? null) : null,
        })),
        edges,
        events,
      };
    });
  }
  private async mutate(scope: Scope, input: Command, actor: PmActor) {
    if (
      !input ||
      !["create", "update", "delete", "add-dependency", "remove-dependency"].includes(input.type)
    )
      throw new BadRequestException("Ungültiges Kommando.");
    return this.prisma.$transaction(async (tx) => {
      await this.ensureScope(tx, scope, actor);
      if (scope.scope === "EVENT") {
        if (!Number.isInteger(input.graphVersion))
          throw new BadRequestException("Graphversion erforderlich.");
        const locked = await tx.event.updateMany({
          where: { id: scope.eventId, pmGraphVersion: input.graphVersion, archived: false },
          data: { pmGraphVersion: { increment: 1 } },
        });
        if (!locked.count)
          throw new ConflictException("Event wurde geändert. Aktuellen Stand laden.");
      }
      const current = await this.state(tx, scope),
        before = current.tasks.find((task) => task.id === input.taskId);
      if (input.type !== "create" && (!before || before.version !== input.taskVersion))
        throw new ConflictException("Aufgabe wurde geändert.");
      const taskId = before?.id ?? randomUUID();
      try {
        if (input.type === "delete") {
          await tx.pmDependency.deleteMany({
            where: { OR: [{ predecessorId: taskId }, { successorId: taskId }] },
          });
          await tx.pmTask.delete({ where: { id: taskId } });
          await this.audit.append(
            {
              entity: "PmTask",
              entityId: taskId,
              action: "delete",
              userId: actor.id,
              details: { scope: before!.scope },
            },
            tx,
          );
        } else if (input.type === "create" || input.type === "update") {
          const patch = input.task ?? {};
          const after: Task = {
            id: taskId,
            scope: before?.scope ?? scope.scope,
            eventId: before?.eventId ?? (scope.scope === "EVENT" ? scope.eventId : null),
            version: (before?.version ?? 0) + 1,
            title: patch.title ?? before?.title ?? "",
            description: patch.description ?? before?.description ?? "",
            status: patch.status ?? before?.status ?? "OPEN",
            priority: patch.priority ?? before?.priority ?? "NORMAL",
            ownerId: patch.ownerId === undefined ? (before?.ownerId ?? null) : patch.ownerId,
            groupId: patch.groupId === undefined ? (before?.groupId ?? null) : patch.groupId,
            startDate:
              patch.startDate === undefined ? (before?.startDate ?? null) : patch.startDate,
            endDate: patch.endDate === undefined ? (before?.endDate ?? null) : patch.endDate,
          };
          if (
            !["OPEN", "IN_PROGRESS", "DONE"].includes(after.status) ||
            !["LOW", "NORMAL", "HIGH"].includes(after.priority) ||
            after.scope !== scope.scope ||
            after.eventId !== (scope.scope === "EVENT" ? scope.eventId : null)
          )
            throw new Error("Ungültiger Aufgabenwert.");
          if (
            [after.title, after.description].some(
              (value) => typeof value !== "string" || value.length > 10000,
            )
          )
            throw new Error("Ungültiger Text.");
          validateTaskChange(before ?? null, after, current.tasks, current.edges, current);
          const data = {
            scope: after.scope,
            eventId: after.eventId,
            title: after.title.trim(),
            description: after.description,
            status: after.status,
            priority: after.priority,
            ownerId: after.ownerId,
            groupId: after.groupId,
            startDate: after.startDate,
            endDate: after.endDate,
            version: after.version,
          };
          if (before) await tx.pmTask.update({ where: { id: taskId }, data });
          else await tx.pmTask.create({ data: { id: taskId, ...data } });
          await tx.pmActivity.create({
            data: {
              taskId,
              actorId: actor.id,
              action: input.type,
              details: json({ before: before ?? null, after }),
            },
          });
          await this.audit.append(
            {
              entity: "PmTask",
              entityId: taskId,
              action: input.type,
              userId: actor.id,
              details: { before: before ?? null, after },
            },
            tx,
          );
        } else {
          const edge: Dependency = {
            predecessorId: input.predecessorId ?? "",
            successorId: taskId,
          };
          if (input.type === "add-dependency") {
            validateDependency(current.tasks, current.edges, edge);
            await tx.pmDependency.create({ data: edge });
          } else await tx.pmDependency.delete({ where: { predecessorId_successorId: edge } });
          await tx.pmTask.update({ where: { id: taskId }, data: { version: { increment: 1 } } });
          await tx.pmActivity.create({
            data: { taskId, actorId: actor.id, action: input.type, details: json(edge) },
          });
          await this.audit.append(
            {
              entity: "PmTask",
              entityId: taskId,
              action: input.type,
              userId: actor.id,
              details: edge,
            },
            tx,
          );
        }
      } catch (error) {
        throw new BadRequestException(
          error instanceof Error ? error.message : "Ungültige Änderung.",
        );
      }
      return scope.scope === "EVENT" ? this.readInside(tx, scope.eventId) : this.state(tx, scope);
    });
  }
  private async readInside(tx: Tx, eventId: string) {
    const event = await tx.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { id: true, eventCode: true, name: true, archived: true, pmGraphVersion: true },
    });
    return {
      event,
      ...(await this.state(tx, { scope: "EVENT", eventId })),
    };
  }
  command(eventId: string, input: Command, actor: PmActor) {
    return this.mutate({ scope: "EVENT", eventId }, input, actor);
  }
  async globalCommand(input: Command, actor: PmActor) {
    if (input.taskId) {
      const task = await this.prisma.pmTask.findUnique({
        where: { id: input.taskId },
        select: { eventId: true },
      });
      if (task?.eventId) {
        const event = await this.prisma.event.findUniqueOrThrow({
          where: { id: task.eventId },
          select: { pmGraphVersion: true },
        });
        return this.mutate(
          { scope: "EVENT", eventId: task.eventId },
          { ...input, graphVersion: input.graphVersion ?? event.pmGraphVersion },
          actor,
        );
      }
    }
    return this.mutate({ scope: "GLOBAL" }, input, actor);
  }
  async comments(taskId: string, actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actor);
      return tx.pmComment.findMany({ where: { taskId }, orderBy: { createdAt: "asc" } });
    });
  }
  async comment(
    taskId: string,
    input: { id?: string; text?: string; delete?: boolean },
    actor: PmActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actor);
      const task = await tx.pmTask.findUnique({ where: { id: taskId } });
      if (!task) throw new NotFoundException("Aufgabe nicht gefunden.");
      const before = input.id ? await tx.pmComment.findUnique({ where: { id: input.id } }) : null;
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
      await this.actor(tx, actor);
      return tx.pmActivity.findMany({
        where: { taskId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });
    });
  }
  groups(actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actor);
      return this.catalogue(tx);
    });
  }
  saveGroup(
    input: { id?: string; name: string; active: boolean; sortOrder: number; version?: number },
    actor: PmActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actor, true);
      if (!input.name?.trim() || !Number.isInteger(input.sortOrder))
        throw new BadRequestException("Name und Reihenfolge erforderlich.");
      const before = input.id ? await tx.pmGroup.findUnique({ where: { id: input.id } }) : null;
      if (before && before.version !== input.version)
        throw new ConflictException("Kategorie wurde geändert.");
      return before
        ? tx.pmGroup.update({
            where: { id: before.id },
            data: {
              name: input.name.trim(),
              active: input.active,
              sortOrder: input.sortOrder,
              version: { increment: 1 },
            },
          })
        : tx.pmGroup.create({
            data: { name: input.name.trim(), active: input.active, sortOrder: input.sortOrder },
          });
    });
  }
}
