import { Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, Share2 } from "lucide-react";
import { SortHeader } from "@/components/t2w/DataTable";
import { EventDateCollisionIndicator } from "@/components/t2w/EventDateCollision";
import { FolderLink } from "@/components/t2w/FolderLink";
import { OrganizerLink } from "@/components/t2w/OrganizerLink";
import { SelectionBadge, ServiceBadge } from "@/components/t2w/ServiceBadge";
import { StatusDot } from "@/components/t2w/StatusBadge";
import type { EventDateCollision } from "@/lib/t2w/event-date-collisions";
import { formatZeitraum, tageZwischen } from "@/lib/t2w/format";
import { resolveEventFolderNavigation } from "@/lib/t2w/folder-navigation";
import type { SelectionListSnapshot } from "@/lib/t2w/selection-list-workspace";
import { STATUS_LABEL, type EventStatus, type Settings, type T2WEvent } from "@/lib/t2w/types";

/**
 * Die Eventtabelle von Übersicht und Veranstaltungen.  Beide Seiten zeigen
 * dieselben Spalten mit denselben Zellen; hier stehen sie einmal, damit sie
 * nicht auseinanderlaufen. `EventTablePresentation` hält die gemeinsame
 * Darstellung zusammen; die Seiten wählen Events und ihre Präferenzkennung.
 *
 * Kopf und Zellen werden in der Reihenfolge von `visibleColumns` ausgegeben —
 * die im Spaltenmenü gewählte Reihenfolge ist damit auch die Anzeigereihenfolge.
 */
export const EVENT_COLUMNS = [
  "Status",
  "TIME2WIN",
  "Event",
  "Veranstalter",
  "Sportart",
  "Services",
  "Zeitraum",
  "Tage",
  "Aufgaben",
  "Ordner",
] as const;
export type EventColumn = (typeof EVENT_COLUMNS)[number];

/** Sortierwerte je Spalte — der Vertrag von `useTableBehavior`. */
export const EVENT_SORT_COLUMNS = [
  { key: "Status", sortValue: (event: T2WEvent) => STATUS_LABEL[event.status] },
  { key: "TIME2WIN", sortValue: (event: T2WEvent) => event.t2wEventId ?? 0 },
  { key: "Event", sortValue: (event: T2WEvent) => event.name },
  { key: "Veranstalter", sortValue: (event: T2WEvent) => event.veranstalter },
  { key: "Sportart", sortValue: (event: T2WEvent) => event.sportart ?? "" },
  { key: "Services", sortValue: (event: T2WEvent) => event.services?.join(", ") ?? "" },
  { key: "Zeitraum", sortValue: (event: T2WEvent) => event.start },
  { key: "Tage", sortValue: (event: T2WEvent) => tageZwischen(event.start, event.ende) },
  { key: "Aufgaben", sortValue: (event: T2WEvent) => event.taskReadiness.openCount },
  {
    key: "Ordner",
    sortValue: (event: T2WEvent) =>
      Number(Boolean(event.outlookOrdner)) + Number(Boolean(event.sharepointOrdner)),
  },
] as const;

export type EventCellContext = {
  settings: Settings;
  selectionLists: SelectionListSnapshot;
  /** Übersetzter Statusname für den Tooltip; ohne Angabe der deutsche Name. */
  statusTitle?: ((status: EventStatus) => string) | undefined;
  dateCollision?: EventDateCollision | undefined;
};

const HEAD_CLASS: Partial<Record<EventColumn, string>> = {
  Status: "w-12 max-w-[3rem] !px-1",
  TIME2WIN: "w-14 max-w-14 whitespace-nowrap !px-1",
};

const CELL_CLASS: Partial<Record<EventColumn, string>> = {
  Status: "w-12 max-w-[3rem] !px-1",
  TIME2WIN: "w-14 max-w-14 whitespace-nowrap !px-1 tabular-nums",
  Event: "max-w-[26rem] font-medium",
  Veranstalter: "max-w-[10rem]",
  Sportart: "max-w-[9rem]",
  Services: "max-w-[12rem]",
  Zeitraum: "whitespace-nowrap",
  Tage: "tabular-nums",
  Aufgaben: "tabular-nums",
};

/** Kopfinhalt, wo die Spalte nicht mit ihrem Namen beschriftet ist. */
function headContent(column: EventColumn) {
  if (column === "Status") return "St.";
  if (column === "TIME2WIN") return "T2W";
  if (column === "Ordner")
    return (
      <span className="inline-flex gap-2" title="Outlook und SharePoint">
        <Mail className="size-3.5" aria-label="Outlook" />
        <Share2 className="size-3.5" aria-label="SharePoint" />
      </span>
    );
  return undefined;
}

function cellTitle(column: EventColumn, event: T2WEvent, context: EventCellContext) {
  if (column === "Status") return (context.statusTitle ?? ((s) => STATUS_LABEL[s]))(event.status);
  if (column === "Sportart") return event.sportart || "—";
  if (column === "Services") return event.services?.join(", ") || "—";
  return undefined;
}

function cellContent(column: EventColumn, event: T2WEvent, context: EventCellContext) {
  const { selectionLists, settings, dateCollision } = context;
  switch (column) {
    case "Status":
      return (
        <>
          <StatusDot status={event.status} />
          <span className="sr-only">{STATUS_LABEL[event.status]}</span>
        </>
      );
    case "TIME2WIN":
      return event.t2wEventId != null ? (
        <a
          href={`https://time2win.at/backend/event/${event.t2wEventId}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`TIME2WIN Event-ID ${event.t2wEventId} im Backend öffnen`}
          title="TIME2WIN Backend öffnen"
        >
          {event.t2wEventId}
        </a>
      ) : (
        <span className="text-muted-foreground">–</span>
      );
    case "Event":
      return (
        <Link
          to="/events/$eventcode"
          params={{ eventcode: event.eventcode }}
          className="hover:text-primary hover:underline"
        >
          {event.name}
        </Link>
      );
    case "Veranstalter":
      return <OrganizerLink organizerId={event.veranstalterId} name={event.veranstalter} />;
    case "Sportart":
      return event.sportart ? (
        <SelectionBadge
          {...(selectionLists.sports.find(
            (sport) => sport.id === event.sportartId || sport.name === event.sportart,
          ) ?? { name: event.sportart })}
        />
      ) : (
        "—"
      );
    case "Services":
      return event.services?.length ? (
        <div className="flex min-w-0 flex-nowrap gap-1 overflow-hidden">
          {event.services.map((name, index) => {
            const service = selectionLists.services.find(
              (item) => item.id === event.serviceIds?.[index] || item.name === name,
            );
            return (
              <div key={service?.id ?? name} className="shrink-0">
                <ServiceBadge name={name} icon={service?.icon} color={service?.color} />
              </div>
            );
          })}
        </div>
      ) : (
        "—"
      );
    case "Zeitraum":
      return (
        <span className="inline-flex items-center gap-1.5">
          {formatZeitraum(event.start, event.ende)}
          {dateCollision && <EventDateCollisionIndicator collision={dateCollision} />}
        </span>
      );
    case "Tage":
      return tageZwischen(event.start, event.ende);
    case "Aufgaben":
      return event.taskReadiness.openCount > 0 ? (
        <span className="rounded bg-secondary px-1.5 py-0.5 font-medium text-foreground">
          {event.taskReadiness.openCount}
        </span>
      ) : (
        <span className="text-muted-foreground">–</span>
      );
    case "Ordner":
      return (
        <span className="flex gap-1">
          {resolveEventFolderNavigation(event, settings).map((destination) => (
            <FolderLink key={destination.id} destination={destination} />
          ))}
        </span>
      );
  }
}

export function EventHeaderCells({
  visibleColumns,
  sort,
  onSort,
}: {
  visibleColumns: EventColumn[];
  sort: { key: EventColumn; direction: "asc" | "desc" };
  onSort: (column: EventColumn) => void;
}) {
  return (
    <>
      {visibleColumns.map((column) => (
        <th key={column} className={HEAD_CLASS[column]}>
          <SortHeader
            label={column}
            active={sort.key === column}
            direction={sort.direction}
            onSort={() => onSort(column)}
          >
            {headContent(column)}
          </SortHeader>
        </th>
      ))}
    </>
  );
}

export function EventRowCells({
  event,
  visibleColumns,
  context,
}: {
  event: T2WEvent;
  visibleColumns: EventColumn[];
  context: EventCellContext;
}) {
  return (
    <>
      {visibleColumns.map((column) => (
        <Fragment key={column}>
          <td className={CELL_CLASS[column]} title={cellTitle(column, event, context)}>
            {cellContent(column, event, context)}
          </td>
        </Fragment>
      ))}
    </>
  );
}
