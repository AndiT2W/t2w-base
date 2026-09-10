import { describe, expect, it } from "vitest";
import {
  projectTasks,
  validateDependency,
  validateTaskChange,
  type Task,
} from "./project-management.js";

const task = (id: string, values: Partial<Task> = {}): Task => ({
  id,
  eventId: "event",
  title: id,
  status: "NEW",
  priority: "NORMAL",
  ownerId: "owner",
  groupId: "group",
  nextStep: "Bearbeiten",
  result: "",
  reason: "",
  dueType: "NONE",
  dueDate: null,
  dueAt: null,
  version: 1,
  ...values,
});
const catalogue = {
  owners: [{ id: "owner", active: true }],
  groups: [{ id: "group", active: true }],
};
describe("project management workspace rules", () => {
  it("orders a real chain by its dependencies and detects mixed deadline contradictions", () => {
    const tasks = [
      task("a", { dueType: "INSTANT", dueAt: "2026-11-01T12:00:00Z" }),
      task("z", { dueType: "DATE", dueDate: "2026-12-01" }),
    ];
    const state = projectTasks(
      tasks,
      [{ predecessorId: "z", successorId: "a" }],
      catalogue,
      "Europe/Vienna",
      "2026-09-10T12:00:00Z",
    );
    expect(state.flows).toEqual([["z", "a"]]);
    expect(state.tasks[0]?.reasons).toContain("Terminwiderspruch: z");
  });
  it("keeps planned dependencies neutral, and evaluates day deadlines in the event timezone across DST", () => {
    const tasks = [
      task("a", { dueType: "DATE", dueDate: "2026-10-25" }),
      task("b", { priority: "HIGH" }),
    ];
    const edges = [{ predecessorId: "a", successorId: "b" }];
    expect(
      projectTasks(tasks, edges, catalogue, "Europe/Vienna", "2026-10-25T22:59:59Z").categories[0]
        ?.summary,
    ).toBe("Alles im Plan");
    expect(
      projectTasks(tasks, edges, catalogue, "Europe/Vienna", "2026-10-25T23:00:00Z").tasks[0]
        ?.overdue,
    ).toBe(true);
    expect(
      projectTasks(tasks, edges, catalogue, "Europe/Vienna", "2026-10-25T23:00:00Z").tasks[1]
        ?.overdue,
    ).toBe(false);
  });
  it("preserves terminal results and detects reopened transitive prerequisites", () => {
    const tasks = [task("a"), task("b", { status: "DONE", result: "Ergebnis bleibt" }), task("c")];
    const edges = [
      { predecessorId: "a", successorId: "b" },
      { predecessorId: "b", successorId: "c" },
    ];
    const state = projectTasks(tasks, edges, catalogue, "Europe/Vienna", "2026-09-10T12:00:00Z");
    expect(state.tasks[1]).toMatchObject({
      status: "DONE",
      result: "Ergebnis bleibt",
      reasons: ["Voraussetzung erneut prüfen"],
    });
    expect(() =>
      validateTaskChange(
        tasks[2]!,
        { ...tasks[2]!, status: "IN_PROGRESS" },
        tasks,
        edges,
        catalogue,
      ),
    ).toThrow("a");
  });
  it("does not treat empty or cancelled categories as completed", () => {
    expect(
      projectTasks([], [], catalogue, "Europe/Vienna", "2026-09-10T12:00:00Z").categories[0]
        ?.summary,
    ).toBe("Keine Aufgaben erfasst");
    expect(
      projectTasks(
        [task("a", { status: "CANCELLED" })],
        [],
        catalogue,
        "Europe/Vienna",
        "2026-09-10T12:00:00Z",
      ).categories[0]?.summary,
    ).toBe("Alle erfassten Aufgaben storniert");
  });
  it("requires all predecessors and rejects cycles", () => {
    const tasks = [task("a", { status: "DONE" }), task("b"), task("c")];
    const edges = [
      { predecessorId: "a", successorId: "c" },
      { predecessorId: "b", successorId: "c" },
    ];
    expect(() =>
      validateTaskChange(
        tasks[2]!,
        { ...tasks[2]!, status: "IN_PROGRESS" },
        tasks,
        edges,
        catalogue,
      ),
    ).toThrow("b");
    expect(() =>
      validateDependency(tasks, edges, { predecessorId: "c", successorId: "a" }),
    ).toThrow();
    expect(
      projectTasks(tasks, edges, catalogue, "Europe/Vienna", "2026-09-10T10:00:00Z").tasks.find(
        (t) => t.id === "c",
      )?.blockedBy,
    ).toEqual(["b"]);
  });
});
