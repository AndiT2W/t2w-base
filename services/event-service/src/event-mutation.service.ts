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
}
