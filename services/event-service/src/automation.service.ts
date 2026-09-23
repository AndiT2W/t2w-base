import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { AuditService } from "./audit.service.js";

@Injectable()
export class AutomationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
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
    if (input.domain === "payout") return this.claimNextPayout(input);
    const record =
      input.domain === "hardware"
        ? await this.prisma.hardwareIssue.findFirst({
            where: { status: "MAIL_SEND" },
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
      throw error;
    }
    return { claim, record };
  }

  private async claimNextPayout(input: { idempotencyKey: string; workflowId?: string }) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const previous = await tx.automationClaim.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (previous) return { ...previous, replayed: true };

        const record = await tx.payout.findFirst({
          where: { status: "VERSANDBEREIT" },
          orderBy: { createdAt: "asc" },
        });
        if (!record) return null;

        const reserved = await tx.payout.updateMany({
          where: { id: record.id, status: "VERSANDBEREIT" },
          data: { status: "VERSAND_LAEUFT" },
        });
        if (!reserved.count) {
          const replay = await tx.automationClaim.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
          });
          return replay ? { ...replay, replayed: true } : null;
        }

        const claim = await tx.automationClaim.create({
          data: {
            domain: "payout",
            recordId: record.id,
            idempotencyKey: input.idempotencyKey,
            workflowId: input.workflowId,
          },
        });
        const claimedRecord = { ...record, status: "VERSAND_LAEUFT" };
        await this.audit.append(
          {
            entity: "Payout",
            entityId: record.id,
            action: "AUTOMATION_CLAIM",
            oldValue: record,
            newValue: claimedRecord,
          },
          tx,
        );
        return { claim, record: claimedRecord };
      });
    } catch (error) {
      const replay = await this.prisma.automationClaim.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (replay) return { ...replay, replayed: true };
      throw error;
    }
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
    if (claim.resultStatus) return { ...claim, replayed: true };
    if (claim.domain === "payout") {
      return this.prisma.$transaction(async (tx) => {
        const reserved = await tx.automationClaim.updateMany({
          where: { id: claim.id, resultStatus: null },
          data: {
            resultStatus: input.success ? "SUCCESS" : "FAILED",
            error: input.success ? null : (input.error ?? "Automation failed"),
            externalId: input.externalId,
            completedAt: new Date(),
            ...(input.success ? {} : { retryCount: { increment: 1 } }),
          },
        });
        if (!reserved.count) {
          const replay = await tx.automationClaim.findUnique({ where: { idempotencyKey } });
          return replay ? { ...replay, replayed: true } : null;
        }

        const payout = await tx.payout.findUnique({ where: { id: claim.recordId } });
        if (!payout) throw new Error("PAYOUT_NOT_FOUND");
        if (payout.status !== "VERSAND_LAEUFT") throw new Error("PAYOUT_SEND_NOT_IN_PROGRESS");

        const updatedPayout = await tx.payout.update({
          where: { id: payout.id },
          data: input.success
            ? { status: "MAIL_GESENDET", mailSentAt: new Date() }
            : { status: "VERSANDBEREIT" },
        });
        await this.audit.append(
          {
            entity: "Payout",
            entityId: payout.id,
            action: "AUTOMATION_RESULT",
            oldValue: payout,
            newValue: updatedPayout,
          },
          tx,
        );
        return tx.automationClaim.findUnique({ where: { idempotencyKey } });
      });
    }
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
