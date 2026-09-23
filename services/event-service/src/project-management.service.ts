import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type PmTask, type User } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  projectTaskPortfolio,
  projectTaskPortfolios,
  validateDependency,
  validateTaskChange,
  type Catalogue,
  type Dependency,
  type Task,
} from "@t2w/domain/project-management";
import { PrismaService } from "./prisma.service.js";
import { AuditService } from "./audit.service.js";
import { ProjectManagementCatalogue } from "./project-management-catalogue.js";
import { ProjectManagementTaskConversation } from "./project-management-task-conversation.js";
type Tx = Prisma.TransactionClient;
export type PmActor = Pick<User, "id" | "role" | "status" | "organizerId" | "financeAccess">;
type Scope = { scope: "EVENT"; eventId: string } | { scope: "GLOBAL"; eventId?: never };
type Command = {
  graphVersion?: number;
  taskVersion?: number;
  taskId?: string;
  type:
    "create" | "create-successor" | "update" | "delete" | "add-dependency" | "remove-dependency";
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
  private readonly categoryCatalogue: ProjectManagementCatalogue;
  private readonly taskConversation: ProjectManagementTaskConversation;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    this.categoryCatalogue = new ProjectManagementCatalogue(
      prisma,
      (tx, actor) => this.actor(tx, actor as PmActor),
      (tx, actor) => this.actor(tx, actor as PmActor, { admin: true }),
    );
    this.taskConversation = new ProjectManagementTaskConversation(
      prisma,
      audit,
      (tx, taskId, actor) => this.ensureTaskAccess(tx, taskId, actor),
    );
  }
  private async actor(
    tx: Tx,
    actor: PmActor,
    options: { admin?: boolean; organizer?: boolean } = {},
  ) {
    const user = await tx.user.findUnique({ where: { id: actor.id } });
    if (
      user?.status !== "ACTIVE" ||
      (!options.organizer && user.role === "ORGANIZER") ||
      (options.admin && user.role !== "ADMIN")
    )
      throw new ForbiddenException("Keine Berechtigung.");
    if (user.role === "ORGANIZER") {
      const organizer = user.organizerId
        ? await tx.organizer.findFirst({ where: { id: user.organizerId, active: true } })
        : null;
      if (!organizer) throw new ForbiddenException("Veranstalterverknüpfung fehlt.");
    }
    return user;
  }
  private catalogue(tx: Tx) {
    return Promise.all([
      tx.user.findMany({
        select: { id: true, displayName: true, status: true, role: true, organizerId: true },
        orderBy: { displayName: "asc" },
      }),
      tx.pmGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    ]).then(([owners, groups]) => ({
      owners: owners.map((owner) => ({ ...owner, active: owner.status === "ACTIVE" })),
      groups,
    }));
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
      const user = await this.actor(tx, actor, { organizer: true });
      if (user.role === "ORGANIZER") return this.organizerEventState(tx, eventId, user);
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
      const user = await this.actor(tx, actor, { organizer: true });
      if (user.role === "ORGANIZER") return this.organizerGlobalState(tx, user);
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
      const projection = this.globalProjection(all, edges, catalogue, events, time);
      return {
        referenceTime: time,
        owners: catalogue.owners,
        groups: catalogue.groups,
        eventChoices: events,
        ...projection,
        edges,
        events,
      };
    });
  }
  private async mutate(scope: Scope, input: Command, actor: PmActor) {
    if (
      !input ||
      ![
        "create",
        "create-successor",
        "update",
        "delete",
        "add-dependency",
        "remove-dependency",
      ].includes(input.type)
    )
      throw new BadRequestException("Ungültiges Kommando.");
    if (input.type === "create-successor" && input.taskId)
      throw new BadRequestException("Nachfolger benötigt eine neue Aufgabe.");
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
      if (
        input.type !== "create" &&
        input.type !== "create-successor" &&
        (!before || before.version !== input.taskVersion)
      )
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
        } else if (
          input.type === "create" ||
          input.type === "create-successor" ||
          input.type === "update"
        ) {
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
          const successorEdge =
            input.type === "create-successor"
              ? { predecessorId: input.predecessorId ?? "", successorId: taskId }
              : null;
          if (successorEdge)
            validateDependency([...current.tasks, after], current.edges, successorEdge);
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
          if (after.ownerId) await this.validateOwner(tx, scope, after.ownerId);
          if (before) await tx.pmTask.update({ where: { id: taskId }, data });
          else await tx.pmTask.create({ data: { id: taskId, ...data } });
          if (successorEdge) await tx.pmDependency.create({ data: successorEdge });
          await tx.pmActivity.create({
            data: {
              taskId,
              actorId: actor.id,
              action: input.type,
              details: json({
                before: before ?? null,
                after,
                ...(successorEdge ? { dependency: successorEdge } : {}),
              }),
            },
          });
          await this.audit.append(
            {
              entity: "PmTask",
              entityId: taskId,
              action: input.type,
              userId: actor.id,
              details: {
                before: before ?? null,
                after,
                ...(successorEdge ? { dependency: successorEdge } : {}),
              },
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
      const state =
        scope.scope === "EVENT"
          ? await this.readInside(tx, scope.eventId)
          : await this.state(tx, scope);
      return { ...state, affectedTaskId: input.type === "delete" ? null : taskId };
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
        const result = await this.mutate(
          { scope: "EVENT", eventId: task.eventId },
          { ...input, graphVersion: input.graphVersion ?? event.pmGraphVersion },
          actor,
        );
        return { ...(await this.global(actor)), affectedTaskId: result.affectedTaskId };
      }
    }
    const result = await this.mutate({ scope: "GLOBAL" }, input, actor);
    return { ...(await this.global(actor)), affectedTaskId: result.affectedTaskId };
  }
  async comments(taskId: string, actor: PmActor) {
    return this.taskConversation.comments(taskId, actor);
  }
  async comment(
    taskId: string,
    input: { id?: string; text?: string; delete?: boolean },
    actor: PmActor,
  ) {
    return this.taskConversation.comment(taskId, input, actor);
  }
  activities(taskId: string, actor: PmActor) {
    return this.taskConversation.activities(taskId, actor);
  }
  groups(actor: PmActor) {
    return this.categoryCatalogue.groups(actor);
  }
  saveGroup(
    input: {
      id?: string;
      name: string;
      icon?: string | null;
      color?: string | null;
      active: boolean;
      sortOrder: number;
      version?: number;
    },
    actor: PmActor,
  ) {
    return this.categoryCatalogue.save(input, actor);
  }
  reorderGroups(input: { groups: { id: string; version: number }[] }, actor: PmActor) {
    return this.categoryCatalogue.reorder(input, actor);
  }

  async attachments(taskId: string, actor: PmActor) {
    return this.taskConversation.attachments(taskId, actor);
  }

  async uploadAttachment(
    taskId: string,
    input: { fileName?: string; mimeType?: string; contentBase64?: string },
    actor: PmActor,
  ) {
    return this.taskConversation.uploadAttachment(taskId, input, actor);
  }

  async attachment(taskId: string, attachmentId: string, actor: PmActor) {
    return this.taskConversation.attachment(taskId, attachmentId, actor);
  }

  private async ensureTaskAccess(tx: Tx, taskId: string, actor: PmActor) {
    const user = await this.actor(tx, actor, { organizer: true });
    const task = await tx.pmTask.findUnique({
      where: { id: taskId },
      select: { ownerId: true, event: { select: { organizerId: true } } },
    });
    if (!task) throw new NotFoundException("Aufgabe nicht gefunden.");
    if (
      user.role === "ORGANIZER" &&
      (task.ownerId !== user.id || !task.event || task.event.organizerId !== user.organizerId)
    )
      throw new NotFoundException("Aufgabe nicht gefunden.");
    return user;
  }

  private async validateOwner(tx: Tx, scope: Scope, ownerId: string) {
    const owner = await tx.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.status !== "ACTIVE")
      throw new BadRequestException("Aktiver Benutzer erforderlich.");
    if (owner.role !== "ORGANIZER") return;
    if (scope.scope !== "EVENT")
      throw new BadRequestException("Veranstalter dürfen keine globalen Aufgaben erhalten.");
    const organizer = owner.organizerId
      ? await tx.organizer.findFirst({ where: { id: owner.organizerId, active: true } })
      : null;
    if (!organizer) throw new BadRequestException("Aktiver Veranstalter nicht gefunden.");
    const event = await tx.event.findUnique({
      where: { id: scope.eventId },
      select: { organizerId: true },
    });
    if (!event?.organizerId || event.organizerId !== owner.organizerId)
      throw new BadRequestException("Veranstalterkonto gehört nicht zu diesem Event.");
  }

  private async organizerGlobalState(tx: Tx, user: User) {
    if (!user.organizerId) throw new ForbiddenException("Veranstalterverknüpfung fehlt.");
    const rows = await tx.pmTask.findMany({
      where: { ownerId: user.id, event: { organizerId: user.organizerId } },
      include: {
        event: {
          select: {
            id: true,
            eventCode: true,
            name: true,
            startAt: true,
            endAt: true,
            archived: true,
            pmGraphVersion: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });
    const rawTasks = rows.map(asTask);
    const taskIds = rawTasks.map((task) => task.id);
    const edges = taskIds.length
      ? await tx.pmDependency.findMany({
          where: { predecessorId: { in: taskIds }, successorId: { in: taskIds } },
        })
      : [];
    const externallyBlockedIds = taskIds.length
      ? new Set(
          (
            await tx.pmDependency.findMany({
              where: {
                successorId: { in: taskIds },
                predecessor: { status: { not: "DONE" } },
                NOT: { predecessorId: { in: taskIds } },
              },
              select: { successorId: true },
            })
          ).map((edge) => edge.successorId),
        )
      : new Set<string>();
    const events = [
      ...new Map(
        rows.filter((row) => row.event).map((row) => [row.event!.id, row.event!]),
      ).values(),
    ];
    const groups = await tx.pmGroup.findMany({
      where: {
        id: { in: rows.map((row) => row.groupId).filter((id): id is string => Boolean(id)) },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    const owners = [
      {
        id: user.id,
        displayName: user.displayName,
        active: true,
        role: user.role,
        organizerId: user.organizerId,
      },
    ];
    const referenceTime = new Date().toISOString();
    const projection = this.globalProjection(
      rawTasks,
      edges,
      { owners, groups },
      events,
      referenceTime,
      externallyBlockedIds,
    );
    return {
      referenceTime,
      owners,
      groups,
      eventChoices: events,
      ...projection,
      edges,
      events,
      readOnly: true,
    };
  }

  private async organizerEventState(tx: Tx, eventId: string, user: User) {
    const global = await this.organizerGlobalState(tx, user);
    const event = global.events.find((candidate) => candidate.id === eventId);
    if (!event) throw new NotFoundException("Event nicht gefunden.");
    const tasks = global.tasks.filter((task) => task.eventId === eventId);
    const ids = new Set(tasks.map((task) => task.id));
    return {
      event,
      tasks,
      edges: global.edges.filter(
        (edge) => ids.has(edge.predecessorId) && ids.has(edge.successorId),
      ),
      owners: global.owners,
      groups: global.groups,
      referenceTime: global.referenceTime,
      readOnly: true,
    };
  }

  private globalProjection(
    tasks: Task[],
    edges: Dependency[],
    catalogue: Catalogue,
    events: {
      id: string;
      eventCode: string;
      name: string;
      archived: boolean;
      pmGraphVersion: number;
    }[],
    referenceTime: string,
    externallyBlockedIds = new Set<string>(),
  ) {
    const eventById = new Map(events.map((event) => [event.id, event]));
    const blocks = projectTaskPortfolios(tasks, edges, catalogue, referenceTime).map(
      ({ eventId, portfolio }) => {
        const projectedTasks = portfolio.tasks.map((task) => ({
          ...task,
          event: task.eventId ? (eventById.get(task.eventId) ?? null) : null,
          externalBlocked: externallyBlockedIds.has(task.id),
          blockedBy:
            externallyBlockedIds.has(task.id) && task.blockedBy.length === 0
              ? ["external"]
              : task.blockedBy,
        }));
        return {
          key: eventId ?? "global",
          event: eventId ? (eventById.get(eventId) ?? null) : null,
          categories: portfolio.categories.map((category) => ({
            ...category,
            tasks: projectedTasks.filter((task) => task.groupId === category.groupId),
          })),
        };
      },
    );
    return {
      tasks: blocks.flatMap((block) => block.categories.flatMap((category) => category.tasks)),
      blocks,
    };
  }
}
