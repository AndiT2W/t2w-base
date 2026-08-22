import type { Kunde, Person } from "./types";
export const DEMO_PERSONEN: Person[] = [
  {
    id: "p1",
    vorname: "Marion",
    nachname: "Kessler",
    email: "m.kessler@nordwerk.de",
    telefon: "+49 40 998812",
    funktion: "Leiterin Marketing",
    ort: "Hamburg",
    notiz: "",
    kundenprofilId: null,
    kundenIds: ["c1"],
    eventRollen: [
      {
        eventcode: "260904_sommerfest_nordwerk",
        eventName: "Sommerfest Nordwerk",
        rolle: "anmeldung",
      },
      {
        eventcode: "260904_sommerfest_nordwerk",
        eventName: "Sommerfest Nordwerk",
        rolle: "finanzen",
      },
    ],
  },
  {
    id: "p2",
    vorname: "Tom",
    nachname: "Reiter",
    email: "t.reiter@nordwerk.de",
    telefon: "+49 151 2233445",
    funktion: "Technik vor Ort",
    ort: "Hamburg",
    notiz: "",
    kundenprofilId: null,
    kundenIds: ["c1"],
    eventRollen: [
      {
        eventcode: "260904_sommerfest_nordwerk",
        eventName: "Sommerfest Nordwerk",
        rolle: "timing",
      },
    ],
  },
  {
    id: "p3",
    vorname: "Jonas",
    nachname: "Feld",
    email: "jonas.feld@feld-timing.de",
    telefon: "+43 664 1122334",
    funktion: "Zeitmessung, selbstständig",
    ort: "Bremen",
    notiz: "Wird auch als Kunde geführt.",
    kundenprofilId: "c2",
    kundenIds: ["c1", "c2"],
    eventRollen: [
      {
        eventcode: "260904_sommerfest_nordwerk",
        eventName: "Sommerfest Nordwerk",
        rolle: "timing",
      },
    ],
  },
];
export const DEMO_KUNDEN: Kunde[] = [
  {
    id: "c1",
    typ: "firma",
    name: "Nordwerk GmbH",
    personId: null,
    uid: "DE 812345678",
    iban: "DE02 2004 0000 0123 4567 00",
    bank: "Commerzbank Hamburg",
    rechnungsAdresse: "Elbchaussee 12, 22765 Hamburg",
    rechnungsEmail: "rechnung@nordwerk.de",
    zahlungsziel: "30 Tage netto",
    status: "aktiv",
    kontaktIds: ["p1", "p2", "p3"],
    events: [
      {
        eventcode: "260904_sommerfest_nordwerk",
        eventName: "Sommerfest Nordwerk",
        funktion: "veranstalter",
      },
      {
        eventcode: "260904_sommerfest_nordwerk",
        eventName: "Sommerfest Nordwerk",
        funktion: "rechnung",
      },
    ],
  },
  {
    id: "c2",
    typ: "person",
    name: "Jonas Feld",
    personId: "p3",
    uid: "ATU 12345678",
    iban: "AT61 1904 3002 3457 3201",
    bank: "Erste Bank",
    rechnungsAdresse: "Am Deich 4, 28199 Bremen",
    rechnungsEmail: "jonas.feld@feld-timing.de",
    zahlungsziel: "30 Tage netto",
    status: "pruefung",
    kontaktIds: ["p3"],
    events: [
      {
        eventcode: "260904_sommerfest_nordwerk",
        eventName: "Sommerfest Nordwerk",
        funktion: "auszahlung",
      },
    ],
  },
];
