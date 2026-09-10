import type { projectTasks, Task } from "@t2w/domain/project-management";
export type PmState = ReturnType<typeof projectTasks> & {
  event: {
    id: string;
    eventCode: string;
    name: string;
    archived: boolean;
    pmGraphVersion: number;
    pmTimeZone: string;
  };
  owners: { id: string; displayName: string; active: boolean }[];
  groups: { id: string; name: string; active: boolean; sortOrder: number; version: number }[];
  legacyCount: number;
  legacySnapshots: { id: string; count: number; sha256: string; createdAt: string }[];
};
export type PmGlobal = Pick<PmState, "owners" | "groups" | "referenceTime"> & {
  eventChoices: { id: string; name: string; seriesId: string | null }[];
  events: { event: PmState["event"]; categories: PmState["categories"] }[];
  tasks: (PmState["tasks"][number] & { event: PmState["event"] })[];
  totalTasks: number;
  totalEvents: number;
  nextCursor: string | null;
  nextEventCursor: string | null;
};
export type PmCommand = {
  type: "create" | "update" | "add-dependency" | "remove-dependency";
  taskId?: string;
  taskVersion?: number;
  task?: Partial<Task>;
  predecessorId?: string;
  reason?: string;
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
export const statusLabel: Record<Task["status"], string> = {
  NEW: "Neu",
  IN_PROGRESS: "In Arbeit",
  DONE: "Erledigt",
  CANCELLED: "Storniert",
};
