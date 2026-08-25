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

export type Task = {
  id: string;
  titel: string;
  faellig: string;
  verantwortlich: string;
  erledigt: boolean;
};

export type EventFile = {
  id: string;
  name: string;
  groesse: string;
  aktualisiert: string;
};

export type Message = {
  id: string;
  kanal: "E-Mail" | "Telefon" | "Notiz";
  betreff: string;
  datum: string;
  autor: string;
  text: string;
};

export type T2WEvent = {
  id: string;
  version?: number;
  eventcode: string;
  name: string;
  veranstalter: string;
  veranstalterId?: string;
  sportartId?: string;
  sportart?: string;
  t2wEventId?: number | null;
  time2winSyncStatus?: string;
  time2winLastSuccessAt?: string | null;
  time2winLastError?: string | null;
  ort: string;
  start: string; // yyyy-mm-dd
  ende: string; // yyyy-mm-dd
  status: EventStatus;
  verantwortlicher: string;
  teilnehmer: number;
  teilnehmerwerte?: Teilnehmerwerte;
  archiviert: boolean;
  notizen: string;
  outlookOrdner: string | null;
  outlookWebUrl: string | null;
  sharepointOrdner: string | null;
  kontakte: Contact[];
  aufgaben: Task[];
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
