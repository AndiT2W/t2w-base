export type EventStatus = "entwurf" | "angefragt" | "zugesagt" | "abgeschlossen" | "storniert";

export const STATUS_LABEL: Record<EventStatus, string> = {
  entwurf: "Entwurf",
  angefragt: "Angefragt",
  zugesagt: "Zugesagt",
  abgeschlossen: "Abgeschlossen",
  storniert: "Storniert",
};

export const STATUS_ORDER: EventStatus[] = [
  "entwurf",
  "angefragt",
  "zugesagt",
  "abgeschlossen",
  "storniert",
];

export type Risk = "keins" | "beobachten" | "kritisch";

export const RISK_LABEL: Record<Risk, string> = {
  keins: "Kein Risiko",
  beobachten: "Beobachten",
  kritisch: "Kritisch",
};

export type Contact = {
  id: string;
  name: string;
  rolle: string;
  email: string;
  telefon: string;
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
  eventcode: string;
  name: string;
  veranstalter: string;
  ort: string;
  start: string; // yyyy-mm-dd
  ende: string; // yyyy-mm-dd
  status: EventStatus;
  verantwortlicher: string;
  risiko: Risk;
  teilnehmer: number;
  archiviert: boolean;
  notizen: string;
  outlookOrdner: string | null;
  sharepointOrdner: string | null;
  kontakte: Contact[];
  aufgaben: Task[];
  dateien: EventFile[];
  kommunikation: Message[];
};

export type Settings = {
  outlookStammordner: string;
  jahresSites: { jahr: string; url: string }[];
};

export type ColumnKey =
  "eventcode" | "name" | "veranstalter" | "zeitraum" | "verantwortlicher" | "status" | "risiko";

export const COLUMN_LABEL: Record<ColumnKey, string> = {
  eventcode: "Eventcode",
  name: "Eventname",
  veranstalter: "Veranstalter",
  zeitraum: "Zeitraum",
  verantwortlicher: "Verantwortlicher",
  status: "Statusfarbe",
  risiko: "Risikoindikator",
};

export const ALL_COLUMNS: ColumnKey[] = [
  "eventcode",
  "name",
  "veranstalter",
  "zeitraum",
  "verantwortlicher",
  "status",
  "risiko",
];
