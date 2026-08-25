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
  organizer?: { id: string; name: string } | null;
  sport?: { id: string; name: string } | null;
  t2wEventId?: number | null;
  time2winSyncStatus?: string;
  time2winLastSuccessAt?: string | null;
  time2winLastError?: string | null;
  contacts?: { role: string; contact: { id: string; name: string; email: string | null; phone: string | null } }[];
  tasks?: { id: string; title: string; dueAt: string | null; responsible: string | null; completed: boolean }[];
  files?: { id: string; name: string; size: string | null; updatedAt: string }[];
  activities?: { id: string; channel: string; subject: string; author: string | null; body: string | null; occurredAt: string }[];
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
    veranstalterId: event.organizer?.id,
    sportartId: event.sport?.id,
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
    t2wEventId: event.t2wEventId ?? null,
    time2winSyncStatus: event.time2winSyncStatus,
    time2winLastSuccessAt: event.time2winLastSuccessAt ?? null,
    time2winLastError: event.time2winLastError ?? null,
    kontakte: (event.contacts ?? []).map(({ role, contact }) => ({ id: contact.id, name: contact.name, rolle: role, email: contact.email ?? "", telefon: contact.phone ?? "" })),
    aufgaben: (event.tasks ?? []).map((task) => ({ id: task.id, titel: task.title, faellig: task.dueAt ? dateOnly(task.dueAt) : "", verantwortlich: task.responsible ?? "", erledigt: task.completed })),
    dateien: (event.files ?? []).map((file) => ({ id: file.id, name: file.name, groesse: file.size ?? "", aktualisiert: dateOnly(file.updatedAt) })),
    kommunikation: (event.activities ?? []).map((activity) => ({ id: activity.id, kanal: activity.channel as "E-Mail" | "Telefon" | "Notiz", betreff: activity.subject, datum: dateOnly(activity.occurredAt), autor: activity.author ?? "", text: activity.body ?? "" })),
    sportart: event.sport?.name ?? "",
  };
}

async function eventAction<T>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const response = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) throw new Error("Event-Arbeitsfläche konnte nicht gespeichert werden");
  return response.status === 204 ? (undefined as T) : (await response.json()) as T;
}
export const apiAddEventContact = (eventId: string, contactId: string, role: string) => eventAction(`/api/v1/events/${eventId}/contacts/${contactId}`, "POST", { role });
export const apiRemoveEventContact = (eventId: string, contactId: string, role: string) => eventAction<void>(`/api/v1/events/${eventId}/contacts/${contactId}/${encodeURIComponent(role)}`, "DELETE");
export const apiCreateEventTask = (eventId: string, body: { title: string; dueAt?: string; responsible?: string }) => eventAction(`/api/v1/events/${eventId}/tasks`, "POST", body);
export const apiUpdateEventTask = (eventId: string, taskId: string, body: { title?: string; dueAt?: string | null; responsible?: string; completed?: boolean }) => eventAction(`/api/v1/events/${eventId}/tasks/${taskId}`, "PATCH", body);
export const apiCreateEventFile = (eventId: string, body: { name: string; url?: string; size?: string }) => eventAction(`/api/v1/events/${eventId}/files`, "POST", body);
export const apiCreateEventActivity = (eventId: string, body: { channel: string; subject: string; author?: string; body?: string; occurredAt?: string }) => eventAction(`/api/v1/events/${eventId}/activities`, "POST", body);

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

export async function apiOutlookStatus(): Promise<boolean> {
  const response = await fetch("/api/v1/settings/outlook/status", { credentials: "include" });
  if (!response.ok) return false;
  return ((await response.json()) as { connected?: boolean }).connected === true;
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
      participantForecast: patch.teilnehmerwerte?.prognose ?? patch.teilnehmer,
      notes: patch.notizen,
      organizerName: patch.veranstalter,
      organizerId: patch.veranstalterId,
      sportId: patch.sportartId,
      status: patch.status === "anfrage" ? "ANFRAGE" : patch.status === "angebot-gesendet" ? "ANGEBOT_GESENDET" : patch.status === "datum-pruefen" ? "DATUM_PRUEFEN" : patch.status === "akquise" ? "AKQUISE" : patch.status === "abgesagt" ? "ABGESAGT" : "ZUGESAGT",
      archived: patch.archiviert,
      t2wEventId: patch.t2wEventId,
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
  country?: string;
  city?: string;
  street?: string;
  postalCode?: string;
  uid?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  email?: string;
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
