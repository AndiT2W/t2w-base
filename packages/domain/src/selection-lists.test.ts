import { describe, expect, it, vi } from "vitest";
import { SelectionLists, createSelectionListWorkspace, type SelectionListAdapter } from "./selection-lists.js";

const values = {
  sports: [{ id: "s1", name: "Triathlon", active: true }],
  eventRoles: [{ id: "r1", name: "Finanz", active: false }],
};
const adapter = (): SelectionListAdapter => ({
  load: vi.fn(async (kind) => values[kind]),
  create: vi.fn(async (_kind, name) => ({ id: "new", name, active: true })),
  update: vi.fn(async (kind, id, patch) => ({ ...values[kind].find((value) => value.id === id)!, ...patch })),
});

describe("Selection lists", () => {
  it("owns active visibility for every registered kind", async () => {
    const lists = new SelectionLists(adapter());
    await expect(lists.list("eventRoles")).resolves.toEqual([]);
    await expect(lists.list("eventRoles", true)).resolves.toEqual(values.eventRoles);
  });

  it("normalizes names once for backend commands and browser state", async () => {
    const persistence = adapter();
    const workspace = createSelectionListWorkspace(persistence);
    await workspace.load();
    await workspace.create("sports", "  Laufen  ");
    expect(persistence.create).toHaveBeenCalledWith("sports", "Laufen");
    expect(workspace.snapshot().sports.map((value) => value.name)).toEqual(["Laufen", "Triathlon"]);
  });
});
