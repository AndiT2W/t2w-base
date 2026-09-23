import { describe, expect, it } from "vitest";
import {
  isPayoutUnpaid,
  normalizePayoutAmount,
  payoutNumber,
  payoutStatusLabel,
} from "./payout.js";
describe("payout domain", () => {
  it("formats the global yearly number", () => expect(payoutNumber(2026, 1)).toBe("T260001"));
  it("normalizes decimal amounts", () => expect(normalizePayoutAmount("12,5")).toBe("12.50"));
  it("labels each step of the shared payout lifecycle", () => {
    expect(payoutStatusLabel("MAIL_GESENDET")).toBe("Mail gesendet");
    expect(payoutStatusLabel("AUSBEZAHLT")).toBe("Ausbezahlt");
  });
  it("keeps sent mail open until payment and treats cancellation as closed", () => {
    expect(isPayoutUnpaid("MAIL_GESENDET")).toBe(true);
    expect(isPayoutUnpaid("AUSBEZAHLT")).toBe(false);
    expect(isPayoutUnpaid("STORNIERT")).toBe(false);
  });
});
