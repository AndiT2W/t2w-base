import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { symbolPruefen } from "./icon-validation.js";

/**
 * Die Symbolbibliothek.  Ein hochgeladenes Symbol gehört nicht einem Wert,
 * sondern allen: dieselbe Datei mehrfach hochzuladen erzeugte Dubletten, die
 * auseinanderlaufen, sobald jemand eine davon ersetzt.
 *
 * Gelöscht wird nie.  Ein Symbol, das an 34 Events hängt, wird archiviert —
 * es verschwindet aus der Auswahl, bleibt aber überall sichtbar, wo es schon
 * gesetzt ist.  Dieselbe Regel gilt für die Auswahllistenwerte selbst, dort
 * heißt sie „inaktiv".
 */
@Injectable()
export class IconService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly UEBERSICHT = {
    id: true,
    name: true,
    mimeType: true,
    size: true,
    monochrome: true,
    active: true,
    createdAt: true,
  } as const;

  list(includeArchived = false) {
    return this.prisma.iconAsset.findMany({
      ...(includeArchived ? {} : { where: { active: true } }),
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: IconService.UEBERSICHT,
    });
  }

  async upload(
    input: { fileName?: string; mimeType?: string; contentBase64?: string },
    actorId: string,
  ) {
    const name = input.fileName?.trim().replace(/[\\/]/g, "_") ?? "";
    if (!name || name.length > 120)
      throw new BadRequestException("Der Dateiname fehlt oder ist zu lang.");
    if (!input.contentBase64) throw new BadRequestException("Die Datei fehlt.");

    const content = Buffer.from(input.contentBase64, "base64");
    const pruefung = symbolPruefen(input.mimeType ?? "", content);
    // Abgelehnt statt still bereinigt: der Hochladende soll erfahren, woran es lag.
    if (!pruefung.ok) throw new BadRequestException(pruefung.grund);

    return this.prisma.iconAsset.create({
      data: {
        name,
        mimeType: (input.mimeType ?? "").trim().toLowerCase(),
        size: content.length,
        content,
        monochrome: pruefung.monochrome,
        createdById: actorId,
      },
      select: IconService.UEBERSICHT,
    });
  }

  async content(id: string) {
    const symbol = await this.prisma.iconAsset.findUnique({
      where: { id },
      select: { content: true, mimeType: true },
    });
    if (!symbol) throw new NotFoundException("Symbol nicht gefunden.");
    return symbol;
  }

  archive(id: string, active: boolean) {
    return this.prisma.iconAsset.update({
      where: { id },
      data: { active },
      select: IconService.UEBERSICHT,
    });
  }
}
