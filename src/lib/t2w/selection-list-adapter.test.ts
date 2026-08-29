import { describe, expect, it, vi } from "vitest";
import { createHttpSelectionListAdapter } from "./selection-list-adapter";

vi.mock("./api", () => ({
  apiManageSports: vi.fn().mockResolvedValue([{ id: "s", name: "Lauf", active: true }]),
  apiManageEventRoles: vi.fn().mockResolvedValue([{ id: "r", name: "Timing", active: true }]),
  apiCreateSport: vi.fn().mockResolvedValue({ id: "s", name: "Lauf", active: true }),
  apiCreateEventRole: vi.fn().mockResolvedValue({ id: "r", name: "Timing", active: true }),
  apiUpdateSport: vi.fn().mockResolvedValue({ id: "s", name: "Lauf", active: false }),
  apiUpdateEventRole: vi.fn().mockResolvedValue({ id: "r", name: "Timing", active: false }),
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
});
