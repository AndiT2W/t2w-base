import type { CategoryTask, CategoryView } from "@/components/t2w/TaskCategory";
import { TaskProgress } from "@/components/t2w/TaskState";
import { taskProgressCounts, taskState, TASK_STATE_LABEL } from "@/lib/t2w/task-state";
import {
  timelinePosition,
  timelineRows,
  timelineScale,
  timelineTicks,
  type TimelineScale,
} from "@/lib/t2w/task-timeline";
import { formatDatum } from "@/lib/t2w/format";
import { cn } from "@/lib/utils";
import { SelectionBadge } from "@/components/t2w/ServiceBadge";

const PILL_TONE: Record<ReturnType<typeof taskState>, string> = {
  done: "border-task-done/40 bg-task-done-soft text-task-done-strong",
  overdue: "border-task-overdue/50 bg-task-overdue-soft font-semibold text-task-overdue-strong",
  waiting: "border-task-waiting/40 bg-task-waiting-soft text-task-waiting-strong",
  active: "border-task-active/40 bg-task-active-soft text-task-active-strong",
  open: "border-input bg-card text-foreground",
};

const DOT_TONE: Record<ReturnType<typeof taskState>, string> = {
  done: "bg-task-done",
  overdue: "bg-task-overdue",
  waiting: "bg-task-waiting",
  active: "bg-task-active",
  open: "bg-task-open",
};

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("de-AT", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });
}

function Pill({
  task,
  onOpen,
  className,
  style,
}: {
  task: CategoryTask;
  onOpen: (task: CategoryTask) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const state = taskState(task);
  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      data-task-state={state}
      title={`${task.title} · ${TASK_STATE_LABEL[state]}${task.endDate ? ` · ${formatDatum(task.endDate)}` : ""}`}
      style={style}
      className={cn(
        "flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[11.5px]",
        PILL_TONE[state],
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT_TONE[state])} aria-hidden="true" />
      <span className="max-w-40 truncate">{task.title}</span>
    </button>
  );
}

function Track({
  category,
  tasks,
  scale,
  onOpen,
}: {
  category: CategoryView;
  tasks: readonly CategoryTask[];
  scale: TimelineScale;
  onOpen: (task: CategoryTask) => void;
}) {
  const counts = taskProgressCounts(tasks);
  const undated = tasks.filter((task) => !task.endDate);
  const dated = timelineRows(
    tasks
      .map((task) => ({ item: task, position: timelinePosition(scale, task.endDate) }))
      .filter(
        (entry): entry is { item: CategoryTask; position: number } => entry.position !== null,
      ),
  );

  return (
    <div className="flex items-stretch border-b last:border-0">
      <div className="w-44 shrink-0 border-r px-3 py-2">
        <SelectionBadge
          name={category.name}
          icon={category.icon}
          color={category.color}
          className="font-semibold"
        />
        <TaskProgress counts={counts} className="mt-1" label={`${counts.done}/${counts.total}`} />
      </div>

      {/* Aufgaben ohne Termin stehen links außerhalb der Achse. Sie hier
          wegzulassen hieße, sie zu verstecken; sie aufs Eventdatum zu setzen
          wäre erfunden. */}
      <div className="w-40 shrink-0 space-y-1 border-r bg-muted/20 px-2 py-2">
        {undated.map((task) => (
          <Pill key={task.id} task={task} onOpen={onOpen} className="w-full" />
        ))}
      </div>

      <div className="relative min-h-24 flex-1 px-3 py-2">
        {dated.map(({ item, position, row }) => (
          <Pill
            key={item.id}
            task={item}
            onOpen={onOpen}
            className="absolute"
            style={{
              left: `${position * 100}%`,
              top: 8 + row * 30,
              transform: position > 0.75 ? "translateX(-100%)" : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Zweite Ansicht der Aufgaben: alles relativ zum Eventdatum statt im
 * Kalenderraster. Kategorien sind Spuren, Aufgaben Punkte; was links der
 * Heute-Linie liegt und offen ist, ist überfällig.
 */
export function TaskTimeline({
  categories,
  tasks,
  eventStart,
  onOpen,
  categoryDetails,
}: {
  categories: readonly {
    groupId: string | null;
    nextTaskId: string | null;
    nextEndDate: string | null;
    count: number;
    flows: readonly string[][][];
  }[];
  tasks: readonly CategoryTask[];
  eventStart?: string;
  onOpen: (task: CategoryTask) => void;
  categoryDetails: (groupId: string | null) => {
    name: string;
    icon: string | null;
    color: string | null;
  };
}) {
  const today = new Date().toISOString().slice(0, 10);
  const scale = timelineScale(
    tasks.map((task) => task.endDate),
    { today, ...(eventStart ? { eventStart } : {}) },
  );
  const ticks = timelineTicks(scale, 6);
  const todayAt = timelinePosition(scale, today);
  const eventAt = eventStart ? timelinePosition(scale, eventStart) : null;

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex border-b bg-muted/30">
        <span className="w-44 shrink-0 border-r px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Kategorie
        </span>
        <span className="w-40 shrink-0 border-r px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Ohne Termin
        </span>
        <span className="relative flex-1 px-3 py-1.5">
          {ticks.map((tick, index) => (
            <span
              key={tick}
              className="absolute text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              style={{
                left: `${(index / (ticks.length - 1)) * 100}%`,
                transform:
                  index === 0
                    ? undefined
                    : index === ticks.length - 1
                      ? "translateX(-100%)"
                      : "translateX(-50%)",
              }}
            >
              {shortDate(tick)}
            </span>
          ))}
          <span className="invisible text-[10px]">Achse</span>
        </span>
      </div>

      <div className="relative">
        {/* Marken über alle Spuren. Sie liegen hinter den Aufgaben, damit ein
            Klick immer die Aufgabe trifft. */}
        <div className="pointer-events-none absolute inset-y-0 left-84 right-0" aria-hidden="true">
          <div className="relative ml-3 mr-3 h-full">
            {todayAt !== null && (
              <span
                className="absolute inset-y-0 w-px bg-muted-foreground/40"
                style={{ left: `${todayAt * 100}%` }}
              />
            )}
            {eventAt !== null && (
              <span
                className="absolute inset-y-0 w-0.5 bg-primary"
                style={{ left: `${eventAt * 100}%` }}
              />
            )}
          </div>
        </div>

        {categories.map((category) => (
          <Track
            key={category.groupId ?? "none"}
            category={{ ...category, ...categoryDetails(category.groupId), flows: category.flows }}
            tasks={tasks.filter((task) => (task.groupId ?? null) === category.groupId)}
            scale={scale}
            onOpen={onOpen}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-muted-foreground/60" aria-hidden="true" />
          Heute
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-primary" aria-hidden="true" />
          Eventstart
        </span>
        <span className="flex-1" />
        <span>Aufgaben ohne Enddatum stehen links, außerhalb der Achse.</span>
      </div>
    </div>
  );
}
