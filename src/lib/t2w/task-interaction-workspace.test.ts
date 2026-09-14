import { describe, expect, it } from "vitest";
import {
  createInMemoryTaskInteractionAdapter,
  createTaskInteractionWorkspace,
} from "./task-interaction-workspace";
import type { Task } from "@t2w/domain/project-management";

const task: Task = {
  id: "task-1",
  scope: "GLOBAL",
  eventId: null,
  title: "Briefing",
  description: "",
  status: "OPEN",
  priority: "NORMAL",
  ownerId: null,
  groupId: null,
  startDate: null,
  endDate: null,
  version: 1,
};

describe("Task interaction workspace", () => {
  it("uses the same interface for draft changes and refreshed collaboration history", async () => {
    const workspace = createTaskInteractionWorkspace(
      createInMemoryTaskInteractionAdapter({ tasks: [task] }),
    );
    await workspace.open(task);
    workspace.updateDraft({ title: "Freigabe" });
    await workspace.command({ type: "update", taskId: task.id, task: workspace.snapshot().draft });
    await workspace.writeComment({ text: "Prüfen" });

    expect(workspace.snapshot()).toMatchObject({
      task: { title: "Freigabe", version: 2 },
      comments: [{ text: "Prüfen" }],
      activities: [{ action: "comment-create" }],
    });
  });
});
