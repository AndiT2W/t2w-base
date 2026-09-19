import { BadRequestException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service.js";

type Tx = Prisma.TransactionClient;
type Actor = { id: string };
type Authorizer = (tx: Tx, actor: Actor) => Promise<unknown>;

/** Kategorie catalogue implementation behind the planning facade seam. */
export class ProjectManagementCatalogue {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorize: Authorizer,
    private readonly authorizeAdmin: Authorizer,
  ) {}

  groups(actor: Actor) {
    return this.prisma.$transaction(async (tx) => {
      await this.authorize(tx, actor);
      return {
        groups: await tx.pmGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      };
    });
  }

  save(
    input: {
      id?: string;
      name: string;
      icon?: string | null;
      color?: string | null;
      active: boolean;
      sortOrder: number;
      version?: number;
    },
    actor: Actor,
  ) {
    return this.prisma
      .$transaction(async (tx) => {
        await this.authorizeAdmin(tx, actor);
        if (
          typeof input.name !== "string" ||
          !input.name.trim() ||
          (input.icon !== undefined && input.icon !== null && typeof input.icon !== "string") ||
          (input.color !== undefined && input.color !== null && typeof input.color !== "string") ||
          typeof input.active !== "boolean" ||
          !Number.isInteger(input.sortOrder)
        )
          throw new BadRequestException("Name und Reihenfolge erforderlich.");
        if (input.id) {
          if (!Number.isInteger(input.version))
            throw new BadRequestException("Kategorieversion erforderlich.");
          const saved = await tx.pmGroup.updateMany({
            where: { id: input.id, version: input.version },
            data: {
              name: input.name.trim(),
              ...(input.icon === undefined ? {} : { icon: input.icon?.trim() || null }),
              ...(input.color === undefined ? {} : { color: input.color?.trim() || null }),
              active: input.active,
              sortOrder: input.sortOrder,
              version: { increment: 1 },
            },
          });
          if (!saved.count)
            throw new ConflictException("Kategorie wurde geändert. Kategorien neu laden.");
          return tx.pmGroup.findUniqueOrThrow({ where: { id: input.id } });
        }
        return tx.pmGroup.create({
          data: {
            name: input.name.trim(),
            icon: input.icon?.trim() || null,
            color: input.color?.trim() || null,
            active: input.active,
            sortOrder: input.sortOrder,
          },
        });
      })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
          throw new ConflictException("Eine Kategorie mit diesem Namen ist bereits vorhanden.");
        throw error;
      });
  }

  reorder(input: { groups: { id: string; version: number }[] }, actor: Actor) {
    return this.prisma
      .$transaction(
        async (tx) => {
          await this.authorizeAdmin(tx, actor);
          if (
            !Array.isArray(input.groups) ||
            input.groups.some(
              (group) => !group || typeof group.id !== "string" || !Number.isInteger(group.version),
            )
          )
            throw new BadRequestException("Kategorien und Versionen erforderlich.");
          const current = await tx.pmGroup.findMany();
          const ids = new Set(input.groups.map((group) => group.id));
          if (
            ids.size !== input.groups.length ||
            current.length !== ids.size ||
            current.some((group) => !ids.has(group.id))
          )
            throw new ConflictException("Kategorien wurden geändert. Kategorien neu laden.");
          const ordered = input.groups
            .map((group, sortOrder) => ({ ...group, sortOrder }))
            .sort((a, b) => a.id.localeCompare(b.id));
          for (const group of ordered) {
            const saved = await tx.pmGroup.updateMany({
              where: { id: group.id, version: group.version },
              data: { sortOrder: group.sortOrder, version: { increment: 1 } },
            });
            if (!saved.count)
              throw new ConflictException("Kategorien wurden geändert. Kategorien neu laden.");
          }
          return {
            groups: await tx.pmGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")
          throw new ConflictException("Kategorien wurden geändert. Kategorien neu laden.");
        throw error;
      });
  }
}
