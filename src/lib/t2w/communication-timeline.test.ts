import { describe, expect, it } from "vitest";
import {
  highlightSegments,
  projectCommunicationTimeline,
  timeBucket,
  type CommunicationTimelineCriteria,
} from "./communication-timeline";

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
    hatAnlagen: true,
  },
  {
    id: "note",
    kanal: "Notiz" as const,
    betreff: "Telefonat",
    datum: "2026-09-02T09:00:00.000Z",
    autor: "Team",
    text: "Rückruf vereinbart.",
  },
  {
    id: "today",
    kanal: "Telefon" as const,
    betreff: "Rückruf Zeitmessung",
    datum: "2026-09-03T07:00:00.000Z",
    autor: "Eva <eva@example.at>",
    text: "Transponder besprochen.",
    richtung: "INCOMING" as const,
  },
  {
    id: "old",
    kanal: "E-Mail" as const,
    betreff: "Erste Anfrage",
    datum: "2026-07-15T10:00:00.000Z",
    autor: "Eva <eva@example.at>",
    empfaenger: "info@time2win.at",
    text: "Wir planen ein Event.",
    richtung: "INCOMING" as const,
    conversationId: "thread-2",
  },
];

const eventContacts = [
  { id: "eva", name: "Eva", rolle: "Anmeldung", email: "eva@example.at", telefon: "" },
];

const criteria = (
  overrides: Partial<CommunicationTimelineCriteria> = {},
): CommunicationTimelineCriteria => ({
  channel: "all",
  contactId: "all",
  direction: "all",
  search: "",
  attachmentsOnly: false,
  view: "verlauf",
  ...overrides,
});

const project = (overrides: Partial<CommunicationTimelineCriteria> = {}) =>
  projectCommunicationTimeline({
    messages,
    eventContacts,
    contacts: [{ id: "eva", name: "Eva Beispiel", email: "eva@example.at" }],
    mailbox: "info@time2win.at",
    today: "2026-09-03",
    criteria: criteria(overrides),
  });

describe("timeBucket", () => {
  it("nimmt heute, die sieben Tage davor und danach den Monat", () => {
    expect(timeBucket("2026-09-03T07:00:00.000Z", "2026-09-03").label).toBe("Heute");
    expect(timeBucket("2026-08-28T07:00:00.000Z", "2026-09-03").label).toBe("Diese Woche");
    expect(timeBucket("2026-07-15T07:00:00.000Z", "2026-09-03").label).toBe("Früher · Juli 2026");
  });

  it("lässt künftige Einträge nicht aus der Liste fallen", () => {
    expect(timeBucket("2026-09-10T07:00:00.000Z", "2026-09-03").label).toBe("Heute");
  });
});

describe("highlightSegments", () => {
  it("trennt Treffer vom übrigen Text", () => {
    expect(highlightSegments("Rückfrage Transponder heute", "transponder")).toEqual([
      { text: "Rückfrage ", match: false },
      { text: "Transponder", match: true },
      { text: " heute", match: false },
    ]);
  });

  it("gibt ohne Suchbegriff und ohne Treffer ein einziges Stück zurück", () => {
    expect(highlightSegments("Text", "")).toEqual([{ text: "Text", match: false }]);
    expect(highlightSegments("Text", "xyz")).toEqual([{ text: "Text", match: false }]);
  });
});

describe("projectCommunicationTimeline", () => {
  it("gruppiert den Verlauf nach Zeit, neueste zuerst", () => {
    const timeline = project();

    expect(timeline.groups.map((group) => group.label)).toEqual([
      "Heute",
      "Diese Woche",
      "Früher · Juli 2026",
    ]);
    expect(timeline.groups[0]?.messages.map((message) => message.id)).toEqual(["today"]);
    expect(timeline.groups[1]?.messages.map((message) => message.id)).toEqual([
      "note",
      "reply",
      "incoming",
    ]);
  });

  it("teilt Kontaktzuordnung, Antworten und TIME2WIN-Versand über beide Ansichten", () => {
    const timeline = project();

    expect(timeline.eventContactsByMessageId.get("incoming")?.rolle).toBe("Anmeldung");
    expect(timeline.replyMessageIds).toEqual(new Set(["reply"]));
    expect(timeline.time2winOutgoingIds).toEqual(new Set(["reply"]));
    expect(timeline.threadSize(messages[0]!)).toBe(2);
    expect(timeline.threadSize(messages[2]!)).toBe(1);
  });

  it("zählt die Arten ohne den Artenfilter, aber mit den übrigen Filtern", () => {
    const all = project();
    expect(all.channelCounts).toEqual({ "E-Mail": 3, Telefon: 1, Notiz: 1 });

    const onlyPhone = project({ channel: "Telefon" });
    expect(onlyPhone.channelCounts).toEqual({ "E-Mail": 3, Telefon: 1, Notiz: 1 });
    expect(onlyPhone.matchCount).toBe(1);

    const incoming = project({ direction: "INCOMING" });
    expect(incoming.channelCounts).toEqual({ "E-Mail": 2, Telefon: 1, Notiz: 0 });
  });

  it("filtert nach Anlagen, Bezug und Text", () => {
    expect(project({ attachmentsOnly: true }).visibleMessages.map((m) => m.id)).toEqual(["reply"]);
    expect(project({ contactId: "unassigned" }).visibleMessages.map((m) => m.id)).toEqual(["note"]);
    expect(project({ search: "rückruf" }).visibleMessages.map((m) => m.id)).toEqual([
      "today",
      "note",
    ]);
    expect(project({ search: "rückruf" }).matchCount).toBe(2);
  });

  it("bündelt Konversationen und hält Einzelnes getrennt", () => {
    const timeline = project({ view: "konversationen" });

    expect(timeline.conversations.map((group) => group.key)).toEqual(["thread-1"]);
    expect(timeline.conversations[0]?.messages.map((message) => message.id)).toEqual([
      "incoming",
      "reply",
    ]);
    expect(timeline.conversations[0]?.period).toBe("01.09.2026 – 02.09.2026");
    expect(timeline.conversations[0]?.attachments).toBe(1);
    // Ein Thread mit nur einer Nachricht bleibt ein Einzeleintrag und behält seinen Thread-Schlüssel.
    expect(timeline.singles.map((group) => group.key)).toEqual(["today", "note", "thread-2"]);
    expect(timeline.singles.map((group) => group.messages[0]?.id)).toEqual([
      "today",
      "note",
      "old",
    ]);
  });

  it("kennt konfigurierte Arten und solche, die nur im Bestand vorkommen", () => {
    const timeline = projectCommunicationTimeline({
      messages: [
        ...messages,
        {
          id: "brief",
          kanal: "Brief",
          betreff: "Postweg",
          datum: "2026-09-02T12:00:00.000Z",
          autor: "Amt",
          text: "Bescheid liegt bei.",
        },
      ],
      eventContacts,
      contacts: [],
      today: "2026-09-03",
      channels: ["E-Mail", "Telefon", "Notiz", "WhatsApp"],
      criteria: criteria(),
    });

    // Konfiguriert, aber unbenutzt: bleibt mit null sichtbar.
    expect(timeline.channelCounts["WhatsApp"]).toBe(0);
    // Nicht konfiguriert, aber vorhanden: fällt nicht aus der Leiste.
    expect(timeline.channelCounts["Brief"]).toBe(1);
    expect(timeline.channelNames).toContain("Brief");
  });

  it("bündelt Konversationen unabhängig von der Art", () => {
    const timeline = projectCommunicationTimeline({
      messages: [
        {
          id: "w1",
          kanal: "WhatsApp",
          betreff: "Zelt steht",
          datum: "2026-09-02T08:00:00.000Z",
          autor: "Eva <eva@example.at>",
          text: "Bin am Gelände.",
          richtung: "INCOMING",
          conversationId: "w-thread",
        },
        {
          id: "w2",
          kanal: "WhatsApp",
          betreff: "Re: Zelt steht",
          datum: "2026-09-02T09:00:00.000Z",
          autor: "info@time2win.at",
          text: "Danke, wir kommen um 10.",
          richtung: "OUTGOING",
          conversationId: "w-thread",
        },
      ],
      eventContacts,
      contacts: [],
      today: "2026-09-03",
      criteria: criteria({ view: "konversationen" }),
    });

    expect(timeline.conversations).toHaveLength(1);
    expect(timeline.conversations[0]?.channel).toBe("WhatsApp");
    expect(timeline.singles).toHaveLength(0);
  });

  it("liefert den Thread einer ausgewählten Nachricht", () => {
    const timeline = project();
    expect(timeline.selectedThread("reply").map((message) => message.id)).toEqual([
      "incoming",
      "reply",
    ]);
    expect(timeline.selectedThread("note").map((message) => message.id)).toEqual(["note"]);
    expect(timeline.selectedThread(null)).toEqual([]);
  });
});
