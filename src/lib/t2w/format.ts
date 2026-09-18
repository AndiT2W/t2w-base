export function formatDatum(iso: string): string {
  const parts = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/.exec(iso)?.groups;
  return parts ? `${parts["day"]}.${parts["month"]}.${parts["year"]}` : iso;
}

export function formatDatumMitZeit(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("de-AT", {
    timeZone: "Europe/Vienna",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("day")}.${value("month")}.${value("year")}, ${value("hour")}:${value("minute")}`;
}

export function formatZeitraum(start: string, ende: string): string {
  if (start === ende) return formatDatum(start);
  return `${formatDatum(start)} – ${formatDatum(ende)}`;
}

export function tageZwischen(start: string, ende: string): number {
  const a = new Date(`${start}T00:00:00`).getTime();
  const b = new Date(`${ende}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

export function heuteIso(): string {
  return new Date().toISOString().slice(0, 10);
}
