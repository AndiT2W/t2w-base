import {
  createEventEditingSession as createDomainEventEditingSession,
  createEventWorkspace as createDomainEventWorkspace,
  type CreateEventInput as DomainCreateEventInput,
  type EventTransport,
  type OutlookFolderPlan,
  type SaveResult as DomainSaveResult,
  type SyncResult as DomainSyncResult,
} from "@t2w/domain/event";
import type { T2WEvent } from "./types";

export type CreateEventInput = DomainCreateEventInput<T2WEvent>;
export type SaveResult = DomainSaveResult<T2WEvent>;
export type SyncResult = DomainSyncResult<T2WEvent>;
export type { OutlookFolderPlan } from "@t2w/domain/event";

export const createEventEditingSession = (
  initial: T2WEvent,
  persist: (draft: T2WEvent) => Promise<SaveResult>,
) => createDomainEventEditingSession(initial, persist);

export const createEventWorkspace = (transport: EventTransport<T2WEvent>) =>
  createDomainEventWorkspace(transport);

export type EventWorkspace = ReturnType<typeof createEventWorkspace>;
export type EventEditingSession = ReturnType<EventWorkspace["openSession"]>;
