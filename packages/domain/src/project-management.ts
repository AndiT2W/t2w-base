export type TaskStatus = "NEW" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type Task = {
  references?: { kind: "contact" | "message" | "hardware" | "payout" | "file"; id: string }[];
  id: string;
  eventId: string;
  title: string;
  status: TaskStatus;
  priority: "NORMAL" | "HIGH";
  ownerId: string | null;
  groupId: string | null;
  nextStep: string;
  result: string;
  reason: string;
  dueType: "NONE" | "DATE" | "INSTANT";
  dueDate: string | null;
  dueAt: string | null;
  version: number;
};
export type Dependency = { predecessorId: string; successorId: string };
export type Catalogue = {
  owners: { id: string; active: boolean }[];
  groups: { id: string; active: boolean }[];
};
export const isOpen = (task: Task) => task.status === "NEW" || task.status === "IN_PROGRESS";

/** Exact deadline boundary, including midnight after a calendar date in an IANA zone. */
export function deadlineInstant(
  task: Pick<Task, "dueType" | "dueAt" | "dueDate">,
  timeZone: string,
): number | null {
  if (task.dueType === "NONE") return null;
  if (task.dueType === "INSTANT") return task.dueAt ? Date.parse(task.dueAt) : null;
  if (!task.dueDate) return null;
  const target = new Date(`${task.dueDate}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() + 1);
  const targetDate = target.toISOString().slice(0, 10);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localDate = (time: number) => {
    const parts = formatter.formatToParts(new Date(time));
    return ["year", "month", "day"]
      .map((type) => parts.find((p) => p.type === type)!.value)
      .join("-");
  };
  let low = target.getTime() - 36 * 3600000,
    high = target.getTime() + 36 * 3600000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (localDate(middle) >= targetDate) high = middle;
    else low = middle;
  }
  return high;
}
const active = (items: { id: string; active: boolean }[], id: string | null) =>
  items.some((i) => i.id === id && i.active);

export function unmetPredecessors(taskId: string, tasks: Task[], edges: Dependency[]): string[] {
  const visited = new Set<string>();
  const unmet = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    for (const edge of edges.filter((e) => e.successorId === id)) {
      const predecessor = tasks.find((t) => t.id === edge.predecessorId);
      if (!predecessor || predecessor.status !== "DONE") unmet.add(edge.predecessorId);
      visit(edge.predecessorId);
    }
  };
  visit(taskId);
  return [...unmet];
}

export function validateDependency(tasks: Task[], edges: Dependency[], edge: Dependency) {
  const predecessor = tasks.find((t) => t.id === edge.predecessorId);
  const successor = tasks.find((t) => t.id === edge.successorId);
  if (!predecessor || !successor || predecessor.eventId !== successor.eventId)
    throw new Error("Aufgaben müssen zum selben Event gehören.");
  if (predecessor.id === successor.id) throw new Error("Selbstbezug ist nicht zulässig.");
  if (
    edges.some((e) => e.predecessorId === edge.predecessorId && e.successorId === edge.successorId)
  )
    throw new Error("Abhängigkeit besteht bereits.");
  const visited = new Set<string>();
  const pending = [successor.id];
  while (pending.length) {
    const id = pending.pop()!;
    if (id === predecessor.id) throw new Error("Zyklische Abhängigkeit ist nicht zulässig.");
    if (visited.has(id)) continue;
    visited.add(id);
    pending.push(...edges.filter((e) => e.predecessorId === id).map((e) => e.successorId));
  }
  if (
    ["IN_PROGRESS", "DONE"].includes(successor.status) &&
    (predecessor.status !== "DONE" || unmetPredecessors(predecessor.id, tasks, edges).length)
  )
    throw new Error("Begonnene Aufgaben dürfen keine neue unerfüllte Voraussetzung erhalten.");
}

export function validateTaskChange(
  before: Task | null,
  after: Task,
  tasks: Task[],
  edges: Dependency[],
  catalogue: Catalogue,
) {
  if (!after.title.trim()) throw new Error("Titel ist erforderlich.");
  if (
    after.dueType === "DATE" &&
    (!after.dueDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(after.dueDate) ||
      new Date(after.dueDate).toISOString().slice(0, 10) !== after.dueDate)
  )
    throw new Error("Gültige Tagesfrist erforderlich.");
  if (after.dueType === "INSTANT" && (!after.dueAt || !Number.isFinite(Date.parse(after.dueAt))))
    throw new Error("Gültiger Zeitpunkt erforderlich.");
  if ((after.dueType !== "DATE" && after.dueDate) || (after.dueType !== "INSTANT" && after.dueAt))
    throw new Error("Fristfelder passen nicht zum Fristtyp.");
  const transitions: Record<TaskStatus, TaskStatus[]> = {
    NEW: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["DONE", "CANCELLED"],
    DONE: ["NEW", "IN_PROGRESS"],
    CANCELLED: ["NEW", "IN_PROGRESS"],
  };
  if (!before && after.status !== "NEW") throw new Error("Neue Aufgaben beginnen im Status Neu.");
  if (
    before &&
    before.status !== after.status &&
    !transitions[before.status].includes(after.status)
  )
    throw new Error("Statusübergang ist nicht zulässig.");
  const needsReason =
    before &&
    (before.dueType !== after.dueType ||
      before.dueDate !== after.dueDate ||
      before.dueAt !== after.dueAt ||
      (before.status !== after.status && (!isOpen(before) || after.status === "CANCELLED")));
  if (needsReason && !after.reason.trim()) throw new Error("Begründung ist erforderlich.");
  const cancelling = before?.status !== after.status && after.status === "CANCELLED";
  if (!cancelling) {
    if (
      (after.ownerId && !active(catalogue.owners, after.ownerId)) ||
      (after.groupId && !active(catalogue.groups, after.groupId))
    )
      throw new Error("Zuweisung prüfen: Owner oder Kategorie ist inaktiv.");
    if (
      ["IN_PROGRESS", "DONE"].includes(after.status) &&
      (!active(catalogue.owners, after.ownerId) ||
        !active(catalogue.groups, after.groupId) ||
        !after.nextStep.trim())
    )
      throw new Error("Aktiver Owner, Kategorie und nächster Schritt sind erforderlich.");
  }
  if (after.status === "DONE" && !after.result.trim())
    throw new Error("Abschlussergebnis ist erforderlich.");
  if (before?.status !== after.status && ["IN_PROGRESS", "DONE"].includes(after.status)) {
    const unmet = unmetPredecessors(after.id, tasks, edges);
    if (unmet.length)
      throw new Error(
        `Voraussetzung offen: ${unmet.map((id) => tasks.find((t) => t.id === id)?.title ?? id).join(", ")}`,
      );
  }
}

export function projectTasks(
  tasks: Task[],
  edges: Dependency[],
  catalogue: Catalogue,
  timeZone: string,
  referenceTime: string,
) {
  const now = new Date(referenceTime);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)?.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const projected = tasks.map((task) => {
    const blockedBy = unmetPredecessors(task.id, tasks, edges);
    const overdue =
      isOpen(task) &&
      ((task.dueType === "DATE" && !!task.dueDate && today > task.dueDate) ||
        (task.dueType === "INSTANT" && !!task.dueAt && now.getTime() >= Date.parse(task.dueAt)));
    const reasons: string[] = [];
    if (overdue) reasons.push("Überfällig");
    if (isOpen(task)) {
      if (!active(catalogue.owners, task.ownerId) || !active(catalogue.groups, task.groupId))
        reasons.push("Zuweisung prüfen");
      if (!task.nextStep.trim()) reasons.push("Nächster Schritt fehlt");
      if (blockedBy.some((id) => tasks.find((t) => t.id === id)?.status === "CANCELLED"))
        reasons.push("Vorgänger storniert");
    }
    if (["IN_PROGRESS", "DONE"].includes(task.status) && blockedBy.length)
      reasons.push("Voraussetzung erneut prüfen");
    for (const edge of edges.filter((e) => e.successorId === task.id)) {
      const predecessor = tasks.find((t) => t.id === edge.predecessorId);
      const deadline = deadlineInstant(task, timeZone);
      const predecessorDeadline = predecessor ? deadlineInstant(predecessor, timeZone) : null;
      if (
        predecessor &&
        isOpen(task) &&
        isOpen(predecessor) &&
        deadline !== null &&
        predecessorDeadline !== null &&
        predecessorDeadline > deadline
      )
        reasons.push(`Terminwiderspruch: ${predecessor.title}`);
    }
    return { ...task, blockedBy, overdue: Boolean(overdue), reasons };
  });
  const groupIds = [
    ...new Set([...catalogue.groups.map((g) => g.id), ...tasks.map((t) => t.groupId)]),
  ];
  const categories = groupIds.map((groupId) => {
    const members = projected.filter((t) => t.groupId === groupId);
    const reasons = members.flatMap((t) => t.reasons.map((message) => ({ taskId: t.id, message })));
    const summary = !members.length
      ? "Keine Aufgaben erfasst"
      : reasons.length
        ? "Handlungsbedarf"
        : members.every((t) => t.status === "CANCELLED")
          ? "Alle erfassten Aufgaben storniert"
          : members.every((t) => t.status === "DONE")
            ? "Alle erfassten Aufgaben erledigt"
            : "Alles im Plan";
    return { groupId, count: members.length, reasons, summary };
  });
  const seen = new Set<string>();
  const flows: string[][] = [];
  for (const task of tasks) {
    if (
      seen.has(task.id) ||
      !edges.some((e) => e.predecessorId === task.id || e.successorId === task.id)
    )
      continue;
    const component: string[] = [],
      queue = [task.id];
    while (queue.length) {
      const id = queue.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      component.push(id);
      queue.push(
        ...edges
          .filter((e) => e.predecessorId === id || e.successorId === id)
          .map((e) => (e.predecessorId === id ? e.successorId : e.predecessorId)),
      );
    }
    const ordered: string[] = [];
    const remaining = new Set(component);
    while (remaining.size) {
      const ready = [...remaining]
        .filter((id) => !edges.some((e) => e.successorId === id && remaining.has(e.predecessorId)))
        .sort();
      if (!ready.length) throw new Error("Ungültiger zyklischer Aufgabenablauf.");
      for (const id of ready) {
        ordered.push(id);
        remaining.delete(id);
      }
    }
    flows.push(ordered);
  }
  const candidates = new Map<string, { task: (typeof projected)[number]; urgent: boolean }>();
  for (const task of projected.filter(isOpen)) {
    const targets = task.blockedBy.length
      ? task.blockedBy
          .map((id) => projected.find((t) => t.id === id))
          .filter((t) => t && !t.blockedBy.length)
      : [task];
    for (const target of targets)
      if (target)
        candidates.set(target.id, {
          task: target,
          urgent: !!(
            task.reasons.length ||
            target.reasons.length ||
            candidates.get(target.id)?.urgent
          ),
        });
  }
  const next = [...candidates.values()]
    .sort(
      (a, b) =>
        Number(b.urgent) - Number(a.urgent) ||
        Number(b.task.priority === "HIGH") - Number(a.task.priority === "HIGH") ||
        (a.task.dueDate ?? a.task.dueAt ?? "9999").localeCompare(
          b.task.dueDate ?? b.task.dueAt ?? "9999",
        ) ||
        a.task.id.localeCompare(b.task.id),
    )
    .slice(0, 3)
    .map((t) => t.task.id);
  return { referenceTime, tasks: projected, edges, categories, flows, next };
}
