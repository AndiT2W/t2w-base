import type { PmCommand } from "./project-management";
import { pmRequest } from "./project-management";
import type { Task } from "@t2w/domain/project-management";

export type TaskComment = {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};
export type TaskActivity = { id: string; action: string; createdAt: string };
export type TaskHistory = { comments: TaskComment[]; activities: TaskActivity[] };

export type TaskInteractionAdapter<TState, TTask extends Task = Task> = {
  command(command: PmCommand): Promise<{ state: TState; task: TTask | null }>;
  history(taskId: string): Promise<TaskHistory>;
  writeComment(
    taskId: string,
    input: { id?: string; text?: string; delete?: boolean },
  ): Promise<void>;
};

export type TaskInteractionSnapshot<TTask extends Task = Task> = TaskHistory & {
  task: TTask | null;
  draft: Partial<TTask>;
  busy: boolean;
  error: string | null;
};

const emptyHistory: TaskHistory = { comments: [], activities: [] };

/**
 * Owns a Task editing interaction. Views render its snapshot; persistence stays behind an adapter.
 */
export function createTaskInteractionWorkspace<TState, TTask extends Task = Task>(
  adapter: TaskInteractionAdapter<TState, TTask>,
) {
  let snapshot: TaskInteractionSnapshot<TTask> = {
    task: null,
    draft: {},
    busy: false,
    error: null,
    ...emptyHistory,
  };
  const subscribers = new Set<() => void>();
  const publish = () => subscribers.forEach((subscriber) => subscriber());
  const set = (patch: Partial<TaskInteractionSnapshot<TTask>>) => {
    snapshot = { ...snapshot, ...patch };
    publish();
  };
  const refreshHistory = async () => {
    if (!snapshot.task?.id) return emptyHistory;
    const history = await adapter.history(snapshot.task.id);
    set(history);
    return history;
  };
  const fail = (value: unknown) => {
    set({
      busy: false,
      error: value instanceof Error ? value.message : "Aufgabe konnte nicht gespeichert werden.",
    });
  };

  return {
    snapshot: () => snapshot,
    subscribe(subscriber: () => void) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    async open(task: TTask) {
      set({ task, draft: task, error: null, ...emptyHistory });
      try {
        await refreshHistory();
      } catch (value) {
        fail(value);
      }
    },
    close() {
      set({ task: null, draft: {}, error: null, ...emptyHistory });
    },
    updateDraft(patch: Partial<TTask>) {
      set({ draft: { ...snapshot.draft, ...patch } });
    },
    async command(command: PmCommand) {
      set({ busy: true, error: null });
      try {
        const result = await adapter.command(command);
        set({ task: result.task, draft: result.task ?? {}, busy: false });
        if (result.task) await refreshHistory();
        return result.state;
      } catch (value) {
        fail(value);
        return undefined;
      }
    },
    async writeComment(input: { id?: string; text?: string; delete?: boolean }) {
      if (!snapshot.task?.id) return;
      set({ busy: true, error: null });
      try {
        await adapter.writeComment(snapshot.task.id, input);
        set({ busy: false });
        await refreshHistory();
      } catch (value) {
        fail(value);
      }
    },
  };
}

export function createHttpTaskInteractionAdapter<TState, TTask extends Task = Task>(
  command: (command: PmCommand) => Promise<{ state: TState; task: TTask | null }>,
): TaskInteractionAdapter<TState, TTask> {
  return {
    command,
    async history(taskId) {
      const [comments, activities] = await Promise.all([
        pmRequest<TaskComment[]>(`/tasks/${taskId}/comments`),
        pmRequest<TaskActivity[]>(`/tasks/${taskId}/activities`),
      ]);
      return { comments, activities };
    },
    async writeComment(taskId, input) {
      await pmRequest(`/tasks/${taskId}/comments`, input);
    },
  };
}

export function createInMemoryTaskInteractionAdapter(initial: {
  tasks: Task[];
  comments?: Record<string, TaskComment[]>;
  activities?: Record<string, TaskActivity[]>;
}): TaskInteractionAdapter<Task[]> {
  let tasks = initial.tasks;
  const comments = new Map(Object.entries(initial.comments ?? {}));
  const activities = new Map(Object.entries(initial.activities ?? {}));
  return {
    async command(command) {
      const before = tasks.find((task) => task.id === command.taskId) ?? null;
      if (command.type === "update" && before) {
        const task = { ...before, ...command.task, version: before.version + 1 };
        tasks = tasks.map((candidate) => (candidate.id === task.id ? task : candidate));
        return { state: tasks, task };
      }
      if (command.type === "delete" && before) {
        tasks = tasks.filter((task) => task.id !== before.id);
        return { state: tasks, task: null };
      }
      return { state: tasks, task: before };
    },
    async history(taskId) {
      return { comments: comments.get(taskId) ?? [], activities: activities.get(taskId) ?? [] };
    },
    async writeComment(taskId, input) {
      const current = comments.get(taskId) ?? [];
      if (input.delete && input.id) {
        comments.set(
          taskId,
          current.filter((comment) => comment.id !== input.id),
        );
        return;
      }
      if (!input.text?.trim()) throw new Error("Kommentartext erforderlich.");
      const now = new Date().toISOString();
      const existing = input.id ? current.find((comment) => comment.id === input.id) : undefined;
      const next = existing
        ? current.map((comment) =>
            comment.id === existing.id
              ? { ...comment, text: input.text!, updatedAt: now }
              : comment,
          )
        : [
            ...current,
            {
              id: `comment-${current.length + 1}`,
              authorId: "memory",
              text: input.text,
              createdAt: now,
              updatedAt: now,
            },
          ];
      comments.set(taskId, next);
      activities.set(taskId, [
        ...(activities.get(taskId) ?? []),
        {
          id: `activity-${next.length}`,
          action: existing ? "comment-update" : "comment-create",
          createdAt: now,
        },
      ]);
    },
  };
}
