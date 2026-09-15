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
  financeNotes?: string;
  contactsNotes?: string;
  outlookFolder?: string;
  outlookWebUrl?: string;
  sharepointFolder?: string;
  payoutRecipientId?: string;
  invoiceRecipientIds?: string[];
  serviceIds?: string[];
};
export type UpdateEventMutation = Partial<CreateEventMutation> & { version?: number };
export type CopyEventMutation = {
  name: string;
  eventCode: string;
  startAt: string;
  endAt: string;
  createRelationship: boolean;
  version?: number;
};
export type EventSeriesMutation = {
  targetEventIds?: string[];
  targetEventId?: string;
  version?: number;
};
export type EventMutationRecord = Record<string, unknown>;

export interface EventMutationAdapter {
  transaction<T>(work: (adapter: EventMutationAdapter) => Promise<T>): Promise<T>;
  createEvent(data: EventMutationRecord): Promise<EventMutationRecord>;
  deleteEvent(id: string): Promise<boolean>;
  updateEvent(
    id: string,
    version: number | undefined,
    changes: EventMutationRecord,
  ): Promise<boolean>;
  replaceInvoiceRecipients(id: string, organizerIds: string[]): Promise<void>;
  replaceServices(id: string, serviceIds: string[]): Promise<void>;
  getEvent(id: string): Promise<EventMutationRecord | undefined>;
  getEventsBySeries(seriesId: string): Promise<EventMutationRecord[]>;
  touchEvent(id: string, version: number | undefined): Promise<boolean>;
  addContact(eventId: string, contactId: string, role: string): Promise<void>;
  removeContact(eventId: string, contactId: string, role: string): Promise<void>;
  replaceContactRole?(
    eventId: string,
    contactId: string,
    role: string,
    nextRole: string,
  ): Promise<void>;
  createFile(eventId: string, input: { name: string; url?: string; size?: string }): Promise<void>;
  createActivity(
    eventId: string,
    input: {
      channel: string;
      subject: string;
      author?: string;
      body?: string;
      occurredAt?: string;
    },
  ): Promise<void>;
  copyEvent(sourceId: string, input: CopyEventMutation): Promise<EventMutationRecord>;
}

export class EventMutationConflict extends Error {
  constructor() {
    super("EVENT_VERSION_CONFLICT");
  }
}

export class EventMutations {
  constructor(
    private readonly persistence: EventMutationAdapter,
    private readonly generateEventCode = (startAt: string) =>
      `${new Date(startAt).toISOString().slice(2, 10).replaceAll("-", "")}_event_${Date.now()}`,
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
        eventCode: input.eventCode?.trim() || this.generateEventCode(input.startAt),
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt ?? input.startAt),
        status: input.status ?? EventStatus.ANFRAGE,
        organizerId,
        payoutRecipientId: input.payoutRecipientId ?? organizerId,
        invoiceRecipientIds,
      });
    });
  }

  remove(id: string) {
    return this.persistence.transaction(async (adapter) => {
      if (!(await adapter.deleteEvent(id))) throw new EventMutationConflict();
    });
  }

  copy(sourceId: string, input: CopyEventMutation) {
    return this.persistence.transaction((adapter) => adapter.copyEvent(sourceId, input));
  }

  updateSeries(id: string, input: EventSeriesMutation) {
    return this.persistence.transaction(async (adapter) => {
      const current = await adapter.getEvent(id);
      if (!current) throw new EventMutationConflict();
      const requestedTargetIds =
        input.targetEventIds ?? (input.targetEventId ? [input.targetEventId] : []);
      const legacySingleTarget = input.targetEventIds === undefined && Boolean(input.targetEventId);
      const targetEventIds = [...new Set(requestedTargetIds)].filter((targetId) => targetId !== id);
      if (!targetEventIds.length) {
        if (requestedTargetIds.length) return [current];
        if (!(await adapter.updateEvent(id, input.version, { seriesId: null })))
          throw new EventMutationConflict();
        const event = await adapter.getEvent(id);
        if (!event) throw new EventMutationConflict();
        return [event];
      }

      const targets = await Promise.all(
        targetEventIds.map((targetId) => adapter.getEvent(targetId)),
      );
      if (targets.some((target) => !target)) throw new Error("SERIES_TARGET_NOT_FOUND");

      const currentSeriesId = current.seriesId as string | null | undefined;
      const legacyTargetSeriesId = (targets[0]?.seriesId as string | null | undefined) ?? undefined;
      const targetSeriesId = legacySingleTarget
        ? (legacyTargetSeriesId ?? crypto.randomUUID())
        : (currentSeriesId ?? crypto.randomUUID());
      const selectedIds = new Set([id, ...targetEventIds]);
      const changedEvents = new Map<string, EventMutationRecord>();

      if (currentSeriesId && !legacySingleTarget) {
        const formerSeriesEvents = await adapter.getEventsBySeries(currentSeriesId);
        for (const formerEvent of formerSeriesEvents) {
          const formerId = formerEvent.id as string;
          if (selectedIds.has(formerId)) continue;
          if (
            !(await adapter.updateEvent(formerId, formerEvent.version as number | undefined, {
              seriesId: null,
            }))
          )
            throw new EventMutationConflict();
          const detachedEvent = await adapter.getEvent(formerId);
          if (!detachedEvent) throw new EventMutationConflict();
          changedEvents.set(formerId, detachedEvent);
        }
      }

      for (const target of targets as EventMutationRecord[]) {
        const targetId = target.id as string;
        if (target.seriesId !== targetSeriesId) {
          if (
            !(await adapter.updateEvent(targetId, target.version as number | undefined, {
              seriesId: targetSeriesId,
            }))
          )
            throw new EventMutationConflict();
        }
        const updatedTarget = await adapter.getEvent(targetId);
        if (!updatedTarget) throw new EventMutationConflict();
        changedEvents.set(targetId, updatedTarget);
      }

      if (!(await adapter.updateEvent(id, input.version, { seriesId: targetSeriesId })))
        throw new EventMutationConflict();
      const event = await adapter.getEvent(id);
      if (!event) throw new EventMutationConflict();
      changedEvents.delete(id);
      return [event, ...changedEvents.values()];
    });
  }

  update(id: string, input: UpdateEventMutation) {
    return this.persistence.transaction(async (adapter) => {
      const { version, invoiceRecipientIds, serviceIds, ...changes } = input;
      const updated = await adapter.updateEvent(id, version, {
        ...changes,
        startAt: changes.startAt ? new Date(changes.startAt) : undefined,
        endAt: changes.endAt ? new Date(changes.endAt) : undefined,
      });
      if (!updated) throw new EventMutationConflict();
      if (invoiceRecipientIds) await adapter.replaceInvoiceRecipients(id, invoiceRecipientIds);
      if (serviceIds) await adapter.replaceServices(id, serviceIds);
      const event = await adapter.getEvent(id);
      if (!event) throw new EventMutationConflict();
      return event;
    });
  }

  addContact(eventId: string, contactId: string, role: string, version: number) {
    return this.mutate(eventId, version, (adapter) =>
      adapter.addContact(eventId, contactId, role.trim() || "Kontakt"),
    );
  }
  removeContact(eventId: string, contactId: string, role: string, version: number) {
    return this.mutate(eventId, version, (adapter) =>
      adapter.removeContact(eventId, contactId, role),
    );
  }
  updateContactRole(
    eventId: string,
    contactId: string,
    role: string,
    nextRole: string,
    version: number,
  ) {
    return this.mutate(eventId, version, async (adapter) => {
      if (!adapter.replaceContactRole) throw new Error("CONTACT_ROLE_ADAPTER_UNAVAILABLE");
      await adapter.replaceContactRole(eventId, contactId, role, nextRole.trim() || "Kontakt");
    });
  }
  createFile(
    eventId: string,
    input: { name: string; url?: string; size?: string },
    version: number,
  ) {
    return this.mutate(eventId, version, (adapter) => adapter.createFile(eventId, input));
  }
  createActivity(
    eventId: string,
    input: {
      channel: string;
      subject: string;
      author?: string;
      body?: string;
      occurredAt?: string;
    },
    version: number,
  ) {
    return this.mutate(eventId, version, (adapter) => adapter.createActivity(eventId, input));
  }

  private mutate(
    id: string,
    version: number | undefined,
    work: (adapter: EventMutationAdapter) => Promise<void>,
  ) {
    return this.persistence.transaction(async (adapter) => {
      if (!(await adapter.touchEvent(id, version))) throw new EventMutationConflict();
      await work(adapter);
      const event = await adapter.getEvent(id);
      if (!event) throw new EventMutationConflict();
      return event;
    });
  }
}
