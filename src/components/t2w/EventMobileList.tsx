import { Link } from "@tanstack/react-router";
import { CalendarDays, CheckSquare } from "lucide-react";
import {
  EventDateCollisionIndicator,
  eventDateCollisionSurfaceClass,
} from "@/components/t2w/EventDateCollision";
import { FolderLink } from "@/components/t2w/FolderLink";
import { OrganizerLink } from "@/components/t2w/OrganizerLink";
import { SelectionBadge, ServiceBadge } from "@/components/t2w/ServiceBadge";
import { StatusBadge } from "@/components/t2w/StatusBadge";
import { cn } from "@/lib/utils";
import type { EventDateCollision } from "@/lib/t2w/event-date-collisions";
import { formatZeitraum } from "@/lib/t2w/format";
import { resolveEventFolderNavigation } from "@/lib/t2w/folder-navigation";
import type { SelectionListSnapshot } from "@/lib/t2w/selection-list-workspace";
import type { Settings, T2WEvent } from "@/lib/t2w/types";

/**
 * Die Eventliste für schmale Ansichten.  Der Tabellenstandard sieht hier
 * Karten statt umbrechender Zeilen vor; Statuskennzeichen, Sportart- und
 * Service-Badges sind dieselben wie in der Desktoptabelle, damit dasselbe
 * Event auf beiden Breiten gleich gelesen wird.
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
        const dateCollision = dateCollisions?.get(event.id);
        const sport = event.sportart
          ? (selectionLists?.sports.find(
              (item) => item.id === event.sportartId || item.name === event.sportart,
            ) ?? { name: event.sportart })
          : null;
        return (
          <article
            key={event.id}
            className={cn(
              "rounded-lg border border-border bg-surface p-3",
              eventDateCollisionSurfaceClass(dateCollision, "card"),
            )}
            data-date-collision-group={
              dateCollision ? String(dateCollision.groupIndex + 1) : undefined
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  to="/events/$eventcode"
                  params={{ eventcode: event.eventcode }}
                  className="flex min-h-11 items-center font-semibold text-foreground hover:text-primary hover:underline"
                >
                  <span className="line-clamp-2">{event.name}</span>
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  <OrganizerLink organizerId={event.veranstalterId} name={event.veranstalter} />
                </p>
              </div>
              <div className="flex items-center gap-1">
                <StatusBadge status={event.status} />
              </div>
            </div>
            {(sport || event.services?.length) && (
              <div className="mt-2 flex flex-wrap gap-1">
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
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />
                {formatZeitraum(event.start, event.ende)}
                {dateCollision && <EventDateCollisionIndicator collision={dateCollision} />}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckSquare className="size-4" aria-hidden="true" />
                {openTasks} offen
              </span>
              <span className="ml-auto inline-flex gap-1">
                {folders.map((destination) => (
                  <FolderLink key={destination.id} destination={destination} />
                ))}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
