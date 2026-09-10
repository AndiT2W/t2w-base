import type { EventStatus, T2WEvent } from "./types";
export type EventPeriod = "alle" | "kommend" | "laufend" | "vergangen" | "monat";
export type ArchiveSelection = "aktiv" | "archiv" | "alle";
export type EventCatalogueFilters = {
  query: string;
  status: EventStatus | "alle";
  period: EventPeriod;
  archive: ArchiveSelection;
  today: string;
};
export const activeCatalogueFilters = (today: string): EventCatalogueFilters => ({
  query: "",
  status: "alle",
  period: "alle",
  archive: "aktiv",
  today,
});
export function selectEventCatalogue(events: T2WEvent[], options: EventCatalogueFilters) {
  const query = options.query.trim().toLowerCase(),
    month = options.today.slice(0, 7);
  return events
    .filter(
      (e) =>
        options.archive === "alle" || (options.archive === "archiv" ? e.archiviert : !e.archiviert),
    )
    .filter((e) => options.status === "alle" || e.status === options.status)
    .filter((e) =>
      options.period === "alle" || options.period === "kommend"
        ? options.period === "alle" || e.start > options.today
        : options.period === "vergangen"
          ? e.ende < options.today
          : options.period === "laufend"
            ? e.start <= options.today && e.ende >= options.today
            : e.start.slice(0, 7) === month || e.ende.slice(0, 7) === month,
    )
    .filter(
      (e) =>
        !query ||
        [e.eventcode, e.name, e.veranstalter, e.verantwortlicher, e.ort]
          .join(" ")
          .toLowerCase()
          .includes(query),
    )
    .sort((a, b) => a.start.localeCompare(b.start));
}
