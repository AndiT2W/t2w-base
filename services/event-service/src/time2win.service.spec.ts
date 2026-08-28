import { afterEach, describe, expect, it, vi } from "vitest";
import { Time2winService } from "./time2win.service.js";

const event = {
  id: "55da2416-8dee-4cec-9af8-66c14d6296c5",
  t2wEventId: 42,
  participantCurrent: 17,
  time2winSnapshot: { eventId: 42, races: [] },
};

describe("Time2winService", () => {
  const apiKey = process.env.TIME2WIN_API_KEY;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (apiKey === undefined) delete process.env.TIME2WIN_API_KEY;
    else process.env.TIME2WIN_API_KEY = apiKey;
  });

  it("keeps the last successful participant snapshot when the API key is unavailable", async () => {
    delete process.env.TIME2WIN_API_KEY;
    const prisma = {
      event: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(event),
        update: vi.fn().mockResolvedValue(event),
        findMany: vi.fn(),
      },
    };
    const service = new Time2winService(prisma as never);

    await expect(service.syncEvent(event.id)).rejects.toThrow("TIME2WIN_API_KEY_NOT_CONFIGURED");
    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: event.id },
        data: expect.objectContaining({
          time2winSyncStatus: "ERROR",
          time2winLastError: "TIME2WIN_API_KEY_NOT_CONFIGURED",
        }),
      }),
    );
    expect(prisma.event.update.mock.calls[0][0].data).not.toHaveProperty("participantCurrent");
    expect(prisma.event.update.mock.calls[0][0].data).not.toHaveProperty("time2winSnapshot");
  });

  it("extracts nested event, race, and registration data for the TIME2WIN detail view", async () => {
    process.env.TIME2WIN_API_KEY = "test-key";
    const prisma = {
      event: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(event),
        update: vi.fn().mockResolvedValue(event),
        findMany: vi.fn(),
      },
    };
    vi.stubGlobal("fetch", vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        data: { event: { name: "Ostseeman 2027", sport: { name: "Triathlon" } }, races: [{ race: { id: 11, name: "Olympische Distanz" } }] },
      }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { statistics: { registered: 128 } } }) }));
    const service = new Time2winService(prisma as never);

    await service.syncEvent(event.id);

    expect(prisma.event.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        participantCurrent: 128,
        time2winSnapshot: expect.objectContaining({
          name: "Ostseeman 2027",
          sportName: "Triathlon",
          races: [{ id: 11, name: "Olympische Distanz", participantCount: 128 }],
        }),
      }),
    }));
  });
});
