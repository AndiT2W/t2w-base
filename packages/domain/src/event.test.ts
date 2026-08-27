import { describe, expect, it, vi } from "vitest";
import { createEventWorkspace, type EventRecord, type EventTransport } from "./event.js";

type TestEvent = EventRecord & { name: string; status: string };
const event: TestEvent = {
  id: "event-1",
  version: 3,
  name: "Mountain Attack",
  status: "ANFRAGE",
  start: "2027-01-15",
  ende: "2027-01-15",
};

function transport(overrides: Partial<EventTransport<TestEvent>> = {}) {
  return {
    create: vi.fn(),
    save: vi.fn(),
    syncOutlook: vi.fn(),
    outlookPlan: vi.fn(),
    ...overrides,
  } satisfies EventTransport<TestEvent>;
}

describe("Event workspace editing lifecycle", () => {
  it("accepts refreshed Event state after a detail command", async () => {
    const refreshed = { ...event, version: 4, name: "Mountain Attack 2027" };
    const persistence = transport({ createTask: vi.fn().mockResolvedValue(refreshed) });
    const workspace = createEventWorkspace(persistence);
    workspace.load([event]);
    const session = workspace.openSession(event.id);

    await expect(session.createTask({ title: "Briefing" })).resolves.toEqual({
      kind: "saved",
      event: refreshed,
    });
    expect(session.snapshot()).toEqual(refreshed);
    expect(workspace.events()).toEqual([refreshed]);
  });

  it("keeps draft and collection unchanged after a version conflict", async () => {
    const persistence = transport({
      save: vi.fn().mockRejectedValue(Object.assign(new Error("conflict"), { code: "EVENT_VERSION_CONFLICT" })),
    });
    const workspace = createEventWorkspace(persistence);
    workspace.load([event]);
    const session = workspace.openSession(event.id);
    session.update({ name: "Local draft" });

    await expect(session.save()).resolves.toEqual({ kind: "conflict" });
    expect(session.snapshot().name).toBe("Local draft");
    expect(workspace.events()).toEqual([event]);
  });
});
