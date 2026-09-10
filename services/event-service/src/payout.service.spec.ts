import { describe, expect, it, vi } from "vitest";
import { PayoutService } from "./payout.service.js";

const payout = {
  id: "p1",
  mailStatus: "ENTWURF",
  paymentStatus: "OFFEN",
  amount: { lessThanOrEqualTo: () => false },
};

describe("PayoutService status rules", () => {
  it("sets paidAt when payment is marked as paid", async () => {
    const update = vi.fn().mockResolvedValue({ ...payout, paymentStatus: "AUSBEZAHLT" });
    const tx = { payout: { findUnique: vi.fn().mockResolvedValue(payout), update }, auditLog: {} };
    const service = new PayoutService(
      { ...tx, $transaction: (work: (client: typeof tx) => unknown) => work(tx) } as any,
      { append: vi.fn() } as any,
    );
    await service.update("p1", { paymentStatus: "AUSBEZAHLT" });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ paidAt: expect.any(Date) }) }),
    );
  });

  it("allows manually setting every mail status", async () => {
    const update = vi.fn().mockResolvedValue({ ...payout, mailStatus: "GESENDET" });
    const tx = { payout: { findUnique: vi.fn().mockResolvedValue(payout), update }, auditLog: {} };
    const service = new PayoutService(
      { ...tx, $transaction: (work: (client: typeof tx) => unknown) => work(tx) } as any,
      { append: vi.fn() } as any,
    );
    await expect(service.update("p1", { mailStatus: "GESENDET" })).resolves.toBeDefined();
  });
});
