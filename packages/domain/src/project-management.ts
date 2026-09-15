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
export type TaskFlow = string[][];
export type Catalogue = {
  owners: { id: string; active: boolean }[];
  groups: { id: string; active: boolean }[];
};
export const isOpen = (task: Pick<Task, "status">) => task.status !== "DONE";
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

export type TaskReadiness = {
  openCount: number;
  overdueCount: number;
};

export function projectTaskReadiness(
  tasks: Pick<Task, "status" | "endDate">[],
  referenceTime: string,
): TaskReadiness {
  const today = referenceTime.slice(0, 10);
  return {
    openCount: tasks.filter(isOpen).length,
    overdueCount: tasks.filter((task) => isOpen(task) && !!task.endDate && task.endDate < today)
      .length,
  };
}

/**
 * Derives connected Task flows for one category. Independent Tasks stay in
 * their own flow; dependent Tasks retain their parallel stages.
 */
export function projectTaskFlows(
  tasks: readonly Pick<Task, "id">[],
  edges: readonly Dependency[],
): TaskFlow[] {
  const taskIds = new Set(tasks.map((task) => task.id));
  const categoryEdges = edges.filter(
    (edge) => taskIds.has(edge.predecessorId) && taskIds.has(edge.successorId),
  );
  const neighbours = new Map<string, Set<string>>(
    [...taskIds].map((id) => [id, new Set<string>()]),
  );
  for (const edge of categoryEdges) {
    neighbours.get(edge.predecessorId)?.add(edge.successorId);
    neighbours.get(edge.successorId)?.add(edge.predecessorId);
  }

  const visited = new Set<string>(),
    flows: TaskFlow[] = [];
  for (const start of [...taskIds].sort()) {
    if (visited.has(start)) continue;
    const connected = new Set<string>(),
      pending = [start];
    while (pending.length) {
      const id = pending.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      connected.add(id);
      pending.push(...(neighbours.get(id) ?? []));
    }

    const remaining = new Set(connected),
      stages: string[][] = [];
    while (remaining.size) {
      const stage = [...remaining]
        .filter(
          (id) =>
            !categoryEdges.some(
              (edge) => edge.successorId === id && remaining.has(edge.predecessorId),
            ),
        )
        .sort();
      if (!stage.length) throw new Error("Ungültiger zyklischer Aufgabenablauf.");
      stages.push(stage);
      stage.forEach((id) => remaining.delete(id));
    }
    flows.push(stages);
  }

  return flows.sort((left, right) => {
    const byTaskCount = right.flat().length - left.flat().length;
    return byTaskCount || left.flat().join("\u0000").localeCompare(right.flat().join("\u0000"));
  });
}

export function projectTaskPortfolio(
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
      flows: projectTaskFlows(members, edges),
    };
  });
  const flows = categories.flatMap((category) => category.flows);
  return { referenceTime, tasks: projected, edges, categories, flows };
}

export type TaskPortfolioScope = {
  scope: TaskScope;
  eventId: string | null;
  portfolio: ReturnType<typeof projectTaskPortfolio>;
};

export function projectTaskPortfolios(
  tasks: Task[],
  edges: Dependency[],
  catalogue: Catalogue,
  referenceTime: string,
): TaskPortfolioScope[] {
  const scopes = new Map<string, { scope: TaskScope; eventId: string | null; tasks: Task[] }>();
  for (const task of tasks) {
    const key = `${task.scope}:${task.eventId ?? "global"}`;
    const current = scopes.get(key) ?? { scope: task.scope, eventId: task.eventId, tasks: [] };
    current.tasks.push(task);
    scopes.set(key, current);
  }
  return [...scopes.values()].map(({ scope, eventId, tasks: scopedTasks }) => {
    const ids = new Set(scopedTasks.map((task) => task.id));
    return {
      scope,
      eventId,
      portfolio: projectTaskPortfolio(
        scopedTasks,
        edges.filter((edge) => ids.has(edge.predecessorId) && ids.has(edge.successorId)),
        catalogue,
        referenceTime,
      ),
    };
  });
}
