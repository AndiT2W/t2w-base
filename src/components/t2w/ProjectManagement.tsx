import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskDetailSheet } from "@/components/t2w/TaskDetailSheet";
import { TaskSummary } from "@/components/t2w/TaskSummary";
import {
  CategoryRow,
  TaskFlowChain,
  TaskTable,
  categoryTasks,
  singleTasks,
} from "@/components/t2w/TaskCategory";
import {
  createEventTaskInteractionAdapter,
  pmRead,
  type PmState,
} from "@/lib/t2w/project-management";
import { createTaskInteractionWorkspace } from "@/lib/t2w/task-interaction-workspace";

export function ProjectManagement({
  eventId,
  eventStart,
}: {
  eventId: string;
  eventStart?: string;
}) {
  const [state, setState] = useState<PmState>();
  const [open, setOpen] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [loadError, setLoadError] = useState("");
  const stateRef = useRef<PmState | undefined>(undefined);
  const interaction = useMemo(
    () =>
      createTaskInteractionWorkspace(
        createEventTaskInteractionAdapter({
          current: () => stateRef.current,
          update: (next) => {
            stateRef.current = next;
            setState(next);
          },
        }),
      ),
    [],
  );
  const interactionSnapshot = useSyncExternalStore(
    interaction.subscribe,
    interaction.snapshot,
    interaction.snapshot,
  );
  const { busy } = interactionSnapshot;
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
  const categoryName = (id: string | null) =>
    state?.groups.find((group) => group.id === id)?.name ?? "Ohne Kategorie";
  const ownerName = (id: string | null) =>
    state?.owners.find((owner) => owner.id === id)?.displayName ?? "nicht zugeordnet";
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
              if (await interaction.create({ title }, false)) setTitle("");
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
          <TaskSummary tasks={state.tasks} {...(eventStart ? { eventStart } : {})} />
          <div className="overflow-hidden rounded-lg border bg-card">
            {state.categories.map((category) => {
              const key = category.groupId ?? "none";
              const members = categoryTasks(state.tasks, category.groupId);
              const expanded = open === key;
              const name = categoryName(category.groupId);
              return (
                <div key={key} className="border-b last:border-0">
                  <CategoryRow
                    category={{ ...category, name }}
                    tasks={members}
                    expanded={expanded}
                    onToggle={() => setOpen(expanded ? null : key)}
                    ownerName={ownerName}
                    taskById={taskById}
                  />
                  {expanded && (
                    <div className="space-y-3 border-t bg-muted/20 px-4 py-3 sm:pl-11">
                      <TaskFlowChain
                        flows={category.flows}
                        groupId={category.groupId}
                        taskById={taskById}
                        edges={state.edges}
                        groupName={categoryName}
                        onOpen={(task) => void interaction.open(task)}
                      />
                      <TaskTable
                        tasks={singleTasks(category.flows, taskById)}
                        ownerName={ownerName}
                        onOpen={(task) => void interaction.open(task)}
                        categoryName={name}
                      />
                      {!members.length && (
                        <p className="text-sm text-muted-foreground">
                          Keine Aufgaben in dieser Kategorie.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      <TaskDetailSheet
        workspace={interaction}
        planning={{
          owners: state?.owners ?? [],
          groups: state?.groups ?? [],
          tasks: state?.tasks ?? [],
          edges: state?.edges ?? [],
        }}
        variant="event"
      />
    </section>
  );
}
