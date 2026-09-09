import { describe, expect, it, vi } from "vitest";
import { AuditService } from "./audit.service.js";

describe("AuditService", () => {
  it("writes structured before/after values and never exposes mutation methods", async () => {
    const create = vi.fn().mockResolvedValue({ id: "a1" });
    const prisma = { auditLog: { create } };
    const service = new AuditService(prisma as any);
    await service.append({ entity: "Payout", entityId: "p1", action: "UPDATE", userId: "u1", oldValue: { amount: "1.00" }, newValue: { amount: "2.00" } });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ entity: "Payout", entityId: "p1", action: "UPDATE", userId: "u1", details: { oldValue: { amount: "1.00" }, newValue: { amount: "2.00" } } }) }));
    expect((service as any).update).toBeUndefined();
    expect((service as any).remove).toBeUndefined();
  });
});
