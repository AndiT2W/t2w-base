import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  append(input: { entity: string; entityId: string; action: string; userId?: string | null; oldValue?: unknown; newValue?: unknown; details?: unknown }) {
    const details = JSON.parse(JSON.stringify({ oldValue: input.oldValue, newValue: input.newValue, ...(input.details as object ?? {}) }));
    return this.prisma.auditLog.create({ data: { entity: input.entity, entityId: input.entityId, action: input.action, userId: input.userId ?? undefined, details } });
  }
  list(entity?: string, entityId?: string) { return this.prisma.auditLog.findMany({ where: { entity, entityId }, orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, displayName: true, email: true } } } }); }
}
