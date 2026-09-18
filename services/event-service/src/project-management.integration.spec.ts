import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaService } from "./prisma.service.js";
import { AuditService } from "./audit.service.js";
import { ProjectManagementService } from "./project-management.service.js";
const enabled = !!process.env.PM_TEST_DATABASE_URL;
describe.skipIf(!enabled)("simplified PM persistence", () => {
  const prisma = new PrismaService({ datasourceUrl: process.env.PM_TEST_DATABASE_URL });
  const actor = {
    id: randomUUID(),
    role: "ADMIN",
    status: "ACTIVE",
    organizerId: null,
    financeAccess: true,
  } as const;
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
  it("manages categories with admin permissions, unique names and atomic versioned ordering", async () => {
    const input = { name: `Category ${randomUUID()}`, active: true, sortOrder: 10 };
    const group = await pm.saveGroup(input, actor);
    await expect(pm.saveGroup(input, actor)).rejects.toThrow("bereits vorhanden");
    const member = await prisma.user.create({
      data: {
        email: `${randomUUID()}@test.invalid`,
        displayName: "Member",
        passwordHash: "unused",
        role: "USER",
      },
    });
    await expect(pm.saveGroup({ ...group, active: false }, member)).rejects.toThrow("Berechtigung");
    const updated = await pm.saveGroup({ ...group, active: false }, actor);
    await expect(pm.saveGroup({ ...group, name: "Stale edit" }, actor)).rejects.toThrow("geändert");
    expect(updated.version).toBe(group.version + 1);
    const before = (await pm.groups(actor)).groups;
    await expect(pm.reorderGroups({ groups: before }, member)).rejects.toThrow("Berechtigung");
    const order = [...before].reverse();
    const result = await pm.reorderGroups({ groups: order }, actor);
    expect(result.groups.map((item) => item.id)).toEqual(order.map((item) => item.id));
    const stale = result.groups.map((item, index) =>
      index === result.groups.length - 1 ? { ...item, version: item.version - 1 } : item,
    );
    await expect(pm.reorderGroups({ groups: stale }, actor)).rejects.toThrow("geändert");
    expect((await pm.groups(actor)).groups).toEqual(result.groups);
    await expect(pm.reorderGroups({ groups: result.groups.slice(1) }, actor)).rejects.toThrow(
      "geändert",
    );
  });
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
  it("limits organizer accounts to their assigned Event tasks, comments and attachments", async () => {
    const organizer = await prisma.organizer.create({
      data: { name: `Organizer ${randomUUID()}`, type: "ORGANISATION" },
    });
    const external = await prisma.user.create({
      data: {
        email: `${randomUUID()}@test.invalid`,
        displayName: "External owner",
        role: "ORGANIZER",
        status: "ACTIVE",
        organizerId: organizer.id,
        passwordHash: "unused",
      },
    });
    const other = await prisma.user.create({
      data: {
        email: `${randomUUID()}@test.invalid`,
        displayName: "Other external",
        role: "ORGANIZER",
        status: "ACTIVE",
        organizerId: organizer.id,
        passwordHash: "unused",
      },
    });
    const foreignOrganizer = await prisma.organizer.create({
      data: { name: `Foreign organizer ${randomUUID()}`, type: "ORGANISATION" },
    });
    const foreignExternal = await prisma.user.create({
      data: {
        email: `${randomUUID()}@test.invalid`,
        displayName: "Foreign external",
        role: "ORGANIZER",
        status: "ACTIVE",
        organizerId: foreignOrganizer.id,
        passwordHash: "unused",
      },
    });
    const eventRecord = await prisma.event.create({
      data: {
        eventCode: `ORG-${randomUUID()}`,
        name: "Organizer access",
        startAt: new Date(),
        endAt: new Date(),
        organizerId: organizer.id,
      },
    });
    await expect(
      pm.globalCommand(
        { type: "create", task: { title: "Ungültig global", ownerId: external.id } },
        actor,
      ),
    ).rejects.toThrow("globalen Aufgaben");
    await expect(
      pm.command(
        eventRecord.id,
        {
          type: "create",
          graphVersion: 0,
          task: { title: "Fremder Veranstalter", ownerId: foreignExternal.id },
        },
        actor,
      ),
    ).rejects.toThrow("gehört nicht zu diesem Event");
    const state = await pm.command(
      eventRecord.id,
      { type: "create", graphVersion: 0, task: { title: "Extern sichtbar", ownerId: external.id } },
      actor,
    );
    const task = state.tasks[0]!;
    const externalActor = { ...external, financeAccess: false };
    const otherActor = { ...other, financeAccess: false };
    expect((await pm.global(externalActor)).tasks.map((item) => item.id)).toEqual([task.id]);
    const internalComment = await pm.comment(task.id, { text: "Interner Hinweis" }, actor);
    await expect(
      pm.comment(task.id, { id: internalComment!.id, text: "Manipuliert" }, externalActor),
    ).rejects.toThrow("eigene Kommentare");
    const externalComment = await pm.comment(task.id, { text: "Rückmeldung" }, externalActor);
    await pm.comment(
      task.id,
      { id: externalComment!.id, text: "Rückmeldung korrigiert" },
      externalActor,
    );
    expect((await pm.comments(task.id, externalActor)).at(-1)?.text).toBe("Rückmeldung korrigiert");
    await pm.comment(task.id, { id: externalComment!.id, delete: true }, externalActor);
    expect(
      (await pm.comments(task.id, externalActor)).some((item) => item.id === externalComment!.id),
    ).toBe(false);
    await expect(
      pm.uploadAttachment(
        task.id,
        { fileName: "malware.exe", mimeType: "application/octet-stream", contentBase64: "WA==" },
        externalActor,
      ),
    ).rejects.toThrow("Dateityp");
    await expect(
      pm.uploadAttachment(
        task.id,
        {
          fileName: "zu-gross.txt",
          mimeType: "text/plain",
          contentBase64: Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64"),
        },
        externalActor,
      ),
    ).rejects.toThrow("5 MB");
    const attachment = await pm.uploadAttachment(
      task.id,
      {
        fileName: "../freigabe.txt",
        mimeType: "text/plain",
        contentBase64: Buffer.from("ok").toString("base64"),
      },
      externalActor,
    );
    expect(attachment.fileName).toBe(".._freigabe.txt");
    expect(
      Buffer.from((await pm.attachment(task.id, attachment.id, externalActor)).content).toString(),
    ).toBe("ok");
    await expect(pm.comments(task.id, otherActor)).rejects.toThrow("nicht gefunden");
    await expect(pm.attachment(task.id, attachment.id, otherActor)).rejects.toThrow(
      "nicht gefunden",
    );
    await expect(
      pm.uploadAttachment(
        task.id,
        { fileName: "fremd.txt", mimeType: "text/plain", contentBase64: "WA==" },
        otherActor,
      ),
    ).rejects.toThrow("nicht gefunden");
    await expect(
      pm.globalCommand(
        { type: "update", taskId: task.id, taskVersion: task.version, task: { status: "DONE" } },
        externalActor,
      ),
    ).rejects.toThrow("Berechtigung");
    const beforeReassign = await pm.read(eventRecord.id, actor);
    await pm.command(
      eventRecord.id,
      {
        type: "update",
        graphVersion: beforeReassign.event.pmGraphVersion,
        taskId: task.id,
        taskVersion: task.version,
        task: { ownerId: actor.id },
      },
      actor,
    );
    expect((await pm.global(externalActor)).tasks).toEqual([]);
    const currentState = await pm.read(eventRecord.id, actor);
    const reassigned = currentState.tasks.find((item) => item.id === task.id)!;
    await pm.command(
      eventRecord.id,
      {
        type: "update",
        graphVersion: currentState.event.pmGraphVersion,
        taskId: task.id,
        taskVersion: reassigned.version,
        task: { ownerId: external.id },
      },
      actor,
    );
    await prisma.user.update({ where: { id: external.id }, data: { status: "DISABLED" } });
    await expect(pm.global(externalActor)).rejects.toThrow("Berechtigung");
    await expect(pm.comments(task.id, externalActor)).rejects.toThrow("Berechtigung");
  });
});
