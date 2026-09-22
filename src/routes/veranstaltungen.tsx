import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventDialog } from "@/components/t2w/EventDialog";
import { GanttSeite } from "@/routes/gantt";
import { KalenderSeite } from "@/routes/kalender";
import { PageHeader } from "@/components/t2w/PageHeader";
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
import { FilterChip, FilterResetChip } from "@/components/t2w/FilterChip";
import { FilterBar, FilterTrenner } from "@/components/t2w/FilterBar";
import { EventViewTabs } from "@/components/t2w/EventViewTabs";
import { Input } from "@/components/ui/input";
import { StatusLegend } from "@/components/t2w/StatusBadge";
import { useT2W } from "@/lib/t2w/store";
import { heuteIso } from "@/lib/t2w/format";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import {
  selectEventCatalogue,
  type ArchiveSelection,
  type EventPeriod,
} from "@/lib/t2w/event-catalogue";
import { EventMobileList } from "@/components/t2w/EventMobileList";
import {
  EventDateCollisionLegend,
  eventDateCollisionSurfaceClass,
} from "@/components/t2w/EventDateCollision";
import { createEventDateCollisionMap } from "@/lib/t2w/event-date-collisions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/veranstaltungen")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
    ansicht:
      search["ansicht"] === "kalender" || search["ansicht"] === "gantt"
        ? search["ansicht"]
        : "liste",
  }),
  head: () => ({
    meta: [
      { title: "Veranstaltungen – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content:
          "Alle TIME2WIN Veranstaltungen mit Suche, Status-, Zeitraum- und Archivfiltern sowie konfigurierbaren Team-Spalten.",
      },
      { property: "og:title", content: "Veranstaltungen – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Status, Zeitraum, Verantwortliche und Risiken aller Events auf einen Blick.",
      },
    ],
  }),
  component: Veranstaltungen,
});

type Zeitraum = EventPeriod;
type ArchivFilter = ArchiveSelection;
/** Ungefilterter Zustand — Bezugspunkt für „n Filter zurücksetzen“. */
const FILTER_GRUNDSTELLUNG = {
  status: "alle",
  zeitraum: "jahr",
  archiv: "aktiv",
  sportart: "alle",
  veranstalter: "alle",
  service: "alle",
} as const;
function Veranstaltungen() {
  const { q, ansicht } = Route.useSearch();
  const { events, settings, selectionLists } = useT2W();
  const [suche, setSuche] = useState(q);
  const [status, setStatus] = useState<EventStatus | "alle">(FILTER_GRUNDSTELLUNG.status);
  const [zeitraum, setZeitraum] = useState<Zeitraum>(FILTER_GRUNDSTELLUNG.zeitraum);
  const [archiv, setArchiv] = useState<ArchivFilter>(FILTER_GRUNDSTELLUNG.archiv);
  const [sportart, setSportart] = useState<string>(FILTER_GRUNDSTELLUNG.sportart);
  const [veranstalterFilter, setVeranstalterFilter] = useState<string>(
    FILTER_GRUNDSTELLUNG.veranstalter,
  );
  const [service, setService] = useState<string>(FILTER_GRUNDSTELLUNG.service);
  const tableRef = useRef<HTMLTableElement>(null);
  const table = useTableBehavior<T2WEvent, EventColumn>({
    storageKey: "t2w-event-table-columns",
    columns: EVENT_SORT_COLUMNS,
    initialSort: { key: "Zeitraum", direction: "asc" },
  });
  const { visibleColumns, toggleColumn, moveColumn, sort } = table;
  const heute = heuteIso();

  const gefiltert = useMemo(() => {
    return selectEventCatalogue(events, {
      query: suche,
      status,
      period: zeitraum,
      archive: archiv,
      today: heute,
    })
      .filter((e) => sportart === FILTER_GRUNDSTELLUNG.sportart || e.sportart === sportart)
      .filter(
        (e) =>
          veranstalterFilter === FILTER_GRUNDSTELLUNG.veranstalter ||
          e.veranstalter === veranstalterFilter,
      )
      .filter(
        (e) => service === FILTER_GRUNDSTELLUNG.service || (e.services ?? []).includes(service),
      );
  }, [events, suche, status, zeitraum, archiv, heute, sportart, veranstalterFilter, service]);

  // Nur Werte, die im Bestand vorkommen: eine Auswahl, die ins Leere führt,
  // ist keine Hilfe. Gleiches Muster wie in kalender.tsx.
  const sportarten = useMemo(
    () =>
      [...new Set(events.map((e) => e.sportart).filter((x): x is string => !!x))].sort((a, b) =>
        a.localeCompare(b, "de"),
      ),
    [events],
  );
  const veranstalterListe = useMemo(
    () =>
      [...new Set(events.map((e) => e.veranstalter).filter((x): x is string => !!x))].sort((a, b) =>
        a.localeCompare(b, "de"),
      ),
    [events],
  );
  const serviceListe = useMemo(
    () =>
      [...new Set(events.flatMap((e) => e.services ?? []))].sort((a, b) =>
        a.localeCompare(b, "de"),
      ),
    [events],
  );
  const sortiere = table.sortBy;
  const zeilen = table.rows(gefiltert);
  const dateCollisions = useMemo(
    () =>
      createEventDateCollisionMap(
        gefiltert.map((event) => ({ ...event, services: event.services ?? [] })),
      ),
    [gefiltert],
  );
  const aktiveFilter =
    (suche.trim() ? 1 : 0) +
    (status === FILTER_GRUNDSTELLUNG.status ? 0 : 1) +
    (zeitraum === FILTER_GRUNDSTELLUNG.zeitraum ? 0 : 1) +
    (archiv === FILTER_GRUNDSTELLUNG.archiv ? 0 : 1) +
    (sportart === FILTER_GRUNDSTELLUNG.sportart ? 0 : 1) +
    (veranstalterFilter === FILTER_GRUNDSTELLUNG.veranstalter ? 0 : 1) +
    (service === FILTER_GRUNDSTELLUNG.service ? 0 : 1);
  const filterZuruecksetzen = () => {
    setSuche("");
    setStatus(FILTER_GRUNDSTELLUNG.status);
    setZeitraum(FILTER_GRUNDSTELLUNG.zeitraum);
    setArchiv(FILTER_GRUNDSTELLUNG.archiv);
    setSportart(FILTER_GRUNDSTELLUNG.sportart);
    setVeranstalterFilter(FILTER_GRUNDSTELLUNG.veranstalter);
    setService(FILTER_GRUNDSTELLUNG.service);
  };
  if (ansicht === "kalender") return <KalenderSeite />;
  if (ansicht === "gantt") return <GanttSeite veranstaltungsmenue />;

  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Veranstaltungen"
        beschreibung={
          <>
            <span className="font-semibold tabular-nums text-foreground">{gefiltert.length}</span>
            {` von ${events.length} Events`}
          </>
        }
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
        <EventViewTabs aktiv="liste" />
        <FilterBar
          werkzeuge={
            <div className="hidden md:block">
              <TableToolbar
                tableRef={tableRef}
                exportName="Veranstaltungen"
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
          {/* Kein eigenes Suchfeld mehr: das Artboard fuehrt die Suche nur
              einmal, oben in der Kopfzeile ueber alle Module.  Kommt man von
              dort mit einer Frage her, steht sie als abwaehlbarer Chip in der
              Leiste -- sonst waere nicht zu sehen, warum die Liste kurz ist,
              und die Frage waere nicht mehr loszuwerden. */}
          {suche.trim() && (
            <>
              <button
                type="button"
                onClick={() => setSuche("")}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 text-sm font-medium sm:min-h-8"
              >
                <Search className="size-3.5" aria-hidden="true" />
                <span className="max-w-48 truncate">Suche: {suche}</span>
                <span aria-hidden="true">×</span>
                <span className="sr-only">Suche zurücksetzen</span>
              </button>

              <FilterTrenner />
            </>
          )}

          <FilterChip
            label="Status"
            value={status}
            inaktiv={FILTER_GRUNDSTELLUNG.status}
            onChange={(wert) => setStatus(wert as EventStatus | "alle")}
          >
            <option value="alle">Alle Status</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </FilterChip>

          <FilterChip
            label="Sportart"
            value={sportart}
            inaktiv={FILTER_GRUNDSTELLUNG.sportart}
            onChange={setSportart}
          >
            <option value="alle">Alle Sportarten</option>
            {sportarten.map((art) => (
              <option key={art} value={art}>
                {art}
              </option>
            ))}
          </FilterChip>

          <FilterChip
            label="Veranstalter"
            value={veranstalterFilter}
            inaktiv={FILTER_GRUNDSTELLUNG.veranstalter}
            onChange={setVeranstalterFilter}
          >
            <option value="alle">Alle Veranstalter</option>
            {veranstalterListe.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </FilterChip>

          <FilterChip
            label="Service"
            value={service}
            inaktiv={FILTER_GRUNDSTELLUNG.service}
            onChange={setService}
          >
            <option value="alle">Alle Services</option>
            {serviceListe.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </FilterChip>

          <FilterChip
            label="Zeitraum"
            value={zeitraum}
            inaktiv={FILTER_GRUNDSTELLUNG.zeitraum}
            onChange={(wert) => setZeitraum(wert as Zeitraum)}
          >
            <option value="jahr">Aktuelles Jahr</option>
            <option value="naechstes-jahr">Nächstes Jahr</option>
            <option value="alle">Alle Zeiträume</option>
            <option value="kommend">Kommend</option>
            <option value="laufend">Laufend</option>
            <option value="vergangen">Vergangen</option>
            <option value="monat">Aktueller Monat</option>
          </FilterChip>

          <FilterChip
            label="Archiv"
            value={archiv}
            inaktiv={FILTER_GRUNDSTELLUNG.archiv}
            onChange={(wert) => setArchiv(wert as ArchivFilter)}
          >
            <option value="aktiv">Nur aktive</option>
            <option value="archiv">Nur archivierte</option>
            <option value="alle">Aktive &amp; Archiv</option>
          </FilterChip>

          <FilterResetChip count={aktiveFilter} onReset={filterZuruecksetzen} />
        </FilterBar>

        {dateCollisions.size > 0 && <EventDateCollisionLegend />}
        <EventMobileList
          events={zeilen}
          settings={settings}
          selectionLists={selectionLists}
          emptyText="Keine Events für die aktuelle Filterauswahl."
          dateCollisions={dateCollisions}
        />
        <div className="hidden md:block">
          <DataTable
            ref={tableRef}
            exportName="Veranstaltungen"
            tools="extern"
            className="min-w-[54rem]"
          >
            <thead className="text-left">
              <tr>
                <EventHeaderCells visibleColumns={visibleColumns} sort={sort} onSort={sortiere} />
              </tr>
            </thead>
            <tbody>
              {zeilen.map((e) => {
                const dateCollision = dateCollisions.get(e.id);
                return (
                  <tr
                    key={e.id}
                    className={cn(eventDateCollisionSurfaceClass(dateCollision, "table"))}
                    data-date-collision-group={
                      dateCollision ? String(dateCollision.groupIndex + 1) : undefined
                    }
                  >
                    <EventRowCells
                      event={e}
                      visibleColumns={visibleColumns}
                      context={{ settings, selectionLists, dateCollision }}
                    />
                  </tr>
                );
              })}
              {gefiltert.length === 0 && (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className="!h-auto !max-w-none !overflow-visible !whitespace-normal py-8"
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <p className="text-sm font-medium text-foreground">
                        Keine Events für die aktuelle Filterauswahl.
                      </p>
                      {aktiveFilter > 0 && (
                        <Button size="sm" variant="outline" onClick={filterZuruecksetzen}>
                          {aktiveFilter} Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
          <div className="mt-2">
            <StatusLegend />
          </div>
        </div>
      </div>
    </div>
  );
}
