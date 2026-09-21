import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

/**
 * Die Suche über alle Module.
 *
 * Bisher gab es keine: das Feld im Seitenkopf leitete auf die Eventliste um.
 * Gesucht wird, was man am Telefon sucht — ein Event, eine Person, ein
 * Hardwareobjekt.  Aufgaben und Auszahlungen findet man im Modul.
 *
 * **Präfix je Wort, nicht Teilstring.** Ein Präfix nutzt die Indizes;
 * Teilstring erzwingt einen Tabellenscan über Events und Kontakte bei jedem
 * Tastendruck.  Wer „kär" eingibt, findet „Kärnten Läuft"; wer „ärnt"
 * eingibt, findet nichts — das ist der bewusste Preis.
 *
 * **Nicht durchsucht:** IBAN und UID sind Finanzdaten und gehören nicht in
 * ein Feld, das jeder Angemeldete sieht; wer eine IBAN sucht, ist ohnehin im
 * Kontaktmodul.  Telefonnummern bleiben draußen, weil ihre Schreibweisen zu
 * weit auseinandergehen (`+43 664`, `0664`, `0043664`) — ein Präfixtreffer
 * darauf wäre unzuverlässig und damit irreführend.
 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ab zwei Zeichen; darunter trifft alles und nichts. */
  static readonly MIN_ZEICHEN = 2;
  /** Je Gruppe; mehr zeigt das Modul selbst. */
  static readonly PRO_GRUPPE = 5;

  private woerter(frage: string) {
    return frage
      .trim()
      .split(/\s+/)
      .filter((wort) => wort.length >= SearchService.MIN_ZEICHEN);
  }

  async search(frage: string, rolle: string) {
    /*
     * Veranstalterkonten sehen keine Treffer.  Ihr Zugriff endet bei den
     * eigenen Eventaufgaben; ein Fehler im Rechteschnitt wäre hier sofort ein
     * Datenleck an einen externen Nutzer.  Die Oberfläche blendet das Feld
     * für sie aus — verlassen darf man sich darauf nicht.
     */
    if (rolle === "ORGANIZER") return { events: [], personen: [], hardware: [] };

    const woerter = this.woerter(frage);
    if (!woerter.length) return { events: [], personen: [], hardware: [] };

    const wie = (wort: string) => ({ startsWith: wort, mode: "insensitive" as const });
    const take = SearchService.PRO_GRUPPE;

    const [events, personen, hardware] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          archived: false,
          AND: woerter.map((wort) => ({
            OR: [
              { name: wie(wort) },
              { eventCode: wie(wort) },
              { location: wie(wort) },
              { organizer: { name: wie(wort) } },
            ],
          })),
        },
        orderBy: { startAt: "desc" },
        take,
        select: {
          id: true,
          eventCode: true,
          name: true,
          startAt: true,
          organizer: { select: { name: true } },
        },
      }),
      this.prisma.contact.findMany({
        where: {
          archived: false,
          AND: woerter.map((wort) => ({
            OR: [
              { name: wie(wort) },
              { firstName: wie(wort) },
              { lastName: wie(wort) },
              { email: wie(wort) },
              { organizers: { some: { organizer: { name: wie(wort) } } } },
            ],
          })),
        },
        orderBy: { name: "asc" },
        take,
        select: { id: true, name: true, email: true },
      }),
      this.prisma.hardwareIssue.findMany({
        where: {
          AND: woerter.map((wort) => ({
            OR: [
              { objectName: wie(wort) },
              { objectNumberSingle: wie(wort) },
              { objectNumberPrefix: wie(wort) },
              { recipientName: wie(wort) },
            ],
          })),
        },
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true,
          objectName: true,
          objectNumberSingle: true,
          recipientName: true,
          eventId: true,
        },
      }),
    ]);

    return { events, personen, hardware };
  }
}
