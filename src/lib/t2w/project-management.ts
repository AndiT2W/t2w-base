import type { projectTaskPortfolio, Task } from "@t2w/domain/project-management";
import type {
  TaskActivity,
  TaskComment,
  TaskInteractionAdapter,
} from "./task-interaction-workspace";

export type PmState = ReturnType<typeof projectTaskPortfolio> & {
  event: { id: string; eventCode: string; name: string; archived: boolean; pmGraphVersion: number };
  owners: { id: string; displayName: string; active: boolean }[];
  groups: { id: string; name: string; active: boolean; sortOrder: number; version: number }[];
};
export type PmGlobal = {
  referenceTime: string;
  owners: PmState["owners"];
  groups: PmState["groups"];
  eventChoices: PmState["event"][];
  events: PmState["event"][];
  tasks: (Task & { event: PmState["event"] | null })[];
  edges: PmState["edges"];
};
type PmCommand = {
  type: "create" | "update" | "delete" | "add-dependency" | "remove-dependency";
  taskId?: string;
  taskVersion?: number;
  task?: Partial<Task>;
  predecessorId?: string;
};

export async function pmRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/v1/pm${path}`, {
    credentials: "include",
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Projektmanagement konnte nicht geladen werden.",
    );
  return data;
}

export const pmRead = (id: string) => pmRequest<PmState>(`/events/${id}`);
const pmCommand = (state: PmState, command: PmCommand) =>
  pmRequest<PmState>(`/events/${state.event.id}/commands`, {
    ...command,
    graphVersion: state.event.pmGraphVersion,
  });
export const pmGlobalRead = () => pmRequest<PmGlobal>("");
const pmGlobalCommand = (command: PmCommand) => pmRequest<unknown>("/commands", command);

const history = async (taskId: string) => {
  const [comments, activities] = await Promise.all([
    pmRequest<TaskComment[]>(`/tasks/${taskId}/comments`),
    pmRequest<TaskActivity[]>(`/tasks/${taskId}/activities`),
  ]);
  return { comments, activities };
};
const writeComment = async (
  taskId: string,
  input: { id?: string; text?: string; delete?: boolean },
) => {
  await pmRequest(`/tasks/${taskId}/comments`, input);
};
const changedTask = (tasks: readonly Task[], command: PmCommand) => {
  if (command.type === "delete") return null;
  if (command.taskId) return tasks.find((task) => task.id === command.taskId) ?? null;
  return tasks.find((task) => task.title === command.task?.title) ?? null;
};

function createPmTaskInteractionAdapter<TState>(options: {
  execute(command: PmCommand): Promise<TState>;
  changedTask(state: TState, command: PmCommand): Task | null;
}): TaskInteractionAdapter<TState> {
  const execute = async (command: PmCommand) => {
    const state = await options.execute(command);
    return { state, task: options.changedTask(state, command) };
  };
  return {
    create: (draft) => execute({ type: "create", task: draft }),
    update: (task, draft) =>
      execute({ type: "update", taskId: task.id, taskVersion: task.version, task: draft }),
    delete: (task) => execute({ type: "delete", taskId: task.id, taskVersion: task.version }),
    addDependency: (task, predecessorId) =>
      execute({
        type: "add-dependency",
        taskId: task.id,
        taskVersion: task.version,
        predecessorId,
      }),
    removeDependency: (task, predecessorId) =>
      execute({
        type: "remove-dependency",
        taskId: task.id,
        taskVersion: task.version,
        predecessorId,
      }),
    history,
    writeComment,
  };
}

/** Event Task changes retain the Event graph-version adapter. */
export function createEventTaskInteractionAdapter(options: {
  current(): PmState | undefined;
  update(state: PmState): void;
}): TaskInteractionAdapter<PmState> {
  return createPmTaskInteractionAdapter({
    async execute(command) {
      const current = options.current();
      if (!current) throw new Error("Aufgaben sind noch nicht geladen.");
      const next = await pmCommand(current, command);
      options.update(next);
      return next;
    },
    changedTask: (state, command) => changedTask(state.tasks, command),
  });
}

/**
 * Global planning uses the canonical server command adapter. The server owns
 * the Event-versus-global route and graph-version lookup for every Task.
 */
export function createGlobalTaskInteractionAdapter(options: {
  update(state: PmGlobal): void;
}): TaskInteractionAdapter<PmGlobal> {
  return createPmTaskInteractionAdapter({
    async execute(command) {
      await pmGlobalCommand(command);
      const next = await pmGlobalRead();
      options.update(next);
      return next;
    },
    changedTask: (state, command) => changedTask(state.tasks, command),
  });
}

export const statusLabel: Record<Task["status"], string> = {
  OPEN: "Offen",
  IN_PROGRESS: "In Arbeit",
  DONE: "Erledigt",
};
export const priorityLabel: Record<Task["priority"], string> = {
  LOW: "Niedrig",
  NORMAL: "Normal",
  HIGH: "Hoch",
};
