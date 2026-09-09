import { test, expect } from "@playwright/test";

test("shows central hardware cases, filters them, and links to the event", async ({ page }) => {
  await page.route("**/api/v1/settings**", (route) =>
    route.fulfill({ json: { outlookJahresordner: [], jahresSites: [], outlookMailbox: null } }),
  );
  await page.route("**/api/v1/events**", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/v1/events/hardware**", (route) =>
    route.fulfill({
      json: [
        {
          id: "h1",
          recipientName: "Max Mustermann",
          issueType: "PARTICIPANT",
          objectName: "Active Transponder",
          objectNumberSingle: "T2W101",
          quantity: 1,
          status: "NOTIFIED",
          dueDate: "2026-09-12",
          event: { eventCode: "260820_demo_event", name: "Demo Event" },
        },
        {
          id: "h2",
          recipientName: "Timer XY",
          issueType: "RENTAL",
          objectName: "GPS Tracker",
          objectNumberPrefix: "T2W",
          objectNumberFrom: 1,
          objectNumberTo: 100,
          quantity: 100,
          status: "OPEN",
          dueDate: "2026-09-20",
          event: { eventCode: "270821_demo_event", name: "Zweites Event" },
        },
      ],
    }),
  );
  await page.goto("/hardware");
  await expect(page.getByRole("heading", { name: "Hardware" })).toBeVisible();
  await expect(page.getByText("Max Mustermann")).toBeVisible();
  await expect(page.getByText("Timer XY")).toBeVisible();
  await page.getByPlaceholder("Event filtern …").fill("Zweites");
  await expect(page.getByText("Timer XY")).toBeVisible();
  await expect(page.getByText("Max Mustermann")).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Zweites Event" })).toHaveAttribute(
    "href",
    "/events/270821_demo_event",
  );
});
