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
  async reorder(kind: SelectionListKind, ids: string[]) {
    const model: any = kind === "sports" ? this.prisma.sport : kind === "services" ? this.prisma.serviceOption : kind === "hardwareObjects" ? this.prisma.hardwareObjectOption : this.prisma.eventRoleOption;
    const current = await model.findMany({ orderBy: { name: "asc" } });
    if (current.length !== ids.length || current.some((value: { id: string }) => !ids.includes(value.id))) throw new Error("SELECTION_LIST_REORDER_CONFLICT");
    await this.prisma.$transaction(ids.map((id, sortOrder) => model.update({ where: { id }, data: { sortOrder } })));
    return model.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  }
}
