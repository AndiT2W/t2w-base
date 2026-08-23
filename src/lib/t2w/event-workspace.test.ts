import { describe, expect, it, vi } from "vitest";
import { createEventWorkspace } from "./event-workspace";
import type { T2WEvent } from "./types";

const event = {
  id: "e1",
  version: 3,
  eventcode: "260823_test",
  name: "Test",
  start: "2026-08-23",
  ende: "2026-08-23",
} as T2WEvent;

describe("Event workspace", () => {
  it("owns the Event collection and publishes only persisted creations", async () => {
    const created = { ...event, id: "e2", name: "Created" };
    const transport = {
      create: vi.fn().mockResolvedValue(created),
      save: vi.fn(),
      syncOutlook: vi.fn(),
      outlookPlan: vi.fn(),
    };
    const workspace = createEventWorkspace(transport);
    const snapshots: T2WEvent[][] = [];
    workspace.subscribe(() => snapshots.push(workspace.events()));
    workspace.load([event]);

    await expect(
      workspace.create({
        name: "Created",
        eventcode: "",
        veranstalter: "Org",
        ort: "Vienna",
        start: "2026-08-24",
        status: "anfrage",
        notizen: "",
      }),
    ).resolves.toEqual(created);
    expect(transport.create).toHaveBeenCalledWith(
      expect.objectContaining({ ende: "2026-08-24", teilnehmerprognose: 0 }),
    );
    expect(snapshots.at(-1)).toEqual([event, created]);
  });

  it("normalizes dates and returns the persisted Event before callers announce success", async () => {
    const saved = { ...event, version: 4, ende: "2026-08-23" };
    const transport = {
      create: vi.fn(),
      save: vi.fn().mockResolvedValue(saved),
      syncOutlook: vi.fn(),
      outlookPlan: vi.fn(),
    };
    const workspace = createEventWorkspace(transport);
    workspace.load([event]);

    await expect(
      workspace.save(event.id, { start: "2026-08-23", ende: "2026-08-20" }),
    ).resolves.toEqual({ kind: "saved", event: saved });
    expect(transport.save).toHaveBeenCalledWith(
      "e1",
      expect.objectContaining({ ende: "2026-08-23", version: 3 }),
    );
    expect(workspace.events()).toEqual([saved]);
  });

  it("returns an explicit version conflict without mutating the Event", async () => {
    const transport = {
      create: vi.fn(),
      save: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("conflict"), { code: "EVENT_VERSION_CONFLICT" }),
        ),
      syncOutlook: vi.fn(),
      outlookPlan: vi.fn(),
    };
    const workspace = createEventWorkspace(transport);
    workspace.load([event]);

    await expect(workspace.save(event.id, { name: "Changed" })).resolves.toEqual({
      kind: "conflict",
    });
    expect(workspace.events()).toEqual([event]);
  });

  it("synchronizes Outlook through the same interface", async () => {
    const synced = { ...event, outlookFolderSyncStatus: "SUCCESS" as const };
    const transport = {
      create: vi.fn(),
      save: vi.fn(),
      syncOutlook: vi.fn().mockResolvedValue(synced),
      outlookPlan: vi.fn(),
    };
    const workspace = createEventWorkspace(transport);
    workspace.load([event]);
    await expect(workspace.syncOutlook(event.id)).resolves.toEqual({
      kind: "synced",
      event: synced,
    });
    expect(workspace.events()).toEqual([synced]);
  });

  it("returns the backend-owned Outlook folder plan", async () => {
    const plan = { path: "06_auftraege_26/Q3/260823_test", drifted: true };
    const transport = {
      create: vi.fn(),
      save: vi.fn(),
      syncOutlook: vi.fn(),
      outlookPlan: vi.fn().mockResolvedValue(plan),
    };
    await expect(createEventWorkspace(transport).outlookPlan("e1")).resolves.toEqual(plan);
  });
});
