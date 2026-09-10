import { Prisma, type PrismaClient } from "@prisma/client";
import type { PrismaService } from "./prisma.service.js";
import type {
  CopyEventMutation,
  EventMutationAdapter,
  EventMutationRecord,
} from "./event-mutations.js";
import { eventRecordInclude } from "./event-record-retrieval.js";

type PrismaConnection = PrismaService | Prisma.TransactionClient | PrismaClient;

export class PrismaEventMutationAdapter implements EventMutationAdapter {
  constructor(private readonly prisma: PrismaConnection) {}

  transaction<T>(work: (adapter: EventMutationAdapter) => Promise<T>): Promise<T> {
    if (!("$transaction" in this.prisma)) return work(this);
    return this.prisma.$transaction((tx) => work(new PrismaEventMutationAdapter(tx)));
  }

  async createEvent(data: EventMutationRecord) {
    const { invoiceRecipientIds, serviceIds, ...eventData } = data;
    const created = await this.prisma.event.create({
      data: eventData as Prisma.EventUncheckedCreateInput,
    });
    const recipients = invoiceRecipientIds as string[];
    if (recipients.length) {
      await this.prisma.eventInvoiceRecipient.createMany({
        data: recipients.map((organizerId) => ({ eventId: created.id, organizerId })),
      });
    }
    const services = serviceIds as string[] | undefined;
    if (services?.length) {
      await this.prisma.eventService.createMany({
        data: services.map((serviceId) => ({ eventId: created.id, serviceId })),
      });
    }
    return this.getEvent(created.id) as Promise<EventMutationRecord>;
  }

  async deleteEvent(id: string) {
    const result = await this.prisma.event.deleteMany({ where: { id } });
    return result.count === 1;
  }

  async updateEvent(id: string, version: number | undefined, changes: EventMutationRecord) {
    const updated = await this.prisma.event.updateMany({
      where: { id, ...(version === undefined ? {} : { version }) },
      data: {
        ...(changes as Prisma.EventUncheckedUpdateManyInput),
        version: { increment: 1 },
      },
    });
    return updated.count === 1;
  }

  async replaceInvoiceRecipients(id: string, organizerIds: string[]) {
    await this.prisma.eventInvoiceRecipient.deleteMany({ where: { eventId: id } });
    if (organizerIds.length) {
      await this.prisma.eventInvoiceRecipient.createMany({
        data: organizerIds.map((organizerId) => ({ eventId: id, organizerId })),
      });
    }
  }

  async replaceServices(id: string, serviceIds: string[]) {
    await this.prisma.eventService.deleteMany({ where: { eventId: id } });
    if (serviceIds.length) {
      await this.prisma.eventService.createMany({
        data: serviceIds.map((serviceId) => ({ eventId: id, serviceId })),
      });
    }
  }

  async touchEvent(id: string, version: number | undefined) {
    const updated = await this.prisma.event.updateMany({
      where: { id, ...(version === undefined ? {} : { version }) },
      data: { version: { increment: 1 } },
    });
    return updated.count === 1;
  }

  getEvent(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: eventRecordInclude,
    }) as Promise<EventMutationRecord | undefined>;
  }

  async replaceContactRole(eventId: string, contactId: string, role: string, nextRole: string) {
    await this.prisma.eventContact.deleteMany({ where: { eventId, contactId, role } });
    await this.prisma.eventContact.upsert({
      where: { eventId_contactId_role: { eventId, contactId, role: nextRole } },
      create: { eventId, contactId, role: nextRole },
      update: {},
    });
  }

  async addContact(eventId: string, contactId: string, role: string) {
    await this.prisma.eventContact.upsert({
      where: { eventId_contactId_role: { eventId, contactId, role } },
      create: { eventId, contactId, role },
      update: {},
    });
  }
  async removeContact(eventId: string, contactId: string, role: string) {
    await this.prisma.eventContact.deleteMany({ where: { eventId, contactId, role } });
  }
  async createTask(
    eventId: string,
    input: {
      title: string;
      dueAt?: string;
      responsible?: string;
      dependsOnTaskId?: string | null;
    },
  ) {
    if (input.dependsOnTaskId) {
      await this.assertTaskDependencyBelongsToEvent(eventId, input.dependsOnTaskId);
    }
    await this.prisma.eventTask.create({
      data: {
        eventId,
        title: input.title,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        responsible: input.responsible,
        dependsOnTaskId: input.dependsOnTaskId,
      },
    });
  }
  async updateTask(
    eventId: string,
    taskId: string,
    input: {
      title?: string;
      dueAt?: string | null;
      responsible?: string;
      dependsOnTaskId?: string | null;
      completed?: boolean;
    },
  ) {
    if (input.dependsOnTaskId !== undefined) {
      if (input.dependsOnTaskId === taskId) {
        throw new Error("TASK_DEPENDENCY_SELF_CYCLE");
      }
      if (input.dependsOnTaskId !== null) {
        await this.assertTaskDependencyBelongsToEvent(eventId, input.dependsOnTaskId);
        await this.assertNoTaskDependencyCycle(eventId, taskId, input.dependsOnTaskId);
      }
    }
    await this.prisma.eventTask.updateMany({
      where: { id: taskId, eventId },
      data: {
        ...input,
        ...(input.dependsOnTaskId === undefined
          ? {}
          : { dependsOnTaskId: input.dependsOnTaskId }),
        ...(input.dueAt === undefined ? {} : { dueAt: input.dueAt ? new Date(input.dueAt) : null }),
      },
    });
  }
  private async assertTaskDependencyBelongsToEvent(eventId: string, dependsOnTaskId: string) {
    const dependency = await this.prisma.eventTask.findFirst({
      where: { id: dependsOnTaskId, eventId },
      select: { id: true },
    });
    if (!dependency) throw new Error("TASK_DEPENDENCY_TARGET_NOT_FOUND");
  }
  private async assertNoTaskDependencyCycle(
    eventId: string,
    taskId: string,
    dependsOnTaskId: string,
  ) {
    const seen = new Set<string>();
    let cursor: string | null = dependsOnTaskId;
    while (cursor) {
      if (cursor === taskId) throw new Error("TASK_DEPENDENCY_CYCLE");
      if (seen.has(cursor)) throw new Error("TASK_DEPENDENCY_CYCLE");
      seen.add(cursor);
      const dependencyTask: { dependsOnTaskId: string | null } | null =
        await this.prisma.eventTask.findFirst({
        where: { id: cursor, eventId },
        select: { dependsOnTaskId: true },
      });
      if (!dependencyTask) throw new Error("TASK_DEPENDENCY_TARGET_NOT_FOUND");
      cursor = dependencyTask.dependsOnTaskId;
    }
  }
  async createFile(eventId: string, input: { name: string; url?: string; size?: string }) {
    await this.prisma.eventFile.create({ data: { eventId, ...input } });
  }
  async createActivity(
    eventId: string,
    input: {
      channel: string;
      subject: string;
      author?: string;
      body?: string;
      occurredAt?: string;
    },
  ) {
    await this.prisma.eventActivity.create({
      data: {
        eventId,
        channel: input.channel,
        subject: input.subject,
        author: input.author,
        body: input.body,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
      },
    });
  }
  async copyEvent(sourceId: string, input: CopyEventMutation): Promise<EventMutationRecord> {
    const source = await this.prisma.event.findUniqueOrThrow({
      where: { id: sourceId },
      include: { contacts: true, invoiceRecipients: true, services: true },
    });
    const seriesId = input.createRelationship ? (source.seriesId ?? crypto.randomUUID()) : null;
    if (input.createRelationship && !source.seriesId) {
      const linked = await this.prisma.event.updateMany({
        where: { id: sourceId, ...(input.version === undefined ? {} : { version: input.version }) },
        data: { seriesId, version: { increment: 1 } },
      });
      if (linked.count !== 1) throw new Error("EVENT_VERSION_CONFLICT");
    }
    const created = await this.prisma.event.create({
      data: {
        eventCode: input.eventCode,
        name: input.name,
        status: source.status,
        organizerId: source.organizerId,
        payoutRecipientId: source.payoutRecipientId,
        sportId: source.sportId,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        location: source.location,
        responsible: source.responsible,
        participantForecast: source.participantForecast,
        notes: source.notes,
        financeNotes: source.financeNotes,
        contactsNotes: source.contactsNotes,
        archived: source.archived,
        seriesId,
        contacts: {
          createMany: { data: source.contacts.map(({ contactId, role }) => ({ contactId, role })) },
        },
        invoiceRecipients: {
          createMany: {
            data: source.invoiceRecipients.map(({ organizerId }) => ({ organizerId })),
          },
        },
        services: { createMany: { data: source.services.map(({ serviceId }) => ({ serviceId })) } },
      },
    });
    return this.getEvent(created.id) as Promise<EventMutationRecord>;
  }
}
