import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  Link2Off,
  Plus,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { MetricRow, MetricTile } from "@/components/t2w/MetricTile";
import { FilterBar, FilterTrenner } from "@/components/t2w/FilterBar";
import { Input } from "@/components/ui/input";

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
/*
 * `nurBreit` steht an dem, was das Artboard auf dem Telefon weglaesst: dort
 * traegt die Uebersicht drei Chips und zwei Kacheln, damit die erste Zeile
 * der Liste ohne Scrollen zu sehen ist.  Ab `md` steht wieder alles da.
 */
const SCHNELLFILTER: { key: Schnellfilter; label: string; nurBreit?: boolean }[] = [
  { key: "alle", label: "Alle aktiven" },
  { key: "diese-woche", label: "Nächste 14 Tage" },
  { key: "ueberfaellig", label: "Überfällige Aufgaben" },
  { key: "offen", label: "Offene Aufgaben", nurBreit: true },
  { key: "ohne-ordner", label: "Ordner fehlt", nurBreit: true },
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
    const kommend = aktive.filter((e) => e.ende >= heute && inTagen(e.start, 14, heute));
    const aufgaben = aktive.reduce((n, e) => n + e.taskReadiness.openCount, 0);
    // Nach Dringlichkeit: das Event mit den meisten überfälligen Aufgaben zuerst.
    const ueberfaellig = aktive
      .filter((e) => e.taskReadiness.overdueCount > 0)
      .sort((a, b) => b.taskReadiness.overdueCount - a.taskReadiness.overdueCount);
    const ohneOrdner = aktive.filter((e) => !e.outlookOrdner || !e.sharepointOrdner).length;
    const laufend = kommend.filter((e) => e.start <= heute).length;
    return { kommend, aufgaben, ueberfaellig, ohneOrdner, laufend };
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
        beschreibung="Was in den nächsten 14 Tagen ansteht und was gerade blockiert"
        aktion={
          <>
            {/* Das Artboard stellt den Weg in den Kalender neben das Anlegen:
                "was steht an" fuehrt oft direkt zur Terminansicht. */}
            <Link
              to="/veranstaltungen"
              search={{ q: "", ansicht: "kalender" }}
              className={buttonVariants({ variant: "outline" })}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Kalender
            </Link>
            <EventDialog
              trigger={
                <Button>
                  <Plus className="size-4" />
                  Event anlegen
                </Button>
              }
            />
          </>
        }
      />
      <div className="space-y-3">
        {/* Jede Kachel ist zugleich ein Filter: anklicken setzt die Liste
            darunter.  Der rote Balken, der früher unter den Kennzahlen stand,
            hängt jetzt als Hinweisfeld an der Kachel, die ihn auslöst. */}
        <MetricRow>
          <MetricTile
            className="hidden md:block"
            icon={CalendarClock}
            label={t("Events nächste 14 Tage")}
            wert={kpi.kommend.length}
            {...(kpi.laufend > 0 ? { hinweis: `davon ${kpi.laufend} laufend` } : {})}
            aktiv={filter === "diese-woche"}
            onClick={() => setFilter(filter === "diese-woche" ? "alle" : "diese-woche")}
          />
          <MetricTile
            icon={CheckSquare}
            label={t("Offene Aufgaben")}
            wert={kpi.aufgaben}
            aktiv={filter === "offen"}
            onClick={() => setFilter(filter === "offen" ? "alle" : "offen")}
          />
          <MetricTile
            icon={AlertTriangle}
            label={t("Überfällige Aufgaben")}
            wert={kpi.ueberfaellig.reduce((n, e) => n + e.taskReadiness.overdueCount, 0)}
            ton="krit"
            {...(kpi.ueberfaellig.length > 0
              ? {
                  hinweis: `in ${kpi.ueberfaellig.length} ${kpi.ueberfaellig.length === 1 ? "Event" : "Events"}`,
                }
              : {})}
            aktiv={filter === "ueberfaellig"}
            onClick={() => setFilter(filter === "ueberfaellig" ? "alle" : "ueberfaellig")}
            {...(kpi.ueberfaellig.length > 0
              ? {
                  detail: (
                    <>
                      <p className="text-xs font-bold text-foreground">Überfällige Aufgaben</p>
                      {kpi.ueberfaellig.slice(0, 4).map((e) => (
                        <Link
                          key={e.id}
                          to="/events/$eventcode"
                          params={{ eventcode: e.eventcode }}
                          className="mt-1.5 flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 no-underline"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-semibold text-foreground">
                              {e.name}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {e.eventcode}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-full bg-task-overdue-soft px-2 py-0.5 text-xs font-semibold text-task-overdue-strong">
                            {e.taskReadiness.overdueCount} überfällig
                          </span>
                        </Link>
                      ))}
                    </>
                  ),
                }
              : {})}
          />
          <MetricTile
            className="hidden md:block"
            icon={Link2Off}
            label={t("Ordner fehlt")}
            wert={kpi.ohneOrdner}
            ton="warn"
            hinweis="Outlook oder SharePoint"
            aktiv={filter === "ohne-ordner"}
            onClick={() => setFilter(filter === "ohne-ordner" ? "alle" : "ohne-ordner")}
          />
        </MetricRow>

        <FilterBar
          werkzeuge={
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
          }
        >
          {/* Kein eigenes Suchfeld: die Uebersicht zeigt die naechsten 14 Tage
              und filtert ueber die Chips.  Gesucht wird oben in der Kopfzeile
              ueber alle Module -- so zeichnet es das Artboard. */}
          {SCHNELLFILTER.map((f) => (
            <ToggleChip
              key={f.key}
              aktiv={filter === f.key}
              onToggle={() => setFilter(filter === f.key ? "alle" : f.key)}
              {...(f.nurBreit ? { className: "hidden md:inline-flex" } : {})}
            >
              {t(f.label)}
            </ToggleChip>
          ))}

          <FilterTrenner className="hidden md:block" />

          <FilterChip
            className="hidden md:inline-flex"
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
            count={(filter === "alle" ? 0 : 1) + (status === "alle" ? 0 : 1) + (suche ? 1 : 0)}
            onReset={() => {
              setFilter("alle");
              setStatus("alle");
              setSuche("");
            }}
          />
        </FilterBar>

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
