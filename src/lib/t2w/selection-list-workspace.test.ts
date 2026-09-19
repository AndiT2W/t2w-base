import { describe, expect, it } from "vitest";
import {
  createSelectionListWorkspace,
  type SelectionListAdapter,
  type SelectionListKind,
  type SelectionListValue,
} from "./selection-list-workspace";

describe("selection list workspace", () => {
  it("owns management snapshots and active values", async () => {
    const values: Record<SelectionListKind, SelectionListValue[]> = {
      sports: [{ id: "s1", name: "Triathlon", active: true }],
      eventRoles: [{ id: "r1", name: "Finanz", active: false }],
      services: [{ id: "service-1", name: "UHF", active: true }],
      hardwareObjects: [{ id: "hardware-1", name: "Active Transponder", active: true }],
      communicationChannels: [{ id: "channel-1", name: "E-Mail", active: true }],
      communicationTopics: [{ id: "topic-1", name: "Teilnehmer", active: true }],
    };
    const adapter: SelectionListAdapter = {
      load: async (kind) => values[kind],
      create: async (_kind, name) => ({ id: "new", name, active: true }),
      update: async (kind, id, patch) => ({
        ...values[kind].find((value) => value.id === id)!,
        ...patch,
      }),
      reorder: async (kind, ids) => ids.map((id) => values[kind].find((value) => value.id === id)!),
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
