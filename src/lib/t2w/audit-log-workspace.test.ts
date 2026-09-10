import { describe, expect, it, vi } from "vitest";
import type { ApiAuditLog } from "./api";
import { createAuditLogWorkspace } from "./audit-log-workspace";

const entry = (overrides: Partial<ApiAuditLog> = {}): ApiAuditLog => ({
  id: "audit-1",
  entity: "Event",
  entityId: "event-42",
  action: "updated",
  details: { name: "City Run" },
  createdAt: "2026-09-10T08:30:00.000Z",
  user: { displayName: "Ada Lovelace", email: "ada@example.com" },
  ...overrides,
});

describe("Audit log workspace", () => {
  it("loads an entity selection and filters the result locally", async () => {
    const load = vi
      .fn()
      .mockResolvedValue([
        entry(),
        entry({ id: "audit-2", entityId: "other", details: { name: "Different race" } }),
      ]);
    const workspace = createAuditLogWorkspace({ load });

    await workspace.selectEntity("Event");
    workspace.search("city run");

    expect(load).toHaveBeenCalledWith({ entity: "Event" });
    expect(workspace.snapshot().visibleEntries.map(({ id }) => id)).toEqual(["audit-1"]);
  });

  it("keeps existing entries and exposes an error when refreshing fails", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce([entry()])
      .mockRejectedValueOnce(new Error("offline"));
    const workspace = createAuditLogWorkspace({ load });
    await workspace.load();

    await workspace.selectEntity("Payout");

    expect(workspace.snapshot()).toMatchObject({
      entries: [expect.objectContaining({ id: "audit-1" })],
      loading: false,
      error: "AUDIT_LOG_LOAD_FAILED",
    });
  });

  it("ignores a late response from an older request", async () => {
    let finishFirst!: (entries: ApiAuditLog[]) => void;
    const first = new Promise<ApiAuditLog[]>((resolve) => (finishFirst = resolve));
    const load = vi
      .fn()
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce([entry({ id: "latest" })]);
    const workspace = createAuditLogWorkspace({ load });

    const olderRequest = workspace.load();
    await workspace.selectEntity("Hardware");
    finishFirst([entry({ id: "stale" })]);
    await olderRequest;

    expect(workspace.snapshot().entries.map(({ id }) => id)).toEqual(["latest"]);
  });

  it("exports only visible entries as escaped CSV", async () => {
    const workspace = createAuditLogWorkspace({
      load: vi
        .fn()
        .mockResolvedValue([
          entry({ action: 'renamed "event"' }),
          entry({ id: "audit-2", entityId: "hidden" }),
        ]),
    });
    await workspace.load();
    workspace.search("event-42");

    const file = workspace.exportCsv(new Date("2026-09-10T12:00:00.000Z"));

    expect(file.fileName).toBe("auditlog-2026-09-10.csv");
    expect(file.contents).toContain('"renamed ""event"""');
    expect(file.contents).not.toContain("hidden");
  });
});
