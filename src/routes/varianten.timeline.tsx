import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VariantSwitcher } from "@/components/t2w/VariantSwitcher";
import { StatusBadge, StatusDot } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatDatum, formatZeitraum, heuteIso } from "@/lib/t2w/format";
import {
  MONATE,
  STATUS_BAR,
  WOCHENTAGE,
  addDays,
  iso,
  mondayOf,
  naechsteAufgabe,
  segmenteFuerWoche,
  type Segment,
} from "@/lib/t2w/kalender";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/varianten/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline Planner – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content:
          "Planungsorientierte Kalenderansicht mit Filterleiste, gespeicherten Ansichten und Detail-Drawer.",
      },
      { property: "og:title", content: "Timeline Planner – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Variante 2: Monats- und Wochenumschaltung mit mehrtägigen Balken.",
      },
    ],
  }),
  component: TimelineVariante,
});

type Ansicht = "alle" | "zugesagt" | "quartal";

const GESPEICHERTE_ANSICHTEN: { key: Ansicht; label: string; hinweis: string }[] = [
  { key: "alle", label: "Alle aktiven Events", hinweis: "Standardansicht" },
  { key: "zugesagt", label: "Nur zugesagte Events", hinweis: "Produktionsplanung" },
  { key: "quartal", label: "Laufendes Quartal", hinweis: "Ordnerpflege Outlook" },
];

function quartalVon(datum: string) {
  const m = Number(datum.slice(5, 7));
  return Math.floor((m - 1) / 3) + 1;
}

function TimelineVariante() {
  const { events } = useT2W();
  const heute = heuteIso();
  const [modus, setModus] = useState<"monat" | "woche">("monat");
  const [anker, setAnker] = useState(() => new Date());
  const [ansicht, setAnsicht] = useState<Ansicht>("alle");
  const [statusFilter, setStatusFilter] = useState<EventStatus[]>([]);
  const [aktiv, setAktiv] = useState<T2WEvent | null>(null);

  const gefiltert = useMemo(() => {
    const q = quartalVon(heute);
    const jahr = heute.slice(0, 4);
    return events
      .filter((e) => !e.archiviert)
      .filter((e) => (statusFilter.length ? statusFilter.includes(e.status) : true))
      .filter((e) => {
        if (ansicht === "zugesagt") return e.status === "zugesagt";
        if (ansicht === "quartal") return e.start.slice(0, 4) === jahr && quartalVon(e.start) === q;
        return true;
      });
  }, [events, ansicht, statusFilter, heute]);

  const monatsStart = new Date(anker.getFullYear(), anker.getMonth(), 1);
  const gitterStart = mondayOf(monatsStart);
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
      : `Woche ab ${formatDatum(iso(wochenStart))}`;

  function toggleStatus(s: EventStatus) {
    setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  return (
    <div className="space-y-4">
      <VariantSwitcher aktiv="timeline" />

      <div
        className={cn(
          "grid gap-4",
          aktiv ? "xl:grid-cols-[15rem_minmax(0,1fr)_20rem]" : "lg:grid-cols-[15rem_minmax(0,1fr)]",
        )}
      >
        <aside className="space-y-4 rounded-lg border border-border bg-surface p-3">
          <div>
            <p className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Gespeicherte Ansichten
            </p>
            <div className="space-y-1">
              {GESPEICHERTE_ANSICHTEN.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setAnsicht(a.key)}
                  className={cn(
                    "block w-full rounded-md px-2.5 py-2 text-left transition-colors",
                    ansicht === a.key
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <span className="block text-sm font-medium">{a.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{a.hinweis}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Statuslegende &amp; Filter
            </p>
            <div className="space-y-1">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    statusFilter.includes(s)
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <StatusDot status={s} />
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            {statusFilter.length > 0 && (
              <button
                onClick={() => setStatusFilter([])}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                Statusfilter zurücksetzen
              </button>
            )}
          </div>
        </aside>

        <div className="min-w-0 rounded-lg border border-border bg-surface">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-3 py-2.5 sm:flex sm:justify-between">
            <h2 className="truncate text-base font-semibold text-foreground">{titel}</h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-border p-0.5">
                {(["monat", "woche"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModus(m)}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                      modus === m
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m === "monat" ? "Monat" : "Woche"}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                aria-label="Zurück"
                onClick={() => blaettern(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAnker(new Date())}>
                Heute
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Weiter"
                onClick={() => blaettern(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-border bg-secondary">
            {WOCHENTAGE.map((t) => (
              <div
                key={t}
                className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {t}
              </div>
            ))}
          </div>

          {modus === "monat" ? (
            Array.from({ length: 6 }, (_, i) => (
              <Woche
                key={i}
                wochenStart={addDays(gitterStart, i * 7)}
                events={gefiltert}
                monat={anker.getMonth()}
                onSelect={setAktiv}
              />
            ))
          ) : (
            <Woche wochenStart={wochenStart} events={gefiltert} onSelect={setAktiv} />
          )}
        </div>

        {aktiv && <Drawer event={aktiv} onClose={() => setAktiv(null)} />}
      </div>
    </div>
  );
}

function Woche({
  wochenStart,
  events,
  monat,
  onSelect,
}: {
  wochenStart: Date;
  events: T2WEvent[];
  monat?: number;
  onSelect: (e: T2WEvent) => void;
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
                "border-r border-border px-2 py-1 text-[11px] last:border-r-0",
                imMonat ? "text-foreground" : "text-muted-foreground/50",
                iso(d) === heute && "bg-accent font-semibold",
              )}
            >
              {d.getDate()}.
            </div>
          );
        })}
      </div>
      <div className="space-y-1 px-1 pb-2 pt-0.5" style={{ minHeight: "2.75rem" }}>
        {zeilen.map((zeile, zi) => (
          <div key={zi} className="grid grid-cols-7">
            {zeile.map((seg) => (
              <div
                key={seg.event.id}
                style={{ gridColumnStart: seg.start + 1, gridColumnEnd: seg.start + 1 + seg.span }}
                className="px-0.5"
              >
                <Balken seg={seg} onSelect={onSelect} />
              </div>
            ))}
          </div>
        ))}
        {zeilen.length === 0 && (
          <p className="px-2 py-1.5 text-[11px] text-muted-foreground">Keine Events</p>
        )}
      </div>
    </div>
  );
}

function Balken({ seg, onSelect }: { seg: Segment; onSelect: (e: T2WEvent) => void }) {
  const e = seg.event;
  return (
    <button
      onClick={() => onSelect(e)}
      title={`${e.name} · ${formatZeitraum(e.start, e.ende)} · ${STATUS_LABEL[e.status]}`}
      className={cn(
        "flex h-6 w-full items-center gap-1.5 overflow-hidden border border-border bg-surface px-2 text-left text-xs font-medium text-foreground shadow-sm transition-opacity hover:opacity-80",
        seg.startsHere ? "rounded-l-md" : "rounded-l-none",
        seg.endsHere ? "rounded-r-md" : "rounded-r-none",
      )}
    >
      <span className={cn("h-4 w-1.5 shrink-0 rounded-sm", STATUS_BAR[e.status])} aria-hidden />
      <span className="truncate">{e.name}</span>
    </button>
  );
}

function Drawer({ event, onClose }: { event: T2WEvent; onClose: () => void }) {
  const naechste = naechsteAufgabe(event);
  return (
    <aside className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">{event.name}</h2>
          <p className="truncate font-mono text-xs text-muted-foreground">{event.eventcode}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Schließen" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <StatusBadge status={event.status} />

      <dl className="space-y-2 text-sm">
        <Zeile label="Zeitraum" wert={formatZeitraum(event.start, event.ende)} />
        <Zeile label="Veranstalter" wert={event.veranstalter} />
        <Zeile label="Ort" wert={event.ort} />
        <Zeile label="Verantwortlich" wert={event.verantwortlicher} />
        <Zeile label="Teilnehmer" wert={String(event.teilnehmer)} />
        <Zeile
          label="Nächste Aufgabe"
          wert={
            naechste
              ? `${naechste.titel} (${formatDatum(naechste.faellig)})`
              : "keine offene Aufgabe"
          }
        />
        <Zeile label="Outlook-Ordner" wert={event.outlookOrdner ?? "nicht verknüpft"} />
        <Zeile label="SharePoint-Ordner" wert={event.sharepointOrdner ?? "nicht verknüpft"} />
      </dl>

      <div className="flex items-center justify-between gap-2">
        <Button asChild size="sm">
          <Link to="/events/$eventcode" params={{ eventcode: event.eventcode }}>
            Detailseite öffnen
          </Link>
        </Button>
      </div>
    </aside>
  );
}

function Zeile({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{wert}</dd>
    </div>
  );
}
