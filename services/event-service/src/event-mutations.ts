import { EventStatus } from "@prisma/client";

export type CreateEventMutation = {
  eventCode?: string;
  name: string;
  startAt: string;
  endAt?: string;
  status?: EventStatus;
  organizerId?: string;
  sportId?: string;
  location?: string;
  responsible?: string;
  participantForecast?: number;
  t2wEventId?: number;
  archived?: boolean;
  notes?: string;
  outlookFolder?: string;
  outlookWebUrl?: string;
  sharepointFolder?: string;
  payoutRecipientId?: string;
  invoiceRecipientIds?: string[];
};
export type UpdateEventMutation = Partial<CreateEventMutation> & { version?: number };
export type EventMutationRecord = Record<string, unknown>;

export interface EventMutationAdapter {
  transaction<T>(work: (adapter: EventMutationAdapter) => Promise<T>): Promise<T>;
  createEvent(data: EventMutationRecord): Promise<EventMutationRecord>;
  updateEvent(
    id: string,
    version: number | undefined,
    changes: EventMutationRecord,
  ): Promise<boolean>;
  replaceInvoiceRecipients(id: string, organizerIds: string[]): Promise<void>;
  getEvent(id: string): Promise<EventMutationRecord | undefined>;
  touchEvent(id: string, version: number | undefined): Promise<boolean>;
  addContact(eventId: string, contactId: string, role: string): Promise<void>;
  removeContact(eventId: string, contactId: string, role: string): Promise<void>;
  replaceContactRole?(eventId: string, contactId: string, role: string, nextRole: string): Promise<void>;
  createTask(eventId: string, input: { title: string; dueAt?: string; responsible?: string }): Promise<void>;
  updateTask(eventId: string, taskId: string, input: { title?: string; dueAt?: string | null; responsible?: string; completed?: boolean }): Promise<void>;
  createFile(eventId: string, input: { name: string; url?: string; size?: string }): Promise<void>;
  createActivity(eventId: string, input: { channel: string; subject: string; author?: string; body?: string; occurredAt?: string }): Promise<void>;
}

export class EventMutationConflict extends Error {
  constructor() {
    super("EVENT_VERSION_CONFLICT");
  }
}

export class EventMutations {
  constructor(
    private readonly persistence: EventMutationAdapter,
    private readonly generateEventCode = () => `event_${Date.now()}`,
  ) {}

  create(input: CreateEventMutation) {
    return this.persistence.transaction(async (adapter) => {
      const organizerId = input.organizerId;
      const invoiceRecipientIds = input.invoiceRecipientIds?.length
        ? input.invoiceRecipientIds
        : organizerId
          ? [organizerId]
          : [];
      return adapter.createEvent({
        ...input,
        eventCode: input.eventCode?.trim() || this.generateEventCode(),
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt ?? input.startAt),
        status: input.status ?? EventStatus.ANFRAGE,
        organizerId,
        payoutRecipientId: input.payoutRecipientId ?? organizerId,
        invoiceRecipientIds,
      });
    });
  }

  update(id: string, input: UpdateEventMutation) {
    return this.persistence.transaction(async (adapter) => {
      const { version, invoiceRecipientIds, ...changes } = input;
      const updated = await adapter.updateEvent(id, version, {
        ...changes,
        startAt: changes.startAt ? new Date(changes.startAt) : undefined,
        endAt: changes.endAt ? new Date(changes.endAt) : undefined,
      });
      if (!updated) throw new EventMutationConflict();
      if (invoiceRecipientIds) await adapter.replaceInvoiceRecipients(id, invoiceRecipientIds);
      const event = await adapter.getEvent(id);
      if (!event) throw new EventMutationConflict();
      return event;
    });
  }

  changeContactRole(eventId: string, contactId: string, role: string, nextRole: string) {
    return this.mutate(eventId, undefined, async (adapter) => {
      if (!adapter.replaceContactRole) throw new Error("CONTACT_ROLE_ADAPTER_UNAVAILABLE");
      await adapter.replaceContactRole(eventId, contactId, role, nextRole.trim() || "Kontakt");
    });
  }

  addContact(eventId: string, contactId: string, role: string, version: number) {
    return this.mutate(eventId, version, (adapter) => adapter.addContact(eventId, contactId, role.trim() || "Kontakt"));
  }
  removeContact(eventId: string, contactId: string, role: string, version: number) {
    return this.mutate(eventId, version, (adapter) => adapter.removeContact(eventId, contactId, role));
  }
  updateContactRole(eventId: string, contactId: string, role: string, nextRole: string, version: number) {
    return this.mutate(eventId, version, async (adapter) => {
      if (!adapter.replaceContactRole) throw new Error("CONTACT_ROLE_ADAPTER_UNAVAILABLE");
      await adapter.replaceContactRole(eventId, contactId, role, nextRole.trim() || "Kontakt");
    });
  }
  createTask(eventId: string, input: { title: string; dueAt?: string; responsible?: string }, version: number) {
    return this.mutate(eventId, version, (adapter) => adapter.createTask(eventId, input));
  }
  updateTask(eventId: string, taskId: string, input: { title?: string; dueAt?: string | null; responsible?: string; completed?: boolean }, version: number) {
    return this.mutate(eventId, version, (adapter) => adapter.updateTask(eventId, taskId, input));
  }
  createFile(eventId: string, input: { name: string; url?: string; size?: string }, version: number) {
    return this.mutate(eventId, version, (adapter) => adapter.createFile(eventId, input));
  }
  createActivity(eventId: string, input: { channel: string; subject: string; author?: string; body?: string; occurredAt?: string }, version: number) {
    return this.mutate(eventId, version, (adapter) => adapter.createActivity(eventId, input));
  }

  private mutate(id: string, version: number | undefined, work: (adapter: EventMutationAdapter) => Promise<void>) {
    return this.persistence.transaction(async (adapter) => {
      if (!(await adapter.touchEvent(id, version))) throw new EventMutationConflict();
      await work(adapter);
      const event = await adapter.getEvent(id);
      if (!event) throw new EventMutationConflict();
      return event;
    });
  }
}
