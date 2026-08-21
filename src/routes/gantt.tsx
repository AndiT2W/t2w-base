import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, GanttChartSquare, List } from "lucide-react";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusBadge } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso } from "@/lib/t2w/format";

export const Route = createFileRoute("/gantt")({
  head: () => ({ meta: [{ title: "Gantt – TIME2WIN Eventverwaltung" }] }),
  component: GanttSeite,
});

export function GanttSeite({
  veranstaltungsmenue = false,
}: { veranstaltungsmenue?: boolean } = {}) {
  const { events } = useT2W();
  const [zoom, setZoom] = useState<"tag" | "woche" | "monat">("tag");
  const heute = heuteIso();
  const sichtbar = events
    .filter((event) => !event.archiviert)
    .sort((a, b) => a.start.localeCompare(b.start));
  const min = Math.min(
    ...sichtbar.map((event) => Date.parse(`${event.start}T00:00:00`)),
    Date.parse(`${heute}T00:00:00`),
  );
  const max = Math.max(
    ...sichtbar.map((event) => Date.parse(`${event.ende}T00:00:00`)),
    min + 30 * 86400000,
  );
  const breite = Math.max(max - min, 30 * 86400000);
  const tage = Array.from({ length: Math.floor(breite / 86400000) + 1 }, (_, index) => {
    const datum = new Date(min + index * 86400000);
    const feiertag = oesterreichischerFeiertag(datum);
    return {
      datum,
      iso: datum.toISOString().slice(0, 10),
      feiertag,
      wochenende: datum.getDay() === 0 || datum.getDay() === 6,
    };
  });
  const tageBreite = Math.max(
    tage.length * (zoom === "tag" ? 2.5 : zoom === "woche" ? 1.2 : 0.55),
    48,
  );
  const monate = gruppiere(tage, (tag) =>
    tag.datum.toLocaleDateString("de-AT", { month: "long", year: "numeric" }),
  );
  const wochen = gruppiere(tage, (tag) => `KW ${isoWoche(tag.datum)}`);

  return (
    <div>
      <PageHeader
        krumen={[{ label: "TIME2WIN", to: "/" }]}
        titel="Veranstaltungen"
        beschreibung={`${sichtbar.length} aktive Events`}
      />
      <div className="space-y-4">
        <nav aria-label="Veranstaltungsansichten" className="flex gap-1 border-b border-border">
          <Reiter to="/veranstaltungen" label="Liste" icon={List} />
          <Reiter
            to="/veranstaltungen"
            search={{ ansicht: "kalender" }}
            label="Kalender"
            icon={CalendarDays}
          />
          <Reiter
            to="/veranstaltungen"
            search={{ ansicht: "gantt" }}
            label="Gantt"
            icon={GanttChartSquare}
            aktiv={veranstaltungsmenue || undefined}
          />
        </nav>
        <div className="flex items-center justify-end gap-2 rounded-t-lg border border-b-0 border-border bg-surface px-3 pt-3 text-sm">
          <label htmlFor="gantt-zoom" className="text-muted-foreground">
            Ansicht
          </label>
          <select
            id="gantt-zoom"
            value={zoom}
            onChange={(event) => setZoom(event.target.value as typeof zoom)}
            className="rounded border border-border bg-background px-2 py-1"
          >
            <option value="tag">Tag</option>
            <option value="woche">Woche</option>
            <option value="monat">Monat</option>
          </select>
        </div>
        <div className="overflow-x-auto rounded-b-lg border border-t-0 border-border bg-surface p-3">
          <div className="space-y-2" style={{ minWidth: `${tageBreite}rem` }}>
            <div className="grid grid-cols-[13rem_1fr] gap-3 text-[10px] text-muted-foreground">
              <div />
              <div className="overflow-hidden">
                <div
                  className="grid border-b border-border bg-secondary/50"
                  style={{ gridTemplateColumns: `repeat(${tage.length}, minmax(2.5rem, 1fr))` }}
                >
                  {monate.map((segment) => (
                    <div
                      key={`monat-${segment.start}`}
                      className="truncate border-r border-border px-1 py-1 font-semibold capitalize"
                      style={{ gridColumn: `span ${segment.count}` }}
                    >
                      {segment.label}
                    </div>
                  ))}
                </div>
                <div
                  className="grid border-b border-border"
                  style={{ gridTemplateColumns: `repeat(${tage.length}, minmax(2.5rem, 1fr))` }}
                >
                  {wochen.map((segment) => (
                    <div
                      key={`woche-${segment.start}`}
                      className="truncate border-r border-border px-1 py-1"
                      style={{ gridColumn: `span ${segment.count}` }}
                    >
                      {segment.label}
                    </div>
                  ))}
                </div>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${tage.length}, minmax(2.5rem, 1fr))` }}
                >
                  {tage.map((tag) => (
                    <div
                      key={tag.iso}
                      title={tag.feiertag ?? undefined}
                      className={`border-r border-border px-1 py-1 text-center tabular-nums ${tag.feiertag ? "bg-amber-100 font-semibold text-amber-900" : tag.wochenende ? "bg-muted/70" : ""}`}
                    >
                      {tag.datum.getDate()}
                    </div>
                  ))}
                </div>
                <div
                  className="grid border-t border-border bg-secondary/30 text-center text-[10px] font-semibold tabular-nums text-muted-foreground"
                  style={{ gridTemplateColumns: `repeat(${tage.length}, minmax(2.5rem, 1fr))` }}
                >
                  {tage.map((tag) => (
                    <div key={`count-${tag.iso}`} className="border-r border-border px-1 py-1">
                      {sichtbar.filter((event) => event.start <= tag.iso && event.ende >= tag.iso)
                        .length || "–"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {sichtbar.map((event) => {
              const left = ((Date.parse(`${event.start}T00:00:00`) - min) / breite) * 100;
              const width = Math.max(
                ((Date.parse(`${event.ende}T00:00:00`) -
                  Date.parse(`${event.start}T00:00:00`) +
                  86400000) /
                  breite) *
                  100,
                1.5,
              );
              return (
                <div
                  key={event.id}
                  className="grid grid-cols-[13rem_1fr] items-center gap-3 text-xs"
                >
                  <Link
                    to="/events/$eventcode"
                    params={{ eventcode: event.eventcode }}
                    className="truncate font-medium hover:text-primary"
                  >
                    {event.name}
                  </Link>
                  <div
                    className="relative h-8 rounded bg-secondary"
                    style={{
                      backgroundImage: rasterHintergrund(tage),
                      backgroundSize: `${100 / tage.length}% 100%`,
                    }}
                  >
                    <Link
                      to="/events/$eventcode"
                      params={{ eventcode: event.eventcode }}
                      className="absolute top-1.5 h-5 rounded bg-primary/80 px-2 text-[11px] text-primary-foreground"
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={formatZeitraum(event.start, event.ende)}
                    >
                      <StatusBadge status={event.status} />
                    </Link>
                  </div>
                </div>
              );
            })}
            {sichtbar.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Keine aktiven Events.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function gruppiere<T>(werte: T[], schluessel: (wert: T) => string) {
  const segmente: { label: string; start: number; count: number }[] = [];
  werte.forEach((wert, index) => {
    const label = schluessel(wert);
    const letztes = segmente[segmente.length - 1];
    if (letztes?.label === label) letztes.count += 1;
    else segmente.push({ label, start: index, count: 1 });
  });
  return segmente;
}

function isoWoche(datum: Date) {
  const donnerstag = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  donnerstag.setUTCDate(donnerstag.getUTCDate() + 4 - (donnerstag.getUTCDay() || 7));
  const jahresstart = new Date(Date.UTC(donnerstag.getUTCFullYear(), 0, 1));
  return Math.ceil(((donnerstag.getTime() - jahresstart.getTime()) / 86400000 + 1) / 7);
}

function oesterreichischerFeiertag(datum: Date) {
  const monat = datum.getMonth() + 1;
  const tag = datum.getDate();
  const fix = new Map([
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
  const fixerFeiertag = fix.get(`${monat}-${tag}`);
  if (fixerFeiertag) return fixerFeiertag;
  const ostersonntag = ostersonntagFuer(datum.getFullYear());
  const tageSeitOstern = Math.round((datum.getTime() - ostersonntag.getTime()) / 86400000);
  return new Map([
    [1, "Ostermontag"],
    [39, "Christi Himmelfahrt"],
    [50, "Pfingstmontag"],
    [60, "Fronleichnam"],
  ]).get(tageSeitOstern);
}

function ostersonntagFuer(jahr: number) {
  const a = jahr % 19,
    b = Math.floor(jahr / 100),
    c = jahr % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    monat = Math.floor((h + l - 7 * m + 114) / 31),
    tag = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(jahr, monat - 1, tag));
}

function rasterHintergrund(tage: { wochenende: boolean; feiertag?: string }[]) {
  const stops = tage.flatMap((tag, index) => {
    const farbe = tag.feiertag
      ? "rgba(245, 158, 11, 0.18)"
      : tag.wochenende
        ? "rgba(148, 163, 184, 0.16)"
        : "transparent";
    const start = (index / tage.length) * 100;
    const ende = ((index + 1) / tage.length) * 100;
    return [
      `${farbe} ${start}%`,
      `${farbe} ${ende - 0.15}%`,
      `hsl(var(--border)) ${ende - 0.15}%`,
      `hsl(var(--border)) ${ende}%`,
    ];
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

function Reiter({
  to,
  search,
  label,
  icon: Icon,
  aktiv = false,
}: {
  to: "/veranstaltungen" | "/kalender" | "/gantt";
  search?: { ansicht: "kalender" | "gantt" };
  label: string;
  icon: typeof List;
  aktiv?: boolean;
}) {
  return (
    <Link
      to={to}
      search={search}
      aria-current={aktiv ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${aktiv ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
