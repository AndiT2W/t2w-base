import type { Task } from "@t2w/domain/project-management";
import { priorityLabel, statusLabel, type PmState } from "@/lib/t2w/project-management";
const fields = {
  title: "Titel",
  description: "Beschreibung",
  status: "Arbeitsstatus",
  priority: "Priorität",
  ownerId: "Owner",
  groupId: "Kategorie",
  startDate: "Start",
  endDate: "Ende",
} as const;
export function TaskChangeDetails({
  before,
  after,
  state,
}: {
  before?: Partial<Task> | null;
  after?: Partial<Task> | null;
  state: PmState;
}) {
  const display = (key: keyof typeof fields, task?: Partial<Task> | null): string => {
    const value = task?.[key];
    if (value === undefined || value === null || value === "") return "—";
    if (key === "status") return statusLabel[value as Task["status"]];
    if (key === "ownerId")
      return state.owners.find((o) => o.id === value)?.displayName ?? "Ehemalige Zuweisung";
    if (key === "groupId")
      return state.groups.find((g) => g.id === value)?.name ?? "Ehemalige Kategorie";
    if (key === "priority") return priorityLabel[value as Task["priority"]];
    return String(value);
  };
  return (
    <dl className="space-y-2 text-sm">
      {(Object.keys(fields) as (keyof typeof fields)[])
        .filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))
        .map((key) => (
          <div key={key}>
            <dt className="font-medium">{fields[key]}</dt>
            <dd className="whitespace-pre-wrap break-words">
              {display(key, before)} → {display(key, after)}
            </dd>
          </div>
        ))}
    </dl>
  );
}
export const activityLabel: Record<string, string> = {
  create: "Aufgabe erstellt",
  update: "Aufgabe geändert",
  "add-dependency": "Voraussetzung hinzugefügt",
  "remove-dependency": "Voraussetzung entfernt",
  "comment-create": "Kommentar erstellt",
  "comment-update": "Kommentar bearbeitet",
  "comment-delete": "Kommentar gelöscht",
};
export function TaskActivityDetails({ details, state }: { details: unknown; state: PmState }) {
  const data = details as {
    before?: Task;
    after?: Task;
    predecessorId?: string;
    successorId?: string;
    reason?: string;
  };
  if (!data || typeof data !== "object") return <p>Verlauf nicht verfügbar.</p>;
  return (
    <>
      <TaskChangeDetails before={data.before ?? null} after={data.after ?? null} state={state} />
      {data.predecessorId && (
        <p>
          Voraussetzung:{" "}
          {state.tasks.find((t) => t.id === data.predecessorId)?.title ?? "Nicht mehr verfügbar"} →{" "}
          {state.tasks.find((t) => t.id === data.successorId)?.title ?? "Nicht mehr verfügbar"}
        </p>
      )}
      {data.reason && <p>Begründung: {data.reason}</p>}
    </>
  );
}
