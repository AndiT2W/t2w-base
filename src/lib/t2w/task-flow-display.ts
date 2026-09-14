export type TaskFlow = string[][];

type FlowTask = { id: string };
type FlowEdge = { predecessorId: string; successorId: string };

function stagesFor(taskIds: ReadonlySet<string>, edges: readonly FlowEdge[]): TaskFlow {
  const remaining = new Set(taskIds),
    stages: string[][] = [];
  while (remaining.size) {
    const stage = [...remaining]
      .filter(
        (id) => !edges.some((edge) => edge.successorId === id && remaining.has(edge.predecessorId)),
      )
      .sort();
    if (!stage.length) throw new Error("Ungültiger zyklischer Aufgabenablauf.");
    stages.push(stage);
    stage.forEach((id) => remaining.delete(id));
  }
  return stages;
}

/** Keeps unrelated tasks out of a dependency flow while preserving parallel stages. */
export function categoryTaskFlows(
  tasks: readonly FlowTask[],
  edges: readonly FlowEdge[],
): TaskFlow[] {
  const taskIds = new Set(tasks.map((task) => task.id));
  const categoryEdges = edges.filter(
    (edge) => taskIds.has(edge.predecessorId) && taskIds.has(edge.successorId),
  );
  const neighbours = new Map<string, Set<string>>(
    [...taskIds].map((id) => [id, new Set<string>()]),
  );
  categoryEdges.forEach((edge) => {
    neighbours.get(edge.predecessorId)?.add(edge.successorId);
    neighbours.get(edge.successorId)?.add(edge.predecessorId);
  });

  const visited = new Set<string>(),
    flows: TaskFlow[] = [];
  for (const start of [...taskIds].sort()) {
    if (visited.has(start)) continue;
    const component = new Set<string>(),
      pending = [start];
    while (pending.length) {
      const id = pending.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      component.add(id);
      pending.push(...(neighbours.get(id) ?? []));
    }
    flows.push(
      stagesFor(
        component,
        categoryEdges.filter(
          (edge) => component.has(edge.predecessorId) && component.has(edge.successorId),
        ),
      ),
    );
  }

  return flows.sort((left, right) => {
    const byConnectedTaskCount = right.flat().length - left.flat().length;
    if (byConnectedTaskCount) return byConnectedTaskCount;
    return left.flat().join("\u0000").localeCompare(right.flat().join("\u0000"));
  });
}
