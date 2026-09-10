import { describe, expect, it } from "vitest";
import { normalizePayoutAmount, payoutNumber, payoutOverallStatus } from "./payout.js";
describe("payout domain", () => {
  it("formats the global yearly number", () => expect(payoutNumber(2026, 1)).toBe("T260001"));
  it("normalizes decimal amounts", () => expect(normalizePayoutAmount("12,5")).toBe("12.50"));
  it("projects separate statuses compactly", () =>
    expect(
      payoutOverallStatus({
        mailStatus: "GESENDET",
        paymentStatus: "OFFEN",
        amount: "1",
        currency: "EUR",
        eventId: null,
        payoutNumber: "T260001",
      }),
    ).toBe("MAIL GESENDET"));
});
