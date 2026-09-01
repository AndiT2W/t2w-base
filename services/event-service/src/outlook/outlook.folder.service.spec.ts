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
    appSettings: {
      findUnique: vi.fn().mockResolvedValue({
        outlookMailbox: "shared@example.com",
        outlookJahresordner: [{ jahr: "2026", url: "06_auftraege_26" }],
      }),
    },
    event: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(event),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...event, ...data })),
    },
  };
  return { subject: new OutlookFolderService(prisma as never, graph), prisma };
}

describe("OutlookFolderService", () => {
  it("plans the canonical year, quarter and Eventcode path and detects drift", () => {
    const graph = {
      listChildFolders: vi.fn(),
      createChildFolder: vi.fn(),
      listMessages: vi.fn(),
      listMessagesByConversationIds: vi.fn(),
      moveMessage: vi.fn(),
    };
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

  it("reports whether the planned event folder already exists", async () => {
    const graph: OutlookGraphClient = {
      listChildFolders: vi
        .fn()
        .mockResolvedValueOnce([{ id: "year-id", displayName: "06_auftraege_26" }])
        .mockResolvedValueOnce([{ id: "quarter-id", displayName: "Q2" }])
        .mockResolvedValueOnce([{ id: "event-id", displayName: "260612_sommerfest" }]),
      createChildFolder: vi.fn(),
      listMessages: vi.fn(),
      listMessagesByConversationIds: vi.fn(),
      moveMessage: vi.fn(),
    };
    const { subject } = service(graph);

    await expect(subject.eventFolderPlan("event-1")).resolves.toMatchObject({
      path: "06_auftraege_26/Q2/260612_sommerfest",
      existence: "EXISTS",
    });
  });

  it("reports when the planned event folder must be created", async () => {
    const graph: OutlookGraphClient = {
      listChildFolders: vi.fn().mockResolvedValueOnce([]),
      createChildFolder: vi.fn(),
      listMessages: vi.fn(),
      listMessagesByConversationIds: vi.fn(),
      moveMessage: vi.fn(),
    };
    const { subject } = service(graph);

    await expect(subject.eventFolderPlan("event-1")).resolves.toMatchObject({
      existence: "MISSING",
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
      listMessages: vi.fn(),
      listMessagesByConversationIds: vi.fn(),
      moveMessage: vi.fn(),
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
            "https://outlook.cloud.microsoft/mail/shared%40example.com/inbox%2F06_auftraege_26%2FQ2%2F260612_sommerfest",
        }),
      }),
    );
  });

  it("persists a URL-encoded Outlook cloud link for Graph folder IDs", async () => {
    const graph: OutlookGraphClient = {
      listChildFolders: vi
        .fn()
        .mockResolvedValueOnce([{ id: "year-id", displayName: "06_auftraege_26" }])
        .mockResolvedValueOnce([{ id: "quarter-id", displayName: "Q2" }])
        .mockResolvedValueOnce([
          {
            id: "AAMkADk4NzhhOGRkLTZlM2EtNDM1ZC05NzI0LWJmZDU2ODI2ODM2MwAuAAAAAADFuKi3IrxzSr9wU1FLd6e-AQBNYevkXG7zRqVdnIkoqMFHAAbwdPScAAA=",
            displayName: "260612_sommerfest",
          },
        ]),
      createChildFolder: vi.fn(),
      listMessages: vi.fn(),
      listMessagesByConversationIds: vi.fn(),
      moveMessage: vi.fn(),
    };
    const { subject, prisma } = service(graph);

    await subject.ensureEventFolder("event-1", "info@time2win.at", "06_auftraege_26");

    expect(prisma.event.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          outlookWebUrl:
            "https://outlook.cloud.microsoft/mail/info%40time2win.at/AAMkADk4NzhhOGRkLTZlM2EtNDM1ZC05NzI0LWJmZDU2ODI2ODM2MwAuAAAAAADFuKi3IrxzSr9wU1FLd6e-AQBNYevkXG7zRqVdnIkoqMFHAAbwdPScAAA%3D",
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
      listMessages: vi.fn(),
      listMessagesByConversationIds: vi.fn(),
      moveMessage: vi.fn(),
    };
    const { subject } = service(graph);
    await expect(subject.ensureFolder("shared@example.com", "root", "2026")).resolves.toEqual({
      id: "year-1",
      displayName: "2026",
    });
  });
});
