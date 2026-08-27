import { describe, expect, it } from "vitest";
import { resolveEventFolderNavigation } from "./folder-navigation";

const settings = {
  jahresSites: [{ jahr: "2026", url: "https://tenant.example/sites/events-2026/" }],
};

describe("Event folder navigation", () => {
  it("prefers the Outlook folder deep link", () => {
    const result = resolveEventFolderNavigation(
      {
        start: "2026-08-27",
        outlookOrdner: "2026/Q3/event",
        outlookWebUrl: "https://outlook.office.com/mail/deeplink/folder/folder-id",
        sharepointOrdner: null,
      },
      settings,
    );
    expect(result.outlook.href).toBe("https://outlook.office.com/mail/deeplink/folder/folder-id");
  });

  it("keeps the general Outlook URL only as a legacy fallback", () => {
    const result = resolveEventFolderNavigation(
      {
        start: "2026-08-27",
        outlookOrdner: "2026/Q3/event",
        outlookWebUrl: null,
        sharepointOrdner: null,
      },
      settings,
    );
    expect(result.outlook.href).toBe("https://outlook.office.com/mail/");
  });

  it("resolves and encodes the SharePoint folder for the Event year", () => {
    const result = resolveEventFolderNavigation(
      {
        start: "2026-08-27",
        outlookOrdner: null,
        outlookWebUrl: null,
        sharepointOrdner: "Q3/Event Folder",
      },
      settings,
    );
    expect(result.sharepoint.href).toBe(
      "https://tenant.example/sites/events-2026/Q3/Event%20Folder",
    );
  });
});
