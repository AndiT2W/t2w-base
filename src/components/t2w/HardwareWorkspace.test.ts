import { describe, expect, it } from "vitest";
import { normalizeHardwareResponse } from "./HardwareWorkspace";

describe("normalizeHardwareResponse", () => {
  it("accepts the legacy array response", () => {
    const item = { id: "hardware-1" };
    expect(normalizeHardwareResponse([item])).toEqual([item]);
  });

  it("unwraps a paginated response", () => {
    const item = { id: "hardware-1" };
    expect(normalizeHardwareResponse({ items: [item], total: 1 })).toEqual([item]);
  });

  it("does not crash on API error payloads", () => {
    expect(normalizeHardwareResponse({ message: "Unauthorized" })).toEqual([]);
    expect(normalizeHardwareResponse(null)).toEqual([]);
  });
});
