import { expect, test } from "@playwright/test";
import { TESTZEIT, mockEventManagementApi } from "./support/event-management-api";

const HEUTE = TESTZEIT.toISOString().slice(0, 10);
const tag = (n: number) => new Date(TESTZEIT.getTime() + n * 86400000).toISOString().slice(0, 10);
const ev = { id: "e1", name: "Bestehendes Event" };

const AUFGABEN = [
  {
    id: "t1",
    scope: "EVENT",
    eventId: "e1",
    title: "Startnummern drucken",
    description: "",
    status: "OPEN",
    priority: "HIGH",
    ownerId: "user-1",
    groupId: "g1",
    startDate: tag(-5),
    endDate: tag(-2),
    version: 1,
    overdue: true,
    dueSoon: false,
    blockedBy: [],
    event: ev,
  },
  {
    id: "t2",
    scope: "EVENT",
    eventId: "e1",
    title: "Matten buchen",
    description: "",
    status: "DONE",
    priority: "NORMAL",
    ownerId: "user-1",
    groupId: "g1",
    startDate: tag(0),
    endDate: tag(3),
    version: 1,
    overdue: false,
    dueSoon: true,
    blockedBy: [],
    event: ev,
  },
  {
    id: "t3",
    scope: "EVENT",
    eventId: "e1",
    title: "Urkunden freigeben",
    description: "",
    status: "OPEN",
    priority: "LOW",
    ownerId: null,
    groupId: "g1",
    startDate: tag(2),
    endDate: tag(8),
    version: 1,
    overdue: false,
    dueSoon: false,
    blockedBy: [],
    event: ev,
  },
];

async function mockPm(page: import("@playwright/test").Page) {
  await page.route("**/api/v1/pm", (route) =>
    route.fulfill({
      json: {
        referenceTime: `${HEUTE}T09:00:00.000Z`,
        owners: [{ id: "user-1", displayName: "Event Admin", active: true }],
        groups: [
          { id: "g1", name: "Material", icon: "package", color: "blau", active: true, version: 1 },
        ],
        eventChoices: [ev],
        events: [ev],
        edges: [],
        tasks: AUFGABEN,
        blocks: [
          {
            key: "e1",
            event: { ...ev, startAt: `${HEUTE}T00:00:00.000Z` },
            categories: [
              {
                groupId: "g1",
                nextTaskId: "t1",
                nextEndDate: tag(-2),
                count: 3,
                flows: [[["t1"], ["t3"]]],
                tasks: AUFGABEN,
              },
            ],
          },
        ],
      },
    }),
  );
}

test("zeigt die Kennzahlen unter dem Seitenkopf und filtert über die Kachel", async ({ page }) => {
  await mockEventManagementApi(page);
  await mockPm(page);
  await page.goto("/aufgaben");

  // Die Kacheln stehen über der Ansichtswahl, wie auf jeder anderen Seite.
  const kacheln = page.getByTestId("task-priority-summary");
  const ansicht = page.getByRole("group", { name: "Ansicht wählen" });
  const kachelBox = await kacheln.boundingBox();
  const ansichtBox = await ansicht.boundingBox();
  expect(kachelBox!.y).toBeLessThan(ansichtBox!.y);

  // „Meine offenen Aufgaben": t1 zählt, t2 ist erledigt, t3 gehört niemandem.
  const meine = page.getByRole("button", { name: /Meine offenen Aufgaben/ });
  await expect(meine).toContainText("1");

  // Die Kachel setzt einen Filter, der in der Leiste sichtbar und lösbar ist.
  await meine.click();
  await expect(page.getByLabel("Status")).toHaveValue("open");
  await expect(page.getByLabel("Person")).toHaveValue("user-1");
  await expect(page.getByText("Startnummern drucken")).toBeVisible();
  await expect(page.getByText("Urkunden freigeben")).toHaveCount(0);

  await meine.click();
  await expect(page.getByLabel("Status")).toHaveValue("all");
  await expect(page.getByText("Urkunden freigeben")).toBeVisible();
});

test("legt die Aufgaben auf der Zeitachse ab", async ({ page }) => {
  await mockEventManagementApi(page);
  await mockPm(page);
  await page.goto("/aufgaben");

  await page.getByRole("button", { name: "Zeitachse", exact: true }).click();
  const achse = page.getByRole("region", { name: "Aufgaben auf der Zeitachse" });
  await expect(achse.getByRole("heading", { name: "Bestehendes Event" })).toBeVisible();
  await expect(achse.getByText("Startnummern drucken")).toBeVisible();
  await expect(achse.getByText("Heute")).toBeVisible();
});

test("nennt beim Ladefehler, was zu tun ist, statt den Satz des JS-Parsers", async ({ page }) => {
  await mockEventManagementApi(page);
  // Antwortet etwas anderes als der Dienst -- ein Proxy, eine Fehlerseite --,
  // dann stand hier bisher wörtlich "Unexpected token '<'".
  await page.route("**/api/v1/pm", (route) =>
    route.fulfill({ status: 502, contentType: "text/html", body: "<!DOCTYPE html><p>nope" }),
  );

  await page.goto("/aufgaben");
  const meldung = page.getByRole("alert");
  await expect(meldung).toContainText("nicht mit Daten geantwortet");
  await expect(meldung).not.toContainText("Unexpected token");
  await expect(meldung.getByRole("button", { name: "Erneut laden" })).toBeVisible();
});
