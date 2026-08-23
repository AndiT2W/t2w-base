import { EventStatus } from "@prisma/client";

export type CreateEventMutation = {
  eventCode?: string;
  name: string;
  startAt: string;
  endAt?: string;
  status?: EventStatus;
  organizerId?: string;
  organizerName?: string;
  sportId?: string;
  location?: string;
  responsible?: string;
  participantForecast?: number;
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
  resolveOrganizer(name?: string, id?: string): Promise<string | undefined>;
  createEvent(data: EventMutationRecord): Promise<EventMutationRecord>;
  updateEvent(
    id: string,
    version: number | undefined,
    changes: EventMutationRecord,
  ): Promise<boolean>;
  replaceInvoiceRecipients(id: string, organizerIds: string[]): Promise<void>;
  getEvent(id: string): Promise<EventMutationRecord | undefined>;
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
      const organizerId = await adapter.resolveOrganizer(
        input.organizerName?.trim(),
        input.organizerId,
      );
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
        organizerName: undefined,
      });
    });
  }

  update(id: string, input: UpdateEventMutation) {
    return this.persistence.transaction(async (adapter) => {
      const { version, organizerName, invoiceRecipientIds, ...changes } = input;
      const organizerId = organizerName?.trim()
        ? await adapter.resolveOrganizer(organizerName.trim())
        : organizerName === ""
          ? null
          : undefined;
      const updated = await adapter.updateEvent(id, version, {
        ...changes,
        organizerId,
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
}
