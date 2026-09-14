import { describe, expect, it } from "vitest";
import { invoiceReadyEvents, openOfferEvents, selectEvents } from "./event-projections";
import type { T2WEvent } from "./types";
const base = {
  id: "1",
  eventcode: "e",
  name: "Race",
  veranstalter: "Club",
  ort: "Wien",
  start: "2026-08-20",
  ende: "2026-08-21",
  status: "anfrage",
  verantwortlicher: "Ada",
  teilnehmer: 0,
  archiviert: false,
  notizen: "",
  outlookOrdner: null,
  outlookWebUrl: null,
  sharepointOrdner: null,
  kontakte: [],
  taskReadiness: { openCount: 0, overdueCount: 0 },
  dateien: [],
  kommunikation: [],
} as T2WEvent;
describe("Event projections", () => {
  it("keeps list, offer and invoice temporal rules consistent", () => {
    const events = [
      base,
      { ...base, id: "2", status: "zugesagt", ende: "2026-08-22" },
      { ...base, id: "3", archiviert: true },
    ] as T2WEvent[];
    expect(openOfferEvents(events).map((e) => e.id)).toEqual(["1"]);
    expect(invoiceReadyEvents(events, "2026-08-23").map((e) => e.id)).toEqual(["2", "1", "3"]);
    expect(
      selectEvents(events, {
        query: "",
        status: "alle",
        period: "vergangen",
        archive: "aktiv",
        today: "2026-08-23",
      }).map((e) => e.id),
    ).toEqual(["1", "2"]);
  });
});
