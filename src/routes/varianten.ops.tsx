import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CheckSquare, Euro, Folder, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VariantSwitcher } from "@/components/t2w/VariantSwitcher";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso, tageZwischen } from "@/lib/t2w/format";

import { STATUS_LABEL, STATUS_ORDER, type EventStatus } from "@/lib/t2w/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/varianten/ops")({
  head: () => ({
    meta: [
      { title: "Ops Command Center – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content:
          "Dichte Eventtabelle mit KPI-Leiste, Schnellfiltern und kompakten Status- und Risikoindikatoren.",
      },
      { property: "og:title", content: "Ops Command Center – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Variante 1: maximale Informationsdichte für die tägliche Sachbearbeitung.",
      },
    ],
  }),
  component: OpsVariante,
});

type Schnellfilter = "alle" | "diese-woche" | "offen" | "risiko" | "ohne-ordner";

const SCHNELLFILTER: { key: Schnellfilter; label: string }[] = [
  { key: "alle", label: "Alle aktiven" },
  { key: "diese-woche", label: "Nächste 14 Tage" },
  { key: "offen", label: "Offene Aufgaben" },
  { key: "risiko", label: "Mit Risiko" },
  { key: "ohne-ordner", label: "Ordner fehlt" },
];

const SEITEN_NAV = [
  { key: "alle" as const, label: "Alle Events", icon: CalendarClock },
  { key: "offen" as const, label: "Aufgaben", icon: CheckSquare },
  { key: "risiko" as const, label: "Risiken", icon: AlertTriangle },
  { key: "ohne-ordner" as const, label: "Ordner", icon: Folder },
];

function inTagen(iso: string, tage: number, heute: string) {
  const grenze = new Date(`${heute}T00:00:00`);
  grenze.setDate(grenze.getDate() + tage);
  return iso <= grenze.toISOString().slice(0, 10);
}

function OpsVariante() {
  const { events } = useT2W();
  const heute = heuteIso();
  const [filter, setFilter] = useState<Schnellfilter>("alle");
  const [status, setStatus] = useState<EventStatus | "alle">("alle");
  const [suche, setSuche] = useState("");

  const aktive = useMemo(() => events.filter((e) => !e.archiviert), [events]);

  const kpi = useMemo(() => {
    const kommend = aktive.filter((e) => e.ende >= heute && inTagen(e.start, 14, heute)).length;
    const aufgaben = aktive.reduce((n, e) => n + e.aufgaben.filter((a) => !a.erledigt).length, 0);
    const risiken = aktive.filter((e) => e.risiko !== "keins").length;
    const luecken = aktive.filter((e) => e.status === "angefragt" || e.status === "entwurf").length;
    return { kommend, aufgaben, risiken, luecken };
  }, [aktive, heute]);

  const zeilen = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return aktive
      .filter((e) => (status === "alle" ? true : e.status === status))
      .filter((e) => {
        if (filter === "diese-woche") return e.ende >= heute && inTagen(e.start, 14, heute);
        if (filter === "offen") return e.aufgaben.some((a) => !a.erledigt);
        if (filter === "risiko") return e.risiko !== "keins";
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
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [aktive, filter, status, suche, heute]);

  return (
    <div className="space-y-4">
      <VariantSwitcher aktiv="ops" />

      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border bg-surface p-2">
          <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Arbeitsbereiche
          </p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {SEITEN_NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setFilter(n.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  filter === n.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <n.icon className="size-4 shrink-0" />
                <span className="truncate">{n.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={CalendarClock} label="Events nächste 14 Tage" wert={kpi.kommend} />
            <Kpi icon={CheckSquare} label="Offene Aufgaben" wert={kpi.aufgaben} />
            <Kpi icon={AlertTriangle} label="Events mit Risiko" wert={kpi.risiken} ton="warn" />
            <Kpi
              icon={Euro}
              label="Finanzielle Lücken (unbestätigt)"
              wert={kpi.luecken}
              ton="warn"
            />
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
            <div className="relative ml-auto min-w-[12rem] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
                placeholder="Suchen …"
                aria-label="Events durchsuchen"
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-[54rem] border-collapse text-xs">
              <thead className="bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 font-semibold">St</th>
                  <th className="px-2 py-1.5 font-semibold">Eventcode</th>
                  <th className="px-2 py-1.5 font-semibold">Event</th>
                  <th className="px-2 py-1.5 font-semibold">Veranstalter</th>
                  <th className="px-2 py-1.5 font-semibold">Zeitraum</th>
                  <th className="px-2 py-1.5 font-semibold">Tg</th>
                  <th className="px-2 py-1.5 font-semibold">Verantw.</th>
                  <th className="px-2 py-1.5 font-semibold">Aufg.</th>
                  <th className="px-2 py-1.5 font-semibold">Ordner</th>
                  <th className="px-2 py-1.5 font-semibold">Ri</th>
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
                      <td className="whitespace-nowrap px-2 py-1 font-mono text-[11px] text-muted-foreground">
                        {e.eventcode}
                      </td>
                      <td className="max-w-[16rem] truncate px-2 py-1 font-medium text-foreground">
                        {e.name}
                      </td>
                      <td className="max-w-[10rem] truncate px-2 py-1">{e.veranstalter}</td>
                      <td className="whitespace-nowrap px-2 py-1">
                        {formatZeitraum(e.start, e.ende)}
                      </td>
                      <td className="px-2 py-1 tabular-nums">{tageZwischen(e.start, e.ende)}</td>
                      <td className="max-w-[9rem] truncate px-2 py-1">{e.verantwortlicher}</td>
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
                      <td className="px-2 py-1">
                        {e.risiko === "keins" ? (
                          <span className="text-muted-foreground">–</span>
                        ) : (
                          <span
                            title={e.risiko === "kritisch" ? "Kritisch" : "Beobachten"}
                            className={cn(
                              "inline-block size-2 rounded-sm",
                              e.risiko === "kritisch" ? "bg-risk-kritisch" : "bg-risk-beobachten",
                            )}
                          />
                        )}
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
                    <td colSpan={11} className="px-2 py-8 text-center text-muted-foreground">
                      Keine Events für diese Schnellfilter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            {zeilen.length} Zeilen · Aufg. = offene Aufgaben, OL/SP = Outlook- bzw.
            SharePoint-Ordner, Ri = Risiko
          </p>
        </div>
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
