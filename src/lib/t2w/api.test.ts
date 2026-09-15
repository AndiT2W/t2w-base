import { afterEach, describe, expect, it, vi } from "vitest";
import { apiEvents } from "./api";

const eventResponse = (id: string) => ({
  id,
  eventCode: `260901_event_${id}`,
  name: `Event ${id}`,
  status: "ANFRAGE",
  startAt: "2026-09-01T00:00:00.000Z",
  endAt: "2026-09-01T00:00:00.000Z",
  location: null,
  responsible: null,
  participantForecast: null,
  participantCurrent: null,
  notes: null,
  outlookFolder: null,
  outlookWebUrl: null,
  sharepointFolder: null,
  archived: false,
});

afterEach(() => vi.unstubAllGlobals());

describe("apiEvents", () => {
  it("loads every 500-row page instead of silently truncating the event catalogue", async () => {
    const firstPage = Array.from({ length: 500 }, (_, index) => eventResponse(String(index)));
    const secondPage = [eventResponse("500")];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(firstPage), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(secondPage), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiEvents()).resolves.toHaveLength(501);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/events?limit=500&offset=0", {
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/events?limit=500&offset=500", {
      credentials: "include",
    });
  });
});
