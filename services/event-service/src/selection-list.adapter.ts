import type {
  SelectionListAdapter,
  SelectionListKind,
  SelectionListPatch,
} from "@t2w/domain/selection-lists";
import { PrismaService } from "./prisma.service.js";

export class PrismaSelectionListAdapter implements SelectionListAdapter {
  constructor(private readonly prisma: PrismaService) {}

  load(kind: SelectionListKind) {
    if (kind === "sports") return this.prisma.sport.findMany({ orderBy: { name: "asc" } });
    if (kind === "services")
      return this.prisma.serviceOption.findMany({ orderBy: { name: "asc" } });
    if (kind === "hardwareObjects")
      return this.prisma.hardwareObjectOption.findMany({ orderBy: { name: "asc" } });
    return this.prisma.eventRoleOption.findMany({ orderBy: { name: "asc" } });
  }
  create(kind: SelectionListKind, name: string) {
    if (kind === "sports") return this.prisma.sport.create({ data: { name } });
    if (kind === "services") return this.prisma.serviceOption.create({ data: { name } });
    if (kind === "hardwareObjects")
      return this.prisma.hardwareObjectOption.create({ data: { name } });
    return this.prisma.eventRoleOption.create({ data: { name } });
  }
  update(kind: SelectionListKind, id: string, patch: SelectionListPatch) {
    if (kind === "sports") return this.prisma.sport.update({ where: { id }, data: patch });
    if (kind === "services")
      return this.prisma.serviceOption.update({ where: { id }, data: patch });
    if (kind === "hardwareObjects")
      return this.prisma.hardwareObjectOption.update({
        where: { id },
        data: { name: patch.name, active: patch.active },
      });
    return this.prisma.eventRoleOption.update({ where: { id }, data: patch });
  }
}
