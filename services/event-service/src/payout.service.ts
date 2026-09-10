import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PayoutMailStatus, PayoutPaymentStatus } from "@prisma/client";
import { AuditService } from "./audit.service.js";
import { PrismaService } from "./prisma.service.js";
const include = {
  event: { select: { id: true, eventCode: true, name: true } },
  recipient: true,
} as const;
@Injectable()
export class PayoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  private async number(tx: Prisma.TransactionClient, year: number) {
    const s = await tx.payoutNumberSequence.upsert({
      where: { year },
      create: { year, nextValue: 2 },
      update: { nextValue: { increment: 1 } },
    });
    return `T${String(year).slice(-2)}${String(s.nextValue - 1).padStart(4, "0")}`;
  }
  list(q: { q?: string; eventId?: string; year?: string; recipientId?: string; status?: string }) {
    const x = q.q;
    return this.prisma.payout.findMany({
      where: {
        eventId: q.eventId,
        year: q.year ? Number(q.year) : undefined,
        recipientId: q.recipientId,
        ...(q.status
          ? {
              OR: [
                { mailStatus: q.status as PayoutMailStatus },
                { paymentStatus: q.status as PayoutPaymentStatus },
              ],
            }
          : {}),
        ...(x
          ? {
              OR: [
                { payoutNumber: { contains: x, mode: "insensitive" } },
                { notes: { contains: x, mode: "insensitive" } },
                { event: { is: { eventCode: { contains: x, mode: "insensitive" } } } },
                { event: { is: { name: { contains: x, mode: "insensitive" } } } },
                { recipient: { is: { name: { contains: x, mode: "insensitive" } } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include,
    });
  }
  findByClickUpId(id: string) {
    return this.prisma.payout.findUnique({ where: { clickUpId: id }, include });
  }
  async create(input: any) {
    const amount = Number(String(input.amount ?? "").replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) throw new BadRequestException("INVALID_AMOUNT");
    const year = Number(input.year ?? new Date(input.paidAt ?? Date.now()).getFullYear());
    return this.prisma.$transaction(async (tx) => {
      let recipient = input.recipientId
        ? await tx.organizer.findUnique({ where: { id: input.recipientId } })
        : null;
      if (!recipient && input.eventId) {
        const e = await tx.event.findUnique({ where: { id: input.eventId } });
        recipient = e?.payoutRecipientId
          ? await tx.organizer.findUnique({ where: { id: e.payoutRecipientId } })
          : null;
      }
      const p = await tx.payout.create({
        data: {
          payoutNumber: await this.number(tx, year),
          year,
          eventId: input.eventId ?? null,
          recipientId: recipient?.id ?? null,
          recipientSnapshot: recipient as any,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          currency: String(input.currency ?? "EUR")
            .trim()
            .toUpperCase(),
          mailStatus: input.mailStatus ?? PayoutMailStatus.ENTWURF,
          paymentStatus: input.paymentStatus ?? PayoutPaymentStatus.OFFEN,
          paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
          mailRecipient: input.mailRecipient ?? recipient?.email,
          transactionReference: input.transactionReference,
          clickUpId: input.clickUpId,
          notes: input.notes,
        },
        include,
      });
      await this.audit.append({
        entity: "Payout",
        entityId: p.id,
        action: "CREATE",
        userId: input.userId,
        newValue: p,
      }, tx);
      return p;
    });
  }
  async update(id: string, input: any) {
    return this.prisma.$transaction(async (tx) => {
    const old = await tx.payout.findUnique({ where: { id } });
    if (!old) throw new NotFoundException();
    const data: any = { ...input };
    for (const k of ["userId", "id", "payoutNumber", "createdAt", "updatedAt"]) delete data[k];
    for (const k of ["paidAt", "mailSentAt"]) if (data[k]) data[k] = new Date(data[k]);
    if (data.paymentStatus === PayoutPaymentStatus.AUSBEZAHLT && !data.paidAt && !old.paidAt)
      data.paidAt = new Date();
    if (data.amount !== undefined) data.amount = new Prisma.Decimal(Number(data.amount).toFixed(2));
    const p = await tx.payout.update({ where: { id }, data, include });
    await this.audit.append({
      entity: "Payout",
      entityId: id,
      action: "UPDATE",
      userId: input.userId,
      oldValue: old,
      newValue: p,
    }, tx);
    return p;
    });
  }
  async remove(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
    const old = await tx.payout.findUnique({ where: { id } });
    if (!old) throw new NotFoundException();
    await this.audit.append({
      entity: "Payout",
      entityId: id,
      action: "DELETE",
      userId,
      oldValue: old,
    }, tx);
    await tx.payout.delete({ where: { id } });
    return { deleted: true, payoutNumber: old.payoutNumber };
    });
  }
  async markForMail(ids: string[], userId?: string) {
    const result = [] as any[];
    for (const id of ids) {
      const p = await this.prisma.payout.findUnique({ where: { id } });
      if (!p) result.push({ id, marked: false, reason: "NOT_FOUND" });
      else if (p.paymentStatus === PayoutPaymentStatus.STORNIERT)
        result.push({ id, marked: false, reason: "STORNIERT" });
      else if (p.amount.lessThanOrEqualTo(0))
        result.push({ id, marked: false, reason: "INVALID_AMOUNT" });
      else {
        const recipient = p.recipientId
          ? await this.prisma.organizer.findUnique({ where: { id: p.recipientId } })
          : null;
        const mailRecipient = (recipient?.email ?? p.mailRecipient)?.trim();
        if (!mailRecipient) {
          result.push({ id, marked: false, reason: "MISSING_MAIL_RECIPIENT" });
          continue;
        }
        await this.update(id, {
          mailStatus: PayoutMailStatus.VERSENDEN,
          recipientSnapshot: recipient ?? p.recipientSnapshot,
          mailRecipient,
          userId,
        });
        result.push({ id, marked: true });
      }
    }
    await this.audit.append({
      entity: "Payout",
      entityId: "bulk",
      action: "BULK_MARK_FOR_MAIL",
      userId,
      newValue: result,
    });
    return result;
  }
  claim(key: string, workflowId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.automationClaim.findUnique({ where: { idempotencyKey: key } });
      if (old) return tx.payout.findUnique({ where: { id: old.recordId }, include });
      const p = await tx.payout.findFirst({
        where: { mailStatus: PayoutMailStatus.VERSENDEN, automationClaimedAt: null },
        include,
      });
      if (!p) return null;
      const claimed = await tx.payout.updateMany({
        where: { id: p.id, automationClaimedAt: null },
        data: { automationClaimedAt: new Date(), automationWorkflowId: workflowId },
      });
      if (!claimed.count) return null;
      await tx.automationClaim.create({
        data: { domain: "payout", recordId: p.id, idempotencyKey: key, workflowId },
      });
      return tx.payout.findUnique({ where: { id: p.id }, include });
    });
  }
  result(id: string, b: any) {
    return b.success
      ? this.update(id, {
          mailStatus: PayoutMailStatus.GESENDET,
          mailSentAt: b.mailSentAt ?? new Date(),
          externalMessageId: b.externalMessageId,
          n8nCorrelationId: b.correlationId,
          automationLastError: null,
        })
      : this.update(id, {
          automationLastError: b.error ?? "Automation failed",
          automationRetryCount: { increment: 1 },
          automationClaimedAt: null,
        });
  }
}
