import { describe, expect, it } from "vitest";
import {
  createInMemoryTaskInteractionAdapter,
  createTaskInteractionWorkspace,
  type TaskInteractionAdapter,
  type TaskHistory,
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
    await workspace.save();
    await workspace.writeComment({ text: "Prüfen" });

    expect(workspace.snapshot()).toMatchObject({
      task: { title: "Freigabe", version: 2 },
      comments: [{ text: "Prüfen" }],
      activities: [{ action: "comment-create" }],
    });
  });

  it("keeps history with the newest Task selection and ignores history after close", async () => {
    const nextTask = { ...task, id: "task-2", title: "Abnahme" };
    const resolvers = new Map<string, (value: TaskHistory) => void>();
    const adapter: TaskInteractionAdapter<Task[]> = {
      create: async () => ({ state: [task, nextTask], task }),
      createSuccessor: async () => ({ state: [task, nextTask], task: nextTask }),
      update: async (current) => ({ state: [task, nextTask], task: current }),
      delete: async () => ({ state: [], task: null }),
      addDependency: async (current) => ({ state: [task, nextTask], task: current }),
      removeDependency: async (current) => ({ state: [task, nextTask], task: current }),
      history: (taskId) =>
        new Promise((resolve) => {
          resolvers.set(taskId, resolve);
        }),
      writeComment: async () => undefined,
      attachments: async () => [],
      uploadAttachment: async () => {
        throw new Error("Nicht erwartet");
      },
      downloadAttachment: async () => new Blob(),
    };
    const workspace = createTaskInteractionWorkspace(adapter);

    const openingFirst = workspace.open(task);
    const openingSecond = workspace.open(nextTask);
    resolvers.get(nextTask.id)!({
      comments: [
        {
          id: "comment-2",
          authorId: "memory",
          text: "Nur für Abnahme",
          createdAt: "2026-09-15T10:00:00Z",
          updatedAt: "2026-09-15T10:00:00Z",
        },
      ],
      activities: [],
    });
    await openingSecond;
    resolvers.get(task.id)!({
      comments: [
        {
          id: "comment-1",
          authorId: "memory",
          text: "Nur für Briefing",
          createdAt: "2026-09-15T10:00:00Z",
          updatedAt: "2026-09-15T10:00:00Z",
        },
      ],
      activities: [],
    });
    await openingFirst;

    expect(workspace.snapshot().task?.id).toBe(nextTask.id);
    expect(workspace.snapshot().comments).toMatchObject([{ text: "Nur für Abnahme" }]);

    const reopening = workspace.open(task);
    workspace.close();
    resolvers.get(task.id)!({ comments: [], activities: [] });
    await reopening;

    expect(workspace.snapshot()).toMatchObject({ task: null, comments: [], activities: [] });
  });

  it("keeps attachment intent and state behind the task interaction interface", async () => {
    const workspace = createTaskInteractionWorkspace(
      createInMemoryTaskInteractionAdapter({ tasks: [task] }),
    );
    await workspace.open(task);
    await workspace.uploadAttachment({
      fileName: "briefing.txt",
      mimeType: "text/plain",
      contentBase64: "aGVsbG8=",
    });

    const attachment = workspace.snapshot().attachments[0]!;
    expect(attachment.fileName).toBe("briefing.txt");
    await expect(workspace.downloadAttachment(attachment)).resolves.toBeInstanceOf(Blob);
  });

  it("keeps a failed successor intent visible without creating a task", async () => {
    const workspace = createTaskInteractionWorkspace(
      createInMemoryTaskInteractionAdapter({ tasks: [task] }),
    );
    const draft = { title: "Druck", scope: "GLOBAL" as const };

    await expect(workspace.createSuccessor(draft, "missing")).resolves.toBeUndefined();
    expect(workspace.snapshot()).toMatchObject({ error: "Aufgabe nicht gefunden.", task: null });

    const state = await workspace.createSuccessor(draft, task.id);
    expect(state).toHaveLength(2);
    expect(workspace.snapshot()).toMatchObject({ error: null, task: null });
  });
});
