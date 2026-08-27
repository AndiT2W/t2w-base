import { describe, expect, it } from "vitest";
import { createTablePreferences, recoverVisibleColumns, sortTableRows } from "./table-model";
describe("table model", () => {
  it("recovers valid preferences", () => {
    expect(recoverVisibleColumns(["name", "removed"], ["name", "status", "email"] as const)).toEqual(["name", "status", "email"]);
    expect(recoverVisibleColumns(undefined, ["name", "status"] as const)).toEqual(["name", "status"]);
  });
  it("sorts locale-aware values stably", () => {
    const rows = [{ name: "Äpfel", id: 1 }, { name: "Apfel", id: 2 }, { name: "Apfel", id: 3 }];
    const column = { key: "name", sortValue: (row: (typeof rows)[number]) => row.name };
    expect(sortTableRows(rows, column, "asc").map((row) => row.id)).toEqual([2, 3, 1]);
    expect(sortTableRows(rows, column, "desc").map((row) => row.id)).toEqual([1, 2, 3]);
  });
  it("owns recovery and persistence through an in-memory adapter", () => {
    const values = new Map<string, string>();
    const preferences = createTablePreferences({ read: (key) => values.get(key) ?? null, write: (key, value) => void values.set(key, value), clear: (key) => void values.delete(key) }, "columns", ["name", "email"] as const);
    expect(preferences.load()).toEqual(["name", "email"]);
    expect(preferences.toggle(["name", "email"], "email")).toEqual(["name"]);
    expect(preferences.load()).toEqual(["name"]);
  });
});
