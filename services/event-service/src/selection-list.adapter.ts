import type { SelectionListAdapter, SelectionListKind, SelectionListPatch } from "@t2w/domain/selection-lists";
import { PrismaService } from "./prisma.service.js";

export class PrismaSelectionListAdapter implements SelectionListAdapter {
  constructor(private readonly prisma: PrismaService) {}

  load(kind: SelectionListKind) {
    return kind === "sports"
      ? this.prisma.sport.findMany({ orderBy: { name: "asc" } })
      : this.prisma.eventRoleOption.findMany({ orderBy: { name: "asc" } });
  }
  create(kind: SelectionListKind, name: string) {
    return kind === "sports"
      ? this.prisma.sport.create({ data: { name } })
      : this.prisma.eventRoleOption.create({ data: { name } });
  }
  update(kind: SelectionListKind, id: string, patch: SelectionListPatch) {
    return kind === "sports"
      ? this.prisma.sport.update({ where: { id }, data: patch })
      : this.prisma.eventRoleOption.update({ where: { id }, data: patch });
  }
}
