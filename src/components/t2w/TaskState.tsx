import { cn } from "@/lib/utils";
import {
  TASK_STATE_LABEL,
  taskProgressCounts,
  type TaskProgressCounts,
  type TaskState,
  type TaskStateInput,
} from "@/lib/t2w/task-state";

const CHIP_TONE: Record<TaskState, string> = {
  done: "bg-task-done-soft text-task-done-strong",
  overdue: "bg-task-overdue-soft text-task-overdue-strong",
  waiting: "bg-task-waiting-soft text-task-waiting-strong",
  active: "bg-task-active-soft text-task-active-strong",
  open: "bg-task-open-soft text-task-open-strong",
};

const SURFACE_TONE: Record<TaskState, string> = {
  done: "bg-task-done",
  overdue: "bg-task-overdue",
  waiting: "bg-task-waiting",
  active: "bg-task-active",
  open: "bg-task-open",
};

export function TaskStateChip({ state, className }: { state: TaskState; className?: string }) {
  return (
    <span
      data-task-state={state}
      className={cn(
        "inline-block rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold leading-4",
        CHIP_TONE[state],
        className,
      )}
    >
      {TASK_STATE_LABEL[state]}
    </span>
  );
}

/** Farbkante links an einer Zeile oder Karte. Trägt allein keine Bedeutung. */
export function TaskStateRail({ state, className }: { state: TaskState; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-task-state={state}
      title={TASK_STATE_LABEL[state]}
      className={cn("inline-block w-[3px] shrink-0 rounded-sm", SURFACE_TONE[state], className)}
    />
  );
}

/**
 * Dreigeteilter Fortschrittsbalken einer Kategorie: erledigt, in Arbeit,
 * überfällig. Der Rest der Breite bleibt Spur und steht für offen und wartend.
 */
export function TaskProgress({
  counts,
  tasks,
  className,
  label,
}: {
  counts?: TaskProgressCounts;
  tasks?: readonly TaskStateInput[];
  className?: string;
  label?: string;
}) {
  const resolved = counts ?? taskProgressCounts(tasks ?? []);
  const share = (value: number) =>
    resolved.total ? `${Math.round((value / resolved.total) * 100)}%` : "0%";
  const text = label ?? `${resolved.done} von ${resolved.total} erledigt`;

  return (
    <span className={cn("block", className)}>
      <span
        role="img"
        aria-label={text}
        className="flex h-[7px] overflow-hidden rounded-full bg-muted"
      >
        <span className="bg-task-done" style={{ width: share(resolved.done) }} />
        <span className="bg-task-active" style={{ width: share(resolved.active) }} />
        <span className="bg-task-overdue" style={{ width: share(resolved.overdue) }} />
      </span>
      <span className="mt-1 block text-[11.5px] tabular-nums text-muted-foreground">{text}</span>
    </span>
  );
}
