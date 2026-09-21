import { taskProgressCounts, type TaskStateInput } from "@/lib/t2w/task-state";
import { cn } from "@/lib/utils";

const SEGMENTS = [
  { key: "done", label: "erledigt", bar: "bg-task-done", dot: "bg-task-done" },
  { key: "active", label: "in Arbeit", bar: "bg-task-active", dot: "bg-task-active" },
  { key: "overdue", label: "überfällig", bar: "bg-task-overdue", dot: "bg-task-overdue" },
  { key: "open", label: "offen", bar: "", dot: "bg-task-open" },
] as const;

/** Ganze Zahl Tage zwischen heute und dem Eventstart, beide auf Mitternacht gerundet. */
function daysUntil(isoDate: string): number | null {
  const target = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start) / 86400000);
}

/**
 * Kopfzeile der Aufgabenansicht: Fortschritt über alle Kategorien und, wenn das
 * Eventdatum bekannt ist, die verbleibenden Tage. Die Zahlen zählen immer alle
 * Aufgaben, unabhängig davon, was gerade eingeklappt ist.
 */
export function TaskSummary({
  tasks,
  eventStart,
  className,
  variante = "breit",
}: {
  tasks: readonly TaskStateInput[];
  eventStart?: string;
  className?: string;
  /**
   * `schmal` ist die Fassung fuer die Schiene der Eventdetailseite: kein
   * eigener Rahmen, weil die Karte darum ihn schon traegt, und alles
   * untereinander statt nebeneinander -- bei 330 px Breite bricht die breite
   * Fassung sonst in vier Zeilen und die Tageszahl steht allein da.
   */
  variante?: "breit" | "schmal";
}) {
  const counts = taskProgressCounts(tasks);
  const share = (value: number) => (counts.total ? `${(value / counts.total) * 100}%` : "0%");
  const days = eventStart ? daysUntil(eventStart) : null;
  const tagetext =
    days === null
      ? null
      : days > 0
        ? `noch ${days} ${days === 1 ? "Tag" : "Tage"}`
        : days === 0
          ? "Event ist heute"
          : `${Math.abs(days)} ${Math.abs(days) === 1 ? "Tag" : "Tage"} nach dem Event`;

  if (variante === "schmal") {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-xs text-muted-foreground">
          <strong className="font-semibold tabular-nums text-foreground">{counts.done}</strong> von{" "}
          {counts.total} erledigt
          {tagetext ? ` · ${tagetext}` : ""}
        </p>
        <div
          role="img"
          aria-label={`${counts.done} erledigt, ${counts.active} in Arbeit, ${counts.overdue} überfällig, ${counts.open} offen`}
          className="flex h-2 overflow-hidden rounded-full bg-muted"
        >
          {SEGMENTS.filter((segment) => segment.bar).map((segment) => (
            <span
              key={segment.key}
              className={segment.bar}
              style={{ width: share(counts[segment.key]) }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {SEGMENTS.map((segment) => (
            <span
              key={segment.key}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className={cn("size-2 rounded-sm", segment.dot)} aria-hidden="true" />
              <strong className="font-semibold tabular-nums text-foreground">
                {counts[segment.key]}
              </strong>
              {segment.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border bg-card px-4 py-3",
        className,
      )}
    >
      <p className="flex shrink-0 items-baseline gap-2">
        <strong className="text-2xl font-semibold tabular-nums tracking-tight">
          {counts.done}
        </strong>
        <span className="text-sm text-muted-foreground">von {counts.total} erledigt</span>
      </p>

      <div className="min-w-48 flex-1">
        <div
          role="img"
          aria-label={`${counts.done} erledigt, ${counts.active} in Arbeit, ${counts.overdue} überfällig, ${counts.open} offen`}
          className="flex h-2 overflow-hidden rounded-full bg-muted"
        >
          {SEGMENTS.filter((segment) => segment.bar).map((segment) => (
            <span
              key={segment.key}
              className={segment.bar}
              style={{ width: share(counts[segment.key]) }}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {SEGMENTS.map((segment) => (
            <span
              key={segment.key}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className={cn("size-2 rounded-sm", segment.dot)} aria-hidden="true" />
              <strong className="font-semibold tabular-nums text-foreground">
                {counts[segment.key]}
              </strong>
              {segment.label}
            </span>
          ))}
        </div>
      </div>

      {days !== null && (
        <div className="shrink-0 border-l pl-5 text-right">
          <p className="text-xl font-semibold tabular-nums tracking-tight">{Math.abs(days)}</p>
          <p className="text-xs text-muted-foreground">
            {days > 0
              ? "Tage bis zum Event"
              : days === 0
                ? "Event ist heute"
                : "Tage nach dem Event"}
          </p>
        </div>
      )}
    </div>
  );
}
