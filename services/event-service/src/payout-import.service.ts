import { Injectable } from "@nestjs/common";
import { PayoutService } from "./payout.service.js";

export type ClickUpPayoutRow = { id?: string; taskId?: string; name?: string; eventId?: string|null; amount?: string|number; currency?: string; status?: string; transactionReference?: string; updatedAt?: string; mailRecipient?: string };
export type PayoutImportReport = { total:number; preview:boolean; created:number; skipped:number; errors:{row:number;reason:string}[] };

@Injectable()
export class PayoutImportService {
  constructor(private readonly payouts:PayoutService) {}
  normalize(row:ClickUpPayoutRow) {
    const raw=String(row.amount??"").replace(/[^0-9,.-]/g,"").replace(",",".");
    const amount=Number(raw);
    if(!raw || !Number.isFinite(amount) || amount<0) throw new Error("INVALID_AMOUNT");
    const status=String(row.status??"").toLowerCase();
    return { clickUpId:row.id??row.taskId, eventId:row.eventId??null, amount:amount.toFixed(2), currency:row.currency?.trim().toUpperCase()||"EUR", transactionReference:row.transactionReference, mailRecipient:row.mailRecipient, notes:row.name, paidAt:status.includes("ausbezahlt")&&row.updatedAt?row.updatedAt:undefined, paymentStatus:status.includes("ausbezahlt")?"AUSBEZAHLT":status.includes("storniert")?"STORNIERT":"OFFEN", mailStatus:status.includes("gesendet")?"GESENDET":status.includes("versenden")?"VERSENDEN":"ENTWURF" };
  }
  async run(rows:ClickUpPayoutRow[], preview=true):Promise<PayoutImportReport & {items?:unknown[]}> { const report:PayoutImportReport={total:rows.length,preview,created:0,skipped:0,errors:[]}; const items=[]; for(const [i,row] of rows.entries()){try{const item=this.normalize(row);items.push(item);if(!preview && item.clickUpId && await this.payouts.findByClickUpId(item.clickUpId)) { report.skipped++; continue; } if(!preview){await this.payouts.create(item);report.created++}}catch(e){report.errors.push({row:i+1,reason:e instanceof Error?e.message:"INVALID_ROW"})}} report.skipped+=report.total-report.created-report.skipped-report.errors.length; return {...report,items}; }
}
