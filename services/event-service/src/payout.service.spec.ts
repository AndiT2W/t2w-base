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
    const service = new PayoutService(
      { payout: { findUnique: vi.fn().mockResolvedValue(payout), update }, auditLog: {} } as any,
      { append: vi.fn() } as any,
    );
    await service.update("p1", { paymentStatus: "AUSBEZAHLT" });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ paidAt: expect.any(Date) }) }),
    );
  });

  it("does not allow CRUD to fake a successful mail send", async () => {
    const service = new PayoutService(
      { payout: { findUnique: vi.fn().mockResolvedValue(payout) }, auditLog: {} } as any,
      { append: vi.fn() } as any,
    );
    await expect(service.update("p1", { mailStatus: "GESENDET" })).rejects.toThrow(
      "MAIL_STATUS_REQUIRES_AUTOMATION_RESULT",
    );
  });
});
