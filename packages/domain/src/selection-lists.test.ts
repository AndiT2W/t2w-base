import { describe, expect, it, vi } from "vitest";
import {
  SelectionLists,
  createSelectionListWorkspace,
  eventContactRoleChoices,
  selectionListChoices,
  type SelectionListAdapter,
} from "./selection-lists.js";

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
  it("offers active values and retains an assigned inactive value", () => {
    const choices = selectionListChoices(
      [
        { id: "s1", name: "Triathlon", active: true },
        { id: "s2", name: "Laufen", active: false },
      ],
      "s2",
    );

    expect(choices.map((choice) => choice.id)).toEqual(["s1", "s2"]);
  });

  it("offers inactive Event roles only for an existing assignment", () => {
    const roles = [
      { id: "r1", name: "Anmeldung", active: true },
      { id: "r2", name: "Finanz", active: false },
    ];
    expect(eventContactRoleChoices(roles)).toEqual(["Kontakt", "Anmeldung"]);
    expect(eventContactRoleChoices(roles, "Finanz")).toEqual(["Finanz", "Kontakt", "Anmeldung"]);
  });

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
