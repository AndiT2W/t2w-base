import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { projectTaskReadiness, type TaskStatus } from "@t2w/domain/project-management";
import { PrismaService } from "./prisma.service.js";

export const eventRecordInclude = {
  organizer: true,
  sport: true,
  contacts: { include: { contact: true } },
  payoutRecipient: true,
  invoiceRecipients: { include: { organizer: true } },
  pmTasks: { select: { status: true, endDate: true } },
  files: true,
  activities: true,
  communicationMessages: { orderBy: { occurredAt: "desc" as const } },
  services: { include: { service: true } },
} satisfies Prisma.EventInclude;

type EventRecord = Prisma.EventGetPayload<{ include: typeof eventRecordInclude }>;

export function withTaskReadiness({ pmTasks, ...event }: EventRecord) {
  return {
    ...event,
    taskReadiness: projectTaskReadiness(
      pmTasks.map((task) => ({ status: task.status as TaskStatus, endDate: task.endDate })),
      new Date().toISOString(),
    ),
  };
}

function forAccess(record: ReturnType<typeof withTaskReadiness>, financeAccess: boolean) {
  if (financeAccess) return record;
  return {
    ...record,
    financeNotes: null,
    payoutRecipientId: null,
    payoutRecipient: null,
  };
}

@Injectable()
export class EventRecordRetrieval {
  constructor(private readonly prisma: PrismaService) {}

  async read(id: string, financeAccess = true) {
    return forAccess(
      withTaskReadiness(
        await this.prisma.event.findUniqueOrThrow({ where: { id }, include: eventRecordInclude }),
      ),
      financeAccess,
    );
  }
  async readByCode(eventCode: string, financeAccess = true) {
    return forAccess(
      withTaskReadiness(
        await this.prisma.event.findUniqueOrThrow({
          where: { eventCode },
          include: eventRecordInclude,
        }),
      ),
      financeAccess,
    );
  }

  async list(input: { q?: string; skip: number; take: number }, financeAccess = true) {
    const events = await this.prisma.event.findMany({
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
    return events.map((event) => forAccess(withTaskReadiness(event), financeAccess));
  }
}
