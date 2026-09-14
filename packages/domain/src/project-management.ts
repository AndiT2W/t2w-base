export type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE";
export type TaskScope = "EVENT" | "GLOBAL";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH";
export type Task = {
  id: string;
  scope: TaskScope;
  eventId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  ownerId: string | null;
  groupId: string | null;
  startDate: string | null;
  endDate: string | null;
  version: number;
};
export type Dependency = { predecessorId: string; successorId: string };
export type Catalogue = {
  owners: { id: string; active: boolean }[];
  groups: { id: string; active: boolean }[];
};
export const isOpen = (task: Task) => task.status !== "DONE";
const validDay = (value: string | null) =>
  value === null ||
  (/^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value);
const active = (items: { id: string; active: boolean }[], id: string | null) =>
  id === null || items.some((item) => item.id === id && item.active);

export function unmetPredecessors(taskId: string, tasks: Task[], edges: Dependency[]) {
  return edges
    .filter((edge) => edge.successorId === taskId)
    .map((edge) => edge.predecessorId)
    .filter((id) => tasks.find((task) => task.id === id)?.status !== "DONE");
}

export function validateDependency(tasks: Task[], edges: Dependency[], edge: Dependency) {
  const predecessor = tasks.find((task) => task.id === edge.predecessorId);
  const successor = tasks.find((task) => task.id === edge.successorId);
  if (
    !predecessor ||
    !successor ||
    predecessor.scope !== successor.scope ||
    predecessor.eventId !== successor.eventId
  )
    throw new Error("Voraussetzungen müssen im selben Kontext liegen.");
  if (predecessor.id === successor.id) throw new Error("Selbstbezug ist nicht zulässig.");
  if (
    edges.some(
      (item) => item.predecessorId === edge.predecessorId && item.successorId === edge.successorId,
    )
  )
    throw new Error("Voraussetzung besteht bereits.");
  const pending = [successor.id],
    visited = new Set<string>();
  while (pending.length) {
    const id = pending.pop()!;
    if (id === predecessor.id) throw new Error("Zyklische Voraussetzung ist nicht zulässig.");
    if (visited.has(id)) continue;
    visited.add(id);
    pending.push(
      ...edges.filter((item) => item.predecessorId === id).map((item) => item.successorId),
    );
  }
}

export function validateTaskChange(
  before: Task | null,
  after: Task,
  tasks: Task[],
  edges: Dependency[],
  catalogue: Catalogue,
) {
  if (!after.title.trim()) throw new Error("Titel ist erforderlich.");
  if (!validDay(after.startDate) || !validDay(after.endDate))
    throw new Error("Gültiges Start- oder Enddatum erforderlich.");
  if (after.startDate && after.endDate && after.startDate > after.endDate)
    throw new Error("Das Ende darf nicht vor dem Start liegen.");
  if (!active(catalogue.owners, after.ownerId) || !active(catalogue.groups, after.groupId))
    throw new Error("Zuweisung prüfen: Person oder Kategorie ist inaktiv.");
  if (!before && after.status !== "OPEN") throw new Error("Neue Aufgaben beginnen als offen.");
  if (after.status === "DONE") {
    const unmet = unmetPredecessors(after.id, tasks, edges);
    if (unmet.length)
      throw new Error(
        `Voraussetzung offen: ${unmet.map((id) => tasks.find((task) => task.id === id)?.title ?? id).join(", ")}`,
      );
  }
}

export function projectTasks(
  tasks: Task[],
  edges: Dependency[],
  catalogue: Catalogue,
  referenceTime: string,
) {
  const today = referenceTime.slice(0, 10),
    warning = new Date(`${today}T00:00:00Z`);
  warning.setUTCDate(warning.getUTCDate() + 7);
  const warningDate = warning.toISOString().slice(0, 10);
  const projected = tasks.map((task) => {
    const blockedBy = unmetPredecessors(task.id, tasks, edges),
      overdue = isOpen(task) && !!task.endDate && task.endDate < today,
      dueSoon =
        isOpen(task) && !!task.endDate && task.endDate >= today && task.endDate <= warningDate;
    return { ...task, blockedBy, overdue, dueSoon };
  });
  const groupIds = [...new Set(projected.map((task) => task.groupId))];
  const categories = groupIds.map((groupId) => {
    const members = projected.filter((task) => task.groupId === groupId);
    const counts = {
      open: members.filter((task) => task.status === "OPEN").length,
      inProgress: members.filter((task) => task.status === "IN_PROGRESS").length,
      done: members.filter((task) => task.status === "DONE").length,
    };
    const next =
      members
        .filter((task) => task.status !== "DONE" && !task.blockedBy.length)
        .sort((a, b) => (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999"))[0] ?? null;
    const health = members.some((task) => task.overdue || task.blockedBy.length)
      ? "critical"
      : members.some((task) => task.dueSoon)
        ? "warning"
        : members.every((task) => task.status === "DONE") && members.length
          ? "done"
          : members.some((task) => task.status === "IN_PROGRESS")
            ? "active"
            : "neutral";
    return {
      groupId,
      count: members.length,
      counts,
      nextTaskId: next?.id ?? null,
      nextEndDate: next?.endDate ?? null,
      health,
    };
  });
  const flows = groupIds.map((groupId) => {
    const remaining = new Set(
        projected.filter((task) => task.groupId === groupId).map((task) => task.id),
      ),
      stages: string[][] = [];
    while (remaining.size) {
      const stage = [...remaining]
        .filter(
          (id) =>
            !edges.some((edge) => edge.successorId === id && remaining.has(edge.predecessorId)),
        )
        .sort();
      if (!stage.length) throw new Error("Ungültiger zyklischer Aufgabenablauf.");
      stages.push(stage);
      stage.forEach((id) => remaining.delete(id));
    }
    return stages;
  });
  return { referenceTime, tasks: projected, edges, categories, flows };
}
