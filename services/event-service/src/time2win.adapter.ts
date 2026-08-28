import { Injectable } from "@nestjs/common";

type Time2winRace = { id: number; name: string; participantCount: number | null };
export type Time2winSnapshot = {
  eventId: number;
  name: string | null;
  sportName: string | null;
  races: Time2winRace[];
};

export interface Time2winAdapter {
  snapshot(eventId: number): Promise<Time2winSnapshot>;
}

export const TIME2WIN_ADAPTER = Symbol("TIME2WIN_ADAPTER");

@Injectable()
export class HttpTime2winAdapter implements Time2winAdapter {
  private readonly baseUrl = (process.env.TIME2WIN_API_BASE_URL ?? "https://time2win.at/api/1.1").replace(/\/+$/, "");
  private readonly apiKey = process.env.TIME2WIN_API_KEY ?? "";

  async snapshot(eventId: number): Promise<Time2winSnapshot> {
    const eventData = await this.request(`/event/${eventId}/eventdata`);
    const source = object(eventData.data ?? eventData);
    const event = object(source.event);
    const races = array(source.races ?? event.races).map(object);
    const raceSnapshots = await Promise.all(races.map(async (race) => {
      const data = object(race.race ?? race);
      const id = firstNumber(data, ["id", "race_id", "raceId"]);
      const stats = await this.request(`/participants/${eventId}/stats${id === null ? "" : `?race_id=${id}`}`);
      return { id: id ?? 0, name: firstString(data, ["name", "race_name", "raceName", "title"]) ?? `Bewerb ${id ?? ""}`.trim(), participantCount: participantCount(stats) };
    }));
    return {
      eventId,
      name: firstString(event, ["name", "event_name", "eventName"]) ?? firstString(source, ["name", "event_name", "eventName"]),
      sportName: firstString(object(event.sport ?? source.sport), ["name", "sport_name", "sportName"]) ?? firstString(event, ["type_name", "sport_name", "sportName"]) ?? firstString(source, ["type_name", "sport_name", "sportName"]),
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

const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const string = (value: unknown): string | null => typeof value === "string" ? value : null;
const number = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const firstString = (source: Record<string, unknown>, keys: string[]) => keys.map((key) => string(source[key])).find((value): value is string => value !== null) ?? null;
const firstNumber = (source: Record<string, unknown>, keys: string[]) => keys.map((key) => number(source[key])).find((value): value is number => value !== null) ?? null;
function participantCount(value: Record<string, unknown>) {
  const data = object(value.data ?? value);
  for (const source of [object(data.statistics ?? data), ...array(data.races).map(object)]) {
    for (const key of ["participantCount", "participants_count", "participants", "registered", "count"]) {
      const found = number(source[key]);
      if (found !== null) return found;
    }
  }
  return null;
}
