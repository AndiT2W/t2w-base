import { describe, expect, it } from "vitest";
import { createEventDateCollisionMap, type EventDateRange } from "./event-date-collisions";

function event(
  id: string,
  name: string,
  start: string,
  ende = start,
  services: string[] = ["UHF"],
): EventDateRange {
  return { id, name, start, ende, services };
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

  it("counts only events with the Active or UHF service", () => {
    const collisions = createEventDateCollisionMap([
      event("a", "Active-Lauf", "2026-09-20", "2026-09-20", ["Active"]),
      event("b", "UHF-Lauf", "2026-09-20", "2026-09-20", ["UHF"]),
      event("c", "Video-Lauf", "2026-09-20", "2026-09-20", ["Video (iRewind)"]),
      event("d", "Ohne Service", "2026-09-20", "2026-09-20", []),
    ]);

    expect(collisions.get("a")).toMatchObject({ eventCount: 2, peerNames: ["UHF-Lauf"] });
    expect(collisions.get("b")).toMatchObject({ eventCount: 2, peerNames: ["Active-Lauf"] });
    expect(collisions.has("c")).toBe(false);
    expect(collisions.has("d")).toBe(false);
  });
});
