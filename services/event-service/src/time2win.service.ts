import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

type Time2winRace = { id: number; name: string; participantCount: number | null };
export type Time2winSnapshot = {
  eventId: number;
  name: string | null;
  sportName: string | null;
  races: Time2winRace[];
};

@Injectable()
export class Time2winService implements OnModuleInit, OnModuleDestroy {
  private readonly baseUrl = (process.env.TIME2WIN_API_BASE_URL ?? "https://time2win.at/api/1.1").replace(/\/+$/, "");
  private readonly apiKey = process.env.TIME2WIN_API_KEY ?? "";
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly prisma: PrismaService) {}

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
      const snapshot = await this.fetchSnapshot(event.t2wEventId);
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

  private async fetchSnapshot(eventId: number): Promise<Time2winSnapshot> {
    const eventData = await this.request(`/event/${eventId}/eventdata`);
    const source = object(eventData.data ?? eventData);
    const races = array(source.races).map(object);
    const raceSnapshots = await Promise.all(races.map(async (race) => {
      const raceId = number(race.id);
      const stats = await this.request(`/participants/${eventId}/stats${raceId === null ? "" : `?race_id=${raceId}`}`);
      return { id: raceId ?? 0, name: string(race.name) ?? `Bewerb ${raceId ?? ""}`.trim(), participantCount: participantCount(stats) };
    }));
    return { eventId, name: string(source.name), sportName: string(object(source.sport).name), races: raceSnapshots };
  }

  private async request(path: string): Promise<Record<string, unknown>> {
    if (!this.apiKey) throw new Error("TIME2WIN_API_KEY_NOT_CONFIGURED");
    const response = await fetch(`${this.baseUrl}${path}`, { headers: { Authorization: `Bearer ${this.apiKey}` } });
    if (!response.ok) throw new Error(`TIME2WIN_API_${response.status}`);
    return object(await response.json());
  }
}

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const string = (value: unknown): string | null => typeof value === "string" ? value : null;
const number = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
function participantCount(value: Record<string, unknown>) {
  const source = object(value.data ?? value);
  for (const key of ["participantCount", "participants", "registered", "count"]) {
    const found = number(source[key]);
    if (found !== null) return found;
  }
  return null;
}
