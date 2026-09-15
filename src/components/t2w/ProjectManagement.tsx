import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Task } from "@t2w/domain/project-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/t2w/DataTable";
import { TaskDetailSheet } from "@/components/t2w/TaskDetailSheet";
import { TaskFlowBadges } from "@/components/t2w/TaskFlowBadges";
import { formatDatum } from "@/lib/t2w/format";
import {
  pmCommand,
  pmRead,
  priorityLabel,
  statusLabel,
  type PmCommand,
  type PmState,
} from "@/lib/t2w/project-management";
import {
  createTaskInteractionWorkspace,
  createHttpTaskInteractionAdapter,
} from "@/lib/t2w/task-interaction-workspace";

const healthLabel: Record<string, string> = {
  critical: "Blockiert oder überfällig",
  warning: "In den nächsten 7 Tagen fällig",
  active: "In Arbeit",
  done: "Erledigt",
  neutral: "Offen",
};
const healthClass: Record<string, string> = {
  critical: "bg-destructive",
  warning: "bg-amber-500",
  active: "bg-blue-600",
  done: "bg-emerald-600",
  neutral: "bg-muted-foreground",
};
export function ProjectManagement({ eventId }: { eventId: string }) {
  const [state, setState] = useState<PmState>();
  const [open, setOpen] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [loadError, setLoadError] = useState("");
  const stateRef = useRef<PmState | undefined>(undefined);
  const interaction = useMemo(
    () =>
      createTaskInteractionWorkspace(
        createHttpTaskInteractionAdapter<PmState>(async (command) => {
          const current = stateRef.current;
          if (!current) throw new Error("Aufgaben sind noch nicht geladen.");
          const next = await pmCommand(current, command);
          stateRef.current = next;
          const task = command.taskId
            ? command.type === "delete"
              ? null
              : (next.tasks.find((candidate) => candidate.id === command.taskId) ?? null)
            : (next.tasks.find((candidate) => candidate.title === command.task?.title) ?? null);
          return { state: next, task };
        }),
      ),
    [],
  );
  const [interactionSnapshot, setInteractionSnapshot] = useState(() => interaction.snapshot());
  useEffect(
    () => interaction.subscribe(() => setInteractionSnapshot(interaction.snapshot())),
    [interaction],
  );
  const draft = interactionSnapshot.task ? (interactionSnapshot.draft as Task) : null;
  const { activities, busy, comments } = interactionSnapshot;
  const error = loadError || interactionSnapshot.error || "";
  const load = useCallback(async () => {
    try {
      const next = await pmRead(eventId);
      stateRef.current = next;
      setState(next);
      setLoadError("");
    } catch (value) {
      setLoadError(value instanceof Error ? value.message : "Laden fehlgeschlagen");
    }
  }, [eventId]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    interaction.close();
  }, [eventId, interaction]);
  const taskById = useMemo(() => new Map(state?.tasks.map((task) => [task.id, task])), [state]);
  async function mutate(command: PmCommand) {
    const next = await interaction.command(command);
    if (!next) return false;
    setState(next);
    return true;
  }
  const categoryName = (id: string | null) =>
    state?.groups.find((group) => group.id === id)?.name ?? "Ohne Kategorie";
  return (
    <section aria-label="Projektmanagement" className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Aufgaben</h2>
          <p className="text-sm text-muted-foreground">
            Kategorien, nächste Schritte und Voraussetzungen
          </p>
        </div>
        <a className="min-h-11 py-2 underline" href="/aufgaben">
          Gesamtübersicht öffnen
        </a>
      </header>
      {error && (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {error}
        </p>
      )}
      {!state ? (
        <p role="status">Aufgaben werden geladen …</p>
      ) : (
        <>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await mutate({ type: "create", task: { title } })) setTitle("");
            }}
          >
            <div className="min-w-48 flex-1">
              <Label htmlFor="pm-new-title">Neue Aufgabe</Label>
              <Input
                id="pm-new-title"
                required
                value={title}
                disabled={busy || state.event.archived}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <Button disabled={busy || state.event.archived}>Aufgabe anlegen</Button>
          </form>
          <div className="space-y-3">
            {state.categories.map((category) => {
              const members = state.tasks.filter((task) => task.groupId === category.groupId);
              const flows = category.flows;
              const expanded = open === (category.groupId ?? "none");
              const next = category.nextTaskId ? taskById.get(category.nextTaskId) : null;
              return (
                <article key={category.groupId ?? "none"} className="rounded-lg border">
                  <button
                    className="w-full cursor-pointer p-4 text-left"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : (category.groupId ?? "none"))}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full ${healthClass[category.health]}`}
                          aria-hidden="true"
                        />
                        <span className="font-semibold">{categoryName(category.groupId)}</span>
                        <span className="text-sm text-muted-foreground">
                          {healthLabel[category.health]}
                        </span>
                      </div>
                      <span className="text-sm">
                        {category.counts.open} offen · {category.counts.inProgress} in Arbeit ·{" "}
                        {category.counts.done} erledigt
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nächster Schritt: {next?.title ?? "—"}
                      {category.nextEndDate ? ` · Ende ${category.nextEndDate}` : ""}
                    </p>
                    <TaskFlowBadges
                      flows={flows}
                      taskById={taskById}
                      badgeClassName={(task) =>
                        `rounded-full border px-2 py-1 text-xs ${task.status === "DONE" ? "border-emerald-700 bg-emerald-50 text-emerald-800" : task.blockedBy.length ? "border-muted bg-muted text-muted-foreground" : task.status === "IN_PROGRESS" ? "border-blue-700 bg-blue-50 text-blue-800" : "border-border bg-background"}`
                      }
                    />
                  </button>
                  {expanded && (
                    <div className="border-t">
                      <div className="hidden overflow-x-auto md:block">
                        <DataTable>
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="p-3">Name</th>
                              <th className="p-3">Person</th>
                              <th className="p-3">Ende</th>
                              <th className="p-3">Priorität</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {members.map((task) => (
                              <tr key={task.id} className="border-b last:border-0">
                                <td className="p-3">
                                  <button
                                    className="min-h-11 text-left font-medium underline"
                                    onClick={() => void interaction.open(task)}
                                  >
                                    {task.title}
                                  </button>
                                  {task.blockedBy.length > 0 && (
                                    <p className="text-xs text-destructive">
                                      Blockiert durch{" "}
                                      {task.blockedBy
                                        .map((id) => taskById.get(id)?.title)
                                        .join(", ")}
                                    </p>
                                  )}
                                </td>
                                <td className="p-3">
                                  {state.owners.find((owner) => owner.id === task.ownerId)
                                    ?.displayName ?? "—"}
                                </td>
                                <td className="p-3">
                                  {task.endDate ? formatDatum(task.endDate) : "—"}
                                </td>
                                <td className="p-3">{priorityLabel[task.priority]}</td>
                                <td className="p-3">{statusLabel[task.status]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </DataTable>
                      </div>
                      <div className="space-y-2 p-3 md:hidden">
                        {members.map((task) => (
                          <button
                            key={task.id}
                            className="w-full rounded-md border p-3 text-left"
                            onClick={() => void interaction.open(task)}
                          >
                            <strong>{task.title}</strong>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {statusLabel[task.status]} ·{" "}
                              {task.endDate ? formatDatum(task.endDate) : "Ohne Ende"} ·{" "}
                              {priorityLabel[task.priority]}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
      <TaskDetailSheet
        task={interactionSnapshot.task}
        draft={draft ?? {}}
        owners={state?.owners ?? []}
        groups={state?.groups ?? []}
        tasks={state?.tasks ?? []}
        edges={state?.edges ?? []}
        comments={comments}
        activities={activities}
        busy={busy}
        title="Aufgabe"
        description="Details, Voraussetzungen, Kommentare und Verlauf"
        onClose={() => interaction.close()}
        onDraftChange={(patch) => interaction.updateDraft(patch)}
        onSubmit={() => {
          if (!draft) return;
          return mutate({
            type: "update",
            taskId: draft.id,
            taskVersion: draft.version,
            task: draft,
          });
        }}
        onAddDependency={(predecessorId) => {
          if (!draft) return;
          return mutate({
            type: "add-dependency",
            taskId: draft.id,
            taskVersion: draft.version,
            predecessorId,
          });
        }}
        onRemoveDependency={(predecessorId) => {
          if (!draft) return;
          return mutate({
            type: "remove-dependency",
            taskId: draft.id,
            taskVersion: draft.version,
            predecessorId,
          });
        }}
        onWriteComment={(input) => interaction.writeComment(input)}
        onDelete={() => {
          if (!draft) return;
          return mutate({ type: "delete", taskId: draft.id, taskVersion: draft.version });
        }}
      />
    </section>
  );
}
