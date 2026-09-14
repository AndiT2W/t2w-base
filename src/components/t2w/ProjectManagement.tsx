import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Task } from "@t2w/domain/project-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TaskFlowBadges } from "@/components/t2w/TaskFlowBadges";
import {
  pmCommand,
  pmRead,
  priorityLabel,
  statusLabel,
  type PmCommand,
  type PmState,
} from "@/lib/t2w/project-management";
import { categoryTaskFlows } from "@/lib/t2w/task-flow-display";
import {
  createTaskInteractionWorkspace,
  createHttpTaskInteractionAdapter,
} from "@/lib/t2w/task-interaction-workspace";

const control = "min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
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
function links(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a key={index} href={part} target="_blank" rel="noreferrer" className="underline">
        {part}
      </a>
    ) : (
      part
    ),
  );
}
function empty(task: Task): Task {
  return {
    ...task,
    description: "",
    status: "OPEN",
    priority: "NORMAL",
    ownerId: null,
    groupId: null,
    startDate: null,
    endDate: null,
  };
}

export function ProjectManagement({ eventId }: { eventId: string }) {
  const [state, setState] = useState<PmState>();
  const [open, setOpen] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
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
              const flows = categoryTaskFlows(members, state.edges);
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
                        <table className="w-full text-left text-sm">
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
                                <td className="p-3">{task.endDate ?? "—"}</td>
                                <td className="p-3">{priorityLabel[task.priority]}</td>
                                <td className="p-3">{statusLabel[task.status]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                              {statusLabel[task.status]} · {task.endDate ?? "Ohne Ende"} ·{" "}
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
      <Sheet open={!!draft} onOpenChange={(shown) => !shown && !busy && interaction.close()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Aufgabe</SheetTitle>
            <SheetDescription>Details, Voraussetzungen, Kommentare und Verlauf</SheetDescription>
          </SheetHeader>
          {draft && (
            <div className="space-y-4 p-4">
              <form
                className="space-y-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  await mutate({
                    type: "update",
                    taskId: draft.id,
                    taskVersion: draft.version,
                    task: draft,
                  });
                }}
              >
                <Label htmlFor="pm-title">Titel</Label>
                <Input
                  id="pm-title"
                  required
                  value={draft.title}
                  onChange={(event) => interaction.updateDraft({ title: event.target.value })}
                />
                <Label htmlFor="pm-description">Beschreibung</Label>
                <textarea
                  id="pm-description"
                  className={control}
                  rows={5}
                  value={draft.description}
                  onChange={(event) => interaction.updateDraft({ description: event.target.value })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="pm-status">Status</Label>
                    <select
                      id="pm-status"
                      className={control}
                      value={draft.status}
                      onChange={(event) =>
                        interaction.updateDraft({ status: event.target.value as Task["status"] })
                      }
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="pm-priority">Priorität</Label>
                    <select
                      id="pm-priority"
                      className={control}
                      value={draft.priority}
                      onChange={(event) =>
                        interaction.updateDraft({
                          priority: event.target.value as Task["priority"],
                        })
                      }
                    >
                      {Object.entries(priorityLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="pm-owner">Verantwortlich</Label>
                    <select
                      id="pm-owner"
                      className={control}
                      value={draft.ownerId ?? ""}
                      onChange={(event) =>
                        interaction.updateDraft({ ownerId: event.target.value || null })
                      }
                    >
                      <option value="">Nicht zugeordnet</option>
                      {state?.owners
                        .filter((owner) => owner.active || owner.id === draft.ownerId)
                        .map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.displayName}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="pm-group">Kategorie</Label>
                    <select
                      id="pm-group"
                      className={control}
                      value={draft.groupId ?? ""}
                      onChange={(event) =>
                        interaction.updateDraft({ groupId: event.target.value || null })
                      }
                    >
                      <option value="">Ohne Kategorie</option>
                      {state?.groups
                        .filter((group) => group.active || group.id === draft.groupId)
                        .map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="pm-start">Start</Label>
                    <Input
                      id="pm-start"
                      type="date"
                      value={draft.startDate ?? ""}
                      onChange={(event) =>
                        interaction.updateDraft({ startDate: event.target.value || null })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pm-end">Ende</Label>
                    <Input
                      id="pm-end"
                      type="date"
                      value={draft.endDate ?? ""}
                      onChange={(event) =>
                        interaction.updateDraft({ endDate: event.target.value || null })
                      }
                    />
                  </div>
                </div>
                <Button disabled={busy}>Änderungen speichern</Button>
              </form>
              <section className="border-t pt-4">
                <h3 className="font-medium">Voraussetzungen</h3>
                {state?.edges
                  .filter((edge) => edge.successorId === draft.id)
                  .map((edge) => (
                    <div
                      key={edge.predecessorId}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <span>{taskById.get(edge.predecessorId)?.title}</span>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          void mutate({
                            type: "remove-dependency",
                            taskId: draft.id,
                            taskVersion: draft.version,
                            predecessorId: edge.predecessorId,
                          })
                        }
                      >
                        Entfernen
                      </Button>
                    </div>
                  ))}
                <Label htmlFor="pm-predecessor">Vorgänger hinzufügen</Label>
                <select
                  id="pm-predecessor"
                  className={control}
                  defaultValue=""
                  onChange={(event) => {
                    if (event.target.value)
                      void mutate({
                        type: "add-dependency",
                        taskId: draft.id,
                        taskVersion: draft.version,
                        predecessorId: event.target.value,
                      });
                    event.currentTarget.value = "";
                  }}
                >
                  <option value="">Aufgabe auswählen</option>
                  {state?.tasks
                    .filter(
                      (task) =>
                        task.id !== draft.id &&
                        !state.edges.some(
                          (edge) => edge.successorId === draft.id && edge.predecessorId === task.id,
                        ),
                    )
                    .map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                </select>
              </section>
              <section className="border-t pt-4">
                <h3 className="font-medium">Kommentare</h3>
                {comments.map((item) => (
                  <article key={item.id} className="border-b py-2">
                    <p className="whitespace-pre-wrap break-words">{links(item.text)}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.updatedAt).toLocaleString("de-AT")}
                        {item.updatedAt !== item.createdAt ? " · bearbeitet" : ""}
                      </p>
                      <span className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const text = window.prompt("Kommentar bearbeiten", item.text);
                            if (text === null) return;
                            await interaction.writeComment({ id: item.id, text });
                          }}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!window.confirm("Kommentar dauerhaft löschen?")) return;
                            await interaction.writeComment({
                              id: item.id,
                              delete: true,
                            });
                          }}
                        >
                          Löschen
                        </Button>
                      </span>
                    </div>
                  </article>
                ))}
                <form
                  className="mt-3 space-y-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!comment.trim()) return;
                    await interaction.writeComment({ text: comment });
                    setComment("");
                  }}
                >
                  <Label htmlFor="pm-comment">Kommentar</Label>
                  <textarea
                    id="pm-comment"
                    className={control}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                  <Button variant="outline">Kommentieren</Button>
                </form>
              </section>
              <section className="border-t pt-4">
                <h3 className="font-medium">Verlauf</h3>
                {activities.map((item) => (
                  <p key={item.id} className="border-b py-2 text-sm">
                    {item.action} · {new Date(item.createdAt).toLocaleString("de-AT")}
                  </p>
                ))}
              </section>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("Aufgabe dauerhaft löschen?"))
                    void mutate({ type: "delete", taskId: draft.id, taskVersion: draft.version });
                }}
              >
                Aufgabe löschen
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
