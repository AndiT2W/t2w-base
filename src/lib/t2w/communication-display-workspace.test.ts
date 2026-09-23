import { describe, expect, it, vi } from "vitest";
import { createCommunicationDisplayWorkspace } from "./communication-display-workspace";

const messages = [
  {
    id: "first",
    kanal: "E-Mail",
    betreff: "Startzeit",
    datum: "2026-09-01T08:00:00.000Z",
    autor: "Eva <eva@example.at>",
    empfaenger: "info@time2win.at",
    text: "Die Startzeit passt.",
    richtung: "INCOMING" as const,
    conversationId: "thread-1",
  },
  {
    id: "reply",
    kanal: "E-Mail",
    betreff: "AW: Startzeit",
    datum: "2026-09-02T08:00:00.000Z",
    autor: "info@time2win.at",
    empfaenger: "eva@example.at",
    text: "Danke.",
    richtung: "OUTGOING" as const,
    conversationId: "thread-1",
    hatAnlagen: true,
  },
  {
    id: "note",
    kanal: "Notiz",
    betreff: "Rückruf",
    datum: "2026-09-03T08:00:00.000Z",
    autor: "Team",
    text: "Teilnehmer besprochen.",
  },
];

const source = {
  messages,
  eventContacts: [
    { id: "eva", name: "Eva", rolle: "Anmeldung", email: "eva@example.at", telefon: "" },
  ],
  contacts: [],
  mailbox: "info@time2win.at",
  channels: ["E-Mail", "Notiz"],
  today: "2026-09-03",
};

describe("communication display workspace", () => {
  it("projects search, filters and view from one snapshot and preserves search/view on reset", () => {
    const workspace = createCommunicationDisplayWorkspace(source, { assignTopic: vi.fn() });
    const notify = vi.fn();
    const unsubscribe = workspace.subscribe(notify);

    expect(workspace.snapshot().timeline.matchCount).toBe(3);
    workspace.update({ search: "startzeit", view: "konversationen" });
    expect(workspace.snapshot().timeline.conversations.map((group) => group.key)).toEqual([
      "thread-1",
    ]);
    expect(workspace.snapshot().timeline.matchCount).toBe(2);

    workspace.toggleChannel("Notiz");
    expect(workspace.snapshot().filterCount).toBe(1);
    expect(workspace.snapshot().timeline.matchCount).toBe(0);
    expect(workspace.snapshot().timeline.channelCounts).toEqual({ "E-Mail": 2, Notiz: 0 });

    workspace.toggleChannel("Notiz");
    workspace.toggleAttachments();
    expect(workspace.snapshot().timeline.visibleMessages.map((message) => message.id)).toEqual([
      "reply",
    ]);
    workspace.resetFilters();
    expect(workspace.snapshot().criteria).toMatchObject({
      search: "startzeit",
      view: "konversationen",
      channel: "all",
      attachmentsOnly: false,
    });
    expect(workspace.snapshot().filterCount).toBe(0);
    expect(workspace.snapshot().timeline.matchCount).toBe(2);
    expect(notify).toHaveBeenCalledTimes(5);
    unsubscribe();
  });

  it("keeps navigation and selected thread coherent as filters and source data change", () => {
    const workspace = createCommunicationDisplayWorkspace(source, { assignTopic: vi.fn() });

    workspace.update({ view: "konversationen" });
    workspace.toggleConversation("thread-1");
    workspace.selectMessage("reply");
    expect(workspace.snapshot().openConversation).toBe("thread-1");
    expect(workspace.snapshot().selectedMessage?.id).toBe("reply");
    expect(workspace.snapshot().selectedThread.map((message) => message.id)).toEqual([
      "first",
      "reply",
    ]);
    expect(workspace.snapshot().selectedPosition).toBe(2);

    workspace.update({ direction: "INCOMING" });
    expect(workspace.snapshot().selectedMessage).toBeNull();
    expect(workspace.snapshot().selectedThread).toEqual([]);
    workspace.resetFilters();
    expect(workspace.snapshot().selectedMessage?.id).toBe("reply");

    workspace.accept({
      ...source,
      messages: source.messages.filter((message) => message.id !== "reply"),
    });
    expect(workspace.snapshot().selectedMessage).toBeNull();
    expect(workspace.snapshot().timeline.totalCount).toBe(2);
    workspace.toggleConversation("thread-1");
    expect(workspace.snapshot().openConversation).toBeNull();
    workspace.selectMessage(null);
    expect(workspace.snapshot().selectedThread).toEqual([]);
  });

  it("reports topic assignment and removal outcomes while refreshed data drives the display", async () => {
    const assignTopic = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("offline"));
    const workspace = createCommunicationDisplayWorkspace(source, { assignTopic });

    expect(await workspace.assignTopic("note", "participants")).toEqual({
      kind: "success",
      message: "Thema zugeordnet.",
      entryId: "note",
      topicId: "participants",
    });
    expect(assignTopic).toHaveBeenCalledWith("note", "participants");
    workspace.accept({
      ...source,
      messages: source.messages.map((message) =>
        message.id === "note" ? { ...message, themaId: "participants" } : message,
      ),
    });
    workspace.update({ topicId: "participants" });
    expect(workspace.snapshot().timeline.visibleMessages.map((message) => message.id)).toEqual([
      "note",
    ]);
    expect(workspace.snapshot().topicOutcome?.kind).toBe("success");

    expect(await workspace.assignTopic("note", null)).toEqual({
      kind: "failed",
      message: "Thema konnte nicht gespeichert werden.",
      entryId: "note",
      topicId: null,
    });
    expect(workspace.snapshot().topicOutcome?.kind).toBe("failed");
    expect(workspace.snapshot().timeline.visibleMessages.map((message) => message.id)).toEqual([
      "note",
    ]);
  });
});
