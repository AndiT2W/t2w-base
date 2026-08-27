import { describe, expect, it, vi } from "vitest";
import { createHttpCrmAdapter } from "./module";
import { createLocalCrmAdapter } from "./local-adapter";

const personResponse = {
  id: "p1",
  name: "Marion Kessler",
  firstName: "Marion",
  lastName: "Kessler",
  email: "m@example.com",
  phone: "+43 1",
  note: "Leitung",
  organizers: [{ organizer: { id: "c1", name: "Nordwerk" } }],
  customerProfile: null,
  eventRoles: [],
};

const customerResponse = {
  id: "c1",
  name: "Nordwerk",
  type: "ORGANISATION",
  active: true,
  uid: "ATU1",
  contacts: [{ contact: { id: "p1" } }],
  events: [{ eventCode: "260820_demo_event", name: "Demo Event" }],
  payoutEvents: [{ eventCode: "260821_payout", name: "Payout Event" }],
  personId: null,
};

describe("CRM module", () => {
  it("loads persisted Personen and Kunden through one interface", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([personResponse]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([customerResponse]), { status: 200 }));
    const crm = createHttpCrmAdapter(request);

    const state = await crm.load();

    expect(state.personen).toEqual([
      expect.objectContaining({
        id: "p1",
        vorname: "Marion",
        nachname: "Kessler",
        kundenIds: ["c1"],
      }),
    ]);
    expect(state.kunden).toEqual([
      expect.objectContaining({
        id: "c1",
        name: "Nordwerk",
        kontaktIds: ["p1"],
        status: "aktiv",
        events: [
          { eventcode: "260820_demo_event", eventName: "Demo Event", funktion: "veranstalter" },
          { eventcode: "260821_payout", eventName: "Payout Event", funktion: "auszahlung" },
        ],
      }),
    ]);
  });

  it("links a Person and Kunde only after persistence succeeds", async () => {
    let release!: () => void;
    const pending = new Promise<Response>((resolve) => {
      release = () => resolve(new Response(null, { status: 204 }));
    });
    const request = vi
      .fn()
      .mockReturnValueOnce(pending)
      .mockResolvedValueOnce(new Response(JSON.stringify([{ ...personResponse, organizers: [{ organizer: { id: "c1" } }] }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([customerResponse]), { status: 200 }));
    const crm = createHttpCrmAdapter(request);
    const state = {
      personen: [
        {
          id: "p1",
          vorname: "M",
          nachname: "K",
          email: "",
          telefon: "",
          funktion: "",
          ort: "",
          notiz: "",
          kundenprofilId: null,
          kundenIds: [],
          eventRollen: [],
        },
      ],
      kunden: [
        {
          id: "c1",
          typ: "firma" as const,
          name: "N",
          personId: null,
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
          kontaktIds: [],
          events: [],
        },
      ],
    };

    const linking = crm.link("p1", "c1");
    expect(state.personen[0].kundenIds).toEqual([]);
    release();

    await expect(linking).resolves.toEqual({
      personen: [expect.objectContaining({ kundenIds: ["c1"] })],
      kunden: [expect.objectContaining({ kontaktIds: ["p1"] })],
    });
    expect(request).toHaveBeenCalledWith(
      "/api/v1/organizers/c1/contacts/p1",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("persists the same Person and Kunde interface through the local demo adapter", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
    const seed = { personen: [statePerson()], kunden: [stateKunde()] };
    const local = createLocalCrmAdapter(storage, "crm-test", seed);

    const linked = await local.link("p1", "c1");
    expect(linked.personen[0].kundenIds).toEqual(["c1"]);
    expect(linked.kunden[0].kontaktIds).toEqual(["p1"]);

    await expect(createLocalCrmAdapter(storage, "crm-test", seed).load()).resolves.toEqual(linked);
  });
});

function statePerson() {
  return {
    id: "p1",
    vorname: "M",
    nachname: "K",
    email: "",
    telefon: "",
    funktion: "",
    ort: "",
    notiz: "",
    kundenprofilId: null,
    kundenIds: [],
    eventRollen: [],
  };
}
function stateKunde() {
  return {
    id: "c1",
    typ: "firma" as const,
    name: "N",
    personId: null,
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
    kontaktIds: [],
    events: [],
  };
}
