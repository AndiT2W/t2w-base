import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaService } from "./prisma.service.js";
import { AuditService } from "./audit.service.js";
import { ProjectManagementService } from "./project-management.service.js";

const enabled = !!process.env.PM_TEST_DATABASE_URL;
describe.skipIf(!enabled)("PM commands with PostgreSQL persistence", () => {
  const prisma = new PrismaService({ datasourceUrl: process.env.PM_TEST_DATABASE_URL });
  const audit = new AuditService(prisma);
  const pm = new ProjectManagementService(prisma, audit);
  const actor = { id: randomUUID(), role: "ADMIN", active: true };
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: actor.id,
        email: `${actor.id}@test.invalid`,
        displayName: "PM Test",
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
  it("persists a fork/join graph, blocks premature start, and keeps results on reopening", async () => {
    const e = await event();
    let state = await pm.read(e.id, actor);
    const ids: string[] = [];
    for (const title of ["Druck", "Adresse", "Versand"]) {
      const result = await pm.command(
        e.id,
        {
          type: "create",
          graphVersion: state.event.pmGraphVersion,
          task: {
            title,
            ownerId: actor.id,
            groupId: state.groups.find((group) => group.active)!.id,
            nextStep: "Ausführen",
          },
        },
        actor,
      );
      ids.push(result.changedTaskId);
      state = result;
    }
    const command = async (
      type: "update" | "add-dependency",
      id: string,
      extra: Record<string, unknown>,
    ) => {
      state = await pm.command(
        e.id,
        {
          type,
          taskId: id,
          taskVersion: state.tasks.find((t) => t.id === id)!.version,
          graphVersion: state.event.pmGraphVersion,
          ...extra,
        },
        actor,
      );
    };
    for (const id of ids.slice(0, 2))
      await command("add-dependency", ids[2]!, { predecessorId: id });
    await expect(command("update", ids[2]!, { task: { status: "IN_PROGRESS" } })).rejects.toThrow();
    for (const id of ids.slice(0, 2)) {
      await command("update", id, { task: { status: "IN_PROGRESS" } });
      await command("update", id, { task: { status: "DONE", result: "Geprüft" } });
    }
    await command("update", ids[2]!, { task: { status: "IN_PROGRESS" } });
    await command("update", ids[0]!, { task: { status: "NEW" }, reason: "Druckkorrektur" });
    const reloaded = await pm.read(e.id, actor);
    expect(reloaded.tasks.find((t) => t.id === ids[2])).toMatchObject({
      status: "IN_PROGRESS",
      reasons: ["Voraussetzung erneut prüfen"],
    });
    expect(reloaded.tasks.find((t) => t.id === ids[0])?.result).toBe("Geprüft");
    await expect(
      command("update", ids[2]!, { task: { status: "DONE", result: "Versendet" } }),
    ).rejects.toThrow();
    expect(
      (await pm.activities(ids[0]!, actor)).some((a) =>
        JSON.stringify(a.details).includes("Druckkorrektur"),
      ),
    ).toBe(true);
  });
  it("serializes competing graph writes and rolls back an audit failure", async () => {
    const e = await event();
    const input = { type: "create" as const, graphVersion: 0, task: { title: "Gleichzeitig" } };
    const results = await Promise.allSettled([
      pm.command(e.id, input, actor),
      pm.command(e.id, input, actor),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const before = await pm.read(e.id, actor);
    class FailingAudit extends AuditService {
      override append(): never {
        throw new Error("test audit unavailable");
      }
    }
    const broken = new ProjectManagementService(prisma, new FailingAudit(prisma));
    await expect(
      broken.command(e.id, { ...input, graphVersion: before.event.pmGraphVersion }, actor),
    ).rejects.toThrow("test audit unavailable");
    const after = await pm.read(e.id, actor);
    expect(after.tasks).toEqual(before.tasks);
    expect(after.event.pmGraphVersion).toBe(before.event.pmGraphVersion);
  });
  it("protects history and archives, rejects inactive actors, and verifies the legacy snapshot", async () => {
    const e = await event();
    await prisma.eventTask.create({
      data: { eventId: e.id, title: "Alt", responsible: "Freitext" },
    });
    await expect(
      pm.command(e.id, { type: "create", graphVersion: 0, task: { title: "Neu" } }, actor),
    ).rejects.toThrow();
    const backup = await pm.cutover(e.id, actor);
    const downloaded = await pm.snapshotDownload(backup.runId, actor);
    expect(JSON.parse(downloaded.payload)).toMatchObject([
      { title: "Alt", responsible: "Freitext" },
    ]);
    expect(downloaded.sha256).toBe(backup.sha256);
    // Rehearse restoring the exported rows into an isolated staging table, preserving IDs/data.
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'CREATE TEMP TABLE pm_restore_rehearsal (LIKE "EventTask" INCLUDING DEFAULTS) ON COMMIT DROP',
      );
      await tx.$executeRaw`INSERT INTO pm_restore_rehearsal SELECT * FROM jsonb_populate_recordset(NULL::"EventTask", ${downloaded.payload}::jsonb)`;
      const restored = await tx.$queryRaw<
        Record<string, unknown>[]
      >`SELECT * FROM pm_restore_rehearsal ORDER BY id`;
      expect(JSON.parse(JSON.stringify(restored))).toEqual(JSON.parse(downloaded.payload));
    });
    const state = await pm.read(e.id, actor);
    expect(state.legacyCount).toBe(0);
    expect(state.tasks).toEqual([]);
    await pm.command(
      e.id,
      { type: "create", graphVersion: state.event.pmGraphVersion, task: { title: "Neu" } },
      actor,
    );
    await expect(
      prisma.event.update({ where: { id: e.id }, data: { archived: true } }),
    ).rejects.toThrow();
    await expect(prisma.event.delete({ where: { id: e.id } })).rejects.toThrow();
    await expect(
      prisma.eventTask.create({ data: { eventId: e.id, title: "Legacy bypass" } }),
    ).rejects.toThrow();
    const inactive = await prisma.user.create({
      data: {
        email: `${randomUUID()}@test.invalid`,
        displayName: "Inaktiv",
        passwordHash: "unused",
        active: false,
      },
    });
    await expect(pm.read(e.id, inactive)).rejects.toThrow();
  });
  it("rejects cross-event edges, cycles and new unmet prerequisites on started tasks", async () => {
    const e = await event();
    const other = await event();
    const a = await pm.command(
      e.id,
      {
        type: "create",
        graphVersion: 0,
        task: {
          title: "a",
          ownerId: actor.id,
          groupId: "55000000-0000-4000-8000-000000000001",
          nextStep: "Arbeiten",
        },
      },
      actor,
    );
    const b = await pm.command(
      e.id,
      { type: "create", graphVersion: a.event.pmGraphVersion, task: { title: "b" } },
      actor,
    );
    const foreign = await pm.command(
      other.id,
      { type: "create", graphVersion: 0, task: { title: "foreign" } },
      actor,
    );
    const command = {
      type: "add-dependency" as const,
      taskId: a.changedTaskId,
      taskVersion: 1,
      graphVersion: b.event.pmGraphVersion,
    };
    await expect(
      pm.command(e.id, { ...command, predecessorId: foreign.changedTaskId }, actor),
    ).rejects.toThrow();
    await expect(
      pm.command(e.id, { ...command, predecessorId: a.changedTaskId }, actor),
    ).rejects.toThrow();
    const linked = await pm.command(
      e.id,
      { ...command, taskId: b.changedTaskId, predecessorId: a.changedTaskId },
      actor,
    );
    await expect(
      pm.command(
        e.id,
        { ...command, graphVersion: linked.event.pmGraphVersion, predecessorId: b.changedTaskId },
        actor,
      ),
    ).rejects.toThrow();
    const started = await pm.command(
      e.id,
      {
        type: "update",
        graphVersion: linked.event.pmGraphVersion,
        taskId: a.changedTaskId,
        taskVersion: 1,
        task: { status: "IN_PROGRESS" },
      },
      actor,
    );
    await expect(
      pm.command(
        e.id,
        {
          ...command,
          graphVersion: started.event.pmGraphVersion,
          taskVersion: 2,
          predecessorId: b.changedTaskId,
        },
        actor,
      ),
    ).rejects.toThrow();
    expect((await pm.read(e.id, actor)).edges).toEqual([
      { predecessorId: a.changedTaskId, successorId: b.changedTaskId },
    ]);
  });
});
