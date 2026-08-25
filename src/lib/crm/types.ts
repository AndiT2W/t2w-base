export type EventRolle = "anmeldung" | "finanzen" | "timing";
export const EVENTROLLE_LABEL: Record<EventRolle, string> = {
  anmeldung: "Anmeldung",
  finanzen: "Finanzen",
  timing: "Timing",
};
export type KundenStatus = "aktiv" | "inaktiv";
export const KUNDENSTATUS_LABEL: Record<KundenStatus, string> = {
  aktiv: "Aktiv",
  inaktiv: "Inaktiv",
};
export type Person = {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefonPrivat: string;
  telefonBeruflich: string;
  funktion: string;
  ort: string;
  land: string;
  strasse: string;
  plz: string;
  notiz: string;
  kundenprofilId: string | null;
  kundenIds: string[];
  eventRollen: { eventcode: string; eventName: string; rolle: EventRolle }[];
};
export type Kunde = {
  id: string;
  typ: "firma" | "person";
  name: string;
  personId: string | null;
  uid: string;
  iban: string;
  bic: string;
  bank: string;
  land: string;
  ort: string;
  strasse: string;
  plz: string;
  email: string;
  status: KundenStatus;
  kontaktIds: string[];
  events: {
    eventcode: string;
    eventName: string;
    funktion: "veranstalter" | "auszahlung" | "rechnung";
  }[];
};
export const personName = (p: Person) => `${p.vorname} ${p.nachname}`.trim();
