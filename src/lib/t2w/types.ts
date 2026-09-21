export type EventStatus =
  "anfrage" | "angebot-gesendet" | "zugesagt" | "abgesagt" | "akquise" | "datum-pruefen";

export const STATUS_LABEL: Record<EventStatus, string> = {
  anfrage: "Anfrage",
  "angebot-gesendet": "Angebot gesendet",
  zugesagt: "Zugesagt",
  abgesagt: "Abgesagt",
  akquise: "Akquise",
  "datum-pruefen": "Datum prüfen",
};

export const STATUS_ORDER: EventStatus[] = [
  "anfrage",
  "angebot-gesendet",
  "zugesagt",
  "abgesagt",
  "akquise",
  "datum-pruefen",
];

export type Contact = {
  id: string;
  name: string;
  rolle: string;
  email: string;
  telefon: string;
  vorname?: string;
  nachname?: string;
  notiz?: string;
  archiviert?: boolean;
  kundenprofil?: Customer | null;
};

export type Customer = {
  id: string;
  name: string;
  land?: string | null;
  ort?: string | null;
  strasse?: string | null;
  plz?: string | null;
  uid?: string | null;
  iban?: string | null;
  bic?: string | null;
  bankname?: string | null;
  email?: string | null;
  personId?: string | null;
};

export type Veranstalter = {
  id: string;
  name: string;
  typ: "organisation" | "person";
  kontakte: Contact[];
};

export type Sportart = { id: string; name: string };

export type Teilnehmerwerte = {
  prognose: number | null;
  aktuell: number | null;
  aktuellQuelle: "manuell" | "time2win" | null;
  aktuellSynchronisiertAm: string | null;
};

export type TaskReadiness = { openCount: number; overdueCount: number };

export type EventFile = {
  id: string;
  name: string;
  groesse: string;
  aktualisiert: string;
};

export type Message = {
  id: string;
  /** Frei konfigurierbar über Einstellungen → Auswahllisten → Nachrichtenarten. */
  kanal: string;
  betreff: string;
  datum: string;
  autor: string;
  text: string;
  richtung?: "INCOMING" | "OUTGOING";
  empfaenger?: string;
  hatAnlagen?: boolean;
  outlookWebUrl?: string;
  conversationId?: string;
  /** Bezug auf ein Thema aus der Auswahlliste; die Person bleibt davon getrennt. */
  themaId?: string;
};

export type T2WEvent = {
  id: string;
  version?: number;
  seriesId?: string | null;
  eventcode: string;
  name: string;
  veranstalter: string;
  veranstalterId?: string;
  sportartId?: string;
  sportart?: string;
  serviceIds?: string[];
  services?: string[];
  t2wEventId?: number | null;
  time2winSyncStatus?: string;
  time2winLastSuccessAt?: string | null;
  time2winLastError?: string | null;
  time2winSnapshot?: {
    eventId: number;
    name: string | null;
    sportName: string | null;
    races: { id: number; name: string; participantCount: number | null }[];
  } | null;
  auszahlungsempfaengerId?: string | null;
  rechnungsempfaengerIds?: string[];
  ort: string;
  start: string; // yyyy-mm-dd
  ende: string; // yyyy-mm-dd
  status: EventStatus;
  verantwortlicher: string;
  teilnehmer: number;
  teilnehmerwerte?: Teilnehmerwerte;
  archiviert: boolean;
  /** Zeitpunkt der letzten Änderung am Eventdatensatz, wie ihn der Dienst führt. */
  zuletztGeaendertAm?: string;
  notizen: string;
  finanzNotizen?: string;
  kontakteNotizen?: string;
  outlookOrdner: string | null;
  outlookWebUrl: string | null;
  outlookMailbox?: string | null;
  outlookRootFolderId?: string | null;
  outlookYearFolderId?: string | null;
  outlookQuarterFolderId?: string | null;
  outlookFolderId?: string | null;
  outlookFolderSyncStatus?: "NEVER" | "SYNCING" | "SUCCESS" | "ERROR";
  outlookFolderLastSuccessAt?: string | null;
  outlookFolderLastError?: string | null;
  outlookMessageSyncStatus?: "NEVER" | "SYNCING" | "SUCCESS" | "ERROR";
  outlookMessageLastSuccessAt?: string | null;
  outlookMessageLastError?: string | null;
  sharepointOrdner: string | null;
  kontakte: Contact[];
  taskReadiness: TaskReadiness;
  dateien: EventFile[];
  kommunikation: Message[];
};

export type Settings = {
  outlookJahresordner: { jahr: string; url: string }[];
  jahresSites: { jahr: string; url: string }[];
  outlookMailbox?: string | null;
  outlookYearFolderId?: string | null;
  outlookQuarterFolderId?: string | null;
  outlookFolderId?: string | null;
  outlookFolderSyncStatus?: "NEVER" | "SYNCING" | "SUCCESS" | "ERROR";
  outlookFolderLastSuccessAt?: string | null;
  outlookFolderLastError?: string | null;
};

export type ColumnKey =
  "eventcode" | "name" | "veranstalter" | "zeitraum" | "verantwortlicher" | "status";

export const COLUMN_LABEL: Record<ColumnKey, string> = {
  eventcode: "Eventcode",
  name: "Eventname",
  veranstalter: "Veranstalter",
  zeitraum: "Zeitraum",
  verantwortlicher: "Verantwortlicher",
  status: "Statusfarbe",
};

export const ALL_COLUMNS: ColumnKey[] = [
  "eventcode",
  "name",
  "veranstalter",
  "zeitraum",
  "verantwortlicher",
  "status",
];
