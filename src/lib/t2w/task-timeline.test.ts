import { describe, expect, it } from "vitest";
import {
  dayToIso,
  isoDay,
  timelinePosition,
  timelineRows,
  timelineScale,
  timelineTicks,
} from "./task-timeline";

const today = "2026-09-17";

describe("timelineScale", () => {
  it("spannt über Aufgaben, heute und das Eventdatum", () => {
    const scale = timelineScale(["2026-09-20", "2026-10-05"], {
      today,
      eventStart: "2026-10-14",
      paddingDays: 0,
    });

    expect(dayToIso(scale.from)).toBe(today);
    expect(dayToIso(scale.to)).toBe("2026-10-14");
    expect(scale.days).toBe(27);
  });

  it("nimmt auch Aufgaben auf, die vor heute liegen", () => {
    const scale = timelineScale(["2026-09-01"], { today, paddingDays: 0 });

    expect(dayToIso(scale.from)).toBe("2026-09-01");
    expect(dayToIso(scale.to)).toBe(today);
  });

  it("legt Rand an beiden Enden dazu", () => {
    const scale = timelineScale(["2026-09-20"], { today, paddingDays: 3 });

    expect(dayToIso(scale.from)).toBe("2026-09-14");
    expect(dayToIso(scale.to)).toBe("2026-09-23");
  });

  it("hält die Spanne bei mindestens einem Tag", () => {
    const scale = timelineScale([today], { today, paddingDays: 0 });

    expect(scale.days).toBe(1);
  });

  it("kommt ohne datierte Aufgaben aus", () => {
    const scale = timelineScale([null, undefined], { today, eventStart: "2026-10-14" });

    expect(scale.days).toBeGreaterThan(0);
  });
});

describe("timelinePosition", () => {
  const scale = timelineScale(["2026-09-17", "2026-10-17"], { today, paddingDays: 0 });

  it("setzt den Anfang auf 0 und das Ende auf 1", () => {
    expect(timelinePosition(scale, "2026-09-17")).toBe(0);
    expect(timelinePosition(scale, "2026-10-17")).toBe(1);
  });

  it("setzt die Mitte auf die Hälfte", () => {
    expect(timelinePosition(scale, "2026-10-02")).toBeCloseTo(0.5, 2);
  });

  it("kappt Werte außerhalb der Achse", () => {
    expect(timelinePosition(scale, "2026-01-01")).toBe(0);
    expect(timelinePosition(scale, "2027-01-01")).toBe(1);
  });

  it("liefert für Aufgaben ohne Datum nichts", () => {
    expect(timelinePosition(scale, null)).toBeNull();
    expect(timelinePosition(scale, "")).toBeNull();
  });
});

describe("timelineTicks", () => {
  it("verteilt die Beschriftungen gleichmäßig", () => {
    const scale = timelineScale(["2026-09-17", "2026-10-17"], { today, paddingDays: 0 });

    expect(timelineTicks(scale, 3)).toEqual(["2026-09-17", "2026-10-02", "2026-10-17"]);
  });
});

describe("timelineRows", () => {
  it("lässt weit auseinanderliegende Aufgaben in einer Reihe", () => {
    const rows = timelineRows([
      { item: "a", position: 0 },
      { item: "b", position: 0.5 },
      { item: "c", position: 1 },
    ]);

    expect(rows.map((entry) => entry.row)).toEqual([0, 0, 0]);
  });

  it("schiebt einen zu nahen Nachbarn in die zweite Reihe", () => {
    const rows = timelineRows([
      { item: "a", position: 0.2 },
      { item: "b", position: 0.25 },
      { item: "c", position: 0.6 },
    ]);

    expect(rows.map((entry) => entry.row)).toEqual([0, 1, 0]);
  });

  it("nutzt eine dritte Reihe, wenn zwei nicht reichen", () => {
    const rows = timelineRows([
      { item: "a", position: 0.2 },
      { item: "b", position: 0.24 },
      { item: "c", position: 0.28 },
    ]);

    expect(rows.map((entry) => entry.row)).toEqual([0, 1, 2]);
  });

  it("nimmt bei zu vielen nahen Terminen die am längsten freie Reihe", () => {
    const rows = timelineRows([
      { item: "a", position: 0.2 },
      { item: "b", position: 0.22 },
      { item: "c", position: 0.24 },
      { item: "d", position: 0.26 },
    ]);

    expect(rows.map((entry) => entry.row)).toEqual([0, 1, 2, 0]);
  });

  it("sortiert nach Position, nicht nach Eingabereihenfolge", () => {
    const rows = timelineRows([
      { item: "spaet", position: 0.9 },
      { item: "frueh", position: 0.1 },
    ]);

    expect(rows.map((entry) => entry.item)).toEqual(["frueh", "spaet"]);
  });
});

describe("isoDay", () => {
  it("nimmt auch Zeitstempel mit Uhrzeit an", () => {
    expect(isoDay("2026-09-17T14:00:00Z")).toBe(isoDay("2026-09-17"));
  });

  it("weist Unbrauchbares ab", () => {
    expect(isoDay("morgen")).toBeNull();
    expect(isoDay(null)).toBeNull();
  });
});
