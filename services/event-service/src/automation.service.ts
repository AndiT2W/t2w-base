import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Injectable()
export class AutomationService {
  constructor(private readonly prisma: PrismaService) {}
  async claim(input: {
    domain: string;
    recordId: string;
    idempotencyKey: string;
    workflowId?: string;
  }) {
    const existing = await this.prisma.automationClaim.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return { ...existing, replayed: true };
    return this.prisma.automationClaim.create({
      data: {
        domain: input.domain,
        recordId: input.recordId,
        idempotencyKey: input.idempotencyKey,
        workflowId: input.workflowId,
      },
    });
  }
  async claimNext(input: { domain: string; idempotencyKey: string; workflowId?: string }) {
    const existing = await this.prisma.automationClaim.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return { ...existing, replayed: true };
    const record =
      input.domain === "hardware"
        ? await this.prisma.hardwareIssue.findFirst({
            where: { status: "MAIL_SEND" },
            orderBy: { createdAt: "asc" },
          })
        : input.domain === "payout"
          ? await this.prisma.payout.findFirst({
              where: { mailStatus: "VERSENDEN", automationClaimedAt: null },
              orderBy: { createdAt: "asc" },
            })
          : null;
    if (!record) return null;
    if (input.domain === "hardware") {
      const reserved = await this.prisma.hardwareIssue.updateMany({
        where: { id: record.id, status: "MAIL_SEND" },
        data: { status: "NOTIFIED" },
      });
      if (!reserved.count) return null;
    }
    if (input.domain === "payout") {
      const reserved = await this.prisma.payout.updateMany({
        where: { id: record.id, mailStatus: "VERSENDEN", automationClaimedAt: null },
        data: { automationClaimedAt: new Date(), automationWorkflowId: input.workflowId },
      });
      if (!reserved.count) return null;
    }
    let claim;
    try {
      claim = await this.prisma.automationClaim.create({
        data: {
          domain: input.domain,
          recordId: record.id,
          idempotencyKey: input.idempotencyKey,
          workflowId: input.workflowId,
        },
      });
    } catch (error) {
      if (input.domain === "hardware")
        await this.prisma.hardwareIssue.updateMany({
          where: { id: record.id, status: "NOTIFIED" },
          data: { status: "MAIL_SEND" },
        });
      if (input.domain === "payout")
        await this.prisma.payout.updateMany({
          where: { id: record.id, automationClaimedAt: { not: null } },
          data: { automationClaimedAt: null, automationWorkflowId: null },
        });
      throw error;
    }
    return { claim, record };
  }
  complete(idempotencyKey: string) {
    return this.prisma.automationClaim.update({
      where: { idempotencyKey },
      data: { completedAt: new Date() },
    });
  }
  async result(
    idempotencyKey: string,
    input: { success: boolean; error?: string; externalId?: string },
  ) {
    const claim = await this.prisma.automationClaim.findUnique({ where: { idempotencyKey } });
    if (!claim) throw new Error("AUTOMATION_CLAIM_NOT_FOUND");
    if (claim.domain === "hardware" && !input.success)
      await this.prisma.hardwareIssue.updateMany({
        where: { id: claim.recordId, status: "NOTIFIED" },
        data: { status: "MAIL_SEND" },
      });
    return this.prisma.automationClaim.update({
      where: { idempotencyKey },
      data: {
        resultStatus: input.success ? "SUCCESS" : "FAILED",
        error: input.success ? null : (input.error ?? "Automation failed"),
        externalId: input.externalId,
        completedAt: input.success ? new Date() : null,
        retryCount: input.success ? undefined : { increment: 1 },
      },
    });
  }
}
