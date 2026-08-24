import { describe, expect, it, vi } from "vitest";
import { createSettingsWorkspace } from "./settings-workspace";
const empty = { outlookJahresordner: [], jahresSites: [], outlookMailbox: null };
describe("Settings workspace", () => {
  it("does not overwrite an edited draft when server settings arrive late", () => {
    const workspace = createSettingsWorkspace({ save: vi.fn(), checkOutlook: vi.fn() }, empty);
    workspace.update({ outlookMailbox: "editing@example.com" });
    workspace.acceptLoaded({ ...empty, outlookMailbox: "server@example.com" });
    expect(workspace.snapshot().draft.outlookMailbox).toBe("editing@example.com");
  });
  it("normalizes years and reports persisted save outcomes", async () => {
    const save = vi.fn(async (value) => value);
    const workspace = createSettingsWorkspace({ save, checkOutlook: vi.fn() }, empty);
    workspace.update({
      jahresSites: [
        { jahr: "2025", url: "a" },
        { jahr: "2027", url: "b" },
      ],
    });
    await expect(workspace.save()).resolves.toMatchObject({ kind: "saved" });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        jahresSites: [
          { jahr: "2027", url: "b" },
          { jahr: "2025", url: "a" },
        ],
      }),
    );
  });
});
