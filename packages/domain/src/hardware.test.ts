import { describe, expect, it } from "vitest";
import { formatObjectNumber, isHardwareOverdue, normalizeHardwareInput } from "./hardware.js";
describe("hardware domain", () => {
  it("calculates a padded range quantity", () => {
    const value = normalizeHardwareInput({
      issueType: "RENTAL",
      objectName: "GPS",
      objectNumberType: "RANGE",
      objectNumberPrefix: "T2W",
      objectNumberFrom: 1,
      objectNumberTo: 100,
      objectNumberPadding: 3,
    });
    expect(value.quantity).toBe(100);
    expect(formatObjectNumber(value)).toBe("T2W001–T2W100");
  });
  it("supports a non-serial quantity", () => {
    expect(
      normalizeHardwareInput({
        issueType: "OTHER",
        objectName: "Stativ",
        objectNumberType: "NONE",
        quantity: 8,
      }).quantity,
    ).toBe(8);
  });
  it("does not mark returned or completed hardware overdue", () => {
    const date = "2020-01-01";
    expect(isHardwareOverdue(date, "OPEN", new Date("2020-01-02"))).toBe(true);
    expect(isHardwareOverdue(date, "RETURNED", new Date("2020-01-02"))).toBe(false);
    expect(isHardwareOverdue(date, "COMPLETED", new Date("2020-01-02"))).toBe(false);
  });
});
