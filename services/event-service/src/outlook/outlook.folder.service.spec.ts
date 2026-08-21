import { describe, expect, it, vi } from "vitest";
import { OutlookFolderService } from "./outlook.folder.service.js";
import { OutlookGraphError, type OutlookGraphClient } from "./outlook.types.js";

function service(graph: OutlookGraphClient) {
  const event = { id: "event-1", eventCode: "260612_sommerfest", startAt: new Date("2026-06-12T12:00:00Z") };
  const prisma = {
    event: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(event),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...event, ...data })),
    },
  } as never;
  return { subject: new OutlookFolderService(prisma, graph), prisma };
}

describe("OutlookFolderService", () => {
  it("provisions the year, quarter and event folders and is idempotent", async () => {
    const folders = new Map<string, { id: string; displayName: string }[]>();
    const graph: OutlookGraphClient = {
      listChildFolders: vi.fn(async (_mailbox, parentId) => folders.get(parentId) ?? []),
      createChildFolder: vi.fn(async (_mailbox, parentId, displayName) => {
        const folder = { id: `${parentId}/${displayName}`, displayName, webUrl: `https://outlook/${displayName}` };
        folders.set(parentId, [...(folders.get(parentId) ?? []), folder]);
        return folder;
      }),
    };
    const { subject } = service(graph);

    await subject.ensureEventFolder("event-1", "shared@example.com", "root");
    await subject.ensureEventFolder("event-1", "shared@example.com", "root");

    expect(graph.createChildFolder).toHaveBeenCalledTimes(3);
    expect(graph.createChildFolder).toHaveBeenNthCalledWith(1, "shared@example.com", "root", "2026");
    expect(graph.createChildFolder).toHaveBeenNthCalledWith(2, "shared@example.com", "root/2026", "Q2");
    expect(graph.createChildFolder).toHaveBeenNthCalledWith(3, "shared@example.com", "root/2026/Q2", "260612_sommerfest");
  });

  it("searches again after a concurrent create conflict", async () => {
    const graph: OutlookGraphClient = {
      listChildFolders: vi.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "year-1", displayName: "2026" }]),
      createChildFolder: vi.fn().mockRejectedValue(new OutlookGraphError(409, "OUTLOOK_GRAPH_409")),
    };
    const { subject } = service(graph);
    await expect(subject.ensureFolder("shared@example.com", "root", "2026")).resolves.toEqual({ id: "year-1", displayName: "2026" });
  });
});
