import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PayoutStatus } from "@prisma/client";
import { AuditService } from "./audit.service.js";
import { PrismaService } from "./prisma.service.js";
const include = {
  event: { select: { id: true, eventCode: true, name: true } },
  recipient: true,
} as const;

const snapshotWithEmail = (recipient: any, email?: string | null) => {
  const snapshot: Record<string, unknown> = {};
  for (const key of [
    "id",
    "name",
    "type",
    "country",
    "city",
    "street",
    "postalCode",
    "uid",
    "iban",
    "bic",
    "bankName",
    "email",
  ]) {
    if (recipient?.[key] !== undefined) snapshot[key] = recipient[key];
  }
  if (email !== undefined) snapshot.email = email?.trim() || null;
  return Object.keys(snapshot).length ? (snapshot as Prisma.InputJsonObject) : null;
};

const PAYOUT_STATUSES = Object.values(PayoutStatus);

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
        status: q.status ? (q.status as PayoutStatus) : undefined,
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
    if (input.status && !PAYOUT_STATUSES.includes(input.status))
      throw new BadRequestException("INVALID_PAYOUT_STATUS");
    if (input.status === PayoutStatus.VERSAND_LAEUFT)
      throw new BadRequestException("PAYOUT_STATUS_SYSTEM_MANAGED");
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
      const recipientEmail =
        input.recipientEmail ??
        input.mailRecipient ??
        input.recipientSnapshot?.email ??
        recipient?.email ??
        null;
      const p = await tx.payout.create({
        data: {
          payoutNumber: await this.number(tx, year),
          year,
          eventId: input.eventId ?? null,
          recipientId: recipient?.id ?? null,
          recipientSnapshot: snapshotWithEmail(
            input.recipientSnapshot ?? recipient,
            recipientEmail,
          ) as any,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          currency: String(input.currency ?? "EUR")
            .trim()
            .toUpperCase(),
          status: input.status ?? PayoutStatus.ENTWURF,
          paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
          mailSentAt: input.mailSentAt ? new Date(input.mailSentAt) : undefined,
          transactionReference: input.transactionReference,
          clickUpId: input.clickUpId,
          notes: input.notes,
        },
        include,
      });
      await this.audit.append(
        {
          entity: "Payout",
          entityId: p.id,
          action: "CREATE",
          userId: input.userId,
          newValue: p,
        },
        tx,
      );
      return p;
    });
  }
  async update(id: string, input: any) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.payout.findUnique({ where: { id } });
      if (!old) throw new NotFoundException();
      const data: any = { ...input };
      for (const k of ["userId", "id", "payoutNumber", "createdAt", "updatedAt"]) delete data[k];
      const recipientEmail = data.recipientEmail ?? data.mailRecipient;
      delete data.recipientEmail;
      delete data.mailRecipient;
      if (recipientEmail !== undefined) {
        data.recipientSnapshot = snapshotWithEmail(old.recipientSnapshot, recipientEmail);
      }
      if (data.status && !PAYOUT_STATUSES.includes(data.status))
        throw new BadRequestException("INVALID_PAYOUT_STATUS");
      if (old.status === PayoutStatus.VERSAND_LAEUFT && data.status && data.status !== old.status)
        throw new BadRequestException("PAYOUT_SEND_IN_PROGRESS");
      if (data.status === PayoutStatus.VERSAND_LAEUFT && old.status !== data.status)
        throw new BadRequestException("PAYOUT_STATUS_SYSTEM_MANAGED");
      if (data.status === PayoutStatus.MAIL_GESENDET && old.status !== data.status)
        throw new BadRequestException("PAYOUT_MAIL_STATUS_SYSTEM_MANAGED");
      for (const k of ["paidAt", "mailSentAt"]) if (data[k]) data[k] = new Date(data[k]);
      if (data.status === PayoutStatus.AUSBEZAHLT && !data.paidAt && !old.paidAt)
        data.paidAt = new Date();
      if (data.amount !== undefined)
        data.amount = new Prisma.Decimal(Number(data.amount).toFixed(2));
      const p = await tx.payout.update({ where: { id }, data, include });
      await this.audit.append(
        {
          entity: "Payout",
          entityId: id,
          action: "UPDATE",
          userId: input.userId,
          oldValue: old,
          newValue: p,
        },
        tx,
      );
      return p;
    });
  }
  async remove(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.payout.findUnique({ where: { id } });
      if (!old) throw new NotFoundException();
      await this.audit.append(
        {
          entity: "Payout",
          entityId: id,
          action: "DELETE",
          userId,
          oldValue: old,
        },
        tx,
      );
      await tx.payout.delete({ where: { id } });
      return { deleted: true, payoutNumber: old.payoutNumber };
    });
  }
  async markForMail(ids: string[], userId?: string) {
    const result = [] as any[];
    for (const id of ids) {
      const p = await this.prisma.payout.findUnique({ where: { id } });
      if (!p) result.push({ id, marked: false, reason: "NOT_FOUND" });
      else if (
        p.status === PayoutStatus.STORNIERT ||
        p.status === PayoutStatus.AUSBEZAHLT ||
        p.status === PayoutStatus.VERSAND_LAEUFT
      )
        result.push({ id, marked: false, reason: "STATUS_NOT_SENDABLE" });
      else if (p.amount.lessThanOrEqualTo(0))
        result.push({ id, marked: false, reason: "INVALID_AMOUNT" });
      else {
        const recipient = p.recipientId
          ? await this.prisma.organizer.findUnique({ where: { id: p.recipientId } })
          : null;
        const previousEmail =
          p.recipientSnapshot &&
          typeof p.recipientSnapshot === "object" &&
          !Array.isArray(p.recipientSnapshot)
            ? (p.recipientSnapshot as Prisma.JsonObject).email
            : null;
        const recipientEmail = String(previousEmail ?? recipient?.email ?? "").trim();
        if (!recipientEmail) {
          result.push({ id, marked: false, reason: "MISSING_MAIL_RECIPIENT" });
          continue;
        }
        await this.update(id, {
          status: PayoutStatus.VERSANDBEREIT,
          recipientSnapshot: snapshotWithEmail(recipient ?? p.recipientSnapshot, recipientEmail),
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
}
