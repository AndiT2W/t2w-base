import { ChevronDown, ChevronRight, ArrowRight, Check, Plus } from "lucide-react";
import type { Dependency, Task, TaskFlow } from "@t2w/domain/project-management";
import { cn } from "@/lib/utils";
import { formatDatum } from "@/lib/t2w/format";
import { taskProgressCounts, taskState, TASK_STATE_LABEL } from "@/lib/t2w/task-state";
import { chainView, foreignPredecessorIds, splitFlows } from "@/lib/t2w/task-flow-view";
import { TaskProgress, TaskStateChip } from "@/components/t2w/TaskState";

export type CategoryTask = Task & {
  blockedBy: readonly string[];
  overdue: boolean;
  dueSoon: boolean;
};

export type CategoryView = {
  groupId: string | null;
  name: string;
  count: number;
  nextTaskId: string | null;
  nextEndDate: string | null;
  flows: readonly TaskFlow[];
};

type OwnerName = (ownerId: string | null) => string;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Owner({ name }: { name: string }) {
  return (
    <span
      title={name}
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground"
    >
      {initials(name)}
    </span>
  );
}

/**
 * Zeile einer Kategorie: Fortschritt auf einen Blick, nächster Schritt im Klartext.
 * Sie ist der Schalter für den ausgeklappten Bereich, deshalb ein echter Button.
 */
export function CategoryRow({
  category,
  tasks,
  expanded,
  onToggle,
  ownerName,
  taskById,
}: {
  category: CategoryView;
  tasks: readonly CategoryTask[];
  expanded: boolean;
  onToggle: () => void;
  ownerName: OwnerName;
  taskById: ReadonlyMap<string, CategoryTask>;
}) {
  const counts = taskProgressCounts(tasks);
  const next = category.nextTaskId ? taskById.get(category.nextTaskId) : null;
  const overdue = tasks.filter((task) => taskState(task) === "overdue");
  const waiting = tasks.filter((task) => taskState(task) === "waiting");
  const complete = counts.total > 0 && counts.done === counts.total;

  const rowState = overdue.length
    ? "overdue"
    : complete
      ? "done"
      : counts.active
        ? "active"
        : "open";

  const hint = overdue.length
    ? `${overdue.length} überfällig${waiting.length ? ` · blockiert ${waiting.length}` : ""}`
    : complete
      ? "vollständig"
      : waiting.length
        ? `${waiting.length} warten auf Vorgänger`
        : "";

  const nextHint = next
    ? next.overdue
      ? "überfällig"
      : next.blockedBy.length
        ? "wartet auf Vorgänger"
        : ""
    : "";

  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      data-task-state={rowState}
      className={cn(
        "flex w-full items-center gap-3 border-l-[3px] px-4 py-3 text-left transition-colors hover:bg-muted/40",
        overdue.length ? "border-l-task-overdue bg-task-overdue-soft/40" : "border-l-transparent",
      )}
    >
      {expanded ? (
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      )}

      <span className="w-40 shrink-0">
        <span className="block truncate font-semibold">{category.name}</span>
        {hint && (
          <span
            className={cn(
              "block text-[11.5px]",
              overdue.length ? "text-task-overdue-strong" : "text-muted-foreground",
            )}
          >
            {hint}
          </span>
        )}
      </span>

      <TaskProgress counts={counts} className="w-48 shrink-0" />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">
          {next ? next.title : "Alle Aufgaben erledigt"}
        </span>
        {nextHint && (
          <span
            className={cn(
              "block text-[11.5px]",
              next?.overdue ? "text-task-overdue-strong" : "text-muted-foreground",
            )}
          >
            {nextHint}
          </span>
        )}
      </span>

      <span
        className={cn(
          "w-20 shrink-0 text-sm tabular-nums",
          next?.overdue ? "font-semibold text-task-overdue-strong" : "text-muted-foreground",
        )}
      >
        {category.nextEndDate ? formatDatum(category.nextEndDate) : "—"}
      </span>

      {/* Ohne nächste Aufgabe gibt es niemanden zu zeigen; ein Platzhalter-Avatar
          würde eine Zuordnung behaupten, die es nicht gibt. */}
      {next?.ownerId ? <Owner name={ownerName(next.ownerId)} /> : <span className="size-6" />}
    </button>
  );
}

function FlowCard({
  task,
  foreignGroupName,
  onOpen,
}: {
  task: CategoryTask;
  foreignGroupName?: string;
  onOpen?: () => void;
}) {
  const state = taskState(task);
  const foreign = Boolean(foreignGroupName);

  return (
    <button
      type="button"
      onClick={onOpen}
      data-task-state={state}
      className={cn(
        "w-[184px] shrink-0 rounded-lg border border-l-[3px] px-2.5 py-2 text-left",
        foreign
          ? "border-dashed border-border border-l-border bg-transparent"
          : state === "overdue"
            ? "border-task-overdue/40 border-l-task-overdue bg-task-overdue-soft/50"
            : state === "done"
              ? "border-border border-l-task-done bg-card"
              : state === "active"
                ? "border-task-active/40 border-l-task-active bg-card"
                : state === "waiting"
                  ? "border-border border-l-task-waiting bg-card"
                  : "border-border border-l-task-open bg-card",
      )}
    >
      <span
        className={cn(
          "block text-[12.5px] font-semibold leading-snug",
          foreign ? "text-muted-foreground" : state === "done" ? "text-muted-foreground" : "",
        )}
      >
        {task.title}
      </span>
      <span className="mt-1.5 flex items-center gap-1.5">
        <span
          className={cn(
            "text-[10.5px] font-semibold",
            foreign
              ? "text-muted-foreground"
              : state === "overdue"
                ? "text-task-overdue-strong"
                : state === "done"
                  ? "text-task-done-strong"
                  : state === "active"
                    ? "text-task-active-strong"
                    : state === "waiting"
                      ? "text-task-waiting-strong"
                      : "text-task-open-strong",
          )}
        >
          {foreign ? `aus ${foreignGroupName}` : TASK_STATE_LABEL[state]}
        </span>
        <span className="flex-1" />
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {task.endDate ? formatDatum(task.endDate) : "—"}
        </span>
      </span>
    </button>
  );
}

function Arrow() {
  return <ArrowRight aria-hidden="true" className="mx-1.5 size-4 shrink-0 text-border" />;
}

/**
 * Abläufe einer Kategorie als Ketten mit Pfeilen. Parallele Aufgaben stehen
 * untereinander, erledigte Anfangsstufen werden zu einer Karte, fremde
 * Vorgänger stehen blass gestrichelt am Kettenanfang.
 */
export function TaskFlowChain({
  flows,
  groupId,
  taskById,
  edges,
  groupName,
  onOpen,
}: {
  flows: readonly TaskFlow[];
  groupId: string | null;
  taskById: ReadonlyMap<string, CategoryTask>;
  edges: readonly Dependency[];
  groupName: (groupId: string | null) => string;
  onOpen: (task: CategoryTask) => void;
}) {
  const { chains } = splitFlows(flows);
  if (!chains.length) return null;

  const isDone = (taskId: string) => taskById.get(taskId)?.status === "DONE";

  return (
    <div className="space-y-3">
      {chains.map((chain) => {
        const view = chainView(chain, isDone);
        const foreignIds = foreignPredecessorIds(
          chain.flat(),
          edges,
          (taskId) => taskById.get(taskId)?.groupId ?? null,
          groupId,
        );

        return (
          <div key={chain.flat().join("-")} className="flex items-center overflow-x-auto pb-1">
            {foreignIds.map((foreignId) => {
              const task = taskById.get(foreignId);
              if (!task) return null;
              return (
                <div key={foreignId} className="flex items-center">
                  <FlowCard
                    task={task}
                    foreignGroupName={groupName(task.groupId)}
                    onOpen={() => onOpen(task)}
                  />
                  <Arrow />
                </div>
              );
            })}

            {view.collapsedDoneCount > 0 && (
              <div className="flex items-center">
                <span className="flex w-[132px] shrink-0 items-center gap-2 rounded-lg border border-dashed px-2.5 py-2 text-left">
                  <Check aria-hidden="true" className="size-4 shrink-0 text-task-done" />
                  <span className="text-[11.5px] font-semibold text-muted-foreground">
                    {view.collapsedDoneCount} erledigt
                  </span>
                </span>
                <Arrow />
              </div>
            )}

            {view.stages.map((stage, stageIndex) => (
              <div key={stage.taskIds.join("-")} className="flex items-center">
                {stageIndex > 0 && <Arrow />}
                <div className="flex flex-col gap-1.5">
                  {stage.taskIds.map((taskId) => {
                    const task = taskById.get(taskId);
                    return task ? (
                      <FlowCard key={taskId} task={task} onOpen={() => onOpen(task)} />
                    ) : null;
                  })}
                  {stage.hiddenCount > 0 && (
                    <span className="w-[184px] rounded-lg border border-dashed px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
                      + {stage.hiddenCount} weitere in dieser Stufe
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

const STATE_ORDER: Record<ReturnType<typeof taskState>, number> = {
  overdue: 0,
  active: 1,
  waiting: 2,
  open: 3,
  done: 4,
};

/**
 * Aufgaben ohne Vorgänger als Tabelle — in den meisten Kategorien die Mehrheit.
 * Gedeckelt auf `limit` Zeilen, sortiert nach Dringlichkeit; der Rest steht als
 * Zähler in der Fußzeile, damit eine volle Kategorie die Seite nicht sprengt.
 */
export function TaskTable({
  tasks,
  ownerName,
  onOpen,
  onCreate,
  limit = 6,
  categoryName,
}: {
  tasks: readonly CategoryTask[];
  ownerName: OwnerName;
  onOpen: (task: CategoryTask) => void;
  onCreate?: () => void;
  limit?: number;
  categoryName: string;
}) {
  if (!tasks.length) return null;

  const sorted = [...tasks].sort((a, b) => {
    const order = STATE_ORDER[taskState(a)] - STATE_ORDER[taskState(b)];
    if (order !== 0) return order;
    return (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999");
  });
  const shown = sorted.slice(0, limit);
  const hidden = sorted.slice(limit);
  const hiddenDone = hidden.filter((task) => task.status === "DONE").length;

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Aufgaben ohne Vorgänger in {categoryName}</caption>
        <thead>
          <tr className="border-b bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-3 py-1.5 text-left">
              Aufgabe
            </th>
            <th scope="col" className="w-24 px-3 py-1.5 text-left">
              Status
            </th>
            <th scope="col" className="w-20 px-3 py-1.5 text-right">
              Fällig
            </th>
            <th scope="col" className="w-10 px-3 py-1.5">
              <span className="sr-only">Verantwortlich</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((task) => {
            const state = taskState(task);
            return (
              <tr key={task.id} className="border-b last:border-0">
                <td className="px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => onOpen(task)}
                    className={cn(
                      "min-h-11 text-left font-medium hover:underline md:min-h-0",
                      state === "done" && "text-muted-foreground line-through",
                    )}
                  >
                    {task.title}
                  </button>
                </td>
                <td className="px-3 py-1.5">
                  <TaskStateChip state={state} />
                </td>
                <td
                  className={cn(
                    "px-3 py-1.5 text-right tabular-nums",
                    state === "overdue" ? "font-semibold text-task-overdue-strong" : "",
                  )}
                >
                  {task.endDate ? formatDatum(task.endDate) : "—"}
                </td>
                <td className="px-3 py-1.5">
                  <Owner name={ownerName(task.ownerId)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {(hidden.length > 0 || onCreate) && (
        <div className="flex flex-wrap items-center gap-2 bg-muted/20 px-3 py-1.5 text-xs">
          {hidden.length > 0 && (
            <span className="text-muted-foreground">
              {hidden.length} weitere
              {hiddenDone ? `, davon ${hiddenDone} erledigt` : ""}
            </span>
          )}
          <span className="flex-1" />
          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary hover:underline md:min-h-8"
            >
              <Plus aria-hidden="true" className="size-3.5" />
              Aufgabe
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function categoryTasks(
  tasks: readonly CategoryTask[],
  groupId: string | null,
): CategoryTask[] {
  return tasks.filter((task) => (task.groupId ?? null) === groupId);
}

export function singleTasks(
  flows: readonly TaskFlow[],
  taskById: ReadonlyMap<string, CategoryTask>,
): CategoryTask[] {
  const { singles } = splitFlows(flows);
  return singles
    .map((taskId) => taskById.get(taskId))
    .filter((task): task is CategoryTask => Boolean(task));
}
