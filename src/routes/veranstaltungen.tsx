import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, GanttChartSquare, List, Mail, Pencil, Plus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventDialog } from "@/components/t2w/EventDialog";
import { GanttSeite } from "@/routes/gantt";
import { KalenderSeite } from "@/routes/kalender";
import { PageHeader } from "@/components/t2w/PageHeader";
import { ColumnPicker, SortHeader, useTableBehavior } from "@/components/t2w/TableFeatures";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { FolderLink } from "@/components/t2w/FolderLink";
import { useT2W } from "@/lib/t2w/store";
import { formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import { selectEvents, type ArchiveSelection, type EventPeriod } from "@/lib/t2w/event-projections";
import { resolveEventFolderNavigation } from "@/lib/t2w/folder-navigation";
import { EventMobileList } from "@/components/t2w/EventMobileList";

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
const EVENT_COLUMNS = [
  "Status",
  "Event",
  "Veranstalter",
  "Zeitraum",
  "Tage",
  "Aufgaben",
  "Ordner",
] as const;
type EventColumn = (typeof EVENT_COLUMNS)[number];
const EVENT_TABLE_COLUMNS = [
  { key: "Status", sortValue: (event: T2WEvent) => STATUS_LABEL[event.status] },
  { key: "Event", sortValue: (event: T2WEvent) => event.name },
  { key: "Veranstalter", sortValue: (event: T2WEvent) => event.veranstalter },
  { key: "Zeitraum", sortValue: (event: T2WEvent) => event.start },
  {
    key: "Tage",
    sortValue: (event: T2WEvent) =>
      Math.max(
        1,
        Math.round((new Date(event.ende).getTime() - new Date(event.start).getTime()) / 86400000) +
          1,
      ),
  },
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

function Veranstaltungen() {
  const { q, ansicht } = Route.useSearch();
  const { events, settings } = useT2W();
  const [suche, setSuche] = useState(q);
  const [status, setStatus] = useState<EventStatus | "alle">("alle");
  const [zeitraum, setZeitraum] = useState<Zeitraum>("alle");
  const [archiv, setArchiv] = useState<ArchivFilter>("aktiv");
  const table = useTableBehavior<T2WEvent, EventColumn>({
    storageKey: "t2w-event-table-columns",
    columns: EVENT_TABLE_COLUMNS,
    initialSort: { key: "Zeitraum", direction: "asc" },
  });
  const { visibleColumns, toggleColumn, sort } = table;
  const heute = heuteIso();

  const gefiltert = useMemo(() => {
    return selectEvents(events, {
      query: suche,
      status,
      period: zeitraum,
      archive: archiv,
      today: heute,
    });
  }, [events, suche, status, zeitraum, archiv, heute]);
  const sortiere = table.sortBy;
  const zeilen = table.rows(gefiltert);

  if (ansicht === "kalender") return <KalenderSeite veranstaltungsmenue />;
  if (ansicht === "gantt") return <GanttSeite veranstaltungsmenue />;

  return (
    <div>
      <PageHeader
        krumen={[{ label: "TIME2WIN", to: "/" }]}
        titel="Veranstaltungen"
        beschreibung={`${gefiltert.length} von ${events.length} Events`}
        suche={{
          value: suche,
          onChange: setSuche,
          placeholder: "Eventcode, Name, Veranstalter, Ort …",
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
        <nav aria-label="Veranstaltungsansichten" className="flex gap-1 border-b border-border">
          <AnsichtsReiter to="/veranstaltungen" aktiv label="Liste" icon={List} />
          <AnsichtsReiter
            to="/veranstaltungen"
            search={{ ansicht: "kalender" }}
            label="Kalender"
            icon={CalendarDays}
          />
          <AnsichtsReiter
            to="/veranstaltungen"
            search={{ ansicht: "gantt" }}
            label="Gantt"
            icon={GanttChartSquare}
          />
        </nav>
        <div
          role="group"
          aria-label="Eventfilter und Tabellenspalten"
          className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface p-3"
        >
          <Select value={status} onValueChange={(v) => setStatus(v as EventStatus | "alle")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Status</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={zeitraum} onValueChange={(v) => setZeitraum(v as Zeitraum)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Zeitraum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Zeiträume</SelectItem>
              <SelectItem value="kommend">Kommend</SelectItem>
              <SelectItem value="laufend">Laufend</SelectItem>
              <SelectItem value="vergangen">Vergangen</SelectItem>
              <SelectItem value="monat">Aktueller Monat</SelectItem>
            </SelectContent>
          </Select>

          <Select value={archiv} onValueChange={(v) => setArchiv(v as ArchivFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Archiv" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aktiv">Nur aktive</SelectItem>
              <SelectItem value="archiv">Nur archivierte</SelectItem>
              <SelectItem value="alle">Aktive & Archiv</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto">
            <ColumnPicker
              columns={EVENT_COLUMNS}
              visibleColumns={visibleColumns}
              toggleColumn={toggleColumn}
            />
          </div>
        </div>

        <EventMobileList
          events={zeilen}
          settings={settings}
          emptyText="Keine Events für die aktuelle Filterauswahl."
        />
        <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
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
                    />
                  </th>
                )}
                {visibleColumns.includes("Aufgaben") && (
                  <th className="px-2 py-1.5">
                    <SortHeader
                      label="Aufgaben"
                      active={sort.key === "Aufgaben"}
                      direction={sort.direction}
                      onSort={() => sortiere("Aufgaben")}
                    />
                  </th>
                )}
                {visibleColumns.includes("Ordner") && (
                  <th className="px-2 py-1.5">
                    <SortHeader
                      label="Ordner"
                      active={sort.key === "Ordner"}
                      direction={sort.direction}
                      onSort={() => sortiere("Ordner")}
                    >
                      <span className="inline-flex gap-2" title="Outlook und SharePoint">
                        <Mail className="size-3.5" aria-label="Outlook" />
                        <Share2 className="size-3.5" aria-label="SharePoint" />
                      </span>
                    </SortHeader>
                  </th>
                )}
                <th className="px-2 py-1.5 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map((e) => {
                const folders = resolveEventFolderNavigation(e, settings);
                return (
                  <tr key={e.id} className="border-t border-border hover:bg-accent/50">
                    {visibleColumns.includes("Status") && (
                      <td className="px-2 py-1" title={STATUS_LABEL[e.status]}>
                        <StatusDot status={e.status} />
                      </td>
                    )}
                    {visibleColumns.includes("Event") && (
                      <td className="max-w-[16rem] truncate px-2 py-1 font-medium">
                        <Link
                          to="/events/$eventcode"
                          params={{ eventcode: e.eventcode }}
                          className="hover:text-primary hover:underline"
                        >
                          {e.name}
                        </Link>
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
                      <td className="px-2 py-1 tabular-nums">
                        {Math.max(
                          1,
                          Math.round(
                            (new Date(e.ende).getTime() - new Date(e.start).getTime()) / 86400000,
                          ) + 1,
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("Aufgaben") && (
                      <td className="px-2 py-1 tabular-nums">
                        {e.aufgaben.filter((a) => !a.erledigt).length || "–"}
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
                          >
                            OL
                          </FolderLink>
                          <FolderLink
                            icon="sharepoint"
                            label="SharePoint"
                            href={folders.sharepoint.href}
                            available={folders.sharepoint.available}
                          >
                            SP
                          </FolderLink>
                        </span>
                      </td>
                    )}
                    <td className="px-2 py-1 text-right">
                      <Link
                        to="/events/$eventcode"
                        params={{ eventcode: e.eventcode }}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-primary hover:bg-accent sm:min-h-0 sm:min-w-0"
                        title="Event bearbeiten"
                        aria-label={`Event bearbeiten: ${e.name}`}
                      >
                        <Pencil className="size-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {gefiltert.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-2 py-8 text-center text-muted-foreground">
                    Keine Events für die aktuelle Filterauswahl.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnsichtsReiter({
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
