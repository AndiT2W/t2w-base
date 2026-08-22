import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, GanttChartSquare, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kalender")({
  head: () => ({
    meta: [
      { title: "Kalender – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content: "Monats- und Wochenkalender aller Events, mehrtägige Events als Balken.",
      },
      { property: "og:title", content: "Kalender – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Alle Events im Monats- und Wochenüberblick mit Statusfarben.",
      },
    ],
  }),
  component: KalenderSeite,
});

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONATE = [
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

const STATUS_BAR: Record<EventStatus, string> = {
  anfrage: "bg-status-angefragt",
  "angebot-gesendet": "bg-status-angefragt",
  abgesagt: "bg-status-storniert",
  akquise: "bg-status-angefragt",
  "datum-pruefen": "bg-status-angefragt",
  zugesagt: "bg-status-zugesagt",
};

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function mondayOf(d: Date) {
  const x = new Date(d);
  const wd = (x.getDay() + 6) % 7;
  return addDays(x, -wd);
}

type Segment = {
  event: T2WEvent;
  start: number;
  span: number;
  startsHere: boolean;
  endsHere: boolean;
};

function segmenteFuerWoche(events: T2WEvent[], wochenStart: Date): Segment[][] {
  const tage = Array.from({ length: 7 }, (_, i) => iso(addDays(wochenStart, i)));
  const ersterTag = tage[0]!;
  const letzterTag = tage[6]!;
  const relevante = events
    .filter((e) => e.start <= letzterTag && e.ende >= ersterTag)
    .sort((a, b) => a.start.localeCompare(b.start) || b.ende.localeCompare(a.ende));

  const zeilen: Segment[][] = [];
  for (const e of relevante) {
    const startIdx = Math.max(
      0,
      tage.findIndex((t) => t >= e.start),
    );
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

function Balken({ seg }: { seg: Segment }) {
  const e = seg.event;
  return (
    <Link
      to="/events/$eventcode"
      params={{ eventcode: e.eventcode }}
      title={`${e.name} · ${formatZeitraum(e.start, e.ende)} · ${STATUS_LABEL[e.status]}`}
      className={cn(
        "flex h-6 items-center gap-1.5 overflow-hidden border border-black/5 px-2 text-xs font-medium text-foreground transition-opacity hover:opacity-80",
        "bg-surface shadow-sm",
        seg.startsHere ? "rounded-l-md" : "rounded-l-none",
        seg.endsHere ? "rounded-r-md" : "rounded-r-none",
      )}
    >
      <span className={cn("h-4 w-1.5 shrink-0 rounded-sm", STATUS_BAR[e.status])} aria-hidden />
      <span className="truncate">{e.name}</span>
    </Link>
  );
}

function WochenGitter({
  wochenStart,
  events,
  monat,
  tageAnzahl = 7,
}: {
  wochenStart: Date;
  events: T2WEvent[];
  monat?: number;
  tageAnzahl?: number;
}) {
  const zeilen = segmenteFuerWoche(events, wochenStart).map((zeile) =>
    tageAnzahl === 1 ? zeile.filter((seg) => seg.start === 0) : zeile,
  );
  const heute = heuteIso();
  return (
    <div className="border-b border-border last:border-b-0">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${tageAnzahl}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: tageAnzahl }, (_, i) => {
          const d = addDays(wochenStart, i);
          const imMonat = monat === undefined || d.getMonth() === monat;
          const feiertag = oesterreichischerFeiertag(d);
          const wochenende = d.getDay() === 0 || d.getDay() === 6;
          return (
            <div
              key={i}
              className={cn(
                "border-r border-border px-2 py-1.5 text-xs last:border-r-0",
                imMonat ? "text-foreground" : "text-muted-foreground/50",
                iso(d) === heute && "bg-accent font-semibold",
                feiertag ? "bg-amber-100 text-amber-900" : wochenende && "bg-muted/70",
              )}
              title={feiertag ?? undefined}
            >
              <span>{d.getDate()}.</span>
              {feiertag && <span className="ml-1 block truncate text-[10px] font-medium" title={feiertag}>{feiertag}</span>}
            </div>
          );
        })}
      </div>
      <div className="relative space-y-1 px-1 pb-2 pt-0.5" style={{ minHeight: "3rem" }}>
        {zeilen.map((zeile, zi) => (
          <div
            key={zi}
            className="grid gap-x-0"
            style={{ gridTemplateColumns: `repeat(${tageAnzahl}, minmax(0, 1fr))` }}
          >
            {zeile.map((seg) => (
              <div
                key={seg.event.id}
                style={{ gridColumnStart: seg.start + 1, gridColumnEnd: seg.start + 1 + seg.span }}
                className="px-0.5"
              >
                <Balken seg={seg} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KalenderSeite({
  veranstaltungsmenue = false,
}: { veranstaltungsmenue?: boolean } = {}) {
  const { events } = useT2W();
  const { t } = useI18n();
  const [modus, setModus] = useState<"monat" | "woche" | "tag">("monat");
  const [anker, setAnker] = useState(() => new Date());
  const sichtbareEvents = useMemo(() => events.filter((e) => !e.archiviert), [events]);

  const monatsStart = new Date(anker.getFullYear(), anker.getMonth(), 1);
  const gitterStart = mondayOf(monatsStart);
  const wochenAnzahl = 6;
  const wochenStart = mondayOf(anker);

  function blaettern(richtung: number) {
    setAnker((prev) => {
      const d = new Date(prev);
      if (modus === "monat") d.setMonth(d.getMonth() + richtung);
      else if (modus === "woche") d.setDate(d.getDate() + richtung * 7);
      else d.setDate(d.getDate() + richtung);
      return d;
    });
  }

  const titel =
    modus === "monat"
      ? `${MONATE[anker.getMonth()]} ${anker.getFullYear()}`
      : modus === "woche"
        ? `Woche ab ${wochenStart.getDate()}. ${MONATE[wochenStart.getMonth()]} ${wochenStart.getFullYear()}`
        : `${anker.getDate()}. ${MONATE[anker.getMonth()]} ${anker.getFullYear()}`;

  return (
    <div className="space-y-5">
      {veranstaltungsmenue && (
        <PageHeader
          krumen={[{ label: "TIME2WIN", to: "/" }]}
          titel="Veranstaltungen"
          beschreibung={`${sichtbareEvents.length} aktive Events`}
        />
      )}
      <nav aria-label="Veranstaltungsansichten" className="flex gap-1 border-b border-border">
        <KalenderReiter to="/veranstaltungen" label="Liste" icon={List} />
        <KalenderReiter
          to="/veranstaltungen"
          search={{ ansicht: "kalender" }}
          label="Kalender"
          icon={CalendarDays}
          aktiv={veranstaltungsmenue || undefined}
        />
        <KalenderReiter
          to="/veranstaltungen"
          search={{ ansicht: "gantt" }}
          label="Gantt"
          icon={GanttChartSquare}
        />
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("nav.calendar")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            {(["monat", "woche", "tag"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModus(m)}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  modus === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "monat" ? "Monat" : m === "woche" ? "Woche" : "Tag"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" aria-label="Zurück" onClick={() => blaettern(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" onClick={() => setAnker(new Date())}>
            Heute
          </Button>
          <Button variant="outline" size="icon" aria-label="Weiter" onClick={() => blaettern(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">{titel}</h2>
          <div className="flex flex-wrap gap-3">
            {STATUS_ORDER.map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <StatusDot status={s} />
                {STATUS_LABEL[s]}
              </span>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "min-w-[42rem] grid border-b border-border bg-secondary",
            modus === "tag" ? "grid-cols-1" : "grid-cols-7",
          )}
        >
          {(modus === "tag" ? [WOCHENTAGE[(anker.getDay() + 6) % 7]] : WOCHENTAGE).map((t) => (
            <div
              key={t}
              className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
        {modus === "monat" ? (
          Array.from({ length: wochenAnzahl }, (_, i) => (
            <WochenGitter
              key={i}
              wochenStart={addDays(gitterStart, i * 7)}
              events={sichtbareEvents}
              monat={anker.getMonth()}
            />
          ))
        ) : modus === "woche" ? (
          <WochenGitter wochenStart={wochenStart} events={sichtbareEvents} />
        ) : (
          <WochenGitter wochenStart={anker} events={sichtbareEvents} tageAnzahl={1} />
        )}
        </div>
      </div>
    </div>
  );
}

function KalenderReiter({
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
      className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
        aktiv
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function oesterreichischerFeiertag(datum: Date) {
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
  const fixerFeiertag = fix.get(`${datum.getMonth() + 1}-${datum.getDate()}`);
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
