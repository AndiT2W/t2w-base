import { describe, expect, it } from "vitest";
import { EventStatus } from "@prisma/client";
import {
  EventMutationConflict,
  EventMutations,
  type EventMutationAdapter,
} from "./event-mutations.js";

function adapter(): EventMutationAdapter & { events: Map<string, Record<string, unknown>> } {
  const events = new Map<string, Record<string, unknown>>();
  return {
    events,
    async transaction(work) {
      return work(this);
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
    async touchEvent(id, version) {
      const current = events.get(id);
      if (!current || (version !== undefined && current.version !== version)) return false;
      events.set(id, { ...current, version: Number(current.version) + 1 });
      return true;
    },
    async getEvent(id) {
      return events.get(id);
    },
    async replaceContactRole(id, contactId, role, nextRole) {
      events.set(id, { ...events.get(id), contactId, previousRole: role, role: nextRole });
    },
    async addContact(id, contactId, role) {
      events.set(id, { ...events.get(id), contactId, role });
    },
    async removeContact(id, contactId, role) {
      events.set(id, { ...events.get(id), removedContactId: contactId, removedRole: role });
    },
    async createTask(id, input) {
      events.set(id, { ...events.get(id), task: input });
    },
    async updateTask(id, taskId, input) {
      events.set(id, { ...events.get(id), taskId, task: input });
    },
    async createFile(id, input) {
      events.set(id, { ...events.get(id), file: input });
    },
    async createActivity(id, input) {
      events.set(id, { ...events.get(id), activity: input });
    },
    async copyEvent(sourceId, input) {
      const source = events.get(sourceId);
      if (!source) throw new Error("EVENT_NOT_FOUND");
      const copied = {
        ...source,
        id: "copy",
        eventCode: input.eventCode,
        name: input.name,
        startAt: input.startAt,
        endAt: input.endAt,
        seriesId: input.createRelationship ? "series-1" : null,
        t2wEventId: null,
        tasks: [],
        files: [],
        activities: [],
      };
      events.set("copy", copied);
      return copied;
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
      organizerId: "o1",
    });

    expect(created).toMatchObject({
      eventCode: "260823_event_fixed",
      status: EventStatus.ANFRAGE,
      organizerId: "o1",
      payoutRecipientId: "o1",
      invoiceRecipientIds: ["o1"],
    });
  });

  it("uses an organizer ID without resolving a similarly named organizer", async () => {
    const persistence = adapter();
    const mutations = new EventMutations(persistence);

    const created = await mutations.create({
      name: "Race",
      startAt: "2026-08-23",
      organizerId: "o-master",
    });

    expect(created).toMatchObject({
      organizerId: "o-master",
      payoutRecipientId: "o-master",
      invoiceRecipientIds: ["o-master"],
    });
  });

  it("owns the date-based fallback Event code", async () => {
    const persistence = adapter();
    const created = await new EventMutations(
      persistence,
      (startAt) => `${startAt.slice(2, 10).replaceAll("-", "")}_event_fixed`,
    ).create({ name: "Race", startAt: "2027-01-15" });

    expect(created.eventCode).toBe("270115_event_fixed");
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

  it("changes a contact role atomically through the event mutation module", async () => {
    const persistence = adapter();
    persistence.events.set("e1", { id: "e1", version: 1 });
    const event = await new EventMutations(persistence).updateContactRole(
      "e1",
      "p1",
      "Kontakt",
      "  Finanzen ",
      1,
    );
    expect(event).toMatchObject({
      version: 2,
      contactId: "p1",
      previousRole: "Kontakt",
      role: "Finanzen",
    });
  });

  it("returns the refreshed Event and rejects a stale detail command", async () => {
    const persistence = adapter();
    persistence.events.set("e1", { id: "e1", version: 2 });
    const mutations = new EventMutations(persistence);

    await expect(mutations.createTask("e1", { title: "Briefing" }, 1)).rejects.toBeInstanceOf(
      EventMutationConflict,
    );
    await expect(mutations.createTask("e1", { title: "Briefing" }, 2)).resolves.toMatchObject({
      version: 3,
      task: { title: "Briefing" },
    });
  });

  it("copies reusable master data while leaving external and operational data behind", async () => {
    const persistence = adapter();
    persistence.events.set("e1", {
      id: "e1",
      eventCode: "260101_race",
      name: "Race 2026",
      version: 2,
      organizerId: "o1",
      t2wEventId: 44,
      tasks: [{ id: "task" }],
      files: [{ id: "file" }],
      activities: [{ id: "activity" }],
    });
    const copy = await new EventMutations(persistence).copy("e1", {
      name: "Race 2027",
      eventCode: "270105_race",
      startAt: "2027-01-05",
      endAt: "2027-01-06",
      createRelationship: true,
    });
    expect(copy).toMatchObject({
      eventCode: "270105_race",
      name: "Race 2027",
      organizerId: "o1",
      seriesId: "series-1",
      t2wEventId: null,
      tasks: [],
      files: [],
      activities: [],
    });
  });
});
