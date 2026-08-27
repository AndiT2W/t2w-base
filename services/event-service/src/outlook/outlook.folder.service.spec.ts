import { describe, expect, it, vi } from "vitest";
import { OutlookFolderService } from "./outlook.folder.service.js";
import { OutlookGraphError, type OutlookGraphClient } from "./outlook.types.js";

function service(graph: OutlookGraphClient) {
  const event = {
    id: "event-1",
    eventCode: "260612_sommerfest",
    startAt: new Date("2026-06-12T12:00:00Z"),
  };
  const prisma = {
    event: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(event),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...event, ...data })),
    },
  };
  return { subject: new OutlookFolderService(prisma as never, graph), prisma };
}

describe("OutlookFolderService", () => {
  it("plans the canonical year, quarter and Eventcode path and detects drift", () => {
    const graph = { listChildFolders: vi.fn(), createChildFolder: vi.fn() };
    const { subject } = service(graph);

    expect(
      subject.planEventFolder(
        { eventCode: "260612_sommerfest", startAt: new Date("2026-06-12T12:00:00Z") },
        "06_auftraege_26",
        "06_auftraege_26/Q1/old",
      ),
    ).toEqual({
      year: "2026",
      yearFolderName: "06_auftraege_26",
      quarter: "Q2",
      eventFolderName: "260612_sommerfest",
      path: "06_auftraege_26/Q2/260612_sommerfest",
      drifted: true,
    });
  });

  it("provisions the year, quarter and event folders and is idempotent", async () => {
    const folders = new Map<string, { id: string; displayName: string }[]>();
    const graph: OutlookGraphClient = {
      listChildFolders: vi.fn(async (_mailbox, parentId) => folders.get(parentId) ?? []),
      createChildFolder: vi.fn(async (_mailbox, parentId, displayName) => {
        const folder = {
          id: `${parentId}/${displayName}`,
          displayName,
          webUrl: `https://outlook/${displayName}`,
        };
        folders.set(parentId, [...(folders.get(parentId) ?? []), folder]);
        return folder;
      }),
    };
    const { subject, prisma } = service(graph);

    await subject.ensureEventFolder("event-1", "shared@example.com", "06_auftraege_26");
    await subject.ensureEventFolder("event-1", "shared@example.com", "06_auftraege_26");

    expect(graph.createChildFolder).toHaveBeenCalledTimes(3);
    expect(graph.createChildFolder).toHaveBeenNthCalledWith(
      1,
      "shared@example.com",
      "inbox",
      "06_auftraege_26",
    );
    expect(graph.createChildFolder).toHaveBeenNthCalledWith(
      2,
      "shared@example.com",
      "inbox/06_auftraege_26",
      "Q2",
    );
    expect(graph.createChildFolder).toHaveBeenNthCalledWith(
      3,
      "shared@example.com",
      "inbox/06_auftraege_26/Q2",
      "260612_sommerfest",
    );
    expect(prisma.event.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outlookFolder: "06_auftraege_26/Q2/260612_sommerfest",
          outlookWebUrl:
            "https://outlook.office.com/mail/shared%40example.com/inbox%2F06_auftraege_26%2FQ2%2F260612_sommerfest",
        }),
      }),
    );
  });

  it("searches again after a concurrent create conflict", async () => {
    const graph: OutlookGraphClient = {
      listChildFolders: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "year-1", displayName: "2026" }]),
      createChildFolder: vi.fn().mockRejectedValue(new OutlookGraphError(409, "OUTLOOK_GRAPH_409")),
    };
    const { subject } = service(graph);
    await expect(subject.ensureFolder("shared@example.com", "root", "2026")).resolves.toEqual({
      id: "year-1",
      displayName: "2026",
    });
  });
});
