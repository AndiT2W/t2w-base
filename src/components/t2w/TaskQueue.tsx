import type { Task } from "@t2w/domain/project-management";
import { TaskStateChip } from "@/components/t2w/TaskState";
import { formatDatum } from "@/lib/t2w/format";
import { groupTasksByUrgency, type QueueGroupKey } from "@/lib/t2w/task-queue";
import { taskState } from "@/lib/t2w/task-state";
import { cn } from "@/lib/utils";
import { SelectionBadge } from "@/components/t2w/ServiceBadge";

export type QueueEntry = Task & {
  blockedBy: readonly string[];
  overdue: boolean;
  dueSoon: boolean;
  event: { id: string; name: string } | null;
};

const GROUP_TONE: Record<QueueGroupKey, { dot: string; head: string; text: string }> = {
  overdue: {
    dot: "bg-task-overdue",
    head: "bg-task-overdue-soft/60",
    text: "text-task-overdue-strong",
  },
  thisWeek: {
    dot: "bg-task-waiting",
    head: "bg-task-waiting-soft/50",
    text: "text-task-waiting-strong",
  },
  blocked: { dot: "bg-task-open", head: "bg-muted/40", text: "text-muted-foreground" },
  later: { dot: "bg-task-open", head: "bg-muted/30", text: "text-muted-foreground" },
  done: { dot: "bg-task-done", head: "bg-task-done-soft/40", text: "text-task-done-strong" },
};

/**
 * Flache Aufgabenliste über alle Events, nach Dringlichkeit gruppiert. Event
 * und Kategorie sind Spalten statt Verschachtelung: die Liste beantwortet
 * „was ist als Nächstes zu tun“, nicht „wie weit ist dieser Bereich“.
 */
export function TaskQueue({
  tasks,
  categoryDetails,
  ownerName,
  taskTitle,
  onOpen,
}: {
  tasks: readonly QueueEntry[];
  categoryDetails: (groupId: string | null) => {
    name: string;
    icon: string | null;
    color: string | null;
  };
  ownerName: (ownerId: string | null) => string;
  taskTitle: (taskId: string) => string;
  onOpen: (task: QueueEntry) => void;
}) {
  const groups = groupTasksByUrgency(tasks);

  if (!groups.length) {
    return (
      <p className="rounded-lg border bg-card py-8 text-center text-sm text-muted-foreground">
        Keine Aufgaben für diese Filter.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="hidden items-center gap-3 border-b bg-muted/30 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:flex">
        <span className="flex-1">Aufgabe</span>
        <span className="w-48">Event</span>
        <span className="w-32">Kategorie</span>
        <span className="w-24">Status</span>
        <span className="w-24 text-right">Fällig</span>
        <span className="w-16 text-right">Person</span>
      </div>

      {groups.map((group) => {
        const tone = GROUP_TONE[group.key];
        return (
          <section key={group.key} aria-label={group.label}>
            <h3
              className={cn(
                "flex items-center gap-2 border-b px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider",
                tone.head,
                tone.text,
              )}
            >
              <span className={cn("size-2 rounded-full", tone.dot)} aria-hidden="true" />
              {group.label}
              <span className="font-semibold tabular-nums opacity-70">{group.tasks.length}</span>
            </h3>

            {group.tasks.map((task) => {
              const state = taskState(task);
              const reason = task.blockedBy.length
                ? `wartet auf ${task.blockedBy.map(taskTitle).join(", ")}`
                : "";
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 last:border-0 md:flex-nowrap",
                    state === "overdue" && "bg-task-overdue-soft/20",
                  )}
                >
                  <span className="order-1 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onOpen(task)}
                      className={cn(
                        "min-h-11 text-left text-sm font-semibold hover:underline md:min-h-0",
                        state === "done" && "font-medium text-muted-foreground line-through",
                      )}
                    >
                      {task.title}
                    </button>
                    {reason && (
                      <span className="block text-[11.5px] text-task-waiting-strong">{reason}</span>
                    )}
                  </span>
                  <span className="order-3 w-48 truncate text-sm text-muted-foreground md:order-2">
                    {task.event?.name ?? "Globale Aufgabe"}
                  </span>
                  <span className="order-4 w-32 md:order-3">
                    <SelectionBadge
                      {...categoryDetails(task.groupId)}
                      className="text-[11px] font-semibold"
                    />
                  </span>
                  <span className="order-5 w-24 md:order-4">
                    <TaskStateChip state={state} />
                  </span>
                  <span
                    className={cn(
                      "order-2 w-24 text-right text-sm tabular-nums md:order-5",
                      state === "overdue"
                        ? "font-semibold text-task-overdue-strong"
                        : "text-muted-foreground",
                    )}
                  >
                    {task.endDate ? formatDatum(task.endDate) : "—"}
                  </span>
                  <span
                    className="order-6 w-16 truncate text-right text-xs text-muted-foreground"
                    title={ownerName(task.ownerId)}
                  >
                    {ownerName(task.ownerId)}
                  </span>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
