import { describe, expect, it } from "vitest";
import { formatDatum, formatDatumMitZeit, formatZeitraum } from "./format";

describe("Datumsformatierung", () => {
  it("zeigt einzelne ISO-Daten immer als dd.mm.yyyy", () => {
    expect(formatDatum("2026-09-05")).toBe("05.09.2026");
    expect(formatDatum("2026-09-05T08:30:00.000Z")).toBe("05.09.2026");
  });

  it("zeigt in Zeiträumen beide Daten vollständig", () => {
    expect(formatZeitraum("2026-09-05", "2026-09-05")).toBe("05.09.2026");
    expect(formatZeitraum("2026-09-05", "2026-09-08")).toBe("05.09.2026 – 08.09.2026");
  });

  it("behält bei Zeitstempeln das vollständige numerische Datum vor der Uhrzeit", () => {
    expect(formatDatumMitZeit("2026-09-05T08:30:00.000Z")).toBe("05.09.2026, 10:30");
  });
});
