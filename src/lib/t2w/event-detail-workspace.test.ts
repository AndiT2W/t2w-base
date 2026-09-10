import { describe, expect, it, vi } from "vitest";
import { createEventDetailWorkspace } from "./event-detail-workspace";
import { createEventWorkspace } from "./event-workspace";
import type { T2WEvent } from "./types";
import type { Kunde, Person } from "@/lib/crm/types";

const event = {
  id: "e1",
  version: 1,
  eventcode: "270115_mountain_attack",
  name: "Mountain Attack",
  start: "2027-01-15",
  ende: "2027-01-15",
  veranstalterId: "c1",
  kontakte: [],
  aufgaben: [],
  dateien: [],
  kommunikation: [],
  rechnungsempfaengerIds: ["c1"],
} as T2WEvent;
const person = {
  id: "p1",
  vorname: "Marion",
  nachname: "Kessler",
  email: "m@example.at",
  kundenIds: ["c1"],
} as Person;
const customer = { id: "c1", name: "Mountain Attack GmbH" } as Kunde;

function setup(
  syncTime2win = vi
    .fn()
    .mockResolvedValue({ kind: "synced", event: { ...event, participantCurrent: 42 } }),
) {
  const saved = { ...event, version: 2, aufgaben: [{ id: "t1", titel: "Briefing" }] } as T2WEvent;
  const transport = {
    create: vi.fn(),
    save: vi.fn().mockResolvedValue(saved),
    syncOutlook: vi.fn().mockResolvedValue(saved),
    syncTime2win,
    outlookPlan: vi
      .fn()
      .mockResolvedValue({ path: "07_auftraege_27/Q1/270115_mountain_attack", drifted: false }),
    addContact: vi.fn().mockResolvedValue(saved),
    createTask: vi.fn().mockResolvedValue(saved),
  };
  const events = createEventWorkspace(transport);
  events.load([event]);
  const mutations = {
    copy: vi.fn().mockResolvedValue({ ...event, id: "e2", eventcode: "270116_mountain_attack" }),
    remove: vi.fn().mockResolvedValue(undefined),
    updateSeries: vi.fn().mockResolvedValue([{ ...event, seriesId: "series-1", version: 2 }]),
    applyEvents: vi.fn(),
  };
  return {
    workspace: createEventDetailWorkspace(events.openSession("e1"), {
      event,
      persons: [person],
      customers: [customer],
      events: [
        event,
        { ...event, id: "e0", eventcode: "270114_before", start: "2027-01-14", seriesId: "series-1" },
        { ...event, id: "e2", eventcode: "270116_after", start: "2027-01-16", seriesId: "series-1" },
      ],
    }, mutations),
    transport,
    syncTime2win,
    mutations,
  };
}

describe("Event detail workspace", () => {
  it("publishes consistent outcomes through the detail-interaction interface", async () => {
    const { workspace } = setup();
    const reloadCrm = vi.fn();
    await expect(workspace.execute("save", reloadCrm)).resolves.toEqual({
      kind: "success",
      message: "Änderungen gespeichert.",
    });
    await expect(workspace.execute("sync-outlook")).resolves.toEqual({
      kind: "success",
      message: "Outlook-Ordner synchronisiert.",
    });
    expect(reloadCrm).toHaveBeenCalledOnce();
  });
  it("owns search, selection, and recipient projections", () => {
    const { workspace } = setup();
    expect(workspace.snapshot().organizerContacts).toEqual([person]);
    expect(workspace.snapshot().invoiceRecipients).toEqual([customer]);
    workspace.setInput("contactSearch", "marion");
    workspace.selectContact("p1");
    expect(workspace.snapshot()).toMatchObject({ contactId: "p1", contactSearch: "" });
  });

  it("owns pessimistic detail commands and clears input only after persistence", async () => {
    const { workspace, transport } = setup();
    workspace.setInput("newTask", "Briefing");
    await workspace.addTask();
    expect(transport.createTask).toHaveBeenCalledWith("e1", { title: "Briefing" }, 1);
    expect(workspace.snapshot().newTask).toBe("");
    expect(workspace.snapshot().form.version).toBe(2);
  });

  it("owns Outlook planning and synchronization status", async () => {
    const { workspace } = setup();
    await expect(workspace.refreshOutlookPlan()).resolves.toMatchObject({
      path: "07_auftraege_27/Q1/270115_mountain_attack",
    });
    await expect(workspace.syncOutlook()).resolves.toMatchObject({ kind: "synced" });
    expect(workspace.snapshot().outlookSyncMessage).toBe("Outlook-Ordner synchronisiert.");
  });

  it("owns TIME2WIN synchronization progress and refreshed Event state", async () => {
    const { workspace, syncTime2win } = setup();
    await expect(workspace.syncTime2win()).resolves.toMatchObject({ kind: "synced" });
    expect(syncTime2win).toHaveBeenCalledWith("e1");
    expect(workspace.snapshot()).toMatchObject({
      time2winSyncing: false,
      time2winSyncMessage: "TIME2WIN-Teilnehmer synchronisiert.",
      form: { participantCurrent: 42 },
    });
  });

  it("preserves the last Event snapshot after a failed TIME2WIN synchronization", async () => {
    const { workspace } = setup(vi.fn().mockRejectedValue(new Error("offline")));
    await expect(workspace.syncTime2win()).resolves.toEqual({ kind: "failed" });
    expect(workspace.snapshot().form).toEqual(event);
    expect(workspace.snapshot().time2winSyncMessage).toContain("letzte erfolgreiche Wert");
  });

  it("owns copy, series, and delete mutations behind the detail seam", async () => {
    const { workspace, mutations } = setup();
    expect(workspace.snapshot().seriesCandidates.map((item) => item.id)).toEqual(["e0", "e2"]);

    await expect(
      workspace.copy({
        name: "Mountain Attack 2027",
        eventcode: "270116_mountain_attack",
        start: "2027-01-16",
        ende: "2027-01-16",
        createRelationship: true,
      }),
    ).resolves.toMatchObject({ id: "e2" });
    expect(mutations.copy).toHaveBeenCalledWith(
      "e1",
      expect.objectContaining({ version: 1, createRelationship: true }),
    );

    await workspace.updateSeries("e2");
    expect(mutations.updateSeries).toHaveBeenCalledWith("e1", {
      targetEventId: "e2",
      version: 1,
    });
    expect(mutations.applyEvents).toHaveBeenCalledOnce();
    expect(workspace.snapshot()).toMatchObject({
      form: { seriesId: "series-1", version: 2 },
      previousSeriesEvent: { id: "e0" },
      nextSeriesEvent: { id: "e2" },
    });

    await workspace.remove();
    expect(mutations.remove).toHaveBeenCalledWith("e1");
  });
});
