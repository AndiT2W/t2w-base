import { describe, expect, it } from "vitest";
import {
  createTableBehavior,
  createTablePreferences,
  recoverVisibleColumns,
  sortTableRows,
} from "./table-model";
describe("table model", () => {
  it("recovers valid preferences", () => {
    expect(
      recoverVisibleColumns(["name", "removed"], ["name", "status", "email"] as const),
    ).toEqual(["name", "status", "email"]);
    expect(recoverVisibleColumns(undefined, ["name", "status"] as const)).toEqual([
      "name",
      "status",
    ]);
  });
  it("sorts locale-aware values stably", () => {
    const rows = [
      { name: "Äpfel", id: 1 },
      { name: "Apfel", id: 2 },
      { name: "Apfel", id: 3 },
    ];
    const column = { key: "name", sortValue: (row: (typeof rows)[number]) => row.name };
    expect(sortTableRows(rows, column, "asc").map((row) => row.id)).toEqual([2, 3, 1]);
    expect(sortTableRows(rows, column, "desc").map((row) => row.id)).toEqual([1, 2, 3]);
  });
  it("owns recovery and persistence through an in-memory adapter", () => {
    const values = new Map<string, string>();
    const preferences = createTablePreferences(
      {
        read: (key) => values.get(key) ?? null,
        write: (key, value) => void values.set(key, value),
        clear: (key) => void values.delete(key),
      },
      "columns",
      ["name", "email"] as const,
    );
    expect(preferences.load()).toEqual(["name", "email"]);
    expect(preferences.toggle(["name", "email"], "email")).toEqual(["name"]);
    expect(preferences.load()).toEqual(["name"]);
  });
  it("owns sorting and visibility behind one interface", () => {
    const values = new Map<string, string>();
    const rows = [
      { name: "Zehn", count: 10 },
      { name: "Zwei", count: 2 },
    ];
    const behavior = createTableBehavior({
      adapter: {
        read: (key) => values.get(key) ?? null,
        write: (key, value) => void values.set(key, value),
        clear: (key) => void values.delete(key),
      },
      storageKey: "table",
      columns: [
        { key: "name", sortValue: (row: (typeof rows)[number]) => row.name },
        { key: "count", sortValue: (row: (typeof rows)[number]) => row.count },
      ],
      initialSort: { key: "name", direction: "asc" },
    });
    expect(behavior.rows(rows).map((row) => row.name)).toEqual(["Zehn", "Zwei"]);
    behavior.sortBy("count");
    expect(behavior.rows(rows).map((row) => row.count)).toEqual([2, 10]);
    expect(behavior.toggleColumn("count").visibleColumns).toEqual(["name"]);
  });
});
