import type { Task } from "@t2w/domain/project-management";

/**
 * Der Arbeitszustand einer Aufgabe, wie ihn die Oberfläche zeigt. Er fasst
 * Arbeitsstatus, Fälligkeit und offene Vorgänger zu einem Wert zusammen; das
 * Datenmodell kennt ihn nicht.
 */
export type TaskState = "done" | "overdue" | "waiting" | "active" | "open";

export type TaskStateInput = Pick<Task, "status"> & {
  overdue?: boolean;
  blockedBy?: readonly string[];
};

export const TASK_STATE_LABEL: Record<TaskState, string> = {
  done: "Erledigt",
  overdue: "Überfällig",
  waiting: "Wartet",
  active: "In Arbeit",
  open: "Offen",
};

/**
 * Reihenfolge der Prüfung ist die Reihenfolge der Dringlichkeit: erledigt
 * schlägt alles, danach überfällig, danach blockiert. Eine erledigte Aufgabe
 * gilt nie als überfällig, auch wenn sie zu spät fertig wurde — das entspricht
 * `projectTaskPortfolio`, wo `overdue` nur für offene Aufgaben gesetzt wird.
 */
export function taskState(task: TaskStateInput): TaskState {
  if (task.status === "DONE") return "done";
  if (task.overdue) return "overdue";
  if (task.blockedBy?.length) return "waiting";
  if (task.status === "IN_PROGRESS") return "active";
  return "open";
}

export type TaskProgressCounts = {
  done: number;
  active: number;
  overdue: number;
  open: number;
  total: number;
};

/**
 * Zählt die Zustände einer Kategorie für den dreigeteilten Fortschrittsbalken.
 * `total` bleibt die Gesamtzahl der Aufgaben, unabhängig davon, was die Ansicht
 * gerade eingeklappt hat — der Balken zeigt immer die ganze Kategorie.
 *
 * Wartende Aufgaben zählen als offen: der Balken zeigt Fortschritt, nicht
 * Blockaden. Die stehen im Ablauf darunter.
 */
export function taskProgressCounts(tasks: readonly TaskStateInput[]): TaskProgressCounts {
  const counts: TaskProgressCounts = {
    done: 0,
    active: 0,
    overdue: 0,
    open: 0,
    total: tasks.length,
  };

  for (const task of tasks) {
    const state = taskState(task);
    if (state === "done") counts.done += 1;
    else if (state === "overdue") counts.overdue += 1;
    else if (state === "active") counts.active += 1;
    else counts.open += 1;
  }

  return counts;
}
