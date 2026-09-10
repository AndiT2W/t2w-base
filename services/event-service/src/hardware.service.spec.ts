import { describe, expect, it, vi } from "vitest";
import { HardwareService } from "./hardware.service.js";

describe("HardwareService inline updates", () => {
  it("keeps due dates as Date values when object fields are normalized", async () => {
    const current = {
      id: "8b985fc5-7d5b-4611-b61d-d9a60bc1e834",
      eventId: null,
      recipientName: "Jakob Klinglhuber",
      issueType: "PARTICIPANT",
      objectName: "T2W161 GPS Tracker",
      objectNumberType: "SINGLE",
      objectNumberSingle: "T2W161",
      objectNumberPrefix: null,
      objectNumberFrom: null,
      objectNumberTo: null,
      objectNumberPadding: null,
      quantity: 1,
      status: "NOTIFIED",
      email: "jakob@example.com",
      phone: null,
      issuedAt: null,
      dueDate: new Date("2026-09-09T00:00:00.000Z"),
      returnedAt: null,
      note: null,
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
      updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    };
    const update = vi.fn().mockResolvedValue({ ...current, note: "Gerät gibt ihn zurück" });
    const prisma = {
      hardwareIssue: { findFirstOrThrow: vi.fn().mockResolvedValue(current), update },
      auditLog: { create: vi.fn() },
    };
    const service = new HardwareService(
      { ...prisma, $transaction: (work: (tx: typeof prisma) => unknown) => work(prisma) } as any,
      { append: vi.fn() } as any,
    );

    await service.update(undefined, current.id, {
      recipientName: current.recipientName,
      email: current.email,
      objectName: current.objectName,
      quantity: current.quantity,
      status: current.status,
      dueDate: "2026-09-09",
      note: "Gerät gibt ihn zurück",
      eventId: null,
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dueDate: expect.any(Date),
          eventId: null,
          note: "Gerät gibt ihn zurück",
        }),
      }),
    );
  });

  it("writes the mutation and its audit entry through one transaction client", async () => {
    const tx = {
      hardwareIssue: { create: vi.fn().mockResolvedValue({ id: "h1" }) },
      auditLog: { create: vi.fn() },
    };
    const audit = { append: vi.fn().mockResolvedValue(undefined) };
    const service = new HardwareService(
      { $transaction: (work: (client: typeof tx) => unknown) => work(tx) } as any,
      audit as any,
    );
    await service.create(undefined, { recipientName: "Ada", objectName: "Tracker" });
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE", entity: "HardwareIssue", entityId: "h1" }),
      tx,
    );
  });
});
