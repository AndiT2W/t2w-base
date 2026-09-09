import { describe, expect, it, vi } from "vitest";
import { PayoutImportService } from "./payout-import.service.js";

describe("PayoutImportService", () => {
  const service = new PayoutImportService({
    create: vi.fn(),
    findByClickUpId: vi.fn().mockResolvedValue(null),
  } as any);
  it("normalizes legacy status, amount and keeps missing events", () => {
    expect(
      service.normalize({
        taskId: "cu-1",
        amount: "€ 125,5",
        currency: "chf",
        status: "ausbezahlt",
        updatedAt: "2026-01-02T00:00:00Z",
      }),
    ).toMatchObject({
      clickUpId: "cu-1",
      eventId: null,
      amount: "125.50",
      currency: "CHF",
      paymentStatus: "AUSBEZAHLT",
    });
  });
  it("normalizes European thousands separators without losing cents", () => {
    expect(service.normalize({ taskId: "cu-eu", amount: "€ 1.234,56" })).toMatchObject({
      amount: "1234.56",
    });
    expect(service.normalize({ taskId: "cu-int", amount: "CHF 1,234.56" })).toMatchObject({
      amount: "1234.56",
    });
  });
  it("reports invalid rows in preview without creating", async () => {
    const result = await service.run(
      [
        { taskId: "ok", amount: 10 },
        { taskId: "bad", amount: "n/a" },
      ],
      true,
    );
    expect(result).toMatchObject({ total: 2, created: 0, preview: true });
    expect(result.errors).toHaveLength(1);
  });
  it("skips an already imported ClickUp record", async () => {
    const create = vi.fn();
    const existing = new PayoutImportService({
      create,
      findByClickUpId: vi.fn().mockResolvedValue({ id: "p1" }),
    } as any);
    const result = await existing.run([{ taskId: "cu-1", amount: 10 }], false);
    expect(result.skipped).toBe(1);
    expect(create).not.toHaveBeenCalled();
  });
  it("resolves a stable event code and marks unresolved events for review", async () => {
    const create = vi.fn();
    const service = new PayoutImportService(
      { create, findByClickUpId: vi.fn().mockResolvedValue(null) } as any,
      {
        event: {
          findUnique: vi.fn().mockResolvedValueOnce({ id: "event-1" }).mockResolvedValueOnce(null),
        },
      } as any,
    );
    const result = await service.run(
      [
        { taskId: "cu-1", eventCode: "EV-1", amount: 10 },
        { taskId: "cu-2", eventCode: "UNKNOWN", amount: 20 },
      ],
      false,
    );
    expect(create).toHaveBeenNthCalledWith(1, expect.objectContaining({ eventId: "event-1" }));
    expect(create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        eventId: null,
        notes: expect.stringContaining("REVIEW_EVENT_UNRESOLVED"),
      }),
    );
    expect(result.created).toBe(2);
  });
});
