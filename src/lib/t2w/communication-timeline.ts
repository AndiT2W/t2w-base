import type { T2WEvent } from "./types";

type Communication = T2WEvent["kommunikation"][number];
type EventContact = T2WEvent["kontakte"][number];

export type CommunicationTimelineCriteria = {
  kind: "all" | "email" | "activity";
  contactId: string;
  search: string;
  view: "cards" | "conversation" | "compact";
};
export type TimelineContact = { id: string; name: string; email?: string };
export type TimelineGroup = {
  key: string;
  label: string;
  period?: string;
  conversation: boolean;
  messages: Communication[];
};

const emails = (value: string) =>
  value.toLocaleLowerCase("de").match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/g) ?? [];

const relatedEmails = (message: Communication) =>
  emails(
    message.richtung === "OUTGOING"
      ? `${message.empfaenger ?? ""} ${message.autor}`
      : `${message.autor} ${message.empfaenger ?? ""}`,
  );

export function projectCommunicationTimeline(input: {
  messages: Communication[];
  eventContacts: EventContact[];
  contacts: TimelineContact[];
  mailbox?: string;
  criteria: CommunicationTimelineCriteria;
}) {
  const ordered = [...input.messages].sort((left, right) => left.datum.localeCompare(right.datum));
  const replyMessageIds = new Set<string>();
  const threadOrigins = new Map<string, Communication>();
  const seenConversations = new Set<string>();
  for (const message of ordered) {
    if (message.kanal !== "E-Mail" || !message.conversationId) continue;
    if (seenConversations.has(message.conversationId)) replyMessageIds.add(message.id);
    else threadOrigins.set(message.conversationId, message);
    seenConversations.add(message.conversationId);
  }
  const eventContactsByMessageId = new Map<string, EventContact>();
  const contactsByMessageId = new Map<string, TimelineContact>();
  const time2winOutgoingIds = new Set<string>();
  for (const message of input.messages) {
    const related = relatedEmails(message);
    const eventContact = input.eventContacts.find((contact) =>
      related.includes(contact.email.toLocaleLowerCase("de")),
    );
    const contact = input.contacts.find((candidate) =>
      related.includes(candidate.email?.toLocaleLowerCase("de") ?? ""),
    );
    if (eventContact) eventContactsByMessageId.set(message.id, eventContact);
    if (contact) contactsByMessageId.set(message.id, contact);
    if (
      message.richtung === "OUTGOING" &&
      input.mailbox &&
      emails(message.autor).includes(input.mailbox.toLocaleLowerCase("de"))
    )
      time2winOutgoingIds.add(message.id);
  }
  const query = input.criteria.search.trim().toLocaleLowerCase("de");
  const filtered = input.messages.filter((message) => {
    if (input.criteria.kind === "email" && message.kanal !== "E-Mail") return false;
    if (input.criteria.kind === "activity" && message.kanal === "E-Mail") return false;
    const eventContact = eventContactsByMessageId.get(message.id);
    if (input.criteria.contactId !== "all") {
      if (
        input.criteria.contactId === "unassigned"
          ? eventContact
          : eventContact?.id !== input.criteria.contactId
      )
        return false;
    }
    return (
      !query ||
      `${message.betreff} ${message.autor} ${message.empfaenger ?? ""} ${message.text}`
        .toLocaleLowerCase("de")
        .includes(query)
    );
  });
  const groups: TimelineGroup[] = [];
  const visibleMessageIds = new Set(filtered.map((message) => message.id));
  if (input.criteria.view === "conversation") {
    const threads = new Map<string, Communication[]>();
    filtered.forEach((message) => {
      const key = message.conversationId ?? message.id;
      threads.set(key, [...(threads.get(key) ?? []), message]);
    });
    threads.forEach((messages, key) => {
      const first = [...messages].sort((a, b) => a.datum.localeCompare(b.datum))[0];
      groups.push({
        key,
        label: first.betreff,
        period: `${messages.length} Nachricht${messages.length === 1 ? "" : "en"}`,
        conversation: true,
        messages: [...messages].sort((a, b) => a.datum.localeCompare(b.datum)),
      });
    });
  } else {
    const dates = new Map<string, Communication[]>();
    filtered.forEach((message) => {
      const key = message.datum.slice(0, 10);
      dates.set(key, [...(dates.get(key) ?? []), message]);
    });
    dates.forEach((messages, key) => {
      const date = new Date(`${key}T12:00:00`);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const iso = (candidate: Date) =>
        new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" }).format(candidate);
      const label =
        key === iso(today)
          ? "Heute"
          : key === iso(yesterday)
            ? "Gestern"
            : new Intl.DateTimeFormat("de-AT", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(date);
      groups.push({
        key,
        label,
        conversation: false,
        messages: [...messages].sort((a, b) => b.datum.localeCompare(a.datum)),
      });
    });
  }
  return {
    groups,
    visibleMessages: filtered,
    replyMessageIds,
    threadOrigins,
    visibleThreadOrigins: new Map(
      [...threadOrigins].filter(([, message]) => visibleMessageIds.has(message.id)),
    ),
    eventContactsByMessageId,
    contactsByMessageId,
    time2winOutgoingIds,
    selectedThread(messageId: string | null) {
      const selected = filtered.find((message) => message.id === messageId) ?? filtered[0];
      if (!selected) return [];
      return filtered
        .filter((message) =>
          selected.conversationId
            ? message.conversationId === selected.conversationId
            : message.id === selected.id,
        )
        .sort((left, right) => left.datum.localeCompare(right.datum));
    },
  };
}
