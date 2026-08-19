import type { T2WEvent } from "./types";

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
    risiko: "keins", teilnehmer: event.participantForecast ?? 0,
    teilnehmerwerte: { prognose: event.participantForecast, aktuell: event.participantCurrent, aktuellQuelle: event.participantCurrent == null ? null : "time2win", aktuellSynchronisiertAm: null },
    archiviert: event.archived, notizen: event.notes ?? "", outlookOrdner: null, sharepointOrdner: null,
    kontakte: [], aufgaben: [], dateien: [], kommunikation: [], sportart: event.sport?.name,
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

export async function apiCreateEvent(input: { name: string; start: string; ende: string; ort: string; verantwortlicher: string; teilnehmerprognose: number; notizen: string; status: string }) {
  const status = input.status === "anfrage" || input.status === "entwurf" || input.status === "angefragt" ? "ANFRAGE" : input.status === "angebot-gesendet" ? "ANGEBOT_GESENDET" : input.status === "datum-pruefen" ? "DATUM_PRUEFEN" : input.status === "akquise" ? "AKQUISE" : input.status === "abgesagt" || input.status === "storniert" ? "ABGESAGT" : "ZUGESAGT";
  const response = await fetch("/api/v1/events", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: input.name, startAt: input.start, endAt: input.ende, location: input.ort, responsible: input.verantwortlicher, participantForecast: input.teilnehmerprognose, notes: input.notizen, status }) });
  if (!response.ok) throw new Error("Event konnte nicht gespeichert werden");
  return mapApiEvent(await response.json() as ApiEvent);
}
