import { describe, expect, it } from "vitest";
import { projectCommunicationTimeline } from "./communication-timeline";

const messages = [
  {
    id: "incoming",
    kanal: "E-Mail" as const,
    betreff: "Startzeit bestätigt",
    datum: "2026-09-01T08:00:00.000Z",
    autor: "Eva <eva@example.at>",
    empfaenger: "info@time2win.at",
    text: "Die Startzeit passt.",
    richtung: "INCOMING" as const,
    conversationId: "thread-1",
  },
  {
    id: "reply",
    kanal: "E-Mail" as const,
    betreff: "AW: Startzeit bestätigt",
    datum: "2026-09-02T08:00:00.000Z",
    autor: "info@time2win.at",
    empfaenger: "eva@example.at",
    text: "Danke.",
    richtung: "OUTGOING" as const,
    conversationId: "thread-1",
  },
  {
    id: "note",
    kanal: "Notiz" as const,
    betreff: "Telefonat",
    datum: "2026-09-02T09:00:00.000Z",
    autor: "Team",
    text: "Rückruf vereinbart.",
  },
];

describe("projectCommunicationTimeline", () => {
  it("shares contact association and reply interpretation across timeline views", () => {
    const timeline = projectCommunicationTimeline({
      messages,
      eventContacts: [
        { id: "eva", name: "Eva", rolle: "Anmeldung", email: "eva@example.at", telefon: "" },
      ],
      contacts: [{ id: "eva", name: "Eva Beispiel", email: "eva@example.at" }],
      mailbox: "info@time2win.at",
      criteria: { kind: "all", contactId: "eva", search: "", view: "conversation" },
    });

    expect(timeline.groups).toHaveLength(1);
    expect(timeline.groups[0]?.messages.map((message) => message.id)).toEqual([
      "incoming",
      "reply",
    ]);
    expect(timeline.eventContactsByMessageId.get("incoming")?.rolle).toBe("Anmeldung");
    expect(timeline.replyMessageIds).toEqual(new Set(["reply"]));
    expect(timeline.threadOrigins.get("thread-1")?.id).toBe("incoming");
    expect(timeline.time2winOutgoingIds).toEqual(new Set(["reply"]));
  });

  it("keeps unassigned and text filtering inside the projection interface", () => {
    const timeline = projectCommunicationTimeline({
      messages,
      eventContacts: [
        { id: "eva", name: "Eva", rolle: "Anmeldung", email: "eva@example.at", telefon: "" },
      ],
      contacts: [],
      criteria: { kind: "activity", contactId: "unassigned", search: "rückruf", view: "compact" },
    });

    expect(timeline.groups.flatMap((group) => group.messages).map((message) => message.id)).toEqual(
      ["note"],
    );
    expect(timeline.selectedThread("note").map((message) => message.id)).toEqual(["note"]);
  });
});
