import { describe, expect, it, vi } from "vitest";
import { hardwareLifecycle } from "./hardware-lifecycle";

describe("hardwareLifecycle", () => {
  it("uses the central and Event-detail seams without exposing URL rules to callers", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: "h1" }) });
    vi.stubGlobal("fetch", fetchMock);
    await hardwareLifecycle.save({ eventId: "event-1" }, { id: "h1", status: "RETURNED" });
    await hardwareLifecycle.save({}, { recipientName: "Ada" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/events/event-1/hardware/h1");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/events/hardware");
    vi.unstubAllGlobals();
  });
});
