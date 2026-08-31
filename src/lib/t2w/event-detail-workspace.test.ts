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
  return {
    workspace: createEventDetailWorkspace(events.openSession("e1"), {
      event,
      persons: [person],
      customers: [customer],
    }),
    transport,
    syncTime2win,
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
});
