import type { T2WEvent } from "./types";

export type CreateEventInput = {
  name: string;
  eventcode?: string;
  veranstalter: string;
  veranstalterId?: string;
  sportartId?: string;
  ort: string;
  start: string;
  ende?: string;
  status: T2WEvent["status"];
  verantwortlicher?: string;
  teilnehmer?: number;
  teilnehmerprognose?: number | null;
  sportart?: string;
  notizen: string;
};
type PersistedCreateEventInput = {
  name: string;
  eventcode: string;
  veranstalter: string;
  veranstalterId?: string;
  sportartId?: string;
  ort: string;
  start: string;
  ende: string;
  status: T2WEvent["status"];
  verantwortlicher: string;
  teilnehmerprognose: number;
  notizen: string;
};
type Transport = {
  create(input: PersistedCreateEventInput): Promise<T2WEvent>;
  save(id: string, patch: Partial<T2WEvent>): Promise<T2WEvent>;
  syncOutlook(id: string): Promise<T2WEvent>;
  outlookPlan(id: string): Promise<OutlookFolderPlan>;
  addContact?(id: string, contactId: string, role: string, version: number): Promise<T2WEvent>;
  removeContact?(id: string, contactId: string, role: string, version: number): Promise<T2WEvent>;
  updateContactRole?(id: string, contactId: string, role: string, nextRole: string, version: number): Promise<T2WEvent>;
  createTask?(id: string, input: { title: string; dueAt?: string; responsible?: string }, version: number): Promise<T2WEvent>;
  updateTask?(id: string, taskId: string, input: { title?: string; dueAt?: string | null; responsible?: string; completed?: boolean }, version: number): Promise<T2WEvent>;
  createFile?(id: string, input: { name: string; url?: string; size?: string }, version: number): Promise<T2WEvent>;
  createActivity?(id: string, input: { channel: string; subject: string; author?: string; body?: string; occurredAt?: string }, version: number): Promise<T2WEvent>;
};
export type OutlookFolderPlan = {
  year?: string;
  yearFolderName?: string;
  quarter?: string;
  eventFolderName?: string;
  path: string;
  drifted: boolean;
};
export type SaveResult =
  { kind: "saved"; event: T2WEvent } | { kind: "conflict" } | { kind: "failed"; error: Error };
export type SyncResult = { kind: "synced"; event: T2WEvent } | { kind: "failed"; error: Error };

export function createEventWorkspace(transport: Transport) {
  let collection: T2WEvent[] = [];
  const subscribers = new Set<() => void>();
  const publish = () => {
    subscribers.forEach((subscriber) => subscriber());
  };
  const replace = (persisted: T2WEvent) => {
    collection = collection.map((event) => (event.id === persisted.id ? persisted : event));
    publish();
  };

  return {
    events: () => collection,
    subscribe(subscriber: () => void) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    load(events: T2WEvent[]) {
      collection = [...events];
      publish();
    },
    async create(input: CreateEventInput): Promise<T2WEvent> {
      const event = await transport.create({
        name: input.name,
        eventcode: input.eventcode ?? "",
        veranstalter: input.veranstalter,
        veranstalterId: input.veranstalterId,
        sportartId: input.sportartId,
        ort: input.ort,
        start: input.start,
        ende: input.ende?.length ? input.ende : input.start,
        status: input.status,
        verantwortlicher: input.verantwortlicher ?? "",
        teilnehmerprognose: input.teilnehmerprognose ?? input.teilnehmer ?? 0,
        notizen: input.notizen,
      });
      collection = [...collection, event];
      publish();
      return event;
    },
    async save(id: string, patch: Partial<T2WEvent>): Promise<SaveResult> {
      const current = collection.find((event) => event.id === id);
      if (!current) return { kind: "failed", error: new Error("EVENT_NOT_FOUND") };
      const start = patch.start ?? current.start;
      const ende = patch.ende && patch.ende >= start ? patch.ende : start;
      try {
        const event = await transport.save(current.id, {
          ...patch,
          ende,
          version: current.version,
        });
        replace(event);
        return { kind: "saved", event };
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "EVENT_VERSION_CONFLICT")
          return { kind: "conflict" };
        return {
          kind: "failed",
          error: error instanceof Error ? error : new Error("EVENT_SAVE_FAILED"),
        };
      }
    },
    async syncOutlook(id: string): Promise<SyncResult> {
      try {
        const event = await transport.syncOutlook(id);
        replace(event);
        return { kind: "synced", event };
      } catch (error) {
        return {
          kind: "failed",
          error: error instanceof Error ? error : new Error("OUTLOOK_FOLDER_SYNC_FAILED"),
        };
      }
    },
    addContact(id: string, contactId: string, role: string) { return mutateDetail(id, (event) => transport.addContact?.(id, contactId, role, event.version ?? 0) ?? Promise.reject(new Error("EVENT_TRANSPORT_UNAVAILABLE"))); },
    removeContact(id: string, contactId: string, role: string) { return mutateDetail(id, (event) => transport.removeContact?.(id, contactId, role, event.version ?? 0) ?? Promise.reject(new Error("EVENT_TRANSPORT_UNAVAILABLE"))); },
    updateContactRole(id: string, contactId: string, role: string, nextRole: string) { return mutateDetail(id, (event) => transport.updateContactRole?.(id, contactId, role, nextRole, event.version ?? 0) ?? Promise.reject(new Error("EVENT_TRANSPORT_UNAVAILABLE"))); },
    createTask(id: string, input: { title: string; dueAt?: string; responsible?: string }) { return mutateDetail(id, (event) => transport.createTask?.(id, input, event.version ?? 0) ?? Promise.reject(new Error("EVENT_TRANSPORT_UNAVAILABLE"))); },
    updateTask(id: string, taskId: string, input: { title?: string; dueAt?: string | null; responsible?: string; completed?: boolean }) { return mutateDetail(id, (event) => transport.updateTask?.(id, taskId, input, event.version ?? 0) ?? Promise.reject(new Error("EVENT_TRANSPORT_UNAVAILABLE"))); },
    createFile(id: string, input: { name: string; url?: string; size?: string }) { return mutateDetail(id, (event) => transport.createFile?.(id, input, event.version ?? 0) ?? Promise.reject(new Error("EVENT_TRANSPORT_UNAVAILABLE"))); },
    createActivity(id: string, input: { channel: string; subject: string; author?: string; body?: string; occurredAt?: string }) { return mutateDetail(id, (event) => transport.createActivity?.(id, input, event.version ?? 0) ?? Promise.reject(new Error("EVENT_TRANSPORT_UNAVAILABLE"))); },
    outlookPlan: (id: string) => transport.outlookPlan(id),
  };

  async function mutateDetail(id: string, work: (event: T2WEvent) => Promise<T2WEvent>): Promise<SaveResult> {
    const current = collection.find((event) => event.id === id);
    if (!current) return { kind: "failed", error: new Error("EVENT_NOT_FOUND") };
    try { const event = await work(current); replace(event); return { kind: "saved", event }; }
    catch (error) {
      if (error instanceof Error && "code" in error && error.code === "EVENT_VERSION_CONFLICT") return { kind: "conflict" };
      return { kind: "failed", error: error instanceof Error ? error : new Error("EVENT_SAVE_FAILED") };
    }
  }
}
