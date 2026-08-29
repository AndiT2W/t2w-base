import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpTime2winAdapter } from "./time2win.adapter.js";

describe("HttpTime2winAdapter", () => {
  const apiKey = process.env.TIME2WIN_API_KEY;
  const apiBaseUrl = process.env.TIME2WIN_API_BASE_URL;
  afterEach(() => {
    vi.unstubAllGlobals();
    if (apiKey === undefined) delete process.env.TIME2WIN_API_KEY;
    else process.env.TIME2WIN_API_KEY = apiKey;
    if (apiBaseUrl === undefined) delete process.env.TIME2WIN_API_BASE_URL;
    else process.env.TIME2WIN_API_BASE_URL = apiBaseUrl;
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

  it("uses the legacy API endpoint when no base URL is configured", async () => {
    process.env.TIME2WIN_API_KEY = "test-key";
    delete process.env.TIME2WIN_API_BASE_URL;
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_name: "Legacy event", type_name: "Run", races: [{ race_id: 7, race_name: "Main race" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ races: [{ race_id: 7, participants_count: 120 }] }) });
    vi.stubGlobal("fetch", fetch);

    await expect(new HttpTime2winAdapter().snapshot(42)).resolves.toEqual({
      eventId: 42,
      name: "Legacy event",
      sportName: "Run",
      races: [{ id: 7, name: "Main race", participantCount: 120 }],
    });

    expect(fetch.mock.calls).toEqual([
      ["https://time2win.at/api/1.1/event/42/eventdata", { headers: { Authorization: "Bearer test-key" } }],
      ["https://time2win.at/api/1.1/participants/42/stats?race_id=7", { headers: { Authorization: "Bearer test-key" } }],
    ]);
  });

  it("uses the configured Data Hub endpoint for synchronization", async () => {
    process.env.TIME2WIN_API_KEY = "test-key";
    process.env.TIME2WIN_API_BASE_URL = "https://data-hub.time2win.at/";
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_name: "Data Hub event", type_name: "Triathlon", races: [{ race_id: 8, race_name: "Sprint" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ races: [{ race_id: 8, participants_count: 240 }] }) });
    vi.stubGlobal("fetch", fetch);

    await expect(new HttpTime2winAdapter().snapshot(42)).resolves.toEqual({
      eventId: 42,
      name: "Data Hub event",
      sportName: "Triathlon",
      races: [{ id: 8, name: "Sprint", participantCount: 240 }],
    });

    expect(fetch.mock.calls).toEqual([
      ["https://data-hub.time2win.at/event/42/eventdata", { headers: { Authorization: "Bearer test-key" } }],
      ["https://data-hub.time2win.at/participants/42/stats?race_id=8", { headers: { Authorization: "Bearer test-key" } }],
    ]);
  });
});
