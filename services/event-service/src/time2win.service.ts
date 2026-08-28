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
    const event = object(source.event);
    const races = array(source.races ?? event.races).map(object);
    const raceSnapshots = await Promise.all(races.map(async (race) => {
      const raceData = object(race.race ?? race);
      const raceId = firstNumber(raceData, ["id", "race_id", "raceId"]);
      const stats = await this.request(`/participants/${eventId}/stats${raceId === null ? "" : `?race_id=${raceId}`}`);
      return { id: raceId ?? 0, name: firstString(raceData, ["name", "race_name", "raceName", "title"]) ?? `Bewerb ${raceId ?? ""}`.trim(), participantCount: participantCount(stats) };
    }));
    return {
      eventId,
      name: firstString(event, ["name", "event_name", "eventName"]) ?? firstString(source, ["name", "event_name", "eventName"]),
      sportName:
        firstString(object(event.sport ?? source.sport), ["name", "sport_name", "sportName"]) ??
        firstString(event, ["type_name", "sport_name", "sportName"]) ??
        firstString(source, ["type_name", "sport_name", "sportName"]),
      races: raceSnapshots,
    };
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
const firstString = (source: Record<string, unknown>, keys: string[]) => keys.map((key) => string(source[key])).find((value): value is string => value !== null) ?? null;
const firstNumber = (source: Record<string, unknown>, keys: string[]) => keys.map((key) => number(source[key])).find((value): value is number => value !== null) ?? null;
function participantCount(value: Record<string, unknown>) {
  const data = object(value.data ?? value);
  const sources = [
    object(data.statistics ?? data),
    ...array(data.races).map(object),
  ];
  for (const source of sources) {
    for (const key of ["participantCount", "participants_count", "participants", "registered", "count"]) {
      const found = number(source[key]);
      if (found !== null) return found;
    }
  }
  return null;
}
