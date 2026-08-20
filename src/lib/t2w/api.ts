import type { Settings, T2WEvent } from "./types";

type ApiEvent = {
  id: string;
  eventCode: string;
  name: string;
  status: string;
  startAt: string;
  endAt: string;
  location: string | null;
  responsible: string | null;
  participantForecast: number | null;
  participantCurrent: number | null;
  notes: string | null;
  outlookFolder: string | null;
  outlookWebUrl: string | null;
  sharepointFolder: string | null;
  archived: boolean;
  organizer?: { name: string } | null;
  sport?: { name: string } | null;
};

const statusFromApi: Record<string, T2WEvent["status"]> = {
  ANFRAGE: "anfrage", ANGEBOT_GESENDET: "angebot-gesendet", ZUGESAGT: "zugesagt",
  ABGESAGT: "abgesagt", AKQUISE: "akquise", DATUM_PRUEFEN: "datum-pruefen",
};

function dateOnly(value: string) { return value.slice(0, 10); }

export function mapApiEvent(event: ApiEvent): T2WEvent {
  return {
    id: event.id, eventcode: event.eventCode, name: event.name,
    veranstalter: event.organizer?.name ?? "—", ort: event.location ?? "",
    start: dateOnly(event.startAt), ende: dateOnly(event.endAt),
    status: statusFromApi[event.status] ?? "anfrage", verantwortlicher: event.responsible ?? "—",
    teilnehmer: event.participantForecast ?? 0,
    teilnehmerwerte: { prognose: event.participantForecast, aktuell: event.participantCurrent, aktuellQuelle: event.participantCurrent == null ? null : "time2win", aktuellSynchronisiertAm: null },
    archiviert: event.archived, notizen: event.notes ?? "", outlookOrdner: event.outlookFolder, outlookWebUrl: event.outlookWebUrl, sharepointOrdner: event.sharepointFolder,
    kontakte: [], aufgaben: [], dateien: [], kommunikation: [], sportart: event.sport?.name ?? "",
  };
}

export async function apiLogin(email: string, password: string) {
  const response = await fetch("/api/v1/auth/login", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new Error("Login fehlgeschlagen");
}

export async function apiEvents() {
  const response = await fetch("/api/v1/events", { credentials: "include" });
  if (!response.ok) throw new Error(response.status === 401 ? "AUTH_REQUIRED" : "Events konnten nicht geladen werden");
  return (await response.json() as ApiEvent[]).map(mapApiEvent);
}

export async function apiCreateEvent(input: { name: string; veranstalter: string; start: string; ende: string; ort: string; verantwortlicher: string; teilnehmerprognose: number; notizen: string; status: string }) {
  const status = input.status === "anfrage" ? "ANFRAGE" : input.status === "angebot-gesendet" ? "ANGEBOT_GESENDET" : input.status === "datum-pruefen" ? "DATUM_PRUEFEN" : input.status === "akquise" ? "AKQUISE" : input.status === "abgesagt" ? "ABGESAGT" : "ZUGESAGT";
  const response = await fetch("/api/v1/events", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: input.name, organizerName: input.veranstalter, startAt: input.start, endAt: input.ende, location: input.ort, responsible: input.verantwortlicher, participantForecast: input.teilnehmerprognose, notes: input.notizen, status }) });
  if (!response.ok) throw new Error("Event konnte nicht gespeichert werden");
  return mapApiEvent(await response.json() as ApiEvent);
}

export async function apiSettings(): Promise<Settings> {
  const response = await fetch("/api/v1/settings", { credentials: "include" });
  if (!response.ok) throw new Error("Einstellungen konnten nicht geladen werden");
  return await response.json() as Settings;
}

export async function apiUpdateSettings(settings: Settings): Promise<Settings> {
  const response = await fetch("/api/v1/settings", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
  if (!response.ok) throw new Error("Einstellungen konnten nicht gespeichert werden");
  return await response.json() as Settings;
}

export async function apiUpdateEvent(id: string, patch: Partial<T2WEvent>) {
  const response = await fetch(`/api/v1/events/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: patch.name, startAt: patch.start, endAt: patch.ende, location: patch.ort, responsible: patch.verantwortlicher, participantForecast: patch.teilnehmer, notes: patch.notizen, organizerName: patch.veranstalter, outlookFolder: patch.outlookOrdner, outlookWebUrl: patch.outlookWebUrl, sharepointFolder: patch.sharepointOrdner }) });
  if (!response.ok) throw new Error("Event konnte nicht gespeichert werden");
  return mapApiEvent(await response.json() as ApiEvent);
}
