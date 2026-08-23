import { describe, expect, it } from "vitest";
import { EventStatus } from "@prisma/client";
import {
  EventMutationConflict,
  EventMutations,
  type EventMutationAdapter,
} from "./event-mutations.js";

function adapter(): EventMutationAdapter & { events: Map<string, Record<string, unknown>> } {
  const events = new Map<string, Record<string, unknown>>();
  const organizers = new Map<string, { id: string; name: string }>();
  return {
    events,
    async transaction(work) {
      return work(this);
    },
    async resolveOrganizer(name, id) {
      if (!name) return id;
      const existing = [...organizers.values()].find((organizer) => organizer.name === name);
      if (existing) return existing.id;
      const created = { id: `o${organizers.size + 1}`, name };
      organizers.set(created.id, created);
      return created.id;
    },
    async createEvent(data) {
      const created = { id: "e1", version: 1, ...data };
      events.set("e1", created);
      return created;
    },
    async updateEvent(id, version, changes) {
      const current = events.get(id);
      if (!current || (version !== undefined && current.version !== version)) return false;
      events.set(id, { ...current, ...changes, version: Number(current.version) + 1 });
      return true;
    },
    async replaceInvoiceRecipients(id, organizerIds) {
      events.set(id, { ...events.get(id), invoiceRecipientIds: organizerIds });
    },
    async getEvent(id) {
      return events.get(id);
    },
  };
}

describe("Event mutation module", () => {
  it("creates an Event with organizer recipient defaults in one transition", async () => {
    const persistence = adapter();
    const mutations = new EventMutations(persistence, () => "260823_event_fixed");

    const created = await mutations.create({
      name: "Race",
      startAt: "2026-08-23",
      organizerName: "Club",
    });

    expect(created).toMatchObject({
      eventCode: "260823_event_fixed",
      status: EventStatus.ANFRAGE,
      organizerId: "o1",
      payoutRecipientId: "o1",
      invoiceRecipientIds: ["o1"],
    });
  });

  it("rejects a stale version before replacing invoice recipients", async () => {
    const persistence = adapter();
    persistence.events.set("e1", { id: "e1", version: 2, invoiceRecipientIds: ["o1"] });
    const mutations = new EventMutations(persistence);

    await expect(
      mutations.update("e1", { version: 1, invoiceRecipientIds: ["o2"] }),
    ).rejects.toBeInstanceOf(EventMutationConflict);
    expect(persistence.events.get("e1")?.invoiceRecipientIds).toEqual(["o1"]);
  });
});
