import { describe, expect, it, vi } from "vitest";
import { createSelectionListManagementWorkspace } from "./selection-list-management-workspace";
describe("Selection-list management workspace", () => {
  it("rejects blank names before crossing its interface", async () => {
    const create = vi.fn();
    const workspace = createSelectionListManagementWorkspace({
      create,
      update: vi.fn(),
      reorder: vi.fn(),
    });
    await expect(workspace.create("sports", "  ")).resolves.toEqual({ kind: "invalid" });
    expect(create).not.toHaveBeenCalled();
  });
});
