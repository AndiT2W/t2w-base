import { EventStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  ClickUpEventImportService,
  mergeClickUpTaskSnapshots,
  normalizeClickUpEvent,
} from "./clickup-event-import.js";

describe("ClickUp event import", () => {
  const task = {
    id: "86abc",
    name: "Musterlauf 2026",
    url: "https://app.clickup.com/t/86abc",
    status: { status: "zugesagt" },
    date_updated: "1776000000000",
    start_date: "1775000000000",
    due_date: "1775100000000",
    description: "ClickUp-Originalbeschreibung",
    assignees: [{ username: "Andi" }, { username: "Julia" }],
    custom_fields: [
      { name: "Ort", value: { formatted_address: "Linz, Österreich" } },
      { name: "Teilnehmer", value: "250" },
      { name: "Event Id", value: "1234" },
      { name: "Sportart", value: "Lauf" },
    ],
  };

  it("maps business fields and retains the immutable source snapshot", () => {
    const item = normalizeClickUpEvent(task);

    expect(item).toMatchObject({
      clickUpId: "86abc",
      eventCode: "260331_musterlauf",
      status: EventStatus.ZUGESAGT,
      location: "Linz, Österreich",
      responsible: "Andi, Julia",
      participantForecast: 250,
      t2wEventId: 1234,
      sportName: "Lauf",
      notes: "ClickUp-Originalbeschreibung",
    });
    expect(item.sourceData).toEqual(task);
  });

  it("uses the business Eventstatus before the ClickUp workflow status", () => {
    const item = normalizeClickUpEvent({
      ...task,
      status: "offen",
      custom_fields: [...task.custom_fields, { name: "Eventstatus", value: "ZUSAGE" }],
    });

    expect(item.status).toBe(EventStatus.ZUGESAGT);
  });

  it("maps the captured ClickUp Eventstatus dropdown value for Zusage", () => {
    const item = normalizeClickUpEvent({
      ...task,
      status: "offen",
      custom_fields: [...task.custom_fields, { name: "Eventstatus", value: 1 }],
    });

    expect(item.status).toBe(EventStatus.ZUGESAGT);
  });

  it("maps the captured ClickUp Sportart dropdown value", () => {
    const item = normalizeClickUpEvent({
      ...task,
      custom_fields: [
        ...task.custom_fields.filter((field) => field.name !== "Sportart"),
        { name: "Sportart", value: 8 },
      ],
    });

    expect(item.sportName).toBe("Triathlon");
  });

  it("merges a full detail response into every list task without dropping list metadata", () => {
    const [merged] = mergeClickUpTaskSnapshots(
      [{ id: "86abc", name: "Musterlauf 2026", date_updated: "1776000000000" }],
      [task],
    );

    expect(merged.description).toBe("ClickUp-Originalbeschreibung");
    expect(merged.sourceSnapshots).toEqual({
      listTask: { id: "86abc", name: "Musterlauf 2026", date_updated: "1776000000000" },
      detailTask: task,
    });
  });

  it("upserts by ClickUp ID and stores the source in a dedicated relation", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "event-1" });
    const sportUpsert = vi.fn().mockResolvedValue({ id: "sport-1" });
    const findMany = vi
      .fn()
      .mockResolvedValue([{ clickUpId: "86abc", eventCode: "clickup-86abc", organizerId: null }]);
    const service = new ClickUpEventImportService({
      event: { findMany, upsert },
      sport: { upsert: sportUpsert },
      organizer: { findMany: vi.fn().mockResolvedValue([]) },
    } as any);

    const result = await service.run([task]);

    expect(result).toEqual({
      total: 1,
      imported: 1,
      errors: [],
      sports: { mapped: 1, sourceMissing: 0, unresolved: [] },
      services: { mapped: 0, sourceMissing: 1, unresolved: [] },
      organizers: { mapped: 0, preserved: 0, sourceMissing: 1, unresolved: [] },
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clickUpId: "86abc" },
        create: expect.objectContaining({
          clickUpId: "86abc",
          clickUpSource: {
            create: expect.objectContaining({ clickUpId: "86abc", sourceData: task }),
          },
        }),
        update: expect.objectContaining({
          eventCode: "260331_musterlauf",
          clickUpSource: expect.any(Object),
        }),
      }),
    );
  });

  it("does not revert an existing status when a partial snapshot lacks Eventstatus", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "event-1" });
    const service = new ClickUpEventImportService({
      event: {
        findMany: vi.fn().mockResolvedValue([
          { clickUpId: "86abc", eventCode: "260331_musterlauf", organizerId: null },
        ]),
        upsert,
      },
      sport: { upsert: vi.fn().mockResolvedValue({ id: "sport-1" }) },
      organizer: { findMany: vi.fn().mockResolvedValue([]) },
    } as any);

    await service.run([{ ...task, status: "offen" }]);

    expect(upsert.mock.calls[0][0].update).not.toHaveProperty("status");
  });

  it("assigns the service represented by the ClickUp Typ field", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "event-1" });
    const serviceOptionFindMany = vi.fn().mockResolvedValue([{ id: "service-uhf", name: "UHF" }]);
    const eventServiceUpsert = vi.fn().mockResolvedValue({});
    const service = new ClickUpEventImportService({
      event: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert,
      },
      sport: { upsert: vi.fn().mockResolvedValue({ id: "sport-1" }) },
      organizer: { findMany: vi.fn().mockResolvedValue([]) },
      serviceOption: { findMany: serviceOptionFindMany },
      eventService: { upsert: eventServiceUpsert },
    } as any);

    await service.run([
      {
        ...task,
        custom_fields: [...task.custom_fields, { name: "Typ", value: 2 }],
      },
    ]);

    expect(eventServiceUpsert).toHaveBeenCalledWith({
      where: { eventId_serviceId: { eventId: "event-1", serviceId: "service-uhf" } },
      create: { eventId: "event-1", serviceId: "service-uhf" },
      update: {},
    });
  });

  it("allocates suffixes without taking an existing non-ClickUp event code", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "event-1" });
    const service = new ClickUpEventImportService({
      event: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ clickUpId: null, eventCode: "260331_musterlauf", organizerId: null }]),
        upsert,
      },
      sport: { upsert: vi.fn().mockResolvedValue({ id: "sport-1" }) },
      organizer: { findMany: vi.fn().mockResolvedValue([]) },
    } as any);

    await service.run([task]);

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ eventCode: "260331_musterlauf_02", clickUpId: "86abc" }),
      }),
    );
  });

  it("maps one unambiguous Veranstalter and never overwrites an existing organizer", async () => {
    const organizerTask = {
      ...task,
      custom_fields: [
        ...task.custom_fields,
        { name: "Veranstalter", value: [{ id: "clickup-organizer", name: "Nördwerk GmbH!" }] },
      ],
    };
    const run = async (organizerId: string | null) => {
      const upsert = vi.fn().mockResolvedValue({ id: "event-1" });
      const service = new ClickUpEventImportService({
        event: {
          findMany: vi
            .fn()
            .mockResolvedValue([{ clickUpId: "86abc", eventCode: "260331_musterlauf", organizerId }]),
          upsert,
        },
        sport: { upsert: vi.fn().mockResolvedValue({ id: "sport-1" }) },
        organizer: {
          findMany: vi.fn().mockResolvedValue([{ id: "organizer-1", name: "NORDWERK GmbH" }]),
        },
      } as any);
      return { result: await service.run([organizerTask]), upsert };
    };

    const mapped = await run(null);
    expect(mapped.result.organizers).toEqual({
      mapped: 1,
      preserved: 0,
      sourceMissing: 0,
      unresolved: [],
    });
    expect(mapped.upsert.mock.calls[0][0].update).toMatchObject({
      organizer: { connect: { id: "organizer-1" } },
    });

    const preserved = await run("manual-organizer");
    expect(preserved.result.organizers).toEqual({
      mapped: 0,
      preserved: 1,
      sourceMissing: 0,
      unresolved: [],
    });
    expect(preserved.upsert.mock.calls[0][0].update).not.toHaveProperty("organizer");
  });

  it("reports multiple source organizers for manual review", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "event-1" });
    const service = new ClickUpEventImportService({
      event: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ clickUpId: "86abc", eventCode: "260331_musterlauf", organizerId: null }]),
        upsert,
      },
      sport: { upsert: vi.fn().mockResolvedValue({ id: "sport-1" }) },
      organizer: { findMany: vi.fn().mockResolvedValue([]) },
    } as any);

    const result = await service.run([
      {
        ...task,
        custom_fields: [
          ...task.custom_fields,
          {
            name: "Veranstalter",
            value: [{ name: "Erster Verein" }, { name: "Zweiter Verein" }],
          },
        ],
      },
    ]);

    expect(result.organizers.unresolved).toEqual([
      expect.objectContaining({
        sourceOrganizerNames: ["Erster Verein", "Zweiter Verein"],
        reason: "MULTIPLE_SOURCE_ORGANIZERS",
      }),
    ]);
  });
});
