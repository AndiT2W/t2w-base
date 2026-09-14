import type { TaskFlow } from "@/lib/t2w/task-flow-display";

type FlowTask = { id: string; title: string };

export function TaskFlowBadges<T extends FlowTask>({
  flows,
  taskById,
  badgeClassName = () => "rounded-full border px-2 py-1 text-xs",
}: {
  flows: readonly TaskFlow[];
  taskById: ReadonlyMap<string, T>;
  badgeClassName?: (task: T) => string;
}) {
  const dependentFlows = flows.filter((flow) => flow.flat().length > 1);
  const independentTaskIds = flows
    .filter((flow) => flow.flat().length === 1)
    .flatMap((flow) => flow.flat());
  const badge = (id: string) => {
    const task = taskById.get(id);
    return task ? (
      <span key={id} className={badgeClassName(task)}>
        {task.title}
      </span>
    ) : null;
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3" role="group" aria-label="Ablauf">
      {dependentFlows.map((flow) => (
        <div
          key={flow.flat().join("-")}
          className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border p-1"
          role="group"
          aria-label="Abhängiger Ablauf"
        >
          {flow.flatMap((stage, stageIndex) => [
            stageIndex ? (
              <span
                key={`arrow-${stageIndex}`}
                aria-hidden="true"
                className="text-muted-foreground"
              >
                →
              </span>
            ) : null,
            <span key={`stage-${stage.join("-")}`} className="flex flex-wrap gap-2">
              {stage.map(badge)}
            </span>,
          ])}
        </div>
      ))}
      {independentTaskIds.length ? (
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Weitere Aufgaben"
        >
          {dependentFlows.length ? (
            <span className="text-xs text-muted-foreground">Weitere Aufgaben</span>
          ) : null}
          {independentTaskIds.map(badge)}
        </div>
      ) : null}
    </div>
  );
}
