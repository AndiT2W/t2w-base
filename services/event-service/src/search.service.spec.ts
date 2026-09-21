import { describe, expect, it, vi } from "vitest";
import { SearchService } from "./search.service.js";
import type { PrismaService } from "./prisma.service.js";

function fakePrisma() {
  return {
    event: { findMany: vi.fn().mockResolvedValue([]) },
    contact: { findMany: vi.fn().mockResolvedValue([]) },
    hardwareIssue: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

const dienst = (prisma: ReturnType<typeof fakePrisma>) =>
  new SearchService(prisma as unknown as PrismaService);

describe("SearchService", () => {
  it("fragt für ein Veranstalterkonto gar nicht erst ab", async () => {
    const prisma = fakePrisma();
    const ergebnis = await dienst(prisma).search("Kärnten", "ORGANIZER");

    expect(ergebnis).toEqual({ events: [], personen: [], hardware: [] });
    expect(prisma.event.findMany).not.toHaveBeenCalled();
    expect(prisma.contact.findMany).not.toHaveBeenCalled();
    expect(prisma.hardwareIssue.findMany).not.toHaveBeenCalled();
  });

  it("sucht erst ab zwei Zeichen", async () => {
    const prisma = fakePrisma();
    await dienst(prisma).search("k", "ADMIN");
    expect(prisma.event.findMany).not.toHaveBeenCalled();
  });

  it("trifft je Wort auf den Wortanfang, nicht irgendwo in der Mitte", async () => {
    const prisma = fakePrisma();
    await dienst(prisma).search("kär läuft", "ADMIN");

    const wo = prisma.event.findMany.mock.calls[0]?.[0]?.where;
    expect(wo.AND).toHaveLength(2);
    expect(wo.AND[0].OR[0].name).toEqual({ startsWith: "kär", mode: "insensitive" });
    expect(wo.AND[1].OR[0].name).toEqual({ startsWith: "läuft", mode: "insensitive" });
  });

  it("lässt archivierte Events und Kontakte aus", async () => {
    const prisma = fakePrisma();
    await dienst(prisma).search("test", "BENUTZER");

    expect(prisma.event.findMany.mock.calls[0]?.[0]?.where.archived).toBe(false);
    expect(prisma.contact.findMany.mock.calls[0]?.[0]?.where.archived).toBe(false);
  });

  it("holt höchstens fünf Treffer je Gruppe", async () => {
    const prisma = fakePrisma();
    await dienst(prisma).search("test", "ADMIN");

    for (const modell of [prisma.event, prisma.contact, prisma.hardwareIssue])
      expect(modell.findMany.mock.calls[0]?.[0]?.take).toBe(5);
  });

  it("durchsucht weder IBAN noch UID noch Telefonnummern", async () => {
    const prisma = fakePrisma();
    await dienst(prisma).search("AT61", "ADMIN");

    const felder = JSON.stringify([
      prisma.contact.findMany.mock.calls[0]?.[0]?.where,
      prisma.hardwareIssue.findMany.mock.calls[0]?.[0]?.where,
    ]);
    for (const verboten of ["iban", "uid", "phone", "vatId"])
      expect(felder.toLowerCase()).not.toContain(verboten.toLowerCase());
  });
});
