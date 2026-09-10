import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service.js";

export const eventRecordInclude = {
  organizer: true,
  sport: true,
  contacts: { include: { contact: true } },
  payoutRecipient: true,
  invoiceRecipients: { include: { organizer: true } },
  tasks: true,
  files: true,
  activities: true,
  communicationMessages: { orderBy: { occurredAt: "desc" as const } },
  services: { include: { service: true } },
} satisfies Prisma.EventInclude;

@Injectable()
export class EventRecordRetrieval {
  constructor(private readonly prisma: PrismaService) {}

  read(id: string) {
    return this.prisma.event.findUniqueOrThrow({ where: { id }, include: eventRecordInclude });
  }
  readByCode(eventCode: string) {
    return this.prisma.event.findUniqueOrThrow({
      where: { eventCode },
      include: eventRecordInclude,
    });
  }

  list(input: { q?: string; skip: number; take: number }) {
    return this.prisma.event.findMany({
      where: {
        ...(input.q
          ? {
              OR: [
                { name: { contains: input.q, mode: "insensitive" as const } },
                { eventCode: { contains: input.q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { startAt: "asc" },
      skip: input.skip,
      take: input.take,
      include: eventRecordInclude,
    });
  }
}
