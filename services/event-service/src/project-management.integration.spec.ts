import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaService } from "./prisma.service.js";
import { AuditService } from "./audit.service.js";
import { ProjectManagementService } from "./project-management.service.js";
const enabled = !!process.env.PM_TEST_DATABASE_URL;
describe.skipIf(!enabled)("simplified PM persistence", () => {
  const prisma = new PrismaService({ datasourceUrl: process.env.PM_TEST_DATABASE_URL });
  const actor = { id: randomUUID(), role: "ADMIN", active: true };
  const pm = new ProjectManagementService(prisma, new AuditService(prisma));
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: actor.id,
        email: `${actor.id}@test.invalid`,
        displayName: "PM test",
        passwordHash: "unused",
        role: "ADMIN",
      },
    });
  });
  afterAll(() => prisma.$disconnect());
  async function event() {
    return prisma.event.create({
      data: {
        eventCode: `PM-${randomUUID()}`,
        name: "PM test",
        startAt: new Date(),
        endAt: new Date(),
      },
    });
  }
  it("keeps global and event tasks separate, supports dependencies and removes a predecessor relation on delete", async () => {
    const e = await event();
    await pm.command(e.id, { type: "create", graphVersion: 0, task: { title: "Design" } }, actor);
    let state = await pm.read(e.id, actor);
    const design = state.tasks.find((task) => task.title === "Design")!;
    await pm.command(
      e.id,
      { type: "create", graphVersion: state.event.pmGraphVersion, task: { title: "Druck" } },
      actor,
    );
    state = await pm.read(e.id, actor);
    const print = state.tasks.find((task) => task.title === "Druck")!;
    await pm.command(
      e.id,
      {
        type: "add-dependency",
        graphVersion: state.event.pmGraphVersion,
        taskId: print.id,
        taskVersion: print.version,
        predecessorId: design.id,
      },
      actor,
    );
    state = await pm.read(e.id, actor);
    const blocked = state.tasks.find((task) => task.id === print.id)!;
    await expect(
      pm.command(
        e.id,
        {
          type: "update",
          graphVersion: state.event.pmGraphVersion,
          taskId: blocked.id,
          taskVersion: blocked.version,
          task: { status: "DONE" },
        },
        actor,
      ),
    ).rejects.toThrow("Voraussetzung");
    await pm.command(
      e.id,
      {
        type: "delete",
        graphVersion: state.event.pmGraphVersion,
        taskId: design.id,
        taskVersion: design.version,
      },
      actor,
    );
    state = await pm.read(e.id, actor);
    expect(state.edges).toEqual([]);
    const remaining = state.tasks.find((task) => task.id === print.id)!;
    await pm.globalCommand(
      {
        type: "update",
        taskId: remaining.id,
        taskVersion: remaining.version,
        task: { title: "Druck aktualisiert" },
      },
      actor,
    );
    expect(
      (await pm.read(e.id, actor)).tasks.some((task) => task.title === "Druck aktualisiert"),
    ).toBe(true);
    await pm.globalCommand(
      { type: "create", task: { title: "Globale Aufgabe", endDate: "2026-09-20" } },
      actor,
    );
    const global = await pm.global(actor);
    expect(
      global.tasks.some((task) => task.title === "Globale Aufgabe" && task.event === null),
    ).toBe(true);
  });
  it("records comments and limits editing to their author", async () => {
    const e = await event();
    const state = await pm.command(
      e.id,
      { type: "create", graphVersion: 0, task: { title: "Kommentar" } },
      actor,
    );
    const task = state.tasks[0]!;
    const comment = await pm.comment(task.id, { text: "https://example.test/proof" }, actor);
    expect((await pm.comments(task.id, actor))[0]?.text).toContain("example.test");
    await pm.comment(task.id, { id: comment!.id, text: "Korrigiert" }, actor);
    expect(
      (await pm.activities(task.id, actor)).some(
        (item) =>
          item.action === "comment-update" && JSON.stringify(item.details).includes("example.test"),
      ),
    ).toBe(true);
    await pm.comment(task.id, { id: comment!.id, delete: true }, actor);
    expect(await pm.comments(task.id, actor)).toEqual([]);
  });
});
