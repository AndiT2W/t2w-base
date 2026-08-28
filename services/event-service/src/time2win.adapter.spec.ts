import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpTime2winAdapter } from "./time2win.adapter.js";

describe("HttpTime2winAdapter", () => {
  const apiKey = process.env.TIME2WIN_API_KEY;
  afterEach(() => {
    vi.unstubAllGlobals();
    if (apiKey === undefined) delete process.env.TIME2WIN_API_KEY;
    else process.env.TIME2WIN_API_KEY = apiKey;
  });

  it("normalizes the flat production response", async () => {
    process.env.TIME2WIN_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_name: "OstseeMan 2027", type_name: "Triathlon", races: [{ race_id: 7709, race_name: "Langdistanz" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ races: [{ race_id: 7709, participants_count: 300 }] }) }));

    await expect(new HttpTime2winAdapter().snapshot(42)).resolves.toEqual({
      eventId: 42,
      name: "OstseeMan 2027",
      sportName: "Triathlon",
      races: [{ id: 7709, name: "Langdistanz", participantCount: 300 }],
    });
  });

  it("fails before transport when authentication is missing", async () => {
    delete process.env.TIME2WIN_API_KEY;
    await expect(new HttpTime2winAdapter().snapshot(42)).rejects.toThrow("TIME2WIN_API_KEY_NOT_CONFIGURED");
  });
});
