import { describe, expect, it, vi } from "vitest";
import { PayoutImportService } from "./payout-import.service.js";

describe("PayoutImportService", () => {
  const service = new PayoutImportService({ create: vi.fn(), findByClickUpId: vi.fn().mockResolvedValue(null) } as any);
  it("normalizes legacy status, amount and keeps missing events", () => {
    expect(service.normalize({ taskId: "cu-1", amount: "€ 125,5", currency: "chf", status: "ausbezahlt", updatedAt: "2026-01-02T00:00:00Z" })).toMatchObject({ clickUpId: "cu-1", eventId: null, amount: "125.50", currency: "CHF", paymentStatus: "AUSBEZAHLT" });
  });
  it("reports invalid rows in preview without creating", async () => {
    const result = await service.run([{ taskId: "ok", amount: 10 }, { taskId: "bad", amount: "n/a" }], true);
    expect(result).toMatchObject({ total: 2, created: 0, preview: true });
    expect(result.errors).toHaveLength(1);
  });
  it("skips an already imported ClickUp record", async () => {
    const create = vi.fn();
    const existing = new PayoutImportService({ create, findByClickUpId: vi.fn().mockResolvedValue({ id: "p1" }) } as any);
    const result = await existing.run([{ taskId: "cu-1", amount: 10 }], false);
    expect(result.skipped).toBe(1);
    expect(create).not.toHaveBeenCalled();
  });
});
