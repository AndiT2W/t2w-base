import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventDialog } from "@/components/t2w/EventDialog";
import { PageHeader } from "@/components/t2w/PageHeader";
import { StatusDot, StatusLegend } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { heuteIso, tageZwischen } from "@/lib/t2w/format";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { activeEvents } from "@/lib/t2w/event-projections";
import {
  ColumnPicker,
  DataTable,
  TableToolbar,
  useTableBehavior,
} from "@/components/t2w/DataTable";
import {
  EVENT_COLUMNS,
  EVENT_SORT_COLUMNS,
  EventHeaderCells,
  EventRowCells,
  type EventColumn,
} from "@/components/t2w/EventTableColumns";
import { EventMobileList } from "@/components/t2w/EventMobileList";
import { FilterChip, FilterResetChip, ToggleChip } from "@/components/t2w/FilterChip";

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

type Schnellfilter = "alle" | "diese-woche" | "offen" | "ueberfaellig" | "ohne-ordner";
const SCHNELLFILTER: { key: Schnellfilter; label: string }[] = [
  { key: "alle", label: "Alle aktiven" },
  { key: "diese-woche", label: "Nächste 14 Tage" },
  { key: "offen", label: "Offene Aufgaben" },
  { key: "ueberfaellig", label: "Überfällige Aufgaben" },
  { key: "ohne-ordner", label: "Ordner fehlt" },
];

function inTagen(iso: string, tage: number, heute: string) {
  const grenze = new Date(`${heute}T00:00:00`);
  grenze.setDate(grenze.getDate() + tage);
  return iso <= grenze.toISOString().slice(0, 10);
}

function Uebersicht() {
  const { events, settings, selectionLists } = useT2W();
  const { t } = useI18n();
  const heute = heuteIso();
  const [filter, setFilter] = useState<Schnellfilter>("alle");
  const [status, setStatus] = useState<EventStatus | "alle">("alle");
  const [suche, setSuche] = useState("");
  const tableRef = useRef<HTMLTableElement>(null);
  const table = useTableBehavior<T2WEvent, EventColumn>({
    storageKey: "t2w-overview-table-columns",
    columns: EVENT_SORT_COLUMNS,
    initialSort: { key: "Zeitraum", direction: "asc" },
  });
  const { visibleColumns, toggleColumn, moveColumn, sort } = table;

  const aktive = useMemo(() => activeEvents(events), [events]);

  const kpi = useMemo(() => {
    const kommend = aktive.filter((e) => e.ende >= heute && inTagen(e.start, 14, heute)).length;
    const aufgaben = aktive.reduce((n, e) => n + e.taskReadiness.openCount, 0);
    const ueberfaellig = aktive.filter((e) => e.taskReadiness.overdueCount > 0).length;
    return { kommend, aufgaben, ueberfaellig };
  }, [aktive, heute]);

  const gefilterte = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return aktive
      .filter((e) => (status === "alle" ? true : e.status === status))
      .filter((e) => {
        if (filter === "diese-woche") return e.ende >= heute && inTagen(e.start, 14, heute);
        if (filter === "offen") return e.taskReadiness.openCount > 0;
        if (filter === "ueberfaellig") return e.taskReadiness.overdueCount > 0;
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
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-3">
          <Kpi icon={CalendarClock} label="Events nächste 14 Tage" wert={kpi.kommend} />
          <Kpi icon={CheckSquare} label="Offene Aufgaben" wert={kpi.aufgaben} />
        </div>

        {kpi.ueberfaellig > 0 && (
          <button
            type="button"
            onClick={() => setFilter("ueberfaellig")}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-risk-kritisch/40 bg-risk-kritisch/10 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-risk-kritisch/15"
          >
            <AlertTriangle className="size-5 shrink-0 text-risk-kritisch" aria-hidden="true" />
            <span className="flex-1">
              {kpi.ueberfaellig} {kpi.ueberfaellig === 1 ? "Event hat" : "Events haben"} überfällige
              Aufgaben.
            </span>
            <span className="font-medium text-risk-kritisch">Anzeigen</span>
          </button>
        )}

        <div
          role="group"
          aria-label="Eventfilter und Tabellenspalten"
          className="flex flex-wrap items-center gap-2 border-b border-border pb-3"
        >
          {/* Schnellfilter sind schaltbare Chips wie die Dringlichkeitsfilter
              der Aufgabenübersicht; „Alle aktiven“ ist die Grundstellung. */}
          {SCHNELLFILTER.map((f) => (
            <ToggleChip
              key={f.key}
              aktiv={filter === f.key}
              onToggle={() => setFilter(filter === f.key ? "alle" : f.key)}
            >
              {t(f.label)}
            </ToggleChip>
          ))}

          <FilterChip
            label="Status"
            ariaLabel="Status filtern"
            value={status}
            inaktiv="alle"
            onChange={(wert) => setStatus(wert as EventStatus | "alle")}
          >
            <option value="alle">{t("status.all")}</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </FilterChip>

          <FilterResetChip
            count={(filter === "alle" ? 0 : 1) + (status === "alle" ? 0 : 1)}
            onReset={() => {
              setFilter("alle");
              setStatus("alle");
            }}
          />

          {/* Auf Filterhöhe statt in einer eigenen Zeile; mobil stehen Karten. */}
          <div className="hidden md:block">
            <TableToolbar
              tableRef={tableRef}
              exportName="Übersicht"
              columnPicker={
                <ColumnPicker
                  columns={EVENT_COLUMNS}
                  visibleColumns={visibleColumns}
                  toggleColumn={toggleColumn}
                  moveColumn={moveColumn}
                />
              }
            />
          </div>
        </div>

        <EventMobileList
          events={zeilen}
          settings={settings}
          selectionLists={selectionLists}
          emptyText="Keine Events für diese Schnellfilter."
        />
        <div className="hidden md:block">
          <DataTable ref={tableRef} exportName="Übersicht" tools="extern" className="min-w-[54rem]">
            <thead className="text-left">
              <tr>
                <EventHeaderCells visibleColumns={visibleColumns} sort={sort} onSort={sortiere} />
              </tr>
            </thead>
            <tbody>
              {zeilen.map((e) => (
                <tr key={e.id}>
                  <EventRowCells
                    event={e}
                    visibleColumns={visibleColumns}
                    context={{
                      settings,
                      selectionLists,
                      statusTitle: (status) => t(`status.${status}` as Parameters<typeof t>[0]),
                    }}
                  />
                </tr>
              ))}
              {zeilen.length === 0 && (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className="px-2 py-8 text-center text-muted-foreground"
                  >
                    Keine Events für diese Schnellfilter.
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
        </div>
        <StatusLegend />

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
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          ton === "warn" && wert > 0 ? "text-risk-kritisch" : "text-foreground",
        )}
      >
        {wert}
      </p>
    </div>
  );
}
