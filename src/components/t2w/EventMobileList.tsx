import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  EventDateCollisionIndicator,
  eventDateCollisionSurfaceClass,
} from "@/components/t2w/EventDateCollision";
import { FolderLink } from "@/components/t2w/FolderLink";
import { OrganizerLink } from "@/components/t2w/OrganizerLink";
import { SelectionBadge, ServiceBadge } from "@/components/t2w/ServiceBadge";
import { StatusDot } from "@/components/t2w/StatusBadge";
import { cn } from "@/lib/utils";
import type { EventDateCollision } from "@/lib/t2w/event-date-collisions";
import { formatZeitraum } from "@/lib/t2w/format";
import { resolveEventFolderNavigation } from "@/lib/t2w/folder-navigation";
import { STATUS_LABEL } from "@/lib/t2w/types";
import type { SelectionListSnapshot } from "@/lib/t2w/selection-list-workspace";
import type { Settings, T2WEvent } from "@/lib/t2w/types";

/**
 * Die Eventliste für schmale Ansichten, nach dem freigegebenen Artboard:
 * eine Karte je Event, die ganze Karte ist der Weg ins Event.
 *
 * Die Zeile darunter trägt Eventcode und Zeitraum, die Chips darunter die
 * Aufgabenlage.  Vorher stand der Statuschip mit Wortlaut rechts oben und der
 * Veranstalter unter dem Namen; beides brauchte auf 390 px zwei Zeilen, die
 * dem Namen fehlten.  Der Status steht jetzt als Punkt vor dem Namen; das
 * Wort bleibt als Lesehilfe erhalten, damit er nicht nur an der Farbe
 * haengt.
 */
export function EventMobileList({
  events,
  settings,
  selectionLists,
  emptyText,
  dateCollisions,
}: {
  events: T2WEvent[];
  settings: Settings;
  selectionLists?: SelectionListSnapshot | undefined;
  emptyText: string;
  dateCollisions?: ReadonlyMap<string, EventDateCollision>;
}) {
  if (!events.length) {
    return (
      <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-muted-foreground md:hidden">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="space-y-2 md:hidden" aria-label="Veranstaltungen mobile Liste">
      {events.map((event) => {
        const folders = resolveEventFolderNavigation(event, settings);
        const openTasks = event.taskReadiness.openCount;
        const overdueTasks = event.taskReadiness.overdueCount;
        const dateCollision = dateCollisions?.get(event.id);
        const ohneOrdner = !event.outlookOrdner && !event.sharepointOrdner;
        const sport = event.sportart
          ? (selectionLists?.sports.find(
              (item) => item.id === event.sportartId || item.name === event.sportart,
            ) ?? { name: event.sportart })
          : null;
        return (
          <article
            key={event.id}
            className={cn(
              "rounded-xl border border-border bg-surface",
              eventDateCollisionSurfaceClass(dateCollision, "card"),
            )}
            data-date-collision-group={
              dateCollision ? String(dateCollision.groupIndex + 1) : undefined
            }
          >
            <Link
              to="/events/$eventcode"
              params={{ eventcode: event.eventcode }}
              className="flex min-h-11 flex-col gap-1.5 p-3"
            >
              <span className="flex items-center gap-2">
                <StatusDot status={event.status} />
                <span className="sr-only">{STATUS_LABEL[event.status]}</span>
                <span className="min-w-0 flex-1 truncate font-bold text-foreground">
                  {event.name}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="font-mono">{event.eventcode}</span> ·{" "}
                {formatZeitraum(event.start, event.ende)}
                {dateCollision && (
                  <>
                    {" "}
                    <EventDateCollisionIndicator collision={dateCollision} />
                  </>
                )}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {overdueTasks > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-status-storniert/15 px-2 py-0.5 text-xs font-semibold text-destructive">
                    <span aria-hidden="true" className="size-1.5 rounded-sm bg-destructive" />
                    {overdueTasks} überfällig
                  </span>
                )}
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold text-foreground/80 ring-1 ring-inset ring-border">
                  {openTasks} offen
                </span>
                {ohneOrdner && (
                  <span className="inline-flex items-center rounded bg-risk-beobachten/15 px-1.5 py-0.5 text-xs font-semibold text-risk-beobachten">
                    Ohne Ordner
                  </span>
                )}
              </span>
            </Link>
            {(sport || event.services?.length || folders.length > 0 || event.veranstalter) && (
              <div className="flex flex-wrap items-center gap-1 border-t border-border px-3 py-2">
                <OrganizerLink organizerId={event.veranstalterId} name={event.veranstalter} />
                {sport && <SelectionBadge {...sport} />}
                {event.services?.map((name, index) => {
                  const service = selectionLists?.services.find(
                    (item) => item.id === event.serviceIds?.[index] || item.name === name,
                  );
                  return (
                    <ServiceBadge
                      key={service?.id ?? name}
                      name={name}
                      icon={service?.icon}
                      color={service?.color}
                    />
                  );
                })}
                <span className="ml-auto inline-flex gap-1">
                  {folders.map((destination) => (
                    <FolderLink key={destination.id} destination={destination} />
                  ))}
                </span>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
