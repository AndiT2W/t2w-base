import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarClock, CheckSquare, Mail, Pencil, Plus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventDialog } from "@/components/t2w/EventDialog";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso, tageZwischen } from "@/lib/t2w/format";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import { cn } from "@/lib/utils";
import { FolderLink } from "@/components/t2w/FolderLink";
import { useI18n } from "@/lib/i18n";
import { activeEvents } from "@/lib/t2w/event-projections";
import { resolveEventFolderNavigation } from "@/lib/t2w/folder-navigation";
import { ColumnPicker, SortHeader, useTableBehavior } from "@/components/t2w/TableFeatures";

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
const OVERVIEW_COLUMNS = [
  "Status",
  "Event",
  "Veranstalter",
  "Zeitraum",
  "Tage",
  "Aufgaben",
  "Ordner",
] as const;
type OverviewColumn = (typeof OVERVIEW_COLUMNS)[number];
const OVERVIEW_TABLE_COLUMNS = [
  { key: "Status", sortValue: (event: T2WEvent) => STATUS_LABEL[event.status] },
  { key: "Event", sortValue: (event: T2WEvent) => event.name },
  { key: "Veranstalter", sortValue: (event: T2WEvent) => event.veranstalter },
  { key: "Zeitraum", sortValue: (event: T2WEvent) => event.start },
  { key: "Tage", sortValue: (event: T2WEvent) => tageZwischen(event.start, event.ende) },
  {
    key: "Aufgaben",
    sortValue: (event: T2WEvent) => event.aufgaben.filter((task) => !task.erledigt).length,
  },
  {
    key: "Ordner",
    sortValue: (event: T2WEvent) =>
      Number(Boolean(event.outlookOrdner)) + Number(Boolean(event.sharepointOrdner)),
  },
] as const;

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
  const { events, settings } = useT2W();
  const { t } = useI18n();
  const navigate = useNavigate();
  const heute = heuteIso();
  const [filter, setFilter] = useState<Schnellfilter>("alle");
  const [status, setStatus] = useState<EventStatus | "alle">("alle");
  const [suche, setSuche] = useState("");
  const table = useTableBehavior<T2WEvent, OverviewColumn>({
    storageKey: "t2w-overview-table-columns",
    columns: OVERVIEW_TABLE_COLUMNS,
    initialSort: { key: "Zeitraum", direction: "asc" },
  });
  const { visibleColumns, toggleColumn, sort } = table;

  const aktive = useMemo(() => activeEvents(events), [events]);

  const kpi = useMemo(() => {
    const kommend = aktive.filter((e) => e.ende >= heute && inTagen(e.start, 14, heute)).length;
    const aufgaben = aktive.reduce((n, e) => n + e.aufgaben.filter((a) => !a.erledigt).length, 0);
    return { kommend, aufgaben };
  }, [aktive, heute]);

  const gefilterte = useMemo(() => {
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
      );
  }, [aktive, filter, status, suche, heute]);
  const zeilen = table.rows(gefilterte);
  const sortiere = table.sortBy;

  return (
    <div>
      <PageHeader
        krumen={[{ label: "TIME2WIN" }]}
        titel="Übersicht"
        suche={{
          value: suche,
          onChange: setSuche,
          placeholder: "Event, Veranstalter oder Ort suchen …",
        }}
        aktion={
          <EventDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                Event anlegen
              </Button>
            }
          />
        }
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
              {t(f.label)}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>Status</span>
            <select
              aria-label="Status filtern"
              value={status}
              onChange={(event) => setStatus(event.target.value as EventStatus | "alle")}
              className="rounded border border-border bg-background px-2 py-1.5 text-foreground"
            >
              <option value="alle">{t("status.all")}</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}` as Parameters<typeof t>[0])}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <ColumnPicker
            columns={OVERVIEW_COLUMNS}
            visibleColumns={visibleColumns}
            toggleColumn={toggleColumn}
          />
          <table className="w-full min-w-[54rem] border-collapse text-xs">
            <thead className="bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                {visibleColumns.includes("Status") && (
                  <th className="px-2 py-1.5">
                    <SortHeader
                      label="Status"
                      active={sort.key === "Status"}
                      direction={sort.direction}
                      onSort={() => sortiere("Status")}
                    />
                  </th>
                )}
                {visibleColumns.includes("Event") && (
                  <th className="px-2 py-1.5">
                    <SortHeader
                      label="Event"
                      active={sort.key === "Event"}
                      direction={sort.direction}
                      onSort={() => sortiere("Event")}
                    />
                  </th>
                )}
                {visibleColumns.includes("Veranstalter") && (
                  <th className="px-2 py-1.5">
                    <SortHeader
                      label="Veranstalter"
                      active={sort.key === "Veranstalter"}
                      direction={sort.direction}
                      onSort={() => sortiere("Veranstalter")}
                    />
                  </th>
                )}
                {visibleColumns.includes("Zeitraum") && (
                  <th className="px-2 py-1.5">
                    <SortHeader
                      label="Zeitraum"
                      active={sort.key === "Zeitraum"}
                      direction={sort.direction}
                      onSort={() => sortiere("Zeitraum")}
                    />
                  </th>
                )}
                {visibleColumns.includes("Tage") && (
                  <th className="px-2 py-1.5">
                    <SortHeader
                      label="Tage"
                      active={sort.key === "Tage"}
                      direction={sort.direction}
                      onSort={() => sortiere("Tage")}
                    >
                      Tage
                    </SortHeader>
                  </th>
                )}
                {visibleColumns.includes("Aufgaben") && (
                  <th className="px-2 py-1.5">
                    <SortHeader
                      label="Aufgaben"
                      active={sort.key === "Aufgaben"}
                      direction={sort.direction}
                      onSort={() => sortiere("Aufgaben")}
                    >
                      Aufg.
                    </SortHeader>
                  </th>
                )}
                {visibleColumns.includes("Ordner") && (
                  <th className="px-2 py-1.5 font-semibold">
                    <span className="sr-only">Ordner: </span>
                    <span className="inline-flex items-center gap-2" title="Outlook und SharePoint">
                      <Mail className="size-3.5" aria-label="Outlook" />
                      <Share2 className="size-3.5" aria-label="SharePoint" />
                    </span>
                  </th>
                )}
                <th className="px-2 py-1.5 text-right font-semibold">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map((e) => {
                const offen = e.aufgaben.filter((a) => !a.erledigt).length;
                const folders = resolveEventFolderNavigation(e, settings);
                return (
                  <tr
                    key={e.id}
                    className="cursor-pointer border-t border-border hover:bg-accent/50"
                    role="link"
                    tabIndex={0}
                    onClick={() =>
                      navigate({ to: "/events/$eventcode", params: { eventcode: e.eventcode } })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate({ to: "/events/$eventcode", params: { eventcode: e.eventcode } });
                      }
                    }}
                    aria-label={`${e.name} öffnen`}
                  >
                    {visibleColumns.includes("Status") && (
                      <td
                        className="px-2 py-1"
                        title={t(`status.${e.status}` as Parameters<typeof t>[0])}
                      >
                        <StatusDot status={e.status} />
                        <span className="sr-only">{STATUS_LABEL[e.status]}</span>
                      </td>
                    )}
                    {visibleColumns.includes("Event") && (
                      <td className="max-w-[16rem] truncate px-2 py-1 font-medium text-foreground">
                        {e.name}
                      </td>
                    )}
                    {visibleColumns.includes("Veranstalter") && (
                      <td className="max-w-[10rem] truncate px-2 py-1">{e.veranstalter}</td>
                    )}
                    {visibleColumns.includes("Zeitraum") && (
                      <td className="whitespace-nowrap px-2 py-1">
                        {formatZeitraum(e.start, e.ende)}
                      </td>
                    )}
                    {visibleColumns.includes("Tage") && (
                      <td className="px-2 py-1 tabular-nums">{tageZwischen(e.start, e.ende)}</td>
                    )}
                    {visibleColumns.includes("Aufgaben") && (
                      <td className="px-2 py-1 tabular-nums">
                        {offen > 0 ? (
                          <span className="rounded bg-secondary px-1.5 py-0.5 font-medium text-foreground">
                            {offen}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("Ordner") && (
                      <td className="px-2 py-1">
                        <span className="flex gap-1">
                          <FolderLink
                            icon="outlook"
                            label="Outlook"
                            href={folders.outlook.href}
                            available={folders.outlook.available}
                          />
                          <FolderLink
                            icon="sharepoint"
                            label="SharePoint"
                            href={folders.sharepoint.href}
                            available={folders.sharepoint.available}
                          />
                        </span>
                      </td>
                    )}
                    <td className="whitespace-nowrap px-2 py-1 text-right">
                      <Link
                        to="/events/$eventcode"
                        params={{ eventcode: e.eventcode }}
                        className="inline-flex rounded p-1 text-primary hover:bg-accent"
                        title={`Event bearbeiten: ${e.name}`}
                        aria-label={`Event bearbeiten: ${e.name}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        <span className="sr-only">Event bearbeiten: </span>
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
        <div
          aria-label="Statuslegende"
          className="flex flex-wrap gap-3 text-xs text-muted-foreground"
        >
          {STATUS_ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <StatusDot status={s} />
              {t(`status.${s}` as Parameters<typeof t>[0])}
            </span>
          ))}
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
