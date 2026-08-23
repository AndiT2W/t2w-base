import type { Settings, T2WEvent } from "./types";

type ApiEvent = {
  id: string;
  version?: number;
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
  outlookMailbox?: string | null;
  outlookRootFolderId?: string | null;
  outlookYearFolderId?: string | null;
  outlookQuarterFolderId?: string | null;
  outlookFolderId?: string | null;
  outlookFolderSyncStatus?: string;
  outlookFolderLastSuccessAt?: string | null;
  outlookFolderLastError?: string | null;
  sharepointFolder: string | null;
  archived: boolean;
  organizer?: { name: string } | null;
  sport?: { name: string } | null;
};

const statusFromApi: Record<string, T2WEvent["status"]> = {
  ANFRAGE: "anfrage",
  ANGEBOT_GESENDET: "angebot-gesendet",
  ZUGESAGT: "zugesagt",
  ABGESAGT: "abgesagt",
  AKQUISE: "akquise",
  DATUM_PRUEFEN: "datum-pruefen",
};

function dateOnly(value: string) {
  return value.slice(0, 10);
}

export function mapApiEvent(event: ApiEvent): T2WEvent {
  return {
    id: event.id,
    version: event.version,
    eventcode: event.eventCode,
    name: event.name,
    veranstalter: event.organizer?.name ?? "—",
    ort: event.location ?? "",
    start: dateOnly(event.startAt),
    ende: dateOnly(event.endAt),
    status: statusFromApi[event.status] ?? "anfrage",
    verantwortlicher: event.responsible ?? "—",
    teilnehmer: event.participantForecast ?? 0,
    teilnehmerwerte: {
      prognose: event.participantForecast,
      aktuell: event.participantCurrent,
      aktuellQuelle: event.participantCurrent == null ? null : "time2win",
      aktuellSynchronisiertAm: null,
    },
    archiviert: event.archived,
    notizen: event.notes ?? "",
    outlookOrdner: event.outlookFolder,
    outlookWebUrl: event.outlookWebUrl,
    outlookMailbox: event.outlookMailbox,
    outlookRootFolderId: event.outlookRootFolderId,
    outlookYearFolderId: event.outlookYearFolderId,
    outlookQuarterFolderId: event.outlookQuarterFolderId,
    outlookFolderId: event.outlookFolderId,
    outlookFolderSyncStatus: event.outlookFolderSyncStatus,
    outlookFolderLastSuccessAt: event.outlookFolderLastSuccessAt,
    outlookFolderLastError: event.outlookFolderLastError,
    sharepointOrdner: event.sharepointFolder,
    kontakte: [],
    aufgaben: [],
    dateien: [],
    kommunikation: [],
    sportart: event.sport?.name ?? "",
  };
}

export async function apiLogin(email: string, password: string) {
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Login fehlgeschlagen");
}

export async function apiEvents() {
  const response = await fetch("/api/v1/events", { credentials: "include" });
  if (!response.ok)
    throw new Error(
      response.status === 401 ? "AUTH_REQUIRED" : "Events konnten nicht geladen werden",
    );
  return ((await response.json()) as ApiEvent[]).map(mapApiEvent);
}

export async function apiCreateEvent(input: {
  name: string;
  eventcode: string;
  veranstalter: string;
  start: string;
  ende: string;
  ort: string;
  verantwortlicher: string;
  teilnehmerprognose: number;
  notizen: string;
  status: string;
}) {
  const status =
    input.status === "anfrage"
      ? "ANFRAGE"
      : input.status === "angebot-gesendet"
        ? "ANGEBOT_GESENDET"
        : input.status === "datum-pruefen"
          ? "DATUM_PRUEFEN"
          : input.status === "akquise"
            ? "AKQUISE"
            : input.status === "abgesagt"
              ? "ABGESAGT"
              : "ZUGESAGT";
  const response = await fetch("/api/v1/events", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      eventCode: input.eventcode,
      organizerName: input.veranstalter,
      startAt: input.start,
      endAt: input.ende,
      location: input.ort,
      responsible: input.verantwortlicher,
      participantForecast: input.teilnehmerprognose,
      notes: input.notizen,
      status,
    }),
  });
  if (!response.ok) throw new Error("Event konnte nicht gespeichert werden");
  return mapApiEvent((await response.json()) as ApiEvent);
}

export async function apiSettings(): Promise<Settings> {
  const response = await fetch("/api/v1/settings", { credentials: "include" });
  if (!response.ok) throw new Error("Einstellungen konnten nicht geladen werden");
  return (await response.json()) as Settings;
}

export async function apiUpdateSettings(settings: Settings): Promise<Settings> {
  const response = await fetch("/api/v1/settings", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error("Einstellungen konnten nicht gespeichert werden");
  return (await response.json()) as Settings;
}

export async function apiUpdateEvent(id: string, patch: Partial<T2WEvent>) {
  const response = await fetch(`/api/v1/events/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: patch.name,
      startAt: patch.start,
      endAt: patch.ende,
      location: patch.ort,
      responsible: patch.verantwortlicher,
      participantForecast: patch.teilnehmer,
      notes: patch.notizen,
      organizerName: patch.veranstalter,
      outlookFolder: patch.outlookOrdner,
      outlookWebUrl: patch.outlookWebUrl,
      sharepointFolder: patch.sharepointOrdner,
      version: patch.version,
    }),
  });
  if (!response.ok) {
    const error = new Error("Event konnte nicht gespeichert werden") as Error & { code?: string };
    if (response.status === 409) error.code = "EVENT_VERSION_CONFLICT";
    throw error;
  }
  return mapApiEvent((await response.json()) as ApiEvent);
}

export async function apiSyncOutlookFolder(id: string, input?: { mailbox?: string }) {
  const response = await fetch(`/api/v1/events/${id}/outlook-folder/sync`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });
  if (!response.ok) throw new Error("OUTLOOK_FOLDER_SYNC_FAILED");
  return mapApiEvent((await response.json()) as ApiEvent);
}

export async function apiOutlookFolderPlan(id: string) {
  const response = await fetch(`/api/v1/events/${id}/outlook-folder/plan`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("OUTLOOK_FOLDER_PLAN_FAILED");
  return response.json() as Promise<import("./event-workspace").OutlookFolderPlan>;
}

export async function apiContacts() {
  const response = await fetch("/api/v1/contacts", { credentials: "include" });
  if (!response.ok) throw new Error("Kontakte konnten nicht geladen werden");
  return await response.json();
}
export async function apiCustomers() {
  const response = await fetch("/api/v1/organizers", { credentials: "include" });
  if (!response.ok) throw new Error("Kunden konnten nicht geladen werden");
  return await response.json();
}
export async function apiCreateContact(input: {
  name: string;
  email?: string;
  phone?: string;
  note?: string;
}) {
  const response = await fetch("/api/v1/contacts", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Kontakt konnte nicht gespeichert werden");
  return await response.json();
}
export async function apiCreateCustomer(input: {
  name: string;
  address?: string;
  uid?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  invoiceEmail?: string;
  personId?: string;
}) {
  const response = await fetch("/api/v1/organizers", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Kunde konnte nicht gespeichert werden");
  return await response.json();
}
