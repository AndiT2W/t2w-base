import { describe, expect, it, vi } from "vitest";
import { createHttpSelectionListAdapter } from "./selection-list-adapter";

/**
 * Die Zugriffskarte im Adapter benennt alle Arten beim Aufbau, nicht erst beim
 * Aufruf — der Mock muss daher vollständig sein.  Genau das ist der Gewinn
 * gegenüber den früheren Fallunterscheidungen: eine vergessene Art fällt
 * jetzt hier auf und nicht erst im Betrieb.
 */
vi.mock("./api", () => ({
  apiManageSports: vi.fn().mockResolvedValue([{ id: "s", name: "Lauf", active: true }]),
  apiManageEventRoles: vi.fn().mockResolvedValue([{ id: "r", name: "Timing", active: true }]),
  apiManageServices: vi.fn().mockResolvedValue([{ id: "v", name: "UHF", active: true }]),
  apiManageHardwareObjects: vi.fn().mockResolvedValue([]),
  apiManageCommunicationChannels: vi.fn().mockResolvedValue([]),
  apiManageCommunicationTopics: vi.fn().mockResolvedValue([]),
  apiCreateSport: vi.fn().mockResolvedValue({ id: "s", name: "Lauf", active: true }),
  apiCreateEventRole: vi.fn().mockResolvedValue({ id: "r", name: "Timing", active: true }),
  apiCreateService: vi.fn().mockResolvedValue({ id: "v", name: "UHF", active: true }),
  apiCreateHardwareObject: vi.fn().mockResolvedValue({ id: "h", name: "Matte", active: true }),
  apiCreateCommunicationChannel: vi.fn().mockResolvedValue({ id: "c", name: "Mail", active: true }),
  apiCreateCommunicationTopic: vi.fn().mockResolvedValue({ id: "t", name: "Thema", active: true }),
  apiUpdateSport: vi.fn().mockResolvedValue({ id: "s", name: "Lauf", active: false }),
  apiUpdateEventRole: vi.fn().mockResolvedValue({ id: "r", name: "Timing", active: false }),
  apiUpdateService: vi.fn().mockResolvedValue({ id: "v", name: "UHF", active: false }),
  apiUpdateHardwareObject: vi.fn().mockResolvedValue({ id: "h", name: "Matte", active: false }),
  apiUpdateCommunicationChannel: vi
    .fn()
    .mockResolvedValue({ id: "c", name: "Mail", active: false }),
  apiUpdateCommunicationTopic: vi.fn().mockResolvedValue({ id: "t", name: "Thema", active: false }),
}));

describe("selection-list HTTP adapter", () => {
  it("keeps route choice behind the selection-list adapter seam", async () => {
    const adapter = createHttpSelectionListAdapter();
    await expect(adapter.load("sports")).resolves.toMatchObject([{ id: "s" }]);
    await expect(adapter.create("eventRoles", "Timing")).resolves.toMatchObject({ id: "r" });
    await expect(adapter.update("sports", "s", { active: false })).resolves.toMatchObject({
      active: false,
    });
  });

  it("führt Aufgabenkategorien auf die vorhandenen Projektmanagement-Endpunkte", async () => {
    const holen = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "g1", name: "Material", active: true }],
    });
    vi.stubGlobal("fetch", holen);

    const adapter = createHttpSelectionListAdapter();
    await adapter.load("taskCategories");
    await adapter.reorder("taskCategories", ["g1"]);

    expect(holen.mock.calls[0]?.[0]).toBe("/api/v1/project-management/groups");
    expect(holen.mock.calls[1]?.[0]).toBe("/api/v1/project-management/groups/reorder");
    vi.unstubAllGlobals();
  });
});
