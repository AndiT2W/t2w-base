import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID, scryptSync } from "node:crypto";

const prisma = new PrismaClient({ datasourceUrl: process.env.PM_TEST_DATABASE_URL });
const adminEmail = `access-admin-${randomUUID()}@test.invalid`;
const userEmail = `access-user-${randomUUID()}@test.invalid`;
const organizerEmail = `access-organizer-${randomUUID()}@test.invalid`;
const password = "Browser-test-123";
const passwordHash = `test:${scryptSync(password, "test", 64).toString("hex")}`;

test.beforeAll(async () => {
  if (!process.env.PM_TEST_DATABASE_URL?.includes("pm_"))
    throw new Error("Use an isolated pm_ database.");
  await prisma.user.createMany({
    data: [
      {
        email: adminEmail,
        displayName: "Access Admin",
        role: "ADMIN",
        financeAccess: false,
        passwordHash,
      },
      {
        email: userEmail,
        displayName: "Access User",
        role: "USER",
        financeAccess: false,
        passwordHash,
      },
    ],
  });
});
test.afterAll(() => prisma.$disconnect());

test("enforces finance permission and persists the admin change after a new login", async ({
  page,
}) => {
  const recipient = await prisma.organizer.create({
    data: { name: `Finance recipient ${randomUUID()}`, type: "ORGANISATION" },
  });
  const event = await prisma.event.create({
    data: {
      eventCode: `FINANCE-${randomUUID()}`,
      name: "Finance access event",
      startAt: new Date("2026-11-01T08:00:00Z"),
      endAt: new Date("2026-11-02T18:00:00Z"),
      financeNotes: "Nur mit Finanzberechtigung",
      payoutRecipientId: recipient.id,
      invoiceRecipients: { create: { organizerId: recipient.id } },
    },
  });
  expect(
    (await page.request.post("/api/v1/auth/login", { data: { email: userEmail, password } })).ok(),
  ).toBeTruthy();
  expect((await page.request.get("/api/v1/users")).status()).toBe(403);
  expect((await page.request.get("/api/v1/payouts")).status()).toBe(403);
  const protectedEvent = await (await page.request.get(`/api/v1/events/${event.id}`)).json();
  expect(protectedEvent.financeNotes).toBeUndefined();
  expect(protectedEvent.payoutRecipient).toBeUndefined();
  expect(protectedEvent.invoiceRecipients).toHaveLength(1);
  expect(
    (
      await page.request.patch(`/api/v1/events/${event.id}`, {
        data: { version: event.version, financeNotes: "Verboten" },
      })
    ).status(),
  ).toBe(403);
  await page.goto("/auszahlungen");
  await expect(page.getByRole("heading", { name: "Kein Zugriff" })).toBeVisible();
  await expect(page.locator('a[href="/auszahlungen"]')).toHaveCount(0);
  await page.goto("/rechnungen");
  await expect(page.getByRole("heading", { name: "Kein Zugriff" })).toBeVisible();
  await expect(page.locator('a[href="/rechnungen"]')).toHaveCount(0);

  await page.request.post("/api/v1/auth/logout");
  const adminLogin = await page.request.post("/api/v1/auth/login", {
    data: { email: adminEmail, password },
  });
  expect(adminLogin.ok()).toBeTruthy();
  const admin = await adminLogin.json();
  expect(admin.financeAccess).toBe(true);
  expect((await page.request.get("/api/v1/payouts")).ok()).toBeTruthy();
  expect(
    (
      await page.request.patch(`/api/v1/users/${admin.id}`, {
        data: { role: "USER" },
      })
    ).status(),
  ).toBe(403);
  const user = await prisma.user.findUniqueOrThrow({ where: { email: userEmail } });
  expect(
    (await page.request.patch(`/api/v1/users/${user.id}`, { data: { financeAccess: true } })).ok(),
  ).toBeTruthy();
  const audit = await (
    await page.request.get(`/api/v1/audit-log?entity=User&entityId=${user.id}`)
  ).json();
  expect(audit.some((entry: { action: string }) => entry.action === "update")).toBe(true);
  await page.request.post("/api/v1/auth/logout");
  expect(
    (await page.request.post("/api/v1/auth/login", { data: { email: userEmail, password } })).ok(),
  ).toBeTruthy();
  expect((await page.request.get("/api/v1/payouts")).ok()).toBeTruthy();
  const permittedEvent = await (await page.request.get(`/api/v1/events/${event.id}`)).json();
  expect(permittedEvent.financeNotes).toBe("Nur mit Finanzberechtigung");
  expect(permittedEvent.payoutRecipient.id).toBe(recipient.id);
  expect(permittedEvent.invoiceRecipients).toHaveLength(1);
  await page.goto("/auszahlungen");
  await expect(page.locator('a[href="/auszahlungen"]')).toBeVisible();
  await page.goto("/rechnungen");
  await expect(page.getByRole("heading", { name: "Rechnungen" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Rechnungen" })).toBeVisible();
});

test("shows an organizer only the assigned task and keeps comments and files after reload", async ({
  page,
}) => {
  expect(
    (await page.request.post("/api/v1/auth/login", { data: { email: adminEmail, password } })).ok(),
  ).toBeTruthy();
  const organizer = await prisma.organizer.create({
    data: { name: `External ${randomUUID()}`, type: "ORGANISATION" },
  });
  const invited = await page.request.post("/api/v1/users/invite", {
    data: { email: organizerEmail, role: "ORGANIZER", organizerId: organizer.id },
  });
  expect(invited.ok()).toBeTruthy();
  const activationUrl = (await invited.json()).activationUrl as string;
  const token = new URL(activationUrl).searchParams.get("invite")!;
  expect(
    (
      await page.request.post("/api/v1/auth/activate", {
        data: { token, password, firstName: "Event", lastName: "Partner" },
      })
    ).ok(),
  ).toBeTruthy();
  const external = await prisma.user.findUniqueOrThrow({ where: { email: organizerEmail } });
  const event = await prisma.event.create({
    data: {
      eventCode: `ACCESS-${randomUUID()}`,
      name: "Partner Event",
      startAt: new Date("2026-10-01T08:00:00Z"),
      endAt: new Date("2026-10-02T18:00:00Z"),
      organizerId: organizer.id,
    },
  });
  const initial = await page.request.get(`/api/v1/pm/events/${event.id}`);
  const initialState = await initial.json();
  const visibleTitle = `Persönliche Aufgabe ${randomUUID().slice(0, 6)}`;
  const hiddenTitle = `Interne Aufgabe ${randomUUID().slice(0, 6)}`;
  expect(
    (
      await page.request.post(`/api/v1/pm/events/${event.id}/commands`, {
        data: {
          type: "create",
          graphVersion: initialState.event.pmGraphVersion,
          task: { title: visibleTitle, ownerId: external.id },
        },
      })
    ).ok(),
  ).toBeTruthy();
  const next = await (await page.request.get(`/api/v1/pm/events/${event.id}`)).json();
  const hiddenResponse = await page.request.post(`/api/v1/pm/events/${event.id}/commands`, {
    data: { type: "create", graphVersion: next.event.pmGraphVersion, task: { title: hiddenTitle } },
  });
  expect(hiddenResponse.ok()).toBeTruthy();
  const hiddenTask = (await hiddenResponse.json()).tasks.find(
    (item: { title: string }) => item.title === hiddenTitle,
  );

  await page.request.post("/api/v1/auth/logout");
  expect(
    (
      await page.request.post("/api/v1/auth/login", { data: { email: organizerEmail, password } })
    ).ok(),
  ).toBeTruthy();
  expect((await page.request.get(`/api/v1/pm/tasks/${hiddenTask.id}/comments`)).status()).toBe(404);
  await page.goto("/aufgaben");
  await expect(page.getByRole("button", { name: visibleTitle, exact: true })).toBeVisible();
  await expect(page.getByText(hiddenTitle)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Einstellungen" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Globale Aufgabe anlegen" })).toHaveCount(0);
  await page.getByRole("button", { name: visibleTitle, exact: true }).click();
  await expect(page.getByLabel("Titel", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Offen", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Änderungen speichern" })).toHaveCount(0);
  await page.getByLabel("Kommentar schreiben").fill("Vom Veranstalter bestätigt.");
  await page.getByRole("button", { name: "Kommentieren" }).click();
  await page.getByLabel("Datei hochladen").setInputFiles({
    name: "freigabe.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("freigegeben"),
  });
  await expect(page.getByText("freigabe.txt")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: visibleTitle, exact: true }).click();
  await expect(page.getByText("Vom Veranstalter bestätigt.")).toBeVisible();
  await expect(page.getByText("freigabe.txt")).toBeVisible();
});
