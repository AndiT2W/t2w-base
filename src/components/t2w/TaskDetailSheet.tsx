import { useEffect, useState, useSyncExternalStore } from "react";
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
import { priorityLabel, statusLabel } from "@/lib/t2w/project-management";
import type { TaskInteractionWorkspace } from "@/lib/t2w/task-interaction-workspace";
import { formatDatumMitZeit } from "@/lib/t2w/format";

const control = "min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export type TaskDetailPlanningContext = {
  owners: { id: string; displayName: string; active: boolean }[];
  groups: { id: string; name: string; active: boolean }[];
  tasks: readonly Task[];
  edges: readonly { predecessorId: string; successorId: string }[];
};

type TaskDetailSheetProps = {
  workspace: TaskInteractionWorkspace<unknown>;
  planning: TaskDetailPlanningContext;
  variant: "event" | "global";
};

function textWithLinks(text: string) {
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

/**
 * The Task-detail module owns one editing interaction for Event and global
 * planning. Callers provide only the current planning context and adapter-backed
 * workspace; scope filtering and Task intentions stay behind this seam.
 */
export function TaskDetailSheet({ workspace, planning, variant }: TaskDetailSheetProps) {
  const snapshot = useSyncExternalStore(
    workspace.subscribe,
    workspace.snapshot,
    workspace.snapshot,
  );
  const { activities, busy, comments, draft, task } = snapshot;
  const [comment, setComment] = useState("");
  const editable = Boolean(task?.id);
  const scopedTasks = task
    ? planning.tasks.filter(
        (candidate) => candidate.scope === task.scope && candidate.eventId === task.eventId,
      )
    : [];
  const dependencies = task ? planning.edges.filter((edge) => edge.successorId === task.id) : [];
  const taskById = new Map(scopedTasks.map((candidate) => [candidate.id, candidate]));
  const availablePredecessors = task
    ? scopedTasks.filter(
        (candidate) =>
          candidate.id !== task.id &&
          !dependencies.some((edge) => edge.predecessorId === candidate.id),
      )
    : [];
  const title =
    variant === "event" ? "Aufgabe" : editable ? "Aufgabe bearbeiten" : "Globale Aufgabe anlegen";
  const description =
    variant === "event"
      ? "Details, Voraussetzungen, Kommentare und Verlauf"
      : "Details, Termine, Voraussetzungen und Kommentare";

  useEffect(() => setComment(""), [task?.id]);

  return (
    <Sheet open={!!task} onOpenChange={(shown) => !shown && !busy && workspace.close()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {task && (
          <div className="space-y-4 p-4">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void workspace.save();
              }}
            >
              <Label htmlFor="task-detail-title">Titel</Label>
              <Input
                id="task-detail-title"
                required
                value={draft.title ?? ""}
                onChange={(event) => workspace.updateDraft({ title: event.target.value })}
              />
              <Label htmlFor="task-detail-description">Beschreibung</Label>
              <textarea
                id="task-detail-description"
                className={control}
                rows={5}
                value={draft.description ?? ""}
                onChange={(event) => workspace.updateDraft({ description: event.target.value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="task-detail-status">Status</Label>
                  <select
                    id="task-detail-status"
                    className={control}
                    value={draft.status ?? "OPEN"}
                    onChange={(event) =>
                      workspace.updateDraft({ status: event.target.value as Task["status"] })
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
                  <Label htmlFor="task-detail-priority">Priorität</Label>
                  <select
                    id="task-detail-priority"
                    className={control}
                    value={draft.priority ?? "NORMAL"}
                    onChange={(event) =>
                      workspace.updateDraft({ priority: event.target.value as Task["priority"] })
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
                  <Label htmlFor="task-detail-owner">Verantwortlich</Label>
                  <select
                    id="task-detail-owner"
                    className={control}
                    value={draft.ownerId ?? ""}
                    onChange={(event) =>
                      workspace.updateDraft({ ownerId: event.target.value || null })
                    }
                  >
                    <option value="">Nicht zugeordnet</option>
                    {planning.owners
                      .filter((owner) => owner.active || owner.id === draft.ownerId)
                      .map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.displayName}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="task-detail-group">Kategorie</Label>
                  <select
                    id="task-detail-group"
                    className={control}
                    value={draft.groupId ?? ""}
                    onChange={(event) =>
                      workspace.updateDraft({ groupId: event.target.value || null })
                    }
                  >
                    <option value="">Ohne Kategorie</option>
                    {planning.groups
                      .filter((group) => group.active || group.id === draft.groupId)
                      .map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="task-detail-start">Start</Label>
                  <Input
                    id="task-detail-start"
                    type="date"
                    value={draft.startDate ?? ""}
                    onChange={(event) =>
                      workspace.updateDraft({ startDate: event.target.value || null })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="task-detail-end">Ende</Label>
                  <Input
                    id="task-detail-end"
                    type="date"
                    value={draft.endDate ?? ""}
                    onChange={(event) =>
                      workspace.updateDraft({ endDate: event.target.value || null })
                    }
                  />
                </div>
              </div>
              <Button disabled={busy}>
                {editable ? "Änderungen speichern" : "Aufgabe anlegen"}
              </Button>
            </form>

            {editable && (
              <section className="border-t pt-4">
                <h3 className="font-medium">Voraussetzungen</h3>
                {dependencies.map((edge) => (
                  <div
                    key={edge.predecessorId}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <span>{taskById.get(edge.predecessorId)?.title ?? edge.predecessorId}</span>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void workspace.removeDependency(edge.predecessorId)}
                    >
                      Entfernen
                    </Button>
                  </div>
                ))}
                <Label htmlFor="task-detail-predecessor">Vorgänger hinzufügen</Label>
                <select
                  id="task-detail-predecessor"
                  className={control}
                  defaultValue=""
                  onChange={(event) => {
                    const predecessorId = event.target.value;
                    if (predecessorId) void workspace.addDependency(predecessorId);
                    event.currentTarget.value = "";
                  }}
                >
                  <option value="">Aufgabe auswählen</option>
                  {availablePredecessors.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.title}
                    </option>
                  ))}
                </select>
              </section>
            )}

            {editable && (
              <section className="border-t pt-4">
                <h3 className="font-medium">Kommentare</h3>
                {comments.map((item) => (
                  <article key={item.id} className="border-b py-2">
                    <p className="whitespace-pre-wrap break-words">{textWithLinks(item.text)}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDatumMitZeit(item.updatedAt)}
                        {item.updatedAt !== item.createdAt ? " · bearbeitet" : ""}
                      </p>
                      <span className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const text = window.prompt("Kommentar bearbeiten", item.text);
                            if (text !== null) void workspace.writeComment({ id: item.id, text });
                          }}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Kommentar dauerhaft löschen?"))
                              void workspace.writeComment({ id: item.id, delete: true });
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
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!comment.trim()) return;
                    void workspace.writeComment({ text: comment });
                    setComment("");
                  }}
                >
                  <Label htmlFor="task-detail-comment">Kommentar</Label>
                  <textarea
                    id="task-detail-comment"
                    className={control}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                  <Button type="submit" variant="outline" disabled={busy}>
                    Kommentieren
                  </Button>
                </form>
              </section>
            )}

            {editable && (
              <section className="border-t pt-4">
                <h3 className="font-medium">Verlauf</h3>
                {activities.map((item) => (
                  <p key={item.id} className="border-b py-2 text-sm">
                    {item.action} · {formatDatumMitZeit(item.createdAt)}
                  </p>
                ))}
              </section>
            )}

            {editable && (
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("Aufgabe dauerhaft löschen?")) void workspace.delete();
                }}
              >
                Aufgabe löschen
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
