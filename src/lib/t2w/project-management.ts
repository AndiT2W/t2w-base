import type { projectTasks, Task } from "@t2w/domain/project-management";
export type PmState = ReturnType<typeof projectTasks> & {
  event: { id: string; eventCode: string; name: string; archived: boolean; pmGraphVersion: number };
  owners: { id: string; displayName: string; active: boolean }[];
  groups: { id: string; name: string; active: boolean; sortOrder: number; version: number }[];
  legacyCount: number;
};
export type PmGlobal = {
  referenceTime: string;
  owners: PmState["owners"];
  groups: PmState["groups"];
  eventChoices: PmState["event"][];
  events: PmState["event"][];
  tasks: (PmState["tasks"][number] & { event: PmState["event"] | null })[];
  edges: PmState["edges"];
  projects: {
    eventId: string | null;
    categories: PmState["categories"];
    flows: PmState["flows"];
  }[];
};
export type PmCommand = {
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
export const pmCommand = (state: PmState, command: PmCommand) =>
  pmRequest<PmState>(`/events/${state.event.id}/commands`, {
    ...command,
    graphVersion: state.event.pmGraphVersion,
  });
export const pmGlobalCommand = (command: PmCommand) =>
  pmRequest<ReturnType<typeof projectTasks>>("/commands", command);
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
