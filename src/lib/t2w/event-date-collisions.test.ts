import { describe, expect, it } from "vitest";
import { createEventDateCollisionMap, type EventDateRange } from "./event-date-collisions";

function event(id: string, name: string, start: string, ende = start): EventDateRange {
  return { id, name, start, ende };
}

describe("createEventDateCollisionMap", () => {
  it("groups events on the same day and lists their peers", () => {
    const collisions = createEventDateCollisionMap([
      event("a", "Berglauf", "2026-09-20"),
      event("b", "Stadtlauf", "2026-09-20"),
      event("c", "Winterlauf", "2026-12-01"),
    ]);

    expect(collisions.get("a")).toEqual({
      groupIndex: 0,
      eventCount: 2,
      peerNames: ["Stadtlauf"],
    });
    expect(collisions.get("b")?.peerNames).toEqual(["Berglauf"]);
    expect(collisions.has("c")).toBe(false);
  });

  it("groups only events with the same start date", () => {
    const collisions = createEventDateCollisionMap([
      event("a", "Langzeit-Event", "2026-01-01", "2026-03-01"),
      event("b", "Samstagslauf", "2026-01-02"),
      event("c", "Trailrun", "2026-01-02"),
    ]);

    expect(collisions.has("a")).toBe(false);
    expect(collisions.get("b")).toMatchObject({
      groupIndex: 0,
      eventCount: 2,
      peerNames: ["Trailrun"],
    });
  });

  it("ignores separate and invalid date ranges", () => {
    const collisions = createEventDateCollisionMap([
      event("a", "Montag", "2026-09-21"),
      event("b", "Dienstag", "2026-09-22"),
      event("c", "Ohne Datum", "offen"),
    ]);

    expect(collisions.size).toBe(0);
  });
});
