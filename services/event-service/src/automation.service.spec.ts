import { describe, expect, it, vi } from "vitest";
import { AutomationService } from "./automation.service.js";

describe("AutomationService", () => {
  it("replays an existing claim for the same idempotency key", async () => {
    const existing = {
      id: "claim-1",
      domain: "payout",
      recordId: "p1",
      idempotencyKey: "payout:p1:wf",
      replayed: false,
    };
    const prisma = {
      automationClaim: { findUnique: vi.fn().mockResolvedValue(existing), create: vi.fn() },
    };
    const service = new AutomationService(prisma as any, { append: vi.fn() } as any);
    await expect(
      service.claim({ domain: "payout", recordId: "p1", idempotencyKey: "payout:p1:wf" }),
    ).resolves.toMatchObject({ id: "claim-1", replayed: true });
    expect(prisma.automationClaim.create).not.toHaveBeenCalled();
  });

  it("creates a claim and can complete it", async () => {
    const create = vi.fn().mockResolvedValue({ id: "claim-2" });
    const update = vi.fn().mockResolvedValue({ id: "claim-2", completedAt: new Date() });
    const prisma = {
      automationClaim: { findUnique: vi.fn().mockResolvedValue(null), create, update },
    };
    const service = new AutomationService(prisma as any, { append: vi.fn() } as any);
    await service.claim({ domain: "hardware", recordId: "h1", idempotencyKey: "hardware:h1:wf" });
    await service.complete("hardware:h1:wf");
    expect(create).toHaveBeenCalledWith({
      data: {
        domain: "hardware",
        recordId: "h1",
        idempotencyKey: "hardware:h1:wf",
        workflowId: undefined,
      },
    });
    expect(update).toHaveBeenCalledWith({
      where: { idempotencyKey: "hardware:h1:wf" },
      data: { completedAt: expect.any(Date) },
    });
  });
  it("claims the oldest pending hardware record through the generic seam", async () => {
    const prisma = {
      automationClaim: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "claim-3" }),
      },
      hardwareIssue: {
        findFirst: vi.fn().mockResolvedValue({ id: "h1", status: "MAIL_SEND" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      payout: { findFirst: vi.fn() },
    };
    const result = await new AutomationService(prisma as any, { append: vi.fn() } as any).claimNext(
      {
        domain: "hardware",
        idempotencyKey: "hardware:h1:wf",
      },
    );
    expect(result).toMatchObject({ claim: { id: "claim-3" }, record: { id: "h1" } });
    expect(prisma.hardwareIssue.findFirst).toHaveBeenCalled();
    expect(prisma.hardwareIssue.updateMany).toHaveBeenCalledWith({
      where: { id: "h1", status: "MAIL_SEND" },
      data: { status: "NOTIFIED" },
    });
  });
  it("records generic success and failure results with retry data", async () => {
    const update = vi
      .fn()
      .mockResolvedValue({ id: "claim-4", resultStatus: "FAILED", retryCount: 1 });
    const service = new AutomationService(
      {
        automationClaim: {
          update,
          findUnique: vi.fn().mockResolvedValue({ domain: "hardware", recordId: "h1" }),
        },
        hardwareIssue: { updateMany: vi.fn() },
      } as any,
      { append: vi.fn() } as any,
    );
    await service.result("hardware:h1:wf", {
      success: false,
      error: "timeout",
      externalId: "run-1",
    });
    expect(update).toHaveBeenCalledWith({
      where: { idempotencyKey: "hardware:h1:wf" },
      data: {
        resultStatus: "FAILED",
        error: "timeout",
        externalId: "run-1",
        completedAt: null,
        retryCount: { increment: 1 },
      },
    });
  });
  it("supports an arbitrary domain such as invoice through the same idempotent claim contract", async () => {
    const create = vi.fn().mockResolvedValue({ id: "claim-invoice" });
    const service = new AutomationService(
      {
        automationClaim: { findUnique: vi.fn().mockResolvedValue(null), create },
      } as any,
      { append: vi.fn() } as any,
    );
    await service.claim({
      domain: "invoice",
      recordId: "inv-1",
      idempotencyKey: "invoice:inv-1:workflow-1",
      workflowId: "workflow-1",
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        domain: "invoice",
        recordId: "inv-1",
        idempotencyKey: "invoice:inv-1:workflow-1",
        workflowId: "workflow-1",
      },
    });
  });

  it("atomically moves a payout into the send-in-progress status before creating a claim", async () => {
    const record = { id: "p1", status: "VERSANDBEREIT", createdAt: new Date() };
    const claim = { id: "claim-p1", idempotencyKey: "payout:p1:run-1" };
    const tx = {
      automationClaim: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(claim),
      },
      payout: {
        findFirst: vi.fn().mockResolvedValue(record),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      automationClaim: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn((work: (client: typeof tx) => unknown) => work(tx)),
    };
    const result = await new AutomationService(prisma as any, { append: vi.fn() } as any).claimNext(
      {
        domain: "payout",
        idempotencyKey: "payout:p1:run-1",
        workflowId: "wf-1",
      },
    );
    expect(tx.payout.updateMany).toHaveBeenCalledWith({
      where: { id: "p1", status: "VERSANDBEREIT" },
      data: { status: "VERSAND_LAEUFT" },
    });
    expect(result).toMatchObject({ claim, record: { id: "p1", status: "VERSAND_LAEUFT" } });
  });

  it("puts a failed payout send back in the queue and records the failure on its claim", async () => {
    const claim = {
      id: "claim-p1",
      idempotencyKey: "payout:p1:run-1",
      domain: "payout",
      recordId: "p1",
      resultStatus: null,
    };
    const updatedClaim = { ...claim, resultStatus: "FAILED", error: "timeout", retryCount: 1 };
    const tx = {
      automationClaim: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi.fn().mockResolvedValue(updatedClaim),
      },
      payout: {
        findUnique: vi.fn().mockResolvedValue({ id: "p1", status: "VERSAND_LAEUFT" }),
        update: vi.fn().mockResolvedValue({ id: "p1", status: "VERSANDBEREIT" }),
      },
    };
    const prisma = {
      automationClaim: { findUnique: vi.fn().mockResolvedValue(claim) },
      $transaction: (work: (client: typeof tx) => unknown) => work(tx),
    };
    const result = await new AutomationService(prisma as any, { append: vi.fn() } as any).result(
      claim.idempotencyKey,
      { success: false, error: "timeout" },
    );
    expect(tx.payout.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: "VERSANDBEREIT" },
    });
    expect(tx.automationClaim.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "claim-p1", resultStatus: null },
        data: expect.objectContaining({ resultStatus: "FAILED", error: "timeout" }),
      }),
    );
    expect(result).toMatchObject({ resultStatus: "FAILED", error: "timeout" });
  });

  it("marks a payout mail-sent only after successful automation and stores the external ID", async () => {
    const claim = {
      id: "claim-p2",
      idempotencyKey: "payout:p2:run-1",
      domain: "payout",
      recordId: "p2",
      resultStatus: null,
    };
    const updatedClaim = { ...claim, resultStatus: "SUCCESS", externalId: "message-2" };
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const updatePayout = vi.fn().mockResolvedValue({ id: "p2", status: "MAIL_GESENDET" });
    const tx = {
      automationClaim: {
        updateMany,
        findUnique: vi.fn().mockResolvedValue(updatedClaim),
      },
      payout: {
        findUnique: vi.fn().mockResolvedValue({ id: "p2", status: "VERSAND_LAEUFT" }),
        update: updatePayout,
      },
    };
    const prisma = {
      automationClaim: { findUnique: vi.fn().mockResolvedValue(claim) },
      $transaction: (work: (client: typeof tx) => unknown) => work(tx),
    };
    const audit = { append: vi.fn() };
    const result = await new AutomationService(prisma as any, audit as any).result(
      claim.idempotencyKey,
      { success: true, externalId: "message-2" },
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "claim-p2", resultStatus: null },
      data: {
        resultStatus: "SUCCESS",
        error: null,
        externalId: "message-2",
        completedAt: expect.any(Date),
      },
    });
    expect(updatePayout).toHaveBeenCalledWith({
      where: { id: "p2" },
      data: { status: "MAIL_GESENDET", mailSentAt: expect.any(Date) },
    });
    expect(audit.append).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ resultStatus: "SUCCESS", externalId: "message-2" });
  });
});
