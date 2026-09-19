import type { T2WEvent } from "./types";
import { formatDatum, heuteIso } from "./format";

type Communication = T2WEvent["kommunikation"][number];
type EventContact = T2WEvent["kontakte"][number];

export type CommunicationChannel = Communication["kanal"];
export type CommunicationView = "verlauf" | "konversationen";
export type CommunicationDirection = "all" | "INCOMING" | "OUTGOING";

/**
 * Die Kommunikationsseite beantwortet „was ist gelaufen und wo finde ich es“.
 * Beantwortet wird in Outlook, deshalb kennt diese Projektion keine
 * Bearbeitungszustände. Siehe wiki/concepts/communication-display-design.md.
 */
export type CommunicationTimelineCriteria = {
  channel: "all" | CommunicationChannel;
  /** "all", "unassigned" oder eine Kontakt-Id. */
  contactId: string;
  /** "all" oder die Id eines Themas aus der Auswahlliste. */
  topicId: string;
  direction: CommunicationDirection;
  search: string;
  attachmentsOnly: boolean;
  view: CommunicationView;
};

export type TimelineContact = { id: string; name: string; email?: string };

/** Zeitgruppe der Verlaufsansicht. */
export type TimelineGroup = {
  key: string;
  label: string;
  messages: Communication[];
};

/** Eine Konversation oder ein einzelner Eintrag in der Konversationsansicht. */
export type ConversationGroup = {
  key: string;
  label: string;
  channel: CommunicationChannel;
  messages: Communication[];
  attachments: number;
  period: string;
  single: boolean;
};

export type HighlightSegment = { text: string; match: boolean };

const MONTHS = [
  "Jänner",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
] as const;

const emails = (value: string): string[] =>
  value.toLocaleLowerCase("de").match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/g) ?? [];

const relatedEmails = (message: Communication) =>
  emails(
    message.richtung === "OUTGOING"
      ? `${message.empfaenger ?? ""} ${message.autor}`
      : `${message.autor} ${message.empfaenger ?? ""}`,
  );

const dayDifference = (isoDay: string, today: string): number => {
  const left = Date.parse(`${isoDay}T00:00:00Z`);
  const right = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(left) || Number.isNaN(right)) return Number.NaN;
  return Math.round((right - left) / 86400000);
};

/**
 * Zeitgruppe eines Eintrags. „Diese Woche“ meint die sieben Tage vor heute,
 * keine Kalenderwoche; alles Ältere sammelt sich je Monat. Zukünftige Einträge
 * bleiben bei „Heute“, damit nichts aus der Liste fällt.
 */
export function timeBucket(iso: string, today: string): { key: string; label: string } {
  const day = iso.slice(0, 10);
  const difference = dayDifference(day, today);
  if (Number.isNaN(difference)) return { key: "unbekannt", label: "Ohne Datum" };
  if (difference <= 0) return { key: "heute", label: "Heute" };
  if (difference <= 7) return { key: "woche", label: "Diese Woche" };
  const month = Number(day.slice(5, 7));
  const label = MONTHS[month - 1] ?? day.slice(5, 7);
  return { key: `monat-${day.slice(0, 7)}`, label: `Früher · ${label} ${day.slice(0, 4)}` };
}

/**
 * Zerlegt einen Text in Treffer- und Zwischenstücke. Die Anzeige hebt die
 * Treffer hervor; ohne Suchbegriff bleibt es ein einziges Stück.
 */
export function highlightSegments(text: string, query: string): HighlightSegment[] {
  const needle = query.trim().toLocaleLowerCase("de");
  if (!needle) return [{ text, match: false }];
  const haystack = text.toLocaleLowerCase("de");
  const segments: HighlightSegment[] = [];
  let index = 0;
  for (;;) {
    const hit = haystack.indexOf(needle, index);
    if (hit === -1) break;
    if (hit > index) segments.push({ text: text.slice(index, hit), match: false });
    segments.push({ text: text.slice(hit, hit + needle.length), match: true });
    index = hit + needle.length;
  }
  if (!segments.length) return [{ text, match: false }];
  if (index < text.length) segments.push({ text: text.slice(index), match: false });
  return segments;
}

export function projectCommunicationTimeline(input: {
  messages: Communication[];
  eventContacts: EventContact[];
  contacts: TimelineContact[];
  mailbox?: string;
  today?: string;
  /** Konfigurierte Nachrichtenarten in ihrer Reihenfolge. */
  channels?: readonly string[];
  criteria: CommunicationTimelineCriteria;
}) {
  const today = input.today ?? heuteIso();
  const ordered = [...input.messages].sort((left, right) => left.datum.localeCompare(right.datum));

  const replyMessageIds = new Set<string>();
  const threadOrigins = new Map<string, Communication>();
  const threadSizes = new Map<string, number>();
  const seenConversations = new Set<string>();
  for (const message of ordered) {
    if (!message.conversationId) continue;
    if (seenConversations.has(message.conversationId)) replyMessageIds.add(message.id);
    else threadOrigins.set(message.conversationId, message);
    seenConversations.add(message.conversationId);
    threadSizes.set(message.conversationId, (threadSizes.get(message.conversationId) ?? 0) + 1);
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
  const matchesSearch = (message: Communication) =>
    !query ||
    `${message.betreff} ${message.autor} ${message.empfaenger ?? ""} ${message.text}`
      .toLocaleLowerCase("de")
      .includes(query);
  const matchesContact = (message: Communication) => {
    if (input.criteria.contactId === "all") return true;
    const eventContact = eventContactsByMessageId.get(message.id);
    // "Ohne Bezug" heisst: weder Person noch Thema. Ein Eintrag mit Thema
    // hat einen Bezug, auch wenn keine Person dahintersteht.
    return input.criteria.contactId === "unassigned"
      ? !eventContact && !message.themaId
      : eventContact?.id === input.criteria.contactId;
  };
  const matchesTopic = (message: Communication) =>
    input.criteria.topicId === "all" || message.themaId === input.criteria.topicId;
  const matchesDirection = (message: Communication) =>
    input.criteria.direction === "all" || message.richtung === input.criteria.direction;
  const matchesAttachments = (message: Communication) =>
    !input.criteria.attachmentsOnly || message.hatAnlagen === true;

  /**
   * Die Artenzähler beziehen sich auf die übrigen gesetzten Filter, aber nicht
   * auf die Art selbst: sonst zeigte jede Art nach dem Klick nur noch sich.
   */
  const withoutChannel = input.messages.filter(
    (message) =>
      matchesSearch(message) &&
      matchesContact(message) &&
      matchesTopic(message) &&
      matchesDirection(message) &&
      matchesAttachments(message),
  );
  const filtered = withoutChannel.filter(
    (message) => input.criteria.channel === "all" || message.kanal === input.criteria.channel,
  );

  /**
   * Gezählt wird jede Art, die entweder konfiguriert ist oder im Bestand
   * vorkommt. So verschwindet eine deaktivierte Art nicht aus der Leiste,
   * solange noch Einträge an ihr hängen.
   */
  const channelNames = [
    ...new Set([...(input.channels ?? []), ...input.messages.map((message) => message.kanal)]),
  ];
  const channelCounts = Object.fromEntries(
    channelNames.map((channel) => [
      channel,
      withoutChannel.filter((message) => message.kanal === channel).length,
    ]),
  ) as Record<string, number>;

  const newest = [...filtered].sort((left, right) => right.datum.localeCompare(left.datum));

  const groups: TimelineGroup[] = [];
  for (const message of newest) {
    const bucket = timeBucket(message.datum, today);
    const existing = groups.find((group) => group.key === bucket.key);
    if (existing) existing.messages.push(message);
    else groups.push({ key: bucket.key, label: bucket.label, messages: [message] });
  }

  const threads = new Map<string, Communication[]>();
  for (const message of [...filtered].sort((left, right) =>
    left.datum.localeCompare(right.datum),
  )) {
    const key = message.conversationId ?? message.id;
    threads.set(key, [...(threads.get(key) ?? []), message]);
  }
  const conversations: ConversationGroup[] = [];
  const singles: ConversationGroup[] = [];
  threads.forEach((messages, key) => {
    const first = messages[0];
    const last = messages[messages.length - 1];
    if (!first || !last) return;
    const group: ConversationGroup = {
      key,
      label: first.betreff,
      channel: first.kanal,
      messages,
      attachments: messages.filter((message) => message.hatAnlagen).length,
      period:
        first.datum.slice(0, 10) === last.datum.slice(0, 10)
          ? formatDatum(last.datum)
          : `${formatDatum(first.datum)} – ${formatDatum(last.datum)}`,
      single: messages.length === 1,
    };
    (group.single ? singles : conversations).push(group);
  });
  const byNewest = (left: ConversationGroup, right: ConversationGroup) =>
    (right.messages[right.messages.length - 1]?.datum ?? "").localeCompare(
      left.messages[left.messages.length - 1]?.datum ?? "",
    );
  conversations.sort(byNewest);
  singles.sort(byNewest);

  return {
    groups,
    conversations,
    singles,
    visibleMessages: newest,
    matchCount: filtered.length,
    totalCount: input.messages.length,
    channelNames,
    channelCounts,
    attachmentCount: withoutChannel.filter((message) => message.hatAnlagen).length,
    unassignedCount: withoutChannel.filter(
      (message) => !eventContactsByMessageId.has(message.id) && !message.themaId,
    ).length,
    replyMessageIds,
    threadOrigins,
    eventContactsByMessageId,
    contactsByMessageId,
    time2winOutgoingIds,
    threadSize(message: Communication) {
      return message.conversationId ? (threadSizes.get(message.conversationId) ?? 1) : 1;
    },
    selectedThread(messageId: string | null) {
      const selected = filtered.find((message) => message.id === messageId);
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
