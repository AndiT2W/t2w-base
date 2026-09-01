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
      conflictingConversationIds: vi.fn().mockResolvedValue([]),
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
      listMessagesByConversationIds: vi.fn().mockResolvedValue([]),
      moveMessage: vi.fn(),
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

  it("moves unambiguous sent replies into the Event folder before persisting", async () => {
    const eventMessages = [
      {
        id: "incoming-1",
        conversationId: "conversation-1",
        subject: "Besprechung Mountain Attack 2027",
        receivedDateTime: "2026-08-24T07:31:50.000Z",
        from: { emailAddress: { address: "max@example.at" } },
      },
    ];
    const movedMessages = [
      ...eventMessages,
      {
        id: "moved-reply-1",
        conversationId: "conversation-1",
        subject: "AW: Besprechung Mountain Attack 2027",
        sentDateTime: "2026-08-27T06:47:36.000Z",
        from: { emailAddress: { address: "info@time2win.at" } },
        toRecipients: [{ emailAddress: { address: "max@example.at" } }],
      },
    ];
    const repository: EventCommunicationRepository = {
      source: vi.fn().mockResolvedValue({ mailbox: "info@time2win.at", folderId: "event-folder" }),
      conflictingConversationIds: vi.fn().mockResolvedValue([]),
      begin: vi.fn(),
      store: vi.fn(),
      succeed: vi.fn().mockResolvedValue({ id: "event-1" }),
      fail: vi.fn(),
    };
    const graph: OutlookGraphClient = {
      listChildFolders: vi.fn(),
      createChildFolder: vi.fn(),
      listMessages: vi
        .fn()
        .mockResolvedValueOnce(eventMessages)
        .mockResolvedValueOnce(movedMessages),
      listMessagesByConversationIds: vi.fn().mockResolvedValue([
        {
          id: "sent-reply-1",
          conversationId: "conversation-1",
          from: { emailAddress: { address: "info@time2win.at" } },
        },
      ]),
      moveMessage: vi.fn().mockResolvedValue({ id: "moved-reply-1" }),
    };

    await new EventCommunicationHub(repository, graph).syncEvent("event-1");

    expect(graph.listMessagesByConversationIds).toHaveBeenCalledWith(
      "info@time2win.at",
      "sentitems",
      ["conversation-1"],
    );
    expect(graph.moveMessage).toHaveBeenCalledWith(
      "info@time2win.at",
      "sent-reply-1",
      "event-folder",
    );
    expect(repository.store).toHaveBeenCalledWith(
      "event-1",
      expect.arrayContaining([
        expect.objectContaining({ externalId: "moved-reply-1", direction: "OUTGOING" }),
      ]),
    );
  });

  it("does not move sent replies when the conversation belongs to another Event too", async () => {
    const repository: EventCommunicationRepository = {
      source: vi.fn().mockResolvedValue({ mailbox: "info@time2win.at", folderId: "event-folder" }),
      conflictingConversationIds: vi.fn().mockResolvedValue(["conversation-1"]),
      begin: vi.fn(),
      store: vi.fn(),
      succeed: vi.fn().mockResolvedValue({ id: "event-1" }),
      fail: vi.fn(),
    };
    const graph: OutlookGraphClient = {
      listChildFolders: vi.fn(),
      createChildFolder: vi.fn(),
      listMessages: vi
        .fn()
        .mockResolvedValue([{ id: "incoming-1", conversationId: "conversation-1" }]),
      listMessagesByConversationIds: vi.fn().mockResolvedValue([]),
      moveMessage: vi.fn(),
    };

    await new EventCommunicationHub(repository, graph).syncEvent("event-1");

    expect(graph.listMessagesByConversationIds).toHaveBeenCalledWith(
      "info@time2win.at",
      "sentitems",
      [],
    );
    expect(graph.moveMessage).not.toHaveBeenCalled();
  });
});
