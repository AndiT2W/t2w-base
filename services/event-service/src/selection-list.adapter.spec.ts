import { describe, expect, it, vi } from "vitest";
import { PrismaSelectionListAdapter } from "./selection-list.adapter.js";
import type { PrismaService } from "./prisma.service.js";

function fakePrisma() {
  const modell = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  });
  return {
    sport: modell(),
    serviceOption: modell(),
    hardwareObjectOption: modell(),
    communicationChannelOption: modell(),
    communicationTopicOption: modell(),
    eventRoleOption: modell(),
    $transaction: vi.fn().mockResolvedValue([]),
  };
}

describe("PrismaSelectionListAdapter", () => {
  it("reicht den Patch je Liste unverändert an Prisma durch", async () => {
    const prisma = fakePrisma();
    const adapter = new PrismaSelectionListAdapter(prisma as unknown as PrismaService);
    const patch = { name: "Trail", icon: "lucide:map-pin", color: "petrol" };

    await adapter.update("sports", "id", patch);
    await adapter.update("services", "id", patch);
    await adapter.update("eventRoles", "id", patch);

    for (const modell of [prisma.sport, prisma.serviceOption, prisma.eventRoleOption])
      expect(modell.update).toHaveBeenCalledWith({ where: { id: "id" }, data: patch });
  });

  it("schreibt Symbol und Farbe auch für Hardware-Objekte", async () => {
    const prisma = fakePrisma();
    const adapter = new PrismaSelectionListAdapter(prisma as unknown as PrismaService);
    const patch = { name: "Transponder", icon: "lucide:box", color: "blau" };

    await adapter.update("hardwareObjects", "id", patch);

    expect(prisma.hardwareObjectOption.update).toHaveBeenCalledWith({
      where: { id: "id" },
      data: patch,
    });
  });

  it("wählt je Art das passende Modell", async () => {
    const prisma = fakePrisma();
    const adapter = new PrismaSelectionListAdapter(prisma as unknown as PrismaService);

    await adapter.load("communicationTopics");
    await adapter.create("communicationChannels", "E-Mail");

    expect(prisma.communicationTopicOption.findMany).toHaveBeenCalled();
    expect(prisma.communicationChannelOption.create).toHaveBeenCalledWith({
      data: { name: "E-Mail" },
    });
    expect(prisma.sport.findMany).not.toHaveBeenCalled();
  });

  it("verweigert das Sortieren, wenn die Liste zwischenzeitlich abweicht", async () => {
    const prisma = fakePrisma();
    prisma.sport.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    const adapter = new PrismaSelectionListAdapter(prisma as unknown as PrismaService);

    await expect(adapter.reorder("sports", ["a"])).rejects.toThrow(
      "SELECTION_LIST_REORDER_CONFLICT",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
