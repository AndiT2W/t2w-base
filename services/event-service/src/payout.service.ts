import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PayoutMailStatus, PayoutPaymentStatus } from "@prisma/client";
import { AuditService } from "./audit.service.js";
import { PrismaService } from "./prisma.service.js";

const include = { event: { select: { id: true, eventCode: true, name: true } }, recipient: true } as const;
@Injectable()
export class PayoutService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  private async number(tx: Prisma.TransactionClient, year: number) {
    const row = await tx.payoutNumberSequence.upsert({ where: { year }, create: { year, nextValue: 2 }, update: { nextValue: { increment: 1 } } });
    return `T${String(year).slice(-2)}${String(row.nextValue - 1).padStart(4, "0")}`;
  }
  list(query: { q?: string; eventId?: string; year?: string; recipientId?: string; status?: string }) {
    const q=query.q; return this.prisma.payout.findMany({ where: { eventId: query.eventId, year: query.year ? Number(query.year) : undefined, recipientId: query.recipientId, ...(query.status ? { OR: [{ mailStatus: query.status as PayoutMailStatus }, { paymentStatus: query.status as PayoutPaymentStatus }] } : {}), ...(q ? { OR: [{ payoutNumber: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }, { event: { is: { eventCode: { contains: q, mode: "insensitive" } } } }, { event: { is: { name: { contains: q, mode: "insensitive" } } } }, { recipient: { is: { name: { contains: q, mode: "insensitive" } } } }] } : {}) }, orderBy: { createdAt: "desc" }, include });
  }
  findByClickUpId(clickUpId: string) {
    return this.prisma.payout.findUnique({ where: { clickUpId }, include });
  }
  async create(input: any) { const year = input.year ?? new Date(input.paidAt ?? Date.now()).getFullYear(); if (Number(input.amount)<0) throw new BadRequestException("amount"); return this.prisma.$transaction(async tx => { let recipient = input.recipientId ? await tx.organizer.findUnique({where:{id:input.recipientId}}) : null; if (!recipient && input.eventId) { const e=await tx.event.findUnique({where:{id:input.eventId}}); recipient=e?.payoutRecipientId ? await tx.organizer.findUnique({where:{id:e.payoutRecipientId}}) : null; } const p=await tx.payout.create({data:{payoutNumber:await this.number(tx,year),year,eventId:input.eventId??null,recipientId:recipient?.id??null,recipientSnapshot:recipient as any,amount:new Prisma.Decimal(input.amount),currency:input.currency??"EUR",paidAt:input.paidAt?new Date(input.paidAt):undefined,mailRecipient:input.mailRecipient??recipient?.email,transactionReference:input.transactionReference,notes:input.notes},include}); await this.audit.append({entity:"Payout",entityId:p.id,action:"CREATE",newValue:p}); return p; }); }
  async update(id:string,input:any) { const current=await this.prisma.payout.findUnique({where:{id}}); if(!current) throw new NotFoundException(); const data:any={...input}; for(const k of ["paidAt","mailSentAt"]) if(data[k]) data[k]=new Date(data[k]); if(data.amount!==undefined)data.amount=new Prisma.Decimal(data.amount); delete data.id; delete data.payoutNumber; const p=await this.prisma.payout.update({where:{id},data,include}); await this.audit.append({entity:"Payout",entityId:id,action:"UPDATE",oldValue:current,newValue:p}); return p; }
  async remove(id:string) { const current=await this.prisma.payout.findUnique({where:{id}}); if(!current) throw new NotFoundException(); await this.audit.append({entity:"Payout",entityId:id,action:"DELETE",oldValue:current}); await this.prisma.payout.delete({where:{id}}); return {deleted:true}; }
  markForMail(ids:string[]) { return Promise.all(ids.map(id=>this.update(id,{mailStatus:PayoutMailStatus.VERSENDEN}))); }
  claim(idempotencyKey:string,workflowId?:string) { return this.prisma.$transaction(async tx=>{ const existing=await tx.automationClaim.findUnique({where:{idempotencyKey}}); if(existing)return tx.payout.findUnique({where:{id:existing.recordId},include}); const p=await tx.payout.findFirst({where:{mailStatus:PayoutMailStatus.VERSENDEN,automationClaimedAt:null},include}); if(!p)return null; await tx.automationClaim.create({data:{domain:"payout",recordId:p.id,idempotencyKey,workflowId}}); return tx.payout.update({where:{id:p.id},data:{automationClaimedAt:new Date(),automationWorkflowId:workflowId},include}); }); }
  async result(id:string, body:any) { if(body.success){ return this.update(id,{mailStatus:PayoutMailStatus.GESENDET,mailSentAt:body.mailSentAt??new Date(),externalMessageId:body.externalMessageId,n8nCorrelationId:body.correlationId,automationLastError:null}); } return this.update(id,{automationLastError:body.error??"Automation failed",automationRetryCount:{increment:1}}); }
}
