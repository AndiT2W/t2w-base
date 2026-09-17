import { taskState, type TaskStateInput } from "@/lib/t2w/task-state";

/**
 * Dringlichkeitsgruppen der Gesamtübersicht. Anders als die Kategorienansicht
 * eines Events fragt diese Liste nicht „wie weit ist der Bereich“, sondern
 * „was ist als Nächstes zu tun“ — quer über alle Events.
 */
export type QueueGroupKey = "overdue" | "thisWeek" | "blocked" | "later" | "done";

export const QUEUE_GROUP_LABEL: Record<QueueGroupKey, string> = {
  overdue: "Überfällig",
  thisWeek: "Diese Woche",
  blocked: "Blockiert",
  later: "Danach",
  done: "Erledigt",
};

export type QueueTask = TaskStateInput & { dueSoon?: boolean; endDate?: string | null };

/**
 * Einordnung einer Aufgabe. Überfällig schlägt alles, danach die anstehende
 * Woche, danach Blockaden — eine blockierte Aufgabe, die diese Woche fällig
 * ist, gehört in die Woche, weil sie dort Druck macht.
 */
export function queueGroupOf(task: QueueTask): QueueGroupKey {
  const state = taskState(task);
  if (state === "done") return "done";
  if (state === "overdue") return "overdue";
  if (task.dueSoon) return "thisWeek";
  if (state === "waiting") return "blocked";
  return "later";
}

export const QUEUE_ORDER: QueueGroupKey[] = ["overdue", "thisWeek", "blocked", "later", "done"];

/**
 * Gruppiert und sortiert in einem Durchgang: innerhalb einer Gruppe nach
 * Fälligkeit, Aufgaben ohne Enddatum ans Ende.
 */
export function groupTasksByUrgency<T extends QueueTask>(
  tasks: readonly T[],
): { key: QueueGroupKey; label: string; tasks: T[] }[] {
  const buckets = new Map<QueueGroupKey, T[]>(QUEUE_ORDER.map((key) => [key, []]));

  for (const task of tasks) buckets.get(queueGroupOf(task))?.push(task);

  return QUEUE_ORDER.map((key) => ({
    key,
    label: QUEUE_GROUP_LABEL[key],
    tasks: (buckets.get(key) ?? []).sort((a, b) =>
      (a.endDate ?? "9999-12-31").localeCompare(b.endDate ?? "9999-12-31"),
    ),
  })).filter((group) => group.tasks.length > 0);
}

export function queueCounts(tasks: readonly QueueTask[]): Record<QueueGroupKey, number> {
  const counts: Record<QueueGroupKey, number> = {
    overdue: 0,
    thisWeek: 0,
    blocked: 0,
    later: 0,
    done: 0,
  };
  for (const task of tasks) counts[queueGroupOf(task)] += 1;
  return counts;
}
