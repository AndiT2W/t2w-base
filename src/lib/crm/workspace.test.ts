import { describe, expect, it, vi } from "vitest";
import { createCrmWorkspace } from "./workspace";
import type { CrmModule } from "./module";

const person = {
  id: "p1",
  vorname: "Ada",
  nachname: "Lovelace",
  email: "ada@example.com",
  telefon: "",
  funktion: "",
  ort: "",
  notiz: "",
  kundenprofilId: null,
  kundenIds: [],
  eventRollen: [],
};
const kunde = {
  id: "k1",
  typ: "person" as const,
  name: "Ada Lovelace",
  personId: "p1",
  uid: "",
  iban: "",
  bic: "",
  bank: "",
  land: "",
  ort: "",
  strasse: "",
  plz: "",
  email: "",
  status: "aktiv" as const,
  kontaktIds: ["p1"],
  events: [],
};

describe("CRM workspace", () => {
  it("reloads customer references after an event relationship changes", async () => {
    const initial = { personen: [], kunden: [{ ...kunde, events: [{ eventcode: "event-1", eventName: "Event", funktion: "veranstalter" as const }] }] };
    const current = { personen: [], kunden: [{ ...kunde, events: [] }] };
    const adapter = {
      load: vi.fn().mockResolvedValueOnce(initial).mockResolvedValueOnce(current),
    } as unknown as CrmModule;
    const workspace = createCrmWorkspace(adapter);

    await workspace.load();
    await workspace.load();

    expect(workspace.snapshot().kunden[0].events).toEqual([]);
    expect(adapter.load).toHaveBeenCalledTimes(2);
  });

  it("creates a Person and Kundenprofil as one workspace transition without stale lookup", async () => {
    const adapter = {
      load: vi.fn().mockResolvedValue({ personen: [], kunden: [] }),
      createPerson: vi.fn().mockResolvedValue(person),
      createKunde: vi.fn().mockResolvedValue(kunde),
    } as unknown as CrmModule;
    const workspace = createCrmWorkspace(adapter);
    await workspace.load();
    await workspace.createPersonAndKunde(
      { ...person, kundenIds: [] },
      { ...kunde, kontaktIds: [], events: [] },
    );
    expect(workspace.snapshot()).toMatchObject({
      personen: [expect.objectContaining({ kundenprofilId: "k1", kundenIds: ["k1"] })],
      kunden: [expect.objectContaining({ id: "k1", kontaktIds: ["p1"] })],
    });
  });

  it("publishes no optimistic state when persistence fails", async () => {
    const adapter = {
      load: vi.fn().mockResolvedValue({ personen: [person], kunden: [] }),
      link: vi.fn().mockRejectedValue(new Error("no")),
    } as unknown as CrmModule;
    const workspace = createCrmWorkspace(adapter);
    await workspace.load();
    await expect(workspace.link("p1", "k1")).rejects.toThrow("no");
    expect(workspace.snapshot().personen[0]?.kundenIds).toEqual([]);
  });
});
