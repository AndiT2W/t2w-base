import { Link } from "@tanstack/react-router";
import { CalendarDays, CheckSquare } from "lucide-react";
import { FolderLink } from "@/components/t2w/FolderLink";
import { StatusBadge } from "@/components/t2w/StatusBadge";
import { formatZeitraum } from "@/lib/t2w/format";
import { resolveEventFolderNavigation } from "@/lib/t2w/folder-navigation";
import type { Settings, T2WEvent } from "@/lib/t2w/types";

export function EventMobileList({
  events,
  settings,
  emptyText,
}: {
  events: T2WEvent[];
  settings: Settings;
  emptyText: string;
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
        const openTasks = event.aufgaben.filter((task) => !task.erledigt).length;
        return (
          <article key={event.id} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  to="/events/$eventcode"
                  params={{ eventcode: event.eventcode }}
                  className="flex min-h-11 items-center font-semibold text-foreground hover:text-primary hover:underline"
                >
                  <span className="line-clamp-2">{event.name}</span>
                </Link>
                <p className="truncate text-sm text-muted-foreground">{event.veranstalter}</p>
              </div>
              <StatusBadge status={event.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />
                {formatZeitraum(event.start, event.ende)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckSquare className="size-4" aria-hidden="true" />
                {openTasks} offen
              </span>
              <span className="ml-auto inline-flex gap-1">
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
            </div>
          </article>
        );
      })}
    </div>
  );
}
