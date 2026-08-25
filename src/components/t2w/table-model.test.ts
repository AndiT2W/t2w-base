import { describe, expect, it } from "vitest";
import { recoverVisibleColumns, sortTableRows } from "./table-model";
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
});
