import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, GanttChartSquare, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
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
}: {
  wochenStart: Date;
  events: T2WEvent[];
  monat?: number;
}) {
  const zeilen = segmenteFuerWoche(events, wochenStart);
  const heute = heuteIso();
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="grid grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(wochenStart, i);
          const imMonat = monat === undefined || d.getMonth() === monat;
          return (
            <div
              key={i}
              className={cn(
                "border-r border-border px-2 py-1.5 text-xs last:border-r-0",
                imMonat ? "text-foreground" : "text-muted-foreground/50",
                iso(d) === heute && "bg-accent font-semibold",
              )}
            >
              {d.getDate()}.
            </div>
          );
        })}
      </div>
      <div className="relative space-y-1 px-1 pb-2 pt-0.5" style={{ minHeight: "3rem" }}>
        {zeilen.map((zeile, zi) => (
          <div key={zi} className="grid grid-cols-7 gap-x-0">
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
        {zeilen.length === 0 && (
          <p className="px-2 py-2 text-xs text-muted-foreground">Keine Events</p>
        )}
      </div>
    </div>
  );
}

function KalenderSeite() {
  const { events } = useT2W();
  const [modus, setModus] = useState<"monat" | "woche">("monat");
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
      else d.setDate(d.getDate() + richtung * 7);
      return d;
    });
  }

  const titel =
    modus === "monat"
      ? `${MONATE[anker.getMonth()]} ${anker.getFullYear()}`
      : `Woche ab ${wochenStart.getDate()}. ${MONATE[wochenStart.getMonth()]} ${wochenStart.getFullYear()}`;

  return (
    <div className="space-y-5">
      <nav aria-label="Veranstaltungsansichten" className="flex gap-1 border-b border-border">
        <KalenderReiter to="/veranstaltungen" label="Liste" icon={List} />
        <KalenderReiter to="/kalender" label="Kalender" icon={CalendarDays} aktiv />
        <KalenderReiter to="/gantt" label="Gantt" icon={GanttChartSquare} />
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kalender</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mehrtägige Events werden als durchgehender Balken dargestellt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            {(["monat", "woche"] as const).map((m) => (
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
                {m === "monat" ? "Monat" : "Woche"}
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

        <div className="grid grid-cols-7 border-b border-border bg-secondary">
          {WOCHENTAGE.map((t) => (
            <div
              key={t}
              className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t}
            </div>
          ))}
        </div>

        {modus === "monat" ? (
          Array.from({ length: wochenAnzahl }, (_, i) => (
            <WochenGitter
              key={i}
              wochenStart={addDays(gitterStart, i * 7)}
              events={sichtbareEvents}
              monat={anker.getMonth()}
            />
          ))
        ) : (
          <WochenGitter wochenStart={wochenStart} events={sichtbareEvents} />
        )}
      </div>
    </div>
  );
}

function KalenderReiter({
  to,
  label,
  icon: Icon,
  aktiv = false,
}: {
  to: "/veranstaltungen" | "/kalender" | "/gantt";
  label: string;
  icon: typeof List;
  aktiv?: boolean;
}) {
  return (
    <Link
      to={to}
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
