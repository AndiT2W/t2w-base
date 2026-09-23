import type { projectTaskPortfolio, Task } from "@t2w/domain/project-management";
import type {
  TaskAttachment,
  TaskActivity,
  TaskComment,
  TaskInteractionAdapter,
} from "./task-interaction-workspace";

export type PmState = ReturnType<typeof projectTaskPortfolio> & {
  event: {
    id: string;
    eventCode: string;
    name: string;
    archived: boolean;
    pmGraphVersion: number;
    startAt?: string;
    endAt?: string;
  };
  owners: {
    id: string;
    displayName: string;
    active: boolean;
    role?: string;
    organizerId?: string | null;
  }[];
  groups: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    active: boolean;
    sortOrder: number;
    version: number;
  }[];
  readOnly?: boolean;
};
export type PmGlobalTask = PmState["tasks"][number] & {
  event: PmState["event"] | null;
  externalBlocked?: boolean;
};
export type PmGlobalBlock = {
  key: string;
  event: PmState["event"] | null;
  categories: (PmState["categories"][number] & { tasks: PmGlobalTask[] })[];
};
export type PmGlobal = {
  referenceTime: string;
  owners: PmState["owners"];
  groups: PmState["groups"];
  eventChoices: PmState["event"][];
  events: PmState["event"][];
  tasks: PmGlobalTask[];
  blocks: PmGlobalBlock[];
  edges: PmState["edges"];
  readOnly?: boolean;
};
export type PmCommand = {
  type:
    "create" | "create-successor" | "update" | "delete" | "add-dependency" | "remove-dependency";
  taskId?: string;
  taskVersion?: number;
  task?: Partial<Task>;
  predecessorId?: string;
};
export type PmMutation<TState> = TState & { affectedTaskId: string | null };

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
  /*
   * Antwortet etwas anderes als der Dienst -- ein Proxy, die Anmeldeseite,
   * eine Fehlerseite des Servers --, dann steht HTML im Rumpf und `json()`
   * wirft den Satz des JS-Parsers: "Unexpected token '<'". Der stand bisher
   * woertlich in der roten Leiste der Aufgabenseite. Er nennt weder, was
   * misslang, noch was zu tun ist.
   */
  const data = await response.json().catch(() => {
    throw new Error(
      `Der Dienst hat auf ${path || "/"} nicht mit Daten geantwortet (Status ${response.status}). Bitte neu laden; hält es an, ist der Event-Service nicht erreichbar.`,
    );
  });
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
  pmRequest<PmMutation<PmState>>(`/events/${state.event.id}/commands`, {
    ...command,
    graphVersion: state.event.pmGraphVersion,
  });
export const pmGlobalRead = () => pmRequest<PmGlobal>("");
export type PmAttachment = TaskAttachment;
export const pmAttachments = (taskId: string) =>
  pmRequest<PmAttachment[]>(`/tasks/${taskId}/attachments`);
export const pmUploadAttachment = (
  taskId: string,
  input: { fileName: string; mimeType: string; contentBase64: string },
) => pmRequest<PmAttachment>(`/tasks/${taskId}/attachments`, input);
export type PmGroup = PmState["groups"][number];
export const pmGroupsRead = () => pmRequest<Pick<PmState, "groups">>("/groups");
export const pmGroupSave = (
  group: Omit<PmGroup, "id" | "version" | "icon" | "color"> &
    Partial<Pick<PmGroup, "icon" | "color">> & { id?: string; version?: number },
) => pmRequest<PmGroup>("/groups", group);
export const pmGroupsReorder = (groups: PmGroup[]) =>
  pmRequest<Pick<PmState, "groups">>("/groups/reorder", {
    groups: groups.map(({ id, version }) => ({ id, version })),
  });
const pmGlobalCommand = (command: PmCommand) =>
  pmRequest<PmMutation<PmGlobal>>("/commands", command);

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
function createPmTaskInteractionAdapter<TState extends { tasks: readonly Task[] }>(options: {
  execute(command: PmCommand): Promise<PmMutation<TState>>;
}): TaskInteractionAdapter<TState> {
  const execute = async (command: PmCommand) => {
    const state = await options.execute(command);
    return {
      state,
      task: state.affectedTaskId
        ? (state.tasks.find((task) => task.id === state.affectedTaskId) ?? null)
        : null,
    };
  };
  return {
    create: (draft) => execute({ type: "create", task: draft }),
    createSuccessor: (draft, predecessorId) =>
      execute({ type: "create-successor", task: draft, predecessorId }),
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
    attachments: pmAttachments,
    uploadAttachment: pmUploadAttachment,
    downloadAttachment: async (taskId, attachment) => {
      const response = await fetch(`/api/v1/pm/tasks/${taskId}/attachments/${attachment.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Datei konnte nicht geladen werden.");
      return response.blob();
    },
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
      const next = await pmGlobalCommand(command);
      options.update(next);
      return next;
    },
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
