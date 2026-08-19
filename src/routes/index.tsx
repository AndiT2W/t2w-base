import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarClock, CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventDialog } from "@/components/t2w/EventDialog";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso, tageZwischen } from "@/lib/t2w/format";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus } from "@/lib/t2w/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Übersicht – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content: "Eventübersicht der TIME2WIN Eventverwaltung.",
      },
      { property: "og:title", content: "Übersicht – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Operative Tagesübersicht aller TIME2WIN Events mit Schnellfiltern.",
      },
    ],
  }),
  component: Uebersicht,
});

type Schnellfilter = "alle" | "diese-woche" | "offen" | "ohne-ordner";

const SCHNELLFILTER: { key: Schnellfilter; label: string }[] = [
  { key: "alle", label: "Alle aktiven" },
  { key: "diese-woche", label: "Nächste 14 Tage" },
  { key: "offen", label: "Offene Aufgaben" },
  { key: "ohne-ordner", label: "Ordner fehlt" },
];

function inTagen(iso: string, tage: number, heute: string) {
  const grenze = new Date(`${heute}T00:00:00`);
  grenze.setDate(grenze.getDate() + tage);
  return iso <= grenze.toISOString().slice(0, 10);
}

function Uebersicht() {
  const { events } = useT2W();
  const heute = heuteIso();
  const [filter, setFilter] = useState<Schnellfilter>("alle");
  const [status, setStatus] = useState<EventStatus | "alle">("alle");
  const [suche, setSuche] = useState("");
  const [sortierung, setSortierung] = useState<{ feld: "name" | "veranstalter" | "start" | "ende" | "aufgaben" | "status"; richtung: "auf" | "ab" }>({ feld: "start", richtung: "auf" });

  const aktive = useMemo(() => events.filter((e) => !e.archiviert), [events]);

  const kpi = useMemo(() => {
    const kommend = aktive.filter((e) => e.ende >= heute && inTagen(e.start, 14, heute)).length;
    const aufgaben = aktive.reduce((n, e) => n + e.aufgaben.filter((a) => !a.erledigt).length, 0);
    return { kommend, aufgaben };
  }, [aktive, heute]);

  const zeilen = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return aktive
      .filter((e) => (status === "alle" ? true : e.status === status))
      .filter((e) => {
        if (filter === "diese-woche") return e.ende >= heute && inTagen(e.start, 14, heute);
        if (filter === "offen") return e.aufgaben.some((a) => !a.erledigt);
        if (filter === "ohne-ordner") return !e.outlookOrdner || !e.sharepointOrdner;
        return true;
      })
      .filter((e) =>
        q
          ? [e.eventcode, e.name, e.veranstalter, e.verantwortlicher, e.ort]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => {
        const av = sortierung.feld === "aufgaben" ? a.aufgaben.filter((x) => !x.erledigt).length : sortierung.feld === "status" ? STATUS_LABEL[a.status] : a[sortierung.feld];
        const bv = sortierung.feld === "aufgaben" ? b.aufgaben.filter((x) => !x.erledigt).length : sortierung.feld === "status" ? STATUS_LABEL[b.status] : b[sortierung.feld];
        const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortierung.richtung === "auf" ? result : -result;
      });
  }, [aktive, filter, status, suche, heute, sortierung]);

  function sortiere(feld: typeof sortierung.feld) {
    setSortierung((aktuell) => aktuell.feld === feld ? { feld, richtung: aktuell.richtung === "auf" ? "ab" : "auf" } : { feld, richtung: "auf" });
  }

  function SortHeader({ feld, children }: { feld: typeof sortierung.feld; children: ReactNode }) {
    const aktiv = sortierung.feld === feld;
    return <button type="button" onClick={() => sortiere(feld)} className="inline-flex items-center gap-1 font-semibold hover:text-foreground"><span>{children}</span>{aktiv ? (sortierung.richtung === "auf" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-50" />}</button>;
  }

  return (
    <div>
      <PageHeader
        titel="Übersicht"
        suche={{
          value: suche,
          onChange: setSuche,
          placeholder: "Event, Veranstalter oder Ort suchen …",
        }}
        aktion={<EventDialog trigger={<Button><Plus className="size-4" />Event anlegen</Button>} />}
      />
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Kpi icon={CalendarClock} label="Events nächste 14 Tage" wert={kpi.kommend} />
          <Kpi icon={CheckSquare} label="Offene Aufgaben" wert={kpi.aufgaben} />
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2">
          {SCHNELLFILTER.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          {(["alle", ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                status === s
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s !== "alle" && <StatusDot status={s} />}
              {s === "alle" ? "Alle Status" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[54rem] border-collapse text-xs">
            <thead className="bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-2 py-1.5 font-semibold">St</th>
                <th className="px-2 py-1.5"><SortHeader feld="name">Event</SortHeader></th>
                <th className="px-2 py-1.5"><SortHeader feld="veranstalter">Veranstalter</SortHeader></th>
                <th className="px-2 py-1.5"><SortHeader feld="start">Zeitraum</SortHeader></th>
                <th className="px-2 py-1.5 font-semibold">Tg</th>
                <th className="px-2 py-1.5"><SortHeader feld="aufgaben">Aufg.</SortHeader></th>
                <th className="px-2 py-1.5 font-semibold">Ordner</th>
                <th className="px-2 py-1.5 text-right font-semibold">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map((e) => {
                const offen = e.aufgaben.filter((a) => !a.erledigt).length;
                return (
                  <tr key={e.id} className="border-t border-border hover:bg-accent/50">
                    <td className="px-2 py-1" title={STATUS_LABEL[e.status]}>
                      <StatusDot status={e.status} />
                    </td>
                    <td className="max-w-[16rem] truncate px-2 py-1 font-medium text-foreground">
                      {e.name}
                    </td>
                    <td className="max-w-[10rem] truncate px-2 py-1">{e.veranstalter}</td>
                    <td className="whitespace-nowrap px-2 py-1">
                      {formatZeitraum(e.start, e.ende)}
                    </td>
                    <td className="px-2 py-1 tabular-nums">{tageZwischen(e.start, e.ende)}</td>
                    <td className="px-2 py-1 tabular-nums">
                      {offen > 0 ? (
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-medium text-foreground">
                          {offen}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <span className="flex gap-1">
                        <Marke aktiv={Boolean(e.outlookOrdner)} text="OL" />
                        <Marke aktiv={Boolean(e.sharepointOrdner)} text="SP" />
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1 text-right">
                      <Link
                        to="/events/$eventcode"
                        params={{ eventcode: e.eventcode }}
                        className="font-medium text-primary hover:underline"
                      >
                        Öffnen
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {zeilen.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-2 py-8 text-center text-muted-foreground">
                    Keine Events für diese Schnellfilter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          {zeilen.length} Zeilen · Aufg. = offene Aufgaben, OL/SP = Outlook- bzw. SharePoint-Ordner
        </p>
      </div>
    </div>
  );
}

function Marke({ aktiv, text }: { aktiv: boolean; text: string }) {
  return (
    <span
      className={cn(
        "rounded px-1 py-0.5 text-[10px] font-semibold",
        aktiv ? "bg-status-zugesagt/20 text-foreground" : "bg-secondary text-muted-foreground",
      )}
      title={`${text === "OL" ? "Outlook" : "SharePoint"}: ${aktiv ? "verknüpft" : "nicht verknüpft"}`}
    >
      {text}
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  wert,
  ton,
}: {
  icon: typeof CalendarClock;
  label: string;
  wert: number;
  ton?: "warn";
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums",
            ton === "warn" && wert > 0 ? "text-risk-kritisch" : "text-foreground",
          )}
        >
          {wert}
        </p>
      </div>
      <Icon className="size-5 shrink-0 text-muted-foreground" />
    </div>
  );
}
