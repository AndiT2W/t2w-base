import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { TaskDetailSheet } from "@/components/t2w/TaskDetailSheet";
import { TaskSummary } from "@/components/t2w/TaskSummary";
import { TaskTimeline } from "@/components/t2w/TaskTimeline";
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
import { useT2W } from "@/lib/t2w/store";

export function ProjectManagement({
  eventId,
  eventStart,
}: {
  eventId: string;
  eventStart?: string;
}) {
  const { currentUser } = useT2W();
  const [state, setState] = useState<PmState>();
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"kategorien" | "zeitachse">("kategorien");
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
  const categoryDetails = (id: string | null) => {
    const group = state?.groups.find((item) => item.id === id);
    return group
      ? { name: group.name, icon: group.icon, color: group.color }
      : { name: "Ohne Kategorie", icon: null, color: null };
  };
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
        <div className="flex items-center gap-3">
          <a className="min-h-11 py-2 underline" href="/aufgaben">
            Gesamtübersicht öffnen
          </a>
          <Button
            type="button"
            disabled={!state || state.event.archived}
            onClick={() => {
              if (!state) return;
              void interaction.open({
                id: "",
                scope: "EVENT",
                eventId: state.event.id,
                title: "",
                description: "",
                status: "OPEN",
                priority: "NORMAL",
                ownerId: null,
                groupId: null,
                startDate: null,
                endDate: null,
                version: 0,
              });
            }}
          >
            Neue Aufgabe
          </Button>
        </div>
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
          <TaskSummary tasks={state.tasks} {...(eventStart ? { eventStart } : {})} />

          <div className="flex gap-1 self-start rounded-lg bg-muted p-1">
            {(["kategorien", "zeitachse"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`min-h-11 rounded-md px-3 text-sm transition-colors md:min-h-8 ${
                  view === value
                    ? "bg-background font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value === "kategorien" ? "Kategorien" : "Zeitachse"}
              </button>
            ))}
          </div>

          {view === "zeitachse" ? (
            <TaskTimeline
              categories={state.categories}
              tasks={state.tasks}
              {...(eventStart ? { eventStart } : {})}
              onOpen={(task) => void interaction.open(task)}
              categoryDetails={categoryDetails}
            />
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card">
              {state.categories.map((category) => {
                const key = category.groupId ?? "none";
                const members = categoryTasks(state.tasks, category.groupId);
                const expanded = open === key;
                const name = categoryName(category.groupId);
                const presentation = categoryDetails(category.groupId);
                const canCreate =
                  !state.event.archived &&
                  (category.groupId === null ||
                    state.groups.some((group) => group.id === category.groupId && group.active));
                return (
                  <div key={key} className="border-b last:border-0">
                    <CategoryRow
                      category={{ ...category, ...presentation }}
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
                          busy={busy}
                          {...(!canCreate
                            ? {}
                            : {
                                onAppend: async (predecessorId: string, title: string) => {
                                  const created = await interaction.create(
                                    { title, groupId: category.groupId, eventId: state.event.id },
                                    true,
                                  );
                                  if (created) await interaction.addDependency(predecessorId);
                                  interaction.close();
                                },
                              })}
                        />
                        <TaskTable
                          tasks={singleTasks(category.flows, taskById)}
                          ownerName={ownerName}
                          onOpen={(task) => void interaction.open(task)}
                          busy={busy}
                          categoryName={name}
                          {...(!canCreate
                            ? {}
                            : {
                                onCreate: (title: string) =>
                                  interaction.create(
                                    { title, groupId: category.groupId, eventId: state.event.id },
                                    false,
                                  ),
                              })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
        currentUserId={currentUser.id}
      />
    </section>
  );
}
