import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import {
  EventMutations,
  type CreateEventMutation,
  type UpdateEventMutation,
} from "./event-mutations.js";
import { PrismaEventMutationAdapter } from "./prisma-event-mutation.adapter.js";

@Injectable()
export class EventMutationService {
  private readonly mutations: EventMutations;

  constructor(prisma: PrismaService) {
    this.mutations = new EventMutations(
      new PrismaEventMutationAdapter(prisma),
      () => `event_${Date.now()}`,
    );
  }

  create(input: CreateEventMutation) {
    return this.mutations.create(input);
  }
  update(id: string, input: UpdateEventMutation) {
    return this.mutations.update(id, input);
  }
  addContact(eventId: string, contactId: string, role: string, version: number) { return this.mutations.addContact(eventId, contactId, role, version); }
  removeContact(eventId: string, contactId: string, role: string, version: number) { return this.mutations.removeContact(eventId, contactId, role, version); }
  changeContactRole(eventId: string, contactId: string, role: string, nextRole: string, version: number) { return this.mutations.updateContactRole(eventId, contactId, role, nextRole, version); }
  createTask(eventId: string, input: { title: string; dueAt?: string; responsible?: string }, version: number) { return this.mutations.createTask(eventId, input, version); }
  updateTask(eventId: string, taskId: string, input: { title?: string; dueAt?: string | null; responsible?: string; completed?: boolean }, version: number) { return this.mutations.updateTask(eventId, taskId, input, version); }
  createFile(eventId: string, input: { name: string; url?: string; size?: string }, version: number) { return this.mutations.createFile(eventId, input, version); }
  createActivity(eventId: string, input: { channel: string; subject: string; author?: string; body?: string; occurredAt?: string }, version: number) { return this.mutations.createActivity(eventId, input, version); }
}
