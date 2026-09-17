import { describe, expect, it } from "vitest";
import { taskProgressCounts, taskState, type TaskStateInput } from "./task-state";

function task(
  status: TaskStateInput["status"],
  extra: Omit<TaskStateInput, "status"> = {},
): TaskStateInput {
  return { status, ...extra };
}

describe("taskState", () => {
  it("meldet erledigte Aufgaben als erledigt", () => {
    expect(taskState(task("DONE"))).toBe("done");
  });

  it("hält eine verspätet erledigte Aufgabe erledigt, nicht überfällig", () => {
    expect(taskState(task("DONE", { overdue: true }))).toBe("done");
  });

  it("stellt überfällig vor blockiert", () => {
    expect(taskState(task("OPEN", { overdue: true, blockedBy: ["a"] }))).toBe("overdue");
  });

  it("meldet offene Vorgänger als wartend", () => {
    expect(taskState(task("OPEN", { blockedBy: ["a"] }))).toBe("waiting");
  });

  it("meldet eine begonnene Aufgabe ohne Vorgänger als in Arbeit", () => {
    expect(taskState(task("IN_PROGRESS"))).toBe("active");
  });

  it("meldet eine begonnene Aufgabe mit offenem Vorgänger als wartend", () => {
    expect(taskState(task("IN_PROGRESS", { blockedBy: ["a"] }))).toBe("waiting");
  });

  it("meldet alles Übrige als offen", () => {
    expect(taskState(task("OPEN"))).toBe("open");
    expect(taskState(task("OPEN", { blockedBy: [] }))).toBe("open");
  });
});

describe("taskProgressCounts", () => {
  it("zählt die Segmente des Fortschrittsbalkens", () => {
    const counts = taskProgressCounts([
      task("DONE"),
      task("DONE"),
      task("IN_PROGRESS"),
      task("OPEN", { overdue: true }),
      task("OPEN"),
    ]);

    expect(counts).toEqual({ done: 2, active: 1, overdue: 1, open: 1, total: 5 });
  });

  it("zählt wartende Aufgaben als offen", () => {
    const counts = taskProgressCounts([task("OPEN", { blockedBy: ["a"] }), task("OPEN")]);

    expect(counts).toEqual({ done: 0, active: 0, overdue: 0, open: 2, total: 2 });
  });

  it("liefert für eine leere Kategorie lauter Nullen", () => {
    expect(taskProgressCounts([])).toEqual({ done: 0, active: 0, overdue: 0, open: 0, total: 0 });
  });
});
