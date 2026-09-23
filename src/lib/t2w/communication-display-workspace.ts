import {
  projectCommunicationTimeline,
  type CommunicationTimelineCriteria,
} from "./communication-timeline";

type DisplaySource = Omit<Parameters<typeof projectCommunicationTimeline>[0], "criteria">;
type Communication = DisplaySource["messages"][number];

export type CommunicationTopicOutcome = {
  kind: "success" | "failed";
  message: string;
  entryId: string;
  topicId: string | null;
};

const initialCriteria: CommunicationTimelineCriteria = {
  channel: "all",
  contactId: "all",
  topicId: "all",
  direction: "all",
  search: "",
  attachmentsOnly: false,
  view: "verlauf",
};

/** Search, navigation and topic assignment for one Event's communication display. */
export function createCommunicationDisplayWorkspace(
  source: DisplaySource,
  mutations: { assignTopic(entryId: string, topicId: string | null): Promise<unknown> },
) {
  let currentSource = source;
  let criteria = { ...initialCriteria };
  let selectedMessageId: string | null = null;
  let openConversation: string | null = null;
  let topicOutcome: CommunicationTopicOutcome | null = null;
  const listeners = new Set<() => void>();

  function project() {
    const timeline = projectCommunicationTimeline({ ...currentSource, criteria });
    const selectedMessage: Communication | null =
      timeline.visibleMessages.find((message) => message.id === selectedMessageId) ?? null;
    const selectedThread = timeline.selectedThread(selectedMessageId);
    return {
      criteria,
      timeline,
      selectedMessage,
      selectedThread,
      selectedPosition: selectedMessage
        ? selectedThread.findIndex((message) => message.id === selectedMessage.id) + 1
        : 0,
      openConversation,
      filterCount:
        Number(criteria.channel !== "all") +
        Number(criteria.contactId !== "all") +
        Number(criteria.topicId !== "all") +
        Number(criteria.direction !== "all") +
        Number(criteria.attachmentsOnly),
      topicOutcome,
    };
  }

  let currentSnapshot = project();
  function publish() {
    currentSnapshot = project();
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot: () => currentSnapshot,
    accept(next: DisplaySource) {
      if (currentSource === next) return;
      currentSource = next;
      publish();
    },
    update(patch: Partial<CommunicationTimelineCriteria>) {
      criteria = { ...criteria, ...patch };
      publish();
    },
    toggleChannel(channel: string) {
      criteria = { ...criteria, channel: criteria.channel === channel ? "all" : channel };
      publish();
    },
    toggleAttachments() {
      criteria = { ...criteria, attachmentsOnly: !criteria.attachmentsOnly };
      publish();
    },
    resetFilters() {
      criteria = { ...initialCriteria, search: criteria.search, view: criteria.view };
      publish();
    },
    toggleConversation(key: string) {
      openConversation = openConversation === key ? null : key;
      publish();
    },
    selectMessage(id: string | null) {
      selectedMessageId = id;
      publish();
    },
    async assignTopic(entryId: string, topicId: string | null): Promise<CommunicationTopicOutcome> {
      try {
        await mutations.assignTopic(entryId, topicId);
        topicOutcome = {
          kind: "success",
          message: topicId ? "Thema zugeordnet." : "Thema entfernt.",
          entryId,
          topicId,
        };
      } catch {
        topicOutcome = {
          kind: "failed",
          message: "Thema konnte nicht gespeichert werden.",
          entryId,
          topicId,
        };
      }
      publish();
      return topicOutcome;
    },
  };
}
