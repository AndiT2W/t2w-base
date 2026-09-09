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
    const service = new AutomationService(prisma as any);
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
    const service = new AutomationService(prisma as any);
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
    const result = await new AutomationService(prisma as any).claimNext({
      domain: "hardware",
      idempotencyKey: "hardware:h1:wf",
    });
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
    const service = new AutomationService({
      automationClaim: {
        update,
        findUnique: vi.fn().mockResolvedValue({ domain: "hardware", recordId: "h1" }),
      },
      hardwareIssue: { updateMany: vi.fn() },
    } as any);
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
    const service = new AutomationService({
      automationClaim: { findUnique: vi.fn().mockResolvedValue(null), create },
    } as any);
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
});
