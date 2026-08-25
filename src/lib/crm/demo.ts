import type { CrmState } from "./module";

export const DEMO_CRM_STATE: CrmState = {
  personen: [
    {
      id: "demo-person-marion",
      vorname: "Marion",
      nachname: "Kessler",
      email: "m.kessler@nordwerk.example",
      telefon: "+43 1 555 0101",
      funktion: "Leitung Marketing",
      ort: "Wien",
      notiz: "Lokaler Demo-Datensatz",
      kundenprofilId: null,
      kundenIds: ["demo-kunde-nordwerk"],
      eventRollen: [],
    },
  ],
  kunden: [
    {
      id: "demo-kunde-nordwerk",
      typ: "firma",
      name: "Nordwerk GmbH",
      personId: null,
      uid: "ATU12345678",
      iban: "AT611904300234573201",
      bic: "DEMOATWW",
      bank: "Demo Bank",
      land: "Österreich",
      ort: "Wien",
      strasse: "Demo-Straße 1",
      plz: "1010",
      email: "rechnung@nordwerk.example",
      status: "aktiv",
      kontaktIds: ["demo-person-marion"],
      events: [],
    },
  ],
};
