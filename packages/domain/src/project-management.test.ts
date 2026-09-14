import { describe, expect, it } from "vitest";
import {
  projectTaskPortfolio,
  projectTaskPortfolios,
  projectTaskReadiness,
  validateDependency,
  validateTaskChange,
  type Task,
} from "./project-management.js";
const catalogue = {
  owners: [{ id: "owner", active: true }],
  groups: [{ id: "group", active: true }],
};
const task = (id: string, changes: Partial<Task> = {}): Task => ({
  id,
  scope: "EVENT",
  eventId: "event",
  title: id,
  description: "",
  status: "OPEN",
  priority: "NORMAL",
  ownerId: "owner",
  groupId: "group",
  startDate: null,
  endDate: null,
  version: 1,
  ...changes,
});
describe("project management v4", () => {
  it("models a sequential workflow with parallel stages and blocks only completion", () => {
    const tasks = [task("design"), task("setup"), task("print")];
    const edges = [
      { predecessorId: "design", successorId: "setup" },
      { predecessorId: "setup", successorId: "print" },
    ];
    const result = projectTaskPortfolio(tasks, edges, catalogue, "2026-09-14T12:00:00Z");
    expect(result.flows).toEqual([[["design"], ["setup"], ["print"]]]);
    expect(result.tasks.find((item) => item.id === "print")?.blockedBy).toEqual(["setup"]);
    expect(() =>
      validateTaskChange(tasks[2]!, { ...tasks[2]!, status: "DONE" }, tasks, edges, catalogue),
    ).toThrow("setup");
    expect(() =>
      validateTaskChange(
        tasks[2]!,
        { ...tasks[2]!, status: "IN_PROGRESS" },
        tasks,
        edges,
        catalogue,
      ),
    ).not.toThrow();
  });
  it("rejects cross-context and cyclic prerequisites", () => {
    const tasks = [task("a"), task("b"), task("global", { scope: "GLOBAL", eventId: null })];
    expect(() =>
      validateDependency(tasks, [], { predecessorId: "global", successorId: "a" }),
    ).toThrow("selben Kontext");
    expect(() =>
      validateDependency(tasks, [{ predecessorId: "a", successorId: "b" }], {
        predecessorId: "b",
        successorId: "a",
      }),
    ).toThrow("Zyklische");
  });
  it("derives category health from overdue, blocked, due-soon and active work", () => {
    const reference = "2026-09-14T12:00:00Z";
    expect(
      projectTaskPortfolio([task("late", { endDate: "2026-09-13" })], [], catalogue, reference)
        .categories[0]?.health,
    ).toBe("critical");
    expect(
      projectTaskPortfolio([task("soon", { endDate: "2026-09-21" })], [], catalogue, reference)
        .categories[0]?.health,
    ).toBe("warning");
    expect(
      projectTaskPortfolio([task("work", { status: "IN_PROGRESS" })], [], catalogue, reference)
        .categories[0]?.health,
    ).toBe("active");
    expect(
      projectTaskPortfolio([task("done", { status: "DONE" })], [], catalogue, reference)
        .categories[0]?.health,
    ).toBe("done");
  });
  it("projects Event readiness without mixing in global work", () => {
    expect(
      projectTaskReadiness(
        [
          task("open", { endDate: "2026-09-13" }),
          task("done", { status: "DONE", endDate: "2026-09-01" }),
        ],
        "2026-09-14T12:00:00Z",
      ),
    ).toEqual({ openCount: 1, overdueCount: 1 });
  });
  it("keeps Event and global portfolio flows in separate planning scopes", () => {
    const portfolios = projectTaskPortfolios(
      [task("event"), task("global", { scope: "GLOBAL", eventId: null })],
      [],
      catalogue,
      "2026-09-14T12:00:00Z",
    );
    expect(portfolios.map((portfolio) => [portfolio.scope, portfolio.eventId])).toEqual([
      ["EVENT", "event"],
      ["GLOBAL", null],
    ]);
  });
  it("requires a title and coherent optional calendar dates", () => {
    const base = task("a");
    expect(() => validateTaskChange(null, { ...base, title: "" }, [], [], catalogue)).toThrow(
      "Titel",
    );
    expect(() =>
      validateTaskChange(
        null,
        { ...base, startDate: "2026-10-02", endDate: "2026-10-01" },
        [],
        [],
        catalogue,
      ),
    ).toThrow("Ende");
    expect(() =>
      validateTaskChange(null, { ...base, startDate: "bad" }, [], [], catalogue),
    ).toThrow("Gültiges");
  });
});
