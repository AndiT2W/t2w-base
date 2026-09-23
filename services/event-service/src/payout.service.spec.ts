import { describe, expect, it, vi } from "vitest";
import { PayoutService } from "./payout.service.js";

const payout = {
  id: "p1",
  status: "ENTWURF",
  recipientSnapshot: { name: "Nordwerk", email: "finance@example.test" },
  amount: { lessThanOrEqualTo: () => false },
};

describe("PayoutService status rules", () => {
  it("sets paidAt when payment is marked as paid", async () => {
    const update = vi.fn().mockResolvedValue({ ...payout, status: "AUSBEZAHLT" });
    const tx = { payout: { findUnique: vi.fn().mockResolvedValue(payout), update }, auditLog: {} };
    const service = new PayoutService(
      { ...tx, $transaction: (work: (client: typeof tx) => unknown) => work(tx) } as any,
      { append: vi.fn() } as any,
    );
    await service.update("p1", { status: "AUSBEZAHLT" });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ paidAt: expect.any(Date) }) }),
    );
  });

  it("does not allow a manual update to claim that mail was sent", async () => {
    const update = vi.fn();
    const tx = { payout: { findUnique: vi.fn().mockResolvedValue(payout), update }, auditLog: {} };
    const service = new PayoutService(
      { ...tx, $transaction: (work: (client: typeof tx) => unknown) => work(tx) } as any,
      { append: vi.fn() } as any,
    );
    await expect(service.update("p1", { status: "MAIL_GESENDET" })).rejects.toThrow(
      "PAYOUT_MAIL_STATUS_SYSTEM_MANAGED",
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("stores the actual recipient email in the snapshot when marking for mail", async () => {
    const payoutWithRecipient = { ...payout, recipientId: "r1" };
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce(payoutWithRecipient)
      .mockResolvedValueOnce(payoutWithRecipient);
    const update = vi.fn().mockResolvedValue({ ...payout, status: "VERSANDBEREIT" });
    const tx = { payout: { findUnique, update }, auditLog: {} };
    const prisma = {
      payout: { findUnique },
      organizer: { findUnique: vi.fn().mockResolvedValue({ email: "updated@example.test" }) },
      $transaction: (work: (client: typeof tx) => unknown) => work(tx),
    };
    const service = new PayoutService(prisma as any, { append: vi.fn() } as any);
    await service.markForMail(["p1"]);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "VERSANDBEREIT",
          recipientSnapshot: expect.objectContaining({ email: "finance@example.test" }),
        }),
      }),
    );
  });

  it("does not allow manual status changes while an email is being sent", async () => {
    const sending = { ...payout, status: "VERSAND_LAEUFT" };
    const tx = { payout: { findUnique: vi.fn().mockResolvedValue(sending), update: vi.fn() } };
    const service = new PayoutService(
      { ...tx, $transaction: (work: (client: typeof tx) => unknown) => work(tx) } as any,
      { append: vi.fn() } as any,
    );
    await expect(service.update("p1", { status: "AUSBEZAHLT" })).rejects.toThrow(
      "PAYOUT_SEND_IN_PROGRESS",
    );
  });
});
