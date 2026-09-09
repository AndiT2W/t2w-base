export type PayoutMailStatus = "ENTWURF" | "VERSENDEN" | "GESENDET";
export type PayoutPaymentStatus = "OFFEN" | "AUSBEZAHLT" | "STORNIERT";
export type Payout = { mailStatus:PayoutMailStatus; paymentStatus:PayoutPaymentStatus; amount:string; currency:string; eventId:string|null; payoutNumber:string };
export function payoutOverallStatus(p:Payout) {
  if (p.paymentStatus === "STORNIERT") return "STORNIERT";
  if (p.paymentStatus === "AUSBEZAHLT") return "AUSBEZAHLT";
  if (p.mailStatus === "GESENDET") return "MAIL GESENDET";
  if (p.mailStatus === "VERSENDEN") return "MAIL VERSENDEN";
  return "OFFEN";
}
export function normalizePayoutAmount(value:string|number) { const n=Number(String(value).replace(",",".")); if(!Number.isFinite(n)||n<0) throw new Error("INVALID_AMOUNT"); return n.toFixed(2); }
export function payoutNumber(year:number,sequence:number) { if(!Number.isInteger(sequence)||sequence<1||sequence>9999) throw new Error("INVALID_SEQUENCE"); return `T${String(year).slice(-2)}${String(sequence).padStart(4,"0")}`; }
