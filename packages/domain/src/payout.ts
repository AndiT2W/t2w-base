export type PayoutStatus =
  "ENTWURF" | "VERSANDBEREIT" | "VERSAND_LAEUFT" | "MAIL_GESENDET" | "AUSBEZAHLT" | "STORNIERT";

export type Payout = {
  status: PayoutStatus;
  amount: string;
  currency: string;
  eventId: string | null;
  payoutNumber: string;
};

export function payoutStatusLabel(status: PayoutStatus) {
  switch (status) {
    case "ENTWURF":
      return "Offen";
    case "VERSANDBEREIT":
      return "Mail versenden";
    case "VERSAND_LAEUFT":
      return "Versand läuft";
    case "MAIL_GESENDET":
      return "Mail gesendet";
    case "AUSBEZAHLT":
      return "Ausbezahlt";
    case "STORNIERT":
      return "Storniert";
  }
}

export function isPayoutUnpaid(status: PayoutStatus) {
  return status !== "AUSBEZAHLT" && status !== "STORNIERT";
}

export function normalizePayoutAmount(value: string | number) {
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new Error("INVALID_AMOUNT");
  return n.toFixed(2);
}
export function payoutNumber(year: number, sequence: number) {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 9999)
    throw new Error("INVALID_SEQUENCE");
  return `T${String(year).slice(-2)}${String(sequence).padStart(4, "0")}`;
}
