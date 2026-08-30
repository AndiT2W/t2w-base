import { afterEach, describe, expect, it, vi } from "vitest";
import { MicrosoftGraphClient } from "./outlook.graph.client.js";

describe("MicrosoftGraphClient messages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OUTLOOK_GRAPH_ACCESS_TOKEN;
  });

  it("reads every page of overview metadata from one Event folder", async () => {
    process.env.OUTLOOK_GRAPH_ACCESS_TOKEN = "test-token";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: [{ id: "mail-1", subject: "Erste Mail" }],
            "@odata.nextLink": "https://graph.microsoft.com/v1.0/next-page",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: [{ id: "mail-2", subject: "Zweite Mail" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      new MicrosoftGraphClient().listMessages("info@time2win.at", "event-folder"),
    ).resolves.toEqual([
      { id: "mail-1", subject: "Erste Mail" },
      { id: "mail-2", subject: "Zweite Mail" },
    ]);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "/users/info%40time2win.at/mailFolders/event-folder/messages?",
    );
  });
});
