import type { T2WEvent } from "./types";

export const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function mondayOf(d: Date): Date {
  const x = new Date(d);
  const wd = (x.getDay() + 6) % 7;
  return addDays(x, -wd);
}

export type Segment = {
  event: T2WEvent;
  start: number;
  span: number;
  startsHere: boolean;
  endsHere: boolean;
};

export function segmenteFuerWoche(events: T2WEvent[], wochenStart: Date): Segment[][] {
  const tage = Array.from({ length: 7 }, (_, i) => iso(addDays(wochenStart, i)));
  const ersterTag = tage[0]!;
  const letzterTag = tage[6]!;
  const relevante = events
    .filter((e) => e.start <= letzterTag && e.ende >= ersterTag)
    .sort((a, b) => a.start.localeCompare(b.start) || b.ende.localeCompare(a.ende));

  const zeilen: Segment[][] = [];
  for (const e of relevante) {
    const gefunden = tage.findIndex((t) => t >= e.start);
    const startIdx = Math.max(0, gefunden === -1 ? 0 : gefunden);
    let endIdx = 6;
    for (let i = 6; i >= 0; i -= 1) {
      if (tage[i]! <= e.ende) {
        endIdx = i;
        break;
      }
    }
    const seg: Segment = {
      event: e,
      start: startIdx,
      span: Math.max(1, endIdx - startIdx + 1),
      startsHere: e.start >= ersterTag,
      endsHere: e.ende <= letzterTag,
    };
    let platziert = false;
    for (const zeile of zeilen) {
      const kollision = zeile.some(
        (s) => seg.start < s.start + s.span && s.start < seg.start + seg.span,
      );
      if (!kollision) {
        zeile.push(seg);
        platziert = true;
        break;
      }
    }
    if (!platziert) zeilen.push([seg]);
  }
  return zeilen;
}

export const STATUS_BAR = {
  entwurf: "bg-status-entwurf",
  angefragt: "bg-status-angefragt",
  zugesagt: "bg-status-zugesagt",
  abgeschlossen: "bg-status-abgeschlossen",
  storniert: "bg-status-storniert",
} as const;

export function naechsteAufgabe(e: T2WEvent) {
  return [...e.aufgaben]
    .filter((a) => !a.erledigt)
    .sort((a, b) => a.faellig.localeCompare(b.faellig))[0];
}
