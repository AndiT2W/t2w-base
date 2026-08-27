import { describe, expect, it } from "vitest";
import {
  createSelectionListWorkspace,
  type SelectionListAdapter,
} from "./selection-list-workspace";

describe("selection list workspace", () => {
  it("owns management snapshots and active values", async () => {
    const values = {
      sports: [{ id: "s1", name: "Triathlon", active: true }],
      eventRoles: [{ id: "r1", name: "Finanz", active: false }],
    };
    const adapter: SelectionListAdapter = {
      load: async (kind) => values[kind],
      create: async (_kind, name) => ({ id: "new", name, active: true }),
      update: async (kind, id, patch) => ({
        ...values[kind].find((value) => value.id === id)!,
        ...patch,
      }),
    };
    const workspace = createSelectionListWorkspace(adapter);
    await workspace.load();
    expect(workspace.active("eventRoles")).toEqual([]);
    await workspace.update("eventRoles", "r1", { active: true });
    expect(workspace.active("eventRoles").map((value) => value.name)).toEqual(["Finanz"]);
    await workspace.create("sports", "Laufen");
    expect(workspace.snapshot().sports.map((value) => value.name)).toEqual(["Laufen", "Triathlon"]);
  });
});
