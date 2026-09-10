import { describe, expect, it, vi } from "vitest";
import { PrismaEventMutationAdapter } from "./prisma-event-mutation.adapter.js";

describe("Prisma event task dependency validation", () => {
  it("rejects self dependency cycles when updating a task", async () => {
    const adapter = new PrismaEventMutationAdapter({} as never);

    await expect(
      adapter.updateTask("e1", "t1", { dependsOnTaskId: "t1" }),
    ).rejects.toThrow("TASK_DEPENDENCY_SELF_CYCLE");
  });

  it("rejects missing dependency targets while updating a task", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const updateMany = vi.fn();
    const adapter = new PrismaEventMutationAdapter({
      eventTask: { findFirst, updateMany },
    } as never);

    await expect(
      adapter.updateTask("e1", "t1", { dependsOnTaskId: "t2" }),
    ).rejects.toThrow("TASK_DEPENDENCY_TARGET_NOT_FOUND");
    expect(findFirst).toHaveBeenCalledWith({ where: { id: "t2", eventId: "e1" }, select: { id: true } });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("rejects circular dependency chains when updating a task", async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({ id: "t3" })
      .mockResolvedValueOnce({ dependsOnTaskId: "t1" });
    const updateMany = vi.fn();
    const adapter = new PrismaEventMutationAdapter({
      eventTask: { findFirst, updateMany },
    } as never);

    await expect(
      adapter.updateTask("e1", "t1", { dependsOnTaskId: "t3" }),
    ).rejects.toThrow("TASK_DEPENDENCY_CYCLE");
    expect(findFirst).toHaveBeenNthCalledWith(1, {
      where: { id: "t3", eventId: "e1" },
      select: { id: true },
    });
    expect(findFirst).toHaveBeenNthCalledWith(2, {
      where: { id: "t3", eventId: "e1" },
      select: { dependsOnTaskId: true },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("rejects create with missing dependency targets", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const create = vi.fn();
    const adapter = new PrismaEventMutationAdapter({
      eventTask: { findFirst, create },
    } as never);

    await expect(
      adapter.createTask("e1", { title: "Task", dependsOnTaskId: "t2" }),
    ).rejects.toThrow("TASK_DEPENDENCY_TARGET_NOT_FOUND");
    expect(findFirst).toHaveBeenCalledWith({ where: { id: "t2", eventId: "e1" }, select: { id: true } });
    expect(create).not.toHaveBeenCalled();
  });
});
