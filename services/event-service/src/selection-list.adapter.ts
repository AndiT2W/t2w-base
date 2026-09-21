import type {
  SelectionListAdapter,
  SelectionListKind,
  SelectionListPatch,
} from "@t2w/domain/selection-lists";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service.js";

/**
 * Prisma-Modelle sehen sich je Auswahlliste gleich genug, dass eine Zuordnung
 * genügt.  Vorher stand in `load`, `create`, `update` und `reorder` dieselbe
 * Fallunterscheidung viermal — und genau darin verschwand eine Sonderregel
 * unauffällig zwischen den Zweigen: Hardware-Objekte bekamen `icon` und
 * `color` stillschweigend abgeschnitten, weil ihnen die Spalten fehlten.
 * Seit Migration 0035 tragen alle sechs Listen dieselben Felder, und die
 * Sonderregel ist ersatzlos entfallen.
 */
type ListenModell = {
  findMany: (args?: unknown) => Prisma.PrismaPromise<unknown[]>;
  create: (args: unknown) => Prisma.PrismaPromise<unknown>;
  update: (args: unknown) => Prisma.PrismaPromise<unknown>;
};

export class PrismaSelectionListAdapter implements SelectionListAdapter {
  constructor(private readonly prisma: PrismaService) {}

  private modell(kind: SelectionListKind): ListenModell {
    const nach: Record<SelectionListKind, unknown> = {
      sports: this.prisma.sport,
      services: this.prisma.serviceOption,
      hardwareObjects: this.prisma.hardwareObjectOption,
      communicationChannels: this.prisma.communicationChannelOption,
      communicationTopics: this.prisma.communicationTopicOption,
      eventRoles: this.prisma.eventRoleOption,
    };
    return nach[kind] as ListenModell;
  }

  load(kind: SelectionListKind) {
    return this.modell(kind).findMany({ orderBy: { name: "asc" } }) as ReturnType<
      SelectionListAdapter["load"]
    >;
  }

  create(kind: SelectionListKind, name: string) {
    return this.modell(kind).create({ data: { name } }) as ReturnType<
      SelectionListAdapter["create"]
    >;
  }

  update(kind: SelectionListKind, id: string, patch: SelectionListPatch) {
    return this.modell(kind).update({ where: { id }, data: patch }) as ReturnType<
      SelectionListAdapter["update"]
    >;
  }

  async reorder(kind: SelectionListKind, ids: string[]) {
    const model = this.modell(kind);
    const current = (await model.findMany({ orderBy: { name: "asc" } })) as { id: string }[];
    if (current.length !== ids.length || current.some((value) => !ids.includes(value.id)))
      throw new Error("SELECTION_LIST_REORDER_CONFLICT");
    await this.prisma.$transaction(
      ids.map((id, sortOrder) => model.update({ where: { id }, data: { sortOrder } })),
    );
    return model.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }) as ReturnType<
      SelectionListAdapter["reorder"]
    >;
  }
}
