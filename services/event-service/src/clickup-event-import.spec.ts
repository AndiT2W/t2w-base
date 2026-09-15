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
      eventCode: "clickup-86abc",
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
    const service = new ClickUpEventImportService({
      event: { upsert },
      sport: { upsert: sportUpsert },
    } as any);

    const result = await service.run([task]);

    expect(result).toEqual({ total: 1, imported: 1, errors: [] });
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
          clickUpSource: expect.any(Object),
        }),
      }),
    );
  });
});
