import { describe, expect, it } from "vitest";
import { groupTasksByUrgency, queueCounts, queueGroupOf, type QueueTask } from "./task-queue";

function task(patch: Partial<QueueTask> = {}): QueueTask {
  return { status: "OPEN", ...patch };
}

describe("queueGroupOf", () => {
  it("stellt überfällig an die Spitze", () => {
    expect(queueGroupOf(task({ overdue: true, dueSoon: true, blockedBy: ["a"] }))).toBe("overdue");
  });

  it("stellt die anstehende Woche vor eine Blockade", () => {
    expect(queueGroupOf(task({ dueSoon: true, blockedBy: ["a"] }))).toBe("thisWeek");
  });

  it("meldet blockierte Aufgaben ohne nahen Termin als blockiert", () => {
    expect(queueGroupOf(task({ blockedBy: ["a"] }))).toBe("blocked");
  });

  it("legt alles Übrige nach hinten", () => {
    expect(queueGroupOf(task())).toBe("later");
    expect(queueGroupOf(task({ status: "IN_PROGRESS" }))).toBe("later");
  });

  it("nimmt Erledigtes aus der Dringlichkeit heraus", () => {
    expect(queueGroupOf(task({ status: "DONE", overdue: true }))).toBe("done");
  });
});

describe("groupTasksByUrgency", () => {
  it("sortiert innerhalb der Gruppe nach Fälligkeit", () => {
    const groups = groupTasksByUrgency([
      task({ endDate: "2026-10-05", dueSoon: true }),
      task({ endDate: "2026-10-01", dueSoon: true }),
    ]);

    expect(groups[0]?.tasks.map((item) => item.endDate)).toEqual(["2026-10-01", "2026-10-05"]);
  });

  it("stellt Aufgaben ohne Enddatum ans Ende ihrer Gruppe", () => {
    const groups = groupTasksByUrgency([task({ endDate: null }), task({ endDate: "2026-10-01" })]);

    expect(groups[0]?.tasks.map((item) => item.endDate)).toEqual(["2026-10-01", null]);
  });

  it("lässt leere Gruppen weg", () => {
    const groups = groupTasksByUrgency([task({ overdue: true })]);

    expect(groups.map((group) => group.key)).toEqual(["overdue"]);
  });

  it("hält die Reihenfolge der Dringlichkeit ein", () => {
    const groups = groupTasksByUrgency([
      task({ status: "DONE" }),
      task(),
      task({ blockedBy: ["a"] }),
      task({ dueSoon: true }),
      task({ overdue: true }),
    ]);

    expect(groups.map((group) => group.key)).toEqual([
      "overdue",
      "thisWeek",
      "blocked",
      "later",
      "done",
    ]);
  });
});

describe("queueCounts", () => {
  it("zählt je Gruppe", () => {
    const counts = queueCounts([
      task({ overdue: true }),
      task({ overdue: true }),
      task({ dueSoon: true }),
      task({ blockedBy: ["a"] }),
      task({ status: "DONE" }),
    ]);

    expect(counts).toEqual({ overdue: 2, thisWeek: 1, blocked: 1, later: 0, done: 1 });
  });
});
