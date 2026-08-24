import type { EventStatus, T2WEvent } from "./types";

export type EventPeriod = "alle" | "kommend" | "laufend" | "vergangen" | "monat";
export type ArchiveSelection = "aktiv" | "archiv" | "alle";

export const activeEvents = (events: T2WEvent[]) => events.filter((event) => !event.archiviert);
export const openOfferEvents = (events: T2WEvent[]) =>
  activeEvents(events).filter(
    (event) => event.status === "anfrage" || event.status === "angebot-gesendet",
  );
export const invoiceReadyEvents = (events: T2WEvent[], today: string) =>
  events
    .filter((event) => event.ende < today && event.status !== "abgesagt")
    .sort((a, b) => b.ende.localeCompare(a.ende));
export const projectedTasks = (
  events: T2WEvent[],
  options: { openOnly: boolean; query: string },
) => {
  const query = options.query.trim().toLowerCase();
  return activeEvents(events)
    .flatMap((event) => event.aufgaben.map((task) => ({ ...task, event })))
    .filter((task) => !options.openOnly || !task.erledigt)
    .filter(
      (task) =>
        !query ||
        [task.titel, task.verantwortlich, task.event.name].join(" ").toLowerCase().includes(query),
    )
    .sort((a, b) => a.faellig.localeCompare(b.faellig));
};
export function selectEvents(
  events: T2WEvent[],
  options: {
    query: string;
    status: EventStatus | "alle";
    period: EventPeriod;
    archive: ArchiveSelection;
    today: string;
  },
) {
  const query = options.query.trim().toLowerCase();
  const month = options.today.slice(0, 7);
  return events
    .filter(
      (event) =>
        options.archive === "alle" ||
        (options.archive === "archiv" ? event.archiviert : !event.archiviert),
    )
    .filter((event) => options.status === "alle" || event.status === options.status)
    .filter((event) =>
      options.period === "alle" || options.period === "kommend"
        ? options.period === "alle" || event.start > options.today
        : options.period === "vergangen"
          ? event.ende < options.today
          : options.period === "laufend"
            ? event.start <= options.today && event.ende >= options.today
            : event.start.slice(0, 7) === month || event.ende.slice(0, 7) === month,
    )
    .filter(
      (event) =>
        !query ||
        [event.eventcode, event.name, event.veranstalter, event.verantwortlicher, event.ort]
          .join(" ")
          .toLowerCase()
          .includes(query),
    )
    .sort((a, b) => a.start.localeCompare(b.start));
}
export function austrianHoliday(date: Date) {
  const fixed = new Map([
    ["1-1", "Neujahr"],
    ["1-6", "Heilige Drei Könige"],
    ["5-1", "Staatsfeiertag"],
    ["8-15", "Mariä Himmelfahrt"],
    ["10-26", "Nationalfeiertag"],
    ["11-1", "Allerheiligen"],
    ["12-8", "Mariä Empfängnis"],
    ["12-25", "Christtag"],
    ["12-26", "Stefanitag"],
  ]);
  const value = fixed.get(`${date.getMonth() + 1}-${date.getDate()}`);
  if (value) return value;
  const easter = easterSunday(date.getFullYear());
  const offset = Math.round((date.getTime() - easter.getTime()) / 86400000);
  return new Map([
    [1, "Ostermontag"],
    [39, "Christi Himmelfahrt"],
    [50, "Pfingstmontag"],
    [60, "Fronleichnam"],
  ]).get(offset);
}
export function easterSunday(year: number) {
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31),
    day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}
export function isoWeek(date: Date) {
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const start = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  return Math.ceil(((thursday.getTime() - start.getTime()) / 86400000 + 1) / 7);
}
export function groupConsecutive<T>(values: T[], key: (value: T) => string) {
  const groups: { label: string; start: number; count: number }[] = [];
  values.forEach((value, index) => {
    const label = key(value),
      last = groups.at(-1);
    if (last?.label === label) last.count += 1;
    else groups.push({ label, start: index, count: 1 });
  });
  return groups;
}
