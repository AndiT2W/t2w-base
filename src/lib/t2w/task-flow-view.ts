import type { Dependency, TaskFlow } from "@t2w/domain/project-management";

/**
 * Aufteilung der Abläufe einer Kategorie in das, was die Ansicht verschieden
 * darstellt: Ketten mit Pfeilen und Aufgaben ohne Vorgänger als Tabelle.
 * Ein Ablauf aus genau einer Aufgabe ist fachlich ein eigener Ablauf, als Bild
 * wäre er aber eine Kette ohne Pfeil — deshalb steht er in der Tabelle.
 */
export function splitFlows(flows: readonly TaskFlow[]): {
  chains: TaskFlow[];
  singles: string[];
} {
  const chains: TaskFlow[] = [];
  const singles: string[] = [];

  for (const flow of flows) {
    const ids = flow.flat();
    if (ids.length > 1) chains.push(flow);
    else singles.push(...ids);
  }

  return { chains, singles };
}

export type FlowStageView = {
  /** Sichtbare Aufgaben dieser Stufe, höchstens `maxPerStage`. */
  taskIds: string[];
  /** Wie viele Aufgaben der Stufe gezählt statt gezeigt werden. */
  hiddenCount: number;
};

export type ChainView = {
  /** Erledigte Stufen am Anfang, zu einer Karte zusammengefasst. */
  collapsedDoneCount: number;
  stages: FlowStageView[];
  /** Gesamtzahl der Schritte, für „Schritt 3 von 9“. */
  stageCount: number;
};

/**
 * Bereitet eine Kette für die Anzeige auf. Zwei Regeln greifen:
 * erledigte Stufen am Anfang werden zu einer Karte, damit die Kette dort
 * beginnt, wo gearbeitet wird; und eine Stufe zeigt höchstens `maxPerStage`
 * Aufgaben und zählt den Rest. Die Kette bricht nie um — sie würde sonst
 * rückwärts gelesen.
 */
export function chainView(
  flow: TaskFlow,
  isDone: (taskId: string) => boolean,
  maxPerStage = 3,
): ChainView {
  let collapsedDoneCount = 0;
  let index = 0;

  while (index < flow.length) {
    const stage = flow[index];
    if (!stage?.length || !stage.every(isDone)) break;
    collapsedDoneCount += stage.length;
    index += 1;
  }

  // Eine vollständig erledigte Kette behält ihre letzte Stufe sichtbar,
  // sonst stünde dort nur noch eine Zählkarte ohne Zusammenhang.
  if (index === flow.length && index > 0) {
    const last = flow[index - 1] ?? [];
    collapsedDoneCount -= last.length;
    index -= 1;
  }

  const stages = flow.slice(index).map((stage) => ({
    taskIds: stage.slice(0, maxPerStage),
    hiddenCount: Math.max(0, stage.length - maxPerStage),
  }));

  return { collapsedDoneCount, stages, stageCount: flow.length };
}

/**
 * Vorgänger einer Aufgabe, die in einer anderen Kategorie liegen. Sie stehen in
 * der Kette als blasse Karte mit Herkunft, damit eine Blockade über
 * Kategoriegrenzen sichtbar wird, ohne die Ansicht zu wechseln.
 */
export function foreignPredecessorIds(
  taskIds: readonly string[],
  edges: readonly Dependency[],
  groupIdOf: (taskId: string) => string | null | undefined,
  groupId: string | null,
): string[] {
  const inCategory = new Set(taskIds);
  const found: string[] = [];

  for (const edge of edges) {
    if (!inCategory.has(edge.successorId)) continue;
    if (inCategory.has(edge.predecessorId)) continue;
    if ((groupIdOf(edge.predecessorId) ?? null) === groupId) continue;
    if (!found.includes(edge.predecessorId)) found.push(edge.predecessorId);
  }

  return found;
}

/**
 * Nachfolger einer Aufgabe — die Gegenrichtung zu `unmetPredecessors`. Das
 * Sheet zeigt damit „Blockiert danach“, was heute nirgends steht, obwohl die
 * Kanten es hergeben.
 */
export function successorIds(taskId: string, edges: readonly Dependency[]): string[] {
  return edges.filter((edge) => edge.predecessorId === taskId).map((edge) => edge.successorId);
}
