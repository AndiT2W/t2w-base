import { Prisma, type PrismaClient } from "@prisma/client";
import type { PrismaService } from "./prisma.service.js";
import type { EventMutationAdapter, EventMutationRecord } from "./event-mutations.js";

type PrismaConnection = PrismaService | Prisma.TransactionClient | PrismaClient;

export class PrismaEventMutationAdapter implements EventMutationAdapter {
  constructor(private readonly prisma: PrismaConnection) {}

  transaction<T>(work: (adapter: EventMutationAdapter) => Promise<T>): Promise<T> {
    if (!("$transaction" in this.prisma)) return work(this);
    return this.prisma.$transaction((tx) => work(new PrismaEventMutationAdapter(tx)));
  }

  async resolveOrganizer(name?: string, id?: string) {
    if (!name) return id;
    const existing = await this.prisma.organizer.findFirst({ where: { name, active: true } });
    if (existing) return existing.id;
    return (await this.prisma.organizer.create({ data: { name, type: "ORGANISATION" } })).id;
  }

  async createEvent(data: EventMutationRecord) {
    const { invoiceRecipientIds, organizerName: _organizerName, ...eventData } = data;
    const created = await this.prisma.event.create({
      data: eventData as Prisma.EventUncheckedCreateInput,
    });
    const recipients = invoiceRecipientIds as string[];
    if (recipients.length) {
      await this.prisma.eventInvoiceRecipient.createMany({
        data: recipients.map((organizerId) => ({ eventId: created.id, organizerId })),
      });
    }
    return this.getEvent(created.id) as Promise<EventMutationRecord>;
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

  getEvent(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: { organizer: true, sport: true },
    }) as Promise<EventMutationRecord | undefined>;
  }
}
