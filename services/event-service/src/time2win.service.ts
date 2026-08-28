import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { TIME2WIN_ADAPTER, type Time2winAdapter } from "./time2win.adapter.js";

@Injectable()
export class Time2winService implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TIME2WIN_ADAPTER) private readonly time2win: Time2winAdapter,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.syncDueEvents(), 24 * 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async syncEvent(id: string) {
    const event = await this.prisma.event.findUniqueOrThrow({ where: { id } });
    if (event.t2wEventId == null) return event;
    try {
      const snapshot = await this.time2win.snapshot(event.t2wEventId);
      const participantCurrent = snapshot.races.reduce<number | null>(
        (total, race) =>
          total === null || race.participantCount === null ? null : total + race.participantCount,
        0,
      );
      return await this.prisma.event.update({
        where: { id },
        data: {
          participantCurrent,
          time2winSnapshot: snapshot,
          time2winSyncStatus: "SUCCESS",
          time2winLastSuccessAt: new Date(),
          time2winLastError: null,
        },
        include: { organizer: true, sport: true, contacts: { include: { contact: true } }, payoutRecipient: true, invoiceRecipients: { include: { organizer: true } }, tasks: true, files: true, activities: true },
      });
    } catch (error) {
      await this.prisma.event.update({
        where: { id },
        data: { time2winSyncStatus: "ERROR", time2winLastError: error instanceof Error ? error.message : "TIME2WIN_SYNC_FAILED" },
      });
      throw error;
    }
  }

  async syncDueEvents() {
    const events = await this.prisma.event.findMany({ where: { t2wEventId: { not: null } }, select: { id: true } });
    await Promise.allSettled(events.map(({ id }) => this.syncEvent(id)));
  }

}
