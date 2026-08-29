export type EventRecord = {
  id: string;
  version?: number;
  start: string;
  ende: string;
  veranstalterId?: string;
  auszahlungsempfaengerId?: string | null;
  rechnungsempfaengerIds?: string[];
};

export type CreateEventInput<TEvent extends EventRecord> = {
  name: string;
  eventcode?: string;
  veranstalter: string;
  veranstalterId?: string;
  sportartId?: string;
  ort: string;
  start: string;
  ende?: string;
  status: TEvent extends { status: infer TStatus } ? TStatus : string;
  verantwortlicher?: string;
  teilnehmer?: number;
  teilnehmerprognose?: number | null;
  sportart?: string;
  notizen: string;
};

export type PersistedCreateEventInput<TEvent extends EventRecord> = {
  name: string;
  eventcode: string;
  veranstalter: string;
  veranstalterId?: string;
  sportartId?: string;
  ort: string;
  start: string;
  ende: string;
  status: TEvent extends { status: infer TStatus } ? TStatus : string;
  verantwortlicher: string;
  teilnehmerprognose: number;
  notizen: string;
};

export type OutlookFolderPlan = {
  year?: string;
  yearFolderName?: string;
  quarter?: string;
  eventFolderName?: string;
  path: string;
  drifted: boolean;
  existence?: "EXISTS" | "MISSING" | "UNKNOWN";
};

export type SaveResult<TEvent extends EventRecord> =
  { kind: "saved"; event: TEvent } | { kind: "conflict" } | { kind: "failed"; error: Error };
export type SyncResult<TEvent extends EventRecord> =
  { kind: "synced"; event: TEvent } | { kind: "failed"; error: Error };

/** Intent-level operations at the Event-detail seam. */
export type EventDetailCommand =
  | { kind: "add-contact"; contactId: string; role: string }
  | { kind: "remove-contact"; contactId: string; role: string }
  | { kind: "change-contact-role"; contactId: string; role: string; nextRole: string }
  | { kind: "create-task"; input: { title: string; dueAt?: string; responsible?: string } }
  | {
      kind: "update-task";
      taskId: string;
      input: { title?: string; dueAt?: string | null; responsible?: string; completed?: boolean };
    }
  | { kind: "create-file"; input: { name: string; url?: string; size?: string } }
  | {
      kind: "create-activity";
      input: {
        channel: string;
        subject: string;
        author?: string;
        body?: string;
        occurredAt?: string;
      };
    };

export type EventTransport<TEvent extends EventRecord> = {
  create(input: PersistedCreateEventInput<TEvent>): Promise<TEvent>;
  save(id: string, patch: Partial<TEvent>): Promise<TEvent>;
  syncOutlook(id: string): Promise<TEvent>;
  syncTime2win?(id: string): Promise<SyncResult<TEvent>>;
  outlookPlan(id: string): Promise<OutlookFolderPlan>;
  addContact?(id: string, contactId: string, role: string, version: number): Promise<TEvent>;
  removeContact?(id: string, contactId: string, role: string, version: number): Promise<TEvent>;
  updateContactRole?(
    id: string,
    contactId: string,
    role: string,
    nextRole: string,
    version: number,
  ): Promise<TEvent>;
  createTask?(
    id: string,
    input: { title: string; dueAt?: string; responsible?: string },
    version: number,
  ): Promise<TEvent>;
  updateTask?(
    id: string,
    taskId: string,
    input: { title?: string; dueAt?: string | null; responsible?: string; completed?: boolean },
    version: number,
  ): Promise<TEvent>;
  createFile?(
    id: string,
    input: { name: string; url?: string; size?: string },
    version: number,
  ): Promise<TEvent>;
  createActivity?(
    id: string,
    input: {
      channel: string;
      subject: string;
      author?: string;
      body?: string;
      occurredAt?: string;
    },
    version: number,
  ): Promise<TEvent>;
};

export function createEventEditingSession<TEvent extends EventRecord>(
  initial: TEvent,
  persist: (draft: TEvent) => Promise<SaveResult<TEvent>>,
) {
  let draft = initial;
  const subscribers = new Set<() => void>();
  const publish = () => subscribers.forEach((subscriber) => subscriber());
  const accept = (event: TEvent) => {
    draft = event;
    publish();
  };
  return {
    snapshot: () => draft,
    subscribe(subscriber: () => void) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    accept,
    update(patch: Partial<TEvent>) {
      const organizerChanged =
        patch.veranstalterId !== undefined && patch.veranstalterId !== draft.veranstalterId;
      draft = {
        ...draft,
        ...patch,
        ...(organizerChanged && patch.veranstalterId
          ? {
              auszahlungsempfaengerId: patch.veranstalterId,
              rechnungsempfaengerIds: [patch.veranstalterId],
            }
          : {}),
      };
      publish();
      return draft;
    },
    async save() {
      if (!draft.start)
        return { kind: "failed", error: new Error("EVENT_START_REQUIRED") } as SaveResult<TEvent>;
      const result = await persist(draft);
      if (result.kind === "saved") accept(result.event);
      return result;
    },
  };
}

export function createEventWorkspace<TEvent extends EventRecord>(
  transport: EventTransport<TEvent>,
) {
  let collection: TEvent[] = [];
  const subscribers = new Set<() => void>();
  const publish = () => subscribers.forEach((subscriber) => subscriber());
  const replace = (persisted: TEvent) => {
    collection = collection.map((event) => (event.id === persisted.id ? persisted : event));
    publish();
  };
  const find = (id: string) => collection.find((event) => event.id === id);

  async function mutateDetail(
    id: string,
    work: (event: TEvent) => Promise<TEvent>,
  ): Promise<SaveResult<TEvent>> {
    const current = find(id);
    if (!current) return { kind: "failed", error: new Error("EVENT_NOT_FOUND") };
    try {
      const event = await work(current);
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
  }

  async function save(id: string, patch: Partial<TEvent>): Promise<SaveResult<TEvent>> {
    const current = find(id);
    if (!current) return { kind: "failed", error: new Error("EVENT_NOT_FOUND") };
    const start = patch.start ?? current.start;
    const ende = patch.ende && patch.ende >= start ? patch.ende : start;
    try {
      const event = await transport.save(id, { ...patch, ende, version: current.version });
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
  }

  async function syncOutlook(id: string): Promise<SyncResult<TEvent>> {
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
  }

  async function syncTime2win(id: string): Promise<SyncResult<TEvent>> {
    if (!transport.syncTime2win)
      return { kind: "failed", error: new Error("TIME2WIN_SYNC_UNAVAILABLE") };
    try {
      const result = await transport.syncTime2win(id);
      if (result.kind === "synced") replace(result.event);
      return result;
    } catch (error) {
      return {
        kind: "failed",
        error: error instanceof Error ? error : new Error("TIME2WIN_SYNC_FAILED"),
      };
    }
  }

  const workspace = {
    events: () => collection,
    subscribe(subscriber: () => void) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    load(events: TEvent[]) {
      collection = [...events];
      publish();
    },
    async create(input: CreateEventInput<TEvent>): Promise<TEvent> {
      const event = await transport.create({
        name: input.name,
        eventcode: input.eventcode ?? "",
        veranstalter: input.veranstalter,
        ...(input.veranstalterId ? { veranstalterId: input.veranstalterId } : {}),
        ...(input.sportartId ? { sportartId: input.sportartId } : {}),
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
    openSession(id: string) {
      const current = find(id);
      if (!current) throw new Error("EVENT_NOT_FOUND");
      const editing = createEventEditingSession(current, (draft) => save(id, draft));
      const acceptSaved = async (result: Promise<SaveResult<TEvent>>) => {
        const resolved = await result;
        if (resolved.kind === "saved") editing.accept(resolved.event);
        return resolved;
      };
      const execute = (command: EventDetailCommand) =>
        acceptSaved(
          mutateDetail(id, (event) => {
            const unavailable = () =>
              Promise.reject<TEvent>(new Error("EVENT_TRANSPORT_UNAVAILABLE"));
            switch (command.kind) {
              case "add-contact":
                return (
                  transport.addContact?.(id, command.contactId, command.role, event.version ?? 0) ??
                  unavailable()
                );
              case "remove-contact":
                return (
                  transport.removeContact?.(
                    id,
                    command.contactId,
                    command.role,
                    event.version ?? 0,
                  ) ?? unavailable()
                );
              case "change-contact-role":
                return (
                  transport.updateContactRole?.(
                    id,
                    command.contactId,
                    command.role,
                    command.nextRole,
                    event.version ?? 0,
                  ) ?? unavailable()
                );
              case "create-task":
                return (
                  transport.createTask?.(id, command.input, event.version ?? 0) ?? unavailable()
                );
              case "update-task":
                return (
                  transport.updateTask?.(id, command.taskId, command.input, event.version ?? 0) ??
                  unavailable()
                );
              case "create-file":
                return (
                  transport.createFile?.(id, command.input, event.version ?? 0) ?? unavailable()
                );
              case "create-activity":
                return (
                  transport.createActivity?.(id, command.input, event.version ?? 0) ?? unavailable()
                );
            }
          }),
        );
      return {
        ...editing,
        syncOutlook: async () => {
          const result = await syncOutlook(id);
          if (result.kind === "synced") editing.accept(result.event);
          return result;
        },
        syncTime2win: async () => {
          const result = await syncTime2win(id);
          if (result.kind === "synced") editing.accept(result.event);
          return result;
        },
        execute,
        // Compatibility interface for existing callers; new callers cross `execute`.
        addContact: (contactId: string, role: string) =>
          execute({ kind: "add-contact", contactId, role }),
        removeContact: (contactId: string, role: string) =>
          execute({ kind: "remove-contact", contactId, role }),
        updateContactRole: (contactId: string, role: string, nextRole: string) =>
          execute({ kind: "change-contact-role", contactId, role, nextRole }),
        createTask: (input: { title: string; dueAt?: string; responsible?: string }) =>
          execute({ kind: "create-task", input }),
        updateTask: (
          taskId: string,
          input: {
            title?: string;
            dueAt?: string | null;
            responsible?: string;
            completed?: boolean;
          },
        ) => execute({ kind: "update-task", taskId, input }),
        createFile: (input: { name: string; url?: string; size?: string }) =>
          execute({ kind: "create-file", input }),
        createActivity: (input: {
          channel: string;
          subject: string;
          author?: string;
          body?: string;
          occurredAt?: string;
        }) => execute({ kind: "create-activity", input }),
        outlookPlan: () => transport.outlookPlan(id),
      };
    },
  };

  return workspace;
}
