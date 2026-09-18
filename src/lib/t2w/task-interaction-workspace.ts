import type { Task } from "@t2w/domain/project-management";

export type TaskComment = {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; displayName: string };
};
export type TaskActivity = { id: string; action: string; createdAt: string };
export type TaskHistory = { comments: TaskComment[]; activities: TaskActivity[] };

type TaskIntentResult<TState> = { state: TState; task: Task | null };
type TaskCommentInput = { id?: string; text?: string; delete?: boolean };

/**
 * The persistence adapter translates Task intentions into its transport. Its
 * callers never construct transport commands, versions, or persistence routes.
 */
export type TaskInteractionAdapter<TState> = {
  create(draft: Partial<Task>): Promise<TaskIntentResult<TState>>;
  update(task: Task, draft: Partial<Task>): Promise<TaskIntentResult<TState>>;
  delete(task: Task): Promise<TaskIntentResult<TState>>;
  addDependency(task: Task, predecessorId: string): Promise<TaskIntentResult<TState>>;
  removeDependency(task: Task, predecessorId: string): Promise<TaskIntentResult<TState>>;
  history(taskId: string): Promise<TaskHistory>;
  writeComment(taskId: string, input: TaskCommentInput): Promise<void>;
};

export type TaskInteractionSnapshot = TaskHistory & {
  task: Task | null;
  draft: Partial<Task>;
  busy: boolean;
  error: string | null;
};

export type TaskInteractionWorkspace<TState> = {
  snapshot(): TaskInteractionSnapshot;
  subscribe(subscriber: () => void): () => void;
  open(task: Task): Promise<void>;
  close(): void;
  updateDraft(patch: Partial<Task>): void;
  create(draft: Partial<Task>, selectCreated?: boolean): Promise<TState | undefined>;
  save(): Promise<TState | undefined>;
  addDependency(predecessorId: string): Promise<TState | undefined>;
  removeDependency(predecessorId: string): Promise<TState | undefined>;
  delete(): Promise<TState | undefined>;
  writeComment(input: TaskCommentInput): Promise<void>;
};

const emptyHistory: TaskHistory = { comments: [], activities: [] };

/**
 * Owns a Task editing interaction. Planning modules use Task intentions while
 * persistence remains behind an adapter. The current selection owns its history.
 */
export function createTaskInteractionWorkspace<TState>(
  adapter: TaskInteractionAdapter<TState>,
): TaskInteractionWorkspace<TState> {
  let snapshot: TaskInteractionSnapshot = {
    task: null,
    draft: {},
    busy: false,
    error: null,
    ...emptyHistory,
  };
  let selectionVersion = 0;
  const subscribers = new Set<() => void>();
  const publish = () => subscribers.forEach((subscriber) => subscriber());
  const set = (patch: Partial<TaskInteractionSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    publish();
  };
  const fail = (value: unknown) => {
    set({
      busy: false,
      error: value instanceof Error ? value.message : "Aufgabe konnte nicht gespeichert werden.",
    });
  };
  const refreshHistory = async (taskId = snapshot.task?.id) => {
    if (!taskId) return emptyHistory;
    const requestVersion = selectionVersion;
    const history = await adapter.history(taskId);
    if (selectionVersion === requestVersion && snapshot.task?.id === taskId) set(history);
    return history;
  };
  const apply = async (intent: () => Promise<TaskIntentResult<TState>>) => {
    set({ busy: true, error: null });
    try {
      const result = await intent();
      selectionVersion += 1;
      set({ task: result.task, draft: result.task ?? {}, busy: false, ...emptyHistory });
      if (result.task?.id) await refreshHistory(result.task.id);
      return result.state;
    } catch (value) {
      fail(value);
      return undefined;
    }
  };
  const applyWithoutSelection = async (intent: () => Promise<TaskIntentResult<TState>>) => {
    set({ busy: true, error: null });
    try {
      const result = await intent();
      set({ busy: false });
      return result.state;
    } catch (value) {
      fail(value);
      return undefined;
    }
  };

  return {
    snapshot: () => snapshot,
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    async open(task) {
      selectionVersion += 1;
      set({ task, draft: task, busy: false, error: null, ...emptyHistory });
      if (!task.id) return;
      try {
        await refreshHistory(task.id);
      } catch (value) {
        if (snapshot.task?.id === task.id) fail(value);
      }
    },
    close() {
      selectionVersion += 1;
      set({ task: null, draft: {}, busy: false, error: null, ...emptyHistory });
    },
    updateDraft(patch) {
      set({ draft: { ...snapshot.draft, ...patch } });
    },
    async create(draft, selectCreated = true) {
      return selectCreated
        ? apply(() => adapter.create(draft))
        : applyWithoutSelection(() => adapter.create(draft));
    },
    async save() {
      const task = snapshot.task;
      if (!task) return undefined;
      return task.id
        ? apply(() => adapter.update(task, snapshot.draft))
        : apply(() => adapter.create(snapshot.draft));
    },
    async addDependency(predecessorId) {
      const task = snapshot.task;
      if (!task?.id) return undefined;
      return apply(() => adapter.addDependency(task, predecessorId));
    },
    async removeDependency(predecessorId) {
      const task = snapshot.task;
      if (!task?.id) return undefined;
      return apply(() => adapter.removeDependency(task, predecessorId));
    },
    async delete() {
      const task = snapshot.task;
      if (!task?.id) return undefined;
      return apply(() => adapter.delete(task));
    },
    async writeComment(input) {
      const taskId = snapshot.task?.id;
      if (!taskId) return;
      set({ busy: true, error: null });
      try {
        await adapter.writeComment(taskId, input);
        set({ busy: false });
        await refreshHistory(taskId);
      } catch (value) {
        fail(value);
      }
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
  const save = (task: Task) => {
    tasks = tasks.map((candidate) => (candidate.id === task.id ? task : candidate));
    return { state: tasks, task };
  };
  const taskOrFail = (id: string) => {
    const task = tasks.find((candidate) => candidate.id === id);
    if (!task) throw new Error("Aufgabe nicht gefunden.");
    return task;
  };
  return {
    async create(draft) {
      const task: Task = {
        id: `task-${tasks.length + 1}`,
        scope: draft.scope ?? "GLOBAL",
        eventId: draft.eventId ?? null,
        title: draft.title ?? "",
        description: draft.description ?? "",
        status: draft.status ?? "OPEN",
        priority: draft.priority ?? "NORMAL",
        ownerId: draft.ownerId ?? null,
        groupId: draft.groupId ?? null,
        startDate: draft.startDate ?? null,
        endDate: draft.endDate ?? null,
        version: 1,
      };
      tasks = [...tasks, task];
      return { state: tasks, task };
    },
    async update(before, draft) {
      return save({ ...taskOrFail(before.id), ...draft, version: before.version + 1 });
    },
    async delete(task) {
      taskOrFail(task.id);
      tasks = tasks.filter((candidate) => candidate.id !== task.id);
      return { state: tasks, task: null };
    },
    async addDependency(task) {
      const before = taskOrFail(task.id);
      return save({ ...before, version: before.version + 1 });
    },
    async removeDependency(task) {
      const before = taskOrFail(task.id);
      return save({ ...before, version: before.version + 1 });
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
