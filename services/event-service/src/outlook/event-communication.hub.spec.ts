import { describe, expect, it, vi } from "vitest";
import {
  EventCommunicationHub,
  type EventCommunicationRepository,
} from "./event-communication.hub.js";
import type { OutlookGraphClient } from "./outlook.types.js";

describe("EventCommunicationHub", () => {
  it("synchronizes an Event folder idempotently and returns the refreshed Event", async () => {
    const repository: EventCommunicationRepository = {
      source: vi.fn().mockResolvedValue({ mailbox: "info@time2win.at", folderId: "event-folder" }),
      begin: vi.fn(),
      store: vi.fn(),
      succeed: vi.fn().mockResolvedValue({ id: "event-1", outlookMessageSyncStatus: "SUCCESS" }),
      fail: vi.fn(),
    };
    const graph: OutlookGraphClient = {
      listChildFolders: vi.fn(),
      createChildFolder: vi.fn(),
      listMessages: vi.fn().mockResolvedValue([
        {
          id: "mail-1",
          subject: "Startzeit bestätigt",
          bodyPreview: "Der Start bleibt um 09:00 Uhr.",
          receivedDateTime: "2026-08-30T08:15:00.000Z",
          from: { emailAddress: { name: "Eva Beispiel", address: "eva@example.at" } },
          toRecipients: [{ emailAddress: { name: "TIME2WIN", address: "info@time2win.at" } }],
          hasAttachments: true,
          webLink: "https://outlook.office.com/mail/deeplink/read/mail-1",
        },
      ]),
    };

    const result = await new EventCommunicationHub(repository, graph).syncEvent("event-1");

    expect(repository.store).toHaveBeenCalledWith("event-1", [
      expect.objectContaining({
        externalId: "mail-1",
        direction: "INCOMING",
        author: "Eva Beispiel <eva@example.at>",
        subject: "Startzeit bestätigt",
        preview: "Der Start bleibt um 09:00 Uhr.",
        hasAttachments: true,
      }),
    ]);
    expect(result).toEqual({ id: "event-1", outlookMessageSyncStatus: "SUCCESS" });
  });
});
