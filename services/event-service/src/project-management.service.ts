import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type PmTask } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import {
  isOpen,
  projectTasks,
  validateDependency,
  validateTaskChange,
  deadlineInstant,
  type Task,
  type Dependency,
} from "@t2w/domain/project-management";
import { PrismaService } from "./prisma.service.js";
import { AuditService } from "./audit.service.js";

type Tx = Prisma.TransactionClient;
export type PmActor = { id: string; role: string; active: boolean };
type Command = {
  graphVersion: number;
  taskVersion?: number;
  taskId?: string;
  type: "create" | "update" | "add-dependency" | "remove-dependency";
  task?: Partial<Task>;
  predecessorId?: string;
  reason?: string;
};
const asTask = (task: PmTask): Task => ({
  ...task,
  references: task.references as NonNullable<Task["references"]>,
  status: task.status as Task["status"],
  priority: task.priority as Task["priority"],
  dueType: task.dueType as Task["dueType"],
});
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

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
  private async catalogue(tx: Tx) {
    return {
      owners: await tx.user.findMany({
        select: { id: true, displayName: true, active: true },
        orderBy: { displayName: "asc" },
      }),
      groups: await tx.pmGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    };
  }
  private async snapshot(
    tx: Tx,
    eventId: string,
    referenceTime = new Date().toISOString(),
    sharedCatalogue?: Awaited<ReturnType<ProjectManagementService["catalogue"]>>,
  ) {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventCode: true,
        name: true,
        archived: true,
        seriesId: true,
        startAt: true,
        endAt: true,
        pmGraphVersion: true,
        pmTimeZone: true,
      },
    });
    if (!event) throw new NotFoundException("Event nicht gefunden.");
    const catalogue = sharedCatalogue ?? (await this.catalogue(tx));
    const tasks = (await tx.pmTask.findMany({ where: { eventId }, orderBy: { id: "asc" } })).map(
      asTask,
    );
    const edges = await tx.pmDependency.findMany({ where: { successor: { eventId } } });
    const projection = projectTasks(tasks, edges, catalogue, event.pmTimeZone, referenceTime);
    return {
      event,
      ...catalogue,
      ...projection,
      legacyCount: await tx.eventTask.count({ where: { eventId } }),
      legacySnapshots: await tx.pmLegacySnapshot.findMany({
        where: { eventId },
        select: { id: true, count: true, sha256: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    };
  }
  async references(eventId: string, actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actor);
      const event = await tx.event.findUniqueOrThrow({ where: { id: eventId } });
      const base = `/events/${encodeURIComponent(event.eventCode)}`;
      const contacts = await tx.eventContact.findMany({
        where: { eventId },
        include: { contact: true },
      });
      const messages = await tx.eventCommunicationMessage.findMany({ where: { eventId } });
      const hardware = await tx.hardwareIssue.findMany({ where: { eventId } });
      const payouts = await tx.payout.findMany({ where: { eventId } });
      const files = await tx.eventFile.findMany({ where: { eventId } });
      return [
        ...contacts.map((c) => ({
          kind: "contact",
          id: c.contactId,
          title: c.contact.name,
          href: `/kontakte?person=${c.contactId}`,
        })),
        ...messages.map((m) => ({
          kind: "message",
          id: m.id,
          title: m.subject,
          href: `${base}?tab=kommunikation`,
        })),
        ...hardware.map((h) => ({
          kind: "hardware",
          id: h.id,
          title: `${h.objectName} · ${h.recipientName}`,
          href: `${base}?tab=hardware`,
        })),
        ...payouts.map((p) => ({
          kind: "payout",
          id: p.id,
          title: p.payoutNumber,
          href: `${base}?tab=finanz`,
        })),
        ...files.map((f) => ({
          kind: "file",
          id: f.id,
          title: f.name,
          href: `${base}?tab=dateien`,
        })),
      ].filter(
        (ref, index, all) => all.findIndex((r) => r.kind === ref.kind && r.id === ref.id) === index,
      );
    });
  }
  private async validateReferences(tx: Tx, eventId: string, references: Task["references"]) {
    if (!Array.isArray(references) || references.length > 100)
      throw new Error("Ungültige Referenzen.");
    const seen = new Set<string>();
    for (const ref of references) {
      if (!ref || typeof ref.id !== "string" || !/^[0-9a-f-]{36}$/i.test(ref.id))
        throw new Error("Ungültige Referenz.");
      const key = `${ref.kind}:${ref.id}`;
      if (seen.has(key)) throw new Error("Doppelte Referenz.");
      seen.add(key);
      const exists =
        ref.kind === "contact"
          ? await tx.eventContact.count({ where: { eventId, contactId: ref.id } })
          : ref.kind === "message"
            ? await tx.eventCommunicationMessage.count({ where: { eventId, id: ref.id } })
            : ref.kind === "hardware"
              ? await tx.hardwareIssue.count({ where: { eventId, id: ref.id } })
              : ref.kind === "payout"
                ? await tx.payout.count({ where: { eventId, id: ref.id } })
                : ref.kind === "file"
                  ? await tx.eventFile.count({ where: { eventId, id: ref.id } })
                  : 0;
      if (!exists) throw new Error("Referenz fehlt oder gehört zu einem anderen Event.");
    }
  }
  read(eventId: string, actor: PmActor) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.actor(tx, actor);
        return this.snapshot(tx, eventId);
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
  configure(eventId: string, input: { graphVersion: number; timeZone: string }, actor: PmActor) {
    try {
      if (typeof input.timeZone !== "string") throw new Error();
      new Intl.DateTimeFormat("en", { timeZone: input.timeZone }).format();
    } catch {
      throw new BadRequestException("Gültige IANA-Zeitzone erforderlich.");
    }
    if (!Number.isInteger(input.graphVersion))
      throw new BadRequestException("Graphversion erforderlich.");
    return this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actor);
      const before = await tx.event.findUniqueOrThrow({ where: { id: eventId } });
      const updated = await tx.event.updateMany({
        where: { id: eventId, pmGraphVersion: input.graphVersion, archived: false },
        data: { pmTimeZone: input.timeZone, pmGraphVersion: { increment: 1 } },
      });
      if (!updated.count) throw new ConflictException("Event geändert oder archiviert.");
      await this.audit.append(
        {
          entity: "Event",
          entityId: eventId,
          action: "pm-timezone",
          userId: actor.id,
          oldValue: before.pmTimeZone,
          newValue: input.timeZone,
        },
        tx,
      );
      return this.snapshot(tx, eventId);
    });
  }
  async command(eventId: string, input: Command, actor: PmActor) {
    if (
      !input ||
      !Number.isInteger(input.graphVersion) ||
      !["create", "update", "add-dependency", "remove-dependency"].includes(input.type)
    )
      throw new BadRequestException("Ungültiges Kommando oder fehlende Graphversion.");
    return this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actor);
      // The event row is the shared serialization point for graph/status/archive commands.
      const locked = await tx.event.updateMany({
        where: { id: eventId, pmGraphVersion: input.graphVersion, archived: false },
        data: { pmGraphVersion: { increment: 1 } },
      });
      if (!locked.count)
        throw new ConflictException({
          message:
            "Event geändert oder archiviert. Eingaben bleiben erhalten; aktuellen Stand laden.",
          current: await tx.event.findUnique({
            where: { id: eventId },
            select: { pmGraphVersion: true, archived: true },
          }),
          tasks: await tx.pmTask.findMany({
            where: { eventId },
            select: { id: true, version: true },
          }),
        });
      const state = await this.snapshot(tx, eventId);
      if (state.legacyCount)
        throw new ConflictException("Legacy-Aufgaben zuerst geprüft sichern und umstellen.");
      const before = state.tasks.find((t) => t.id === input.taskId);
      if (input.type !== "create" && (!before || before.version !== input.taskVersion))
        throw new ConflictException({
          message: "Aufgabe wurde geändert. Eigene Eingaben bleiben erhalten.",
          current: before ?? null,
        });
      const taskId = before?.id ?? randomUUID();
      let details: unknown;
      try {
        if (input.type === "create" || input.type === "update") {
          const patch = input.task ?? {};
          // Copy only editable fields; client IDs, event scopes and versions are never accepted.
          const after: Task = {
            references: patch.references ?? before?.references ?? [],
            id: taskId,
            eventId,
            version: (before?.version ?? 0) + 1,
            title: patch.title ?? before?.title ?? "",
            status: patch.status ?? before?.status ?? "NEW",
            priority: patch.priority ?? before?.priority ?? "NORMAL",
            ownerId: patch.ownerId === undefined ? (before?.ownerId ?? null) : patch.ownerId,
            groupId: patch.groupId === undefined ? (before?.groupId ?? null) : patch.groupId,
            nextStep: patch.nextStep ?? before?.nextStep ?? "",
            result: patch.result ?? before?.result ?? "",
            reason: input.reason ?? "",
            dueType: patch.dueType ?? before?.dueType ?? "NONE",
            dueDate: patch.dueDate === undefined ? (before?.dueDate ?? null) : patch.dueDate,
            dueAt: patch.dueAt === undefined ? (before?.dueAt ?? null) : patch.dueAt,
          };
          if (
            !["NEW", "IN_PROGRESS", "DONE", "CANCELLED"].includes(after.status) ||
            !["NORMAL", "HIGH"].includes(after.priority) ||
            !["NONE", "DATE", "INSTANT"].includes(after.dueType)
          )
            throw new Error("Ungültiger Status, Priorität oder Fristtyp.");
          for (const value of [after.title, after.nextStep, after.result, after.reason])
            if (typeof value !== "string" || value.length > 10000)
              throw new Error("Ungültiger Text.");
          validateTaskChange(before ?? null, after, state.tasks, state.edges, state);
          await this.validateReferences(tx, eventId, after.references);
          const { id, ...data } = after;
          if (before) await tx.pmTask.update({ where: { id }, data });
          else await tx.pmTask.create({ data: { id, ...data } });
          details = { before: before ?? null, after, reason: input.reason ?? "" };
        } else {
          const edge: Dependency = {
            predecessorId: input.predecessorId ?? "",
            successorId: taskId,
          };
          if (input.type === "add-dependency") {
            validateDependency(state.tasks, state.edges, edge);
            await tx.pmDependency.create({ data: edge });
          } else {
            if (!input.reason?.trim()) throw new Error("Entfernungsgrund ist erforderlich.");
            const removed = await tx.pmDependency.deleteMany({ where: edge });
            if (!removed.count) throw new Error("Abhängigkeit nicht gefunden.");
          }
          await tx.pmTask.update({ where: { id: taskId }, data: { version: { increment: 1 } } });
          details = { ...edge, reason: input.reason ?? "" };
        }
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) throw error;
        throw new BadRequestException(
          error instanceof Error ? error.message : "Ungültige Änderung.",
        );
      }
      await tx.pmActivity.create({
        data: { taskId, actorId: actor.id, action: input.type, details: json(details) },
      });
      await this.audit.append(
        { entity: "PmTask", entityId: taskId, action: input.type, userId: actor.id, details },
        tx,
      );
      return { ...(await this.snapshot(tx, eventId)), changedTaskId: taskId };
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
      if (
        typeof input.name !== "string" ||
        !input.name.trim() ||
        typeof input.active !== "boolean" ||
        !Number.isInteger(input.sortOrder)
      )
        throw new BadRequestException("Name, Aktivierung und Reihenfolge erforderlich.");
      const before = input.id ? await tx.pmGroup.findUnique({ where: { id: input.id } }) : null;
      if (input.id && (!before || before.version !== input.version))
        throw new ConflictException("Kategorie wurde geändert.");
      const data = { name: input.name.trim(), active: input.active, sortOrder: input.sortOrder };
      const group = before
        ? await tx.pmGroup.update({
            where: { id: before.id, version: input.version },
            data: { ...data, version: { increment: 1 } },
          })
        : await tx.pmGroup.create({ data });
      await this.audit.append(
        {
          entity: "PmGroup",
          entityId: group.id,
          action: "save",
          userId: actor.id,
          oldValue: before,
          newValue: group,
        },
        tx,
      );
      return group;
    });
  }
  global(query: Record<string, string>, actor: PmActor) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.actor(tx, actor);
        const time = new Date().toISOString();
        if (Object.values(query).some((value) => typeof value !== "string"))
          throw new BadRequestException("Filter müssen einzelne Textwerte sein.");
        const values = (key: string) => query[key]?.split(",").filter(Boolean) ?? [];
        for (const key of ["eventFrom", "eventTo", "dueFrom", "dueTo"])
          if (
            query[key] &&
            (!/^\d{4}-\d{2}-\d{2}$/.test(query[key]) || !Number.isFinite(Date.parse(query[key])))
          )
            throw new BadRequestException("Ungültiger Datumsfilter.");
        const events = await tx.event.findMany({
          where: {
            ...(query.archive === "all" ? {} : { archived: query.archive === "archived" }),
            ...(values("event").length ? { id: { in: values("event") } } : {}),
            ...(query.eventFrom
              ? { endAt: { gte: new Date(`${query.eventFrom}T00:00:00Z`) } }
              : {}),
            ...(query.eventTo
              ? { startAt: { lte: new Date(`${query.eventTo}T23:59:59.999Z`) } }
              : {}),
          },
          select: {
            id: true,
            name: true,
            eventCode: true,
            archived: true,
            seriesId: true,
            startAt: true,
            endAt: true,
            pmGraphVersion: true,
            pmTimeZone: true,
          },
          orderBy: { id: "asc" },
        });
        const catalogue = await this.catalogue(tx);
        const eventIds = events.map((event) => event.id);
        const storedTasks = await tx.pmTask.findMany({
          where: { eventId: { in: eventIds } },
          orderBy: { id: "asc" },
        });
        const storedEdges = await tx.pmDependency.findMany({
          where: { successor: { eventId: { in: eventIds } } },
        });
        const tasksByEvent = new Map<string, Task[]>();
        const taskEvents = new Map<string, string>();
        for (const task of storedTasks) {
          const tasks = tasksByEvent.get(task.eventId) ?? [];
          tasks.push(asTask(task));
          tasksByEvent.set(task.eventId, tasks);
          taskEvents.set(task.id, task.eventId);
        }
        const edgesByEvent = new Map<string, Dependency[]>();
        for (const edge of storedEdges) {
          const eventId = taskEvents.get(edge.successorId)!;
          const edges = edgesByEvent.get(eventId) ?? [];
          edges.push(edge);
          edgesByEvent.set(eventId, edges);
        }
        const states = events.map((event) => ({
          event,
          ...catalogue,
          ...projectTasks(
            tasksByEvent.get(event.id) ?? [],
            edgesByEvent.get(event.id) ?? [],
            catalogue,
            event.pmTimeZone,
            time,
          ),
        }));
        const matches = (key: string, value: string) =>
          !values(key).length || values(key).includes(value);
        const matchingEvents = states.filter(
          (s) => matches("event", s.event.id) && matches("series", s.event.seriesId ?? "none"),
        );
        const taskMatches = (
          t: (typeof states)[number]["tasks"][number],
          s: (typeof states)[number],
        ) =>
          matches("group", t.groupId ?? "none") &&
          matches(
            "owner",
            t.ownerId && s.owners.find((o) => o.id === t.ownerId)?.active
              ? t.ownerId
              : t.ownerId
                ? "inactive"
                : "none",
          ) &&
          matches("status", t.status) &&
          matches("priority", t.priority) &&
          matches("due", t.overdue ? "overdue" : t.dueType === "NONE" ? "none" : "planned") &&
          matches("blocked", t.blockedBy.length ? "yes" : "no") &&
          (!query.dueFrom ||
            (deadlineInstant(t, s.event.pmTimeZone) ?? -Infinity) >=
              Date.parse(`${query.dueFrom}T00:00:00Z`)) &&
          (!query.dueTo ||
            (deadlineInstant(t, s.event.pmTimeZone) ?? Infinity) <=
              Date.parse(`${query.dueTo}T23:59:59.999Z`)) &&
          (!query.q ||
            `${t.title} ${s.event.name} ${t.nextStep}`
              .toLowerCase()
              .includes(query.q.toLowerCase()));
        const allTasks = matchingEvents.flatMap((s) =>
          s.tasks.filter((t) => taskMatches(t, s)).map((t) => ({ ...t, event: s.event })),
        );
        const allEvents = matchingEvents.filter(
          (s) =>
            ((!query.q &&
              !["group", "owner", "status", "priority", "due", "blocked", "dueFrom", "dueTo"].some(
                (k) => query[k],
              )) ||
              s.tasks.some((t) => taskMatches(t, s))) &&
            (query.all === "true" || s.categories.some((c) => c.reasons.length)),
        );
        const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
        const sorted = allTasks.sort((a, b) => a.id.localeCompare(b.id));
        const tasks = sorted.filter((t) => !query.cursor || t.id > query.cursor).slice(0, limit);
        const pageEvents = allEvents
          .filter((s) => !query.eventCursor || s.event.id > query.eventCursor)
          .slice(0, limit);
        return {
          eventChoices: await tx.event.findMany({
            select: { id: true, name: true, seriesId: true },
            orderBy: [{ name: "asc" }, { id: "asc" }],
          }),
          referenceTime: time,
          tasks,
          totalTasks: allTasks.length,
          events: pageEvents.map((s) => ({ event: s.event, categories: s.categories })),
          totalEvents: allEvents.length,
          nextCursor:
            tasks.length === limit && sorted.some((t) => t.id > tasks[tasks.length - 1]!.id)
              ? tasks[tasks.length - 1]!.id
              : null,
          nextEventCursor:
            pageEvents.length === limit &&
            allEvents.some((s) => s.event.id > pageEvents[pageEvents.length - 1]!.event.id)
              ? pageEvents[pageEvents.length - 1]!.event.id
              : null,
          ...catalogue,
        };
      },
      { isolationLevel: "RepeatableRead", timeout: 30000 },
    );
  }
  cutover(eventId: string, actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actor, true);
      await tx.event.update({ where: { id: eventId }, data: { pmGraphVersion: { increment: 1 } } });
      // Include columns left by the withdrawn implementation in the immutable backup as well.
      const rows = await tx.$queryRaw<
        Record<string, unknown>[]
      >`SELECT * FROM "EventTask" WHERE "eventId" = ${eventId}::uuid ORDER BY id`;
      const payload = JSON.stringify(rows);
      const sha256 = createHash("sha256").update(payload).digest("hex");
      const saved = await tx.pmLegacySnapshot.create({
        data: { eventId, actorId: actor.id, count: rows.length, payload, sha256 },
      });
      const verified = await tx.pmLegacySnapshot.findUniqueOrThrow({ where: { id: saved.id } });
      if (
        createHash("sha256").update(verified.payload).digest("hex") !== sha256 ||
        JSON.parse(verified.payload).length !== rows.length
      )
        throw new Error("Snapshotprüfung fehlgeschlagen.");
      await this.audit.append(
        {
          entity: "PmLegacySnapshot",
          entityId: saved.id,
          action: "verified-cutover",
          userId: actor.id,
          details: {
            eventId,
            runId: saved.id,
            count: rows.length,
            sha256,
            location: `/api/v1/pm/snapshots/${saved.id}`,
          },
        },
        tx,
      );
      await tx.eventTask.deleteMany({ where: { eventId } });
      return {
        runId: saved.id,
        count: saved.count,
        sha256,
        location: `/api/v1/pm/snapshots/${saved.id}`,
      };
    });
  }
  snapshotDownload(id: string, actor: PmActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.actor(tx, actor, true);
      return tx.pmLegacySnapshot.findUniqueOrThrow({ where: { id } });
    });
  }
}
