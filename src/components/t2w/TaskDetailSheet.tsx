import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, ChevronDown, Download, History, Paperclip, Plus, Trash2, X } from "lucide-react";
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
import { formatDatum, formatDatumMitZeit } from "@/lib/t2w/format";
import { successorIds } from "@/lib/t2w/task-flow-view";
import { taskState } from "@/lib/t2w/task-state";
import { TaskStateChip } from "@/components/t2w/TaskState";
import { cn } from "@/lib/utils";
import type { TaskAttachment } from "@/lib/t2w/task-interaction-workspace";

const control = "min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export type TaskDetailPlanningContext = {
  owners: {
    id: string;
    displayName: string;
    active: boolean;
    role?: string;
    organizerId?: string | null;
  }[];
  groups: { id: string; name: string; active: boolean }[];
  tasks: readonly Task[];
  edges: readonly { predecessorId: string; successorId: string }[];
};

type TaskDetailSheetProps = {
  workspace: TaskInteractionWorkspace<unknown>;
  planning: TaskDetailPlanningContext;
  variant: "event" | "global";
  readOnly?: boolean;
  currentUserId?: string;
};

/** Felder, deren Änderung die Fußleiste als ungespeichert meldet. */
const TRACKED = [
  ["title", "Titel"],
  ["description", "Beschreibung"],
  ["status", "Status"],
  ["priority", "Priorität"],
  ["ownerId", "Verantwortlich"],
  ["groupId", "Kategorie"],
  ["startDate", "Start"],
  ["endDate", "Ende"],
] as const;

const STATUS_ORDER: Task["status"][] = ["OPEN", "IN_PROGRESS", "DONE"];
const PRIORITY_ORDER: Task["priority"][] = ["LOW", "NORMAL", "HIGH"];

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
export function TaskDetailSheet({
  workspace,
  planning,
  variant,
  readOnly = false,
  currentUserId,
}: TaskDetailSheetProps) {
  const snapshot = useSyncExternalStore(
    workspace.subscribe,
    workspace.snapshot,
    workspace.snapshot,
  );
  const { activities, attachmentBusy, attachments, busy, comments, draft, error, task } = snapshot;
  const [comment, setComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const editable = Boolean(task?.id);
  const canEdit = editable && !readOnly;
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
  const blockedAfter = task
    ? successorIds(task.id, planning.edges)
        .map((id) => taskById.get(id)?.title)
        .filter((title): title is string => Boolean(title))
    : [];
  const groupName = planning.groups.find((group) => group.id === draft.groupId)?.name ?? null;
  const selectedOwner = planning.owners.find((owner) => owner.id === draft.ownerId);
  const exposesTaskToOrganizer =
    canEdit &&
    variant === "event" &&
    selectedOwner?.role === "ORGANIZER" &&
    task?.ownerId !== selectedOwner.id;
  const unsaved = editable
    ? TRACKED.filter(
        ([field]) => task && draft[field] !== undefined && draft[field] !== task[field],
      )
    : [];

  useEffect(() => {
    setComment("");
    setEditingComment(null);
    setConfirmDelete(null);
    setHistoryOpen(false);
  }, [task?.id]);

  const downloadAttachment = async (attachment: TaskAttachment) => {
    const file = await workspace.downloadAttachment(attachment);
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={!!task} onOpenChange={(shown) => !shown && !busy && workspace.close()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="space-y-0 border-b p-0">
          <SheetTitle className="sr-only">
            {editable ? "Aufgabe bearbeiten" : "Neue Aufgabe"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Details, Voraussetzungen, Kommentare und Verlauf
          </SheetDescription>

          {task && (
            <div className="space-y-3 px-5 pb-4 pt-5">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                {editable ? (
                  <TaskStateChip state={taskState(task)} />
                ) : (
                  <span className="rounded-[5px] bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground/90 text-foreground">
                    Neu
                  </span>
                )}
                {groupName && <span className="text-xs text-muted-foreground">{groupName}</span>}
                {variant === "global" && (
                  <span className="text-xs text-muted-foreground">Globale Planung</span>
                )}
              </div>

              <div>
                <Label htmlFor="task-detail-title" className="sr-only">
                  Titel
                </Label>
                <Input
                  id="task-detail-title"
                  required
                  autoComplete="off"
                  placeholder="Was ist zu tun?"
                  value={draft.title ?? ""}
                  disabled={readOnly}
                  onChange={(event) => workspace.updateDraft({ title: event.target.value })}
                  className="h-auto border-transparent bg-transparent px-2 py-1 text-xl font-semibold tracking-tight shadow-none focus-visible:border-input"
                />
              </div>

              <div>
                <div
                  role="group"
                  aria-label="Status"
                  className="flex gap-1 rounded-lg bg-muted p-1"
                >
                  {STATUS_ORDER.map((value) => {
                    const active = (draft.status ?? "OPEN") === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        disabled={busy || readOnly}
                        onClick={() => workspace.updateDraft({ status: value })}
                        className={cn(
                          "min-h-11 flex-1 rounded-md px-3 text-sm transition-colors md:min-h-8",
                          active
                            ? "bg-background font-semibold shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {statusLabel[value]}
                      </button>
                    );
                  })}
                </div>
                {editable && blockedAfter.length > 0 && (
                  <p className="mt-2 text-xs text-task-waiting-strong">
                    Blockiert danach: {blockedAfter.join(" · ")}
                  </p>
                )}
              </div>
            </div>
          )}
        </SheetHeader>

        {task && (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {error && (
              <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
                {error}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="task-detail-owner">Verantwortlich</Label>
                <select
                  id="task-detail-owner"
                  className={control}
                  value={draft.ownerId ?? ""}
                  disabled={readOnly}
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
                {exposesTaskToOrganizer && (
                  <p role="alert" className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    Mit der Zuweisung werden Aufgabeninhalt sowie vorhandene Kommentare und Dateien
                    für dieses Veranstalterkonto sichtbar.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="task-detail-group">Kategorie</Label>
                <select
                  id="task-detail-group"
                  className={control}
                  value={draft.groupId ?? ""}
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
                  onChange={(event) =>
                    workspace.updateDraft({ endDate: event.target.value || null })
                  }
                />
              </div>
            </div>

            <div>
              <span className="text-sm font-medium">Priorität</span>
              <div role="group" aria-label="Priorität" className="mt-1.5 flex flex-wrap gap-2">
                {PRIORITY_ORDER.map((value) => {
                  const active = (draft.priority ?? "NORMAL") === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      disabled={busy || readOnly}
                      onClick={() => workspace.updateDraft({ priority: value })}
                      className={cn(
                        "min-h-11 rounded-full border px-3 text-sm transition-colors md:min-h-8",
                        active
                          ? "border-primary bg-primary/15 font-semibold text-foreground"
                          : "border-input text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {priorityLabel[value]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="task-detail-description">Beschreibung</Label>
              <textarea
                id="task-detail-description"
                className={control}
                rows={3}
                value={draft.description ?? ""}
                disabled={readOnly}
                onChange={(event) => workspace.updateDraft({ description: event.target.value })}
              />
            </div>

            <section className="border-t pt-4">
              <h3 className="text-sm font-medium">Voraussetzungen</h3>
              <p className="text-xs text-muted-foreground">
                Vorgänger, die vorher fertig sein müssen
              </p>

              {canEdit ? (
                <>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dependencies.map((edge) => {
                      const predecessor = taskById.get(edge.predecessorId);
                      const overdue = predecessor ? taskState(predecessor) === "overdue" : false;
                      return (
                        <span
                          key={edge.predecessorId}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1 text-sm",
                            overdue
                              ? "border-task-overdue/40 bg-task-overdue-soft text-task-overdue-strong"
                              : "border-input",
                          )}
                        >
                          {predecessor?.title ?? edge.predecessorId}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-full"
                            aria-label={`${predecessor?.title ?? "Vorgänger"} entfernen`}
                            disabled={busy}
                            onClick={() => void workspace.removeDependency(edge.predecessorId)}
                          >
                            <X aria-hidden="true" className="size-3.5" />
                          </Button>
                        </span>
                      );
                    })}
                    {!dependencies.length && (
                      <span className="text-sm text-muted-foreground">Keine</span>
                    )}
                  </div>

                  <Label htmlFor="task-detail-predecessor" className="mt-3 block">
                    Vorgänger hinzufügen
                  </Label>
                  <select
                    id="task-detail-predecessor"
                    className={control}
                    defaultValue=""
                    disabled={busy || !availablePredecessors.length}
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
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Lassen sich setzen, sobald die Aufgabe angelegt ist.
                </p>
              )}
            </section>

            {editable && (
              <section className="border-t pt-4">
                <h3 className="text-sm font-medium">Kommentare</h3>

                <div className="mt-2 space-y-3">
                  {comments.map((item) => (
                    <article key={item.id} className="rounded-md border p-3">
                      {editingComment === item.id ? (
                        <form
                          className="space-y-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void workspace.writeComment({ id: item.id, text: commentDraft });
                            setEditingComment(null);
                          }}
                        >
                          <Label htmlFor={`comment-${item.id}`} className="sr-only">
                            Kommentar bearbeiten
                          </Label>
                          <textarea
                            id={`comment-${item.id}`}
                            className={control}
                            rows={3}
                            value={commentDraft}
                            onChange={(event) => setCommentDraft(event.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={busy}>
                              Speichern
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingComment(null)}
                            >
                              Abbrechen
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap break-words text-sm">
                            {textWithLinks(item.text)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <p className="flex-1 text-xs text-muted-foreground">
                              {item.author?.displayName ? `${item.author.displayName} · ` : ""}
                              {formatDatumMitZeit(item.updatedAt)}
                              {item.updatedAt !== item.createdAt ? " · bearbeitet" : ""}
                            </p>
                            {item.authorId === currentUserId &&
                              (confirmDelete === item.id ? (
                                <>
                                  <span className="text-xs text-destructive">
                                    Wirklich löschen?
                                  </span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={busy}
                                    onClick={() => {
                                      void workspace.writeComment({ id: item.id, delete: true });
                                      setConfirmDelete(null);
                                    }}
                                  >
                                    Löschen
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setConfirmDelete(null)}
                                  >
                                    Abbrechen
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingComment(item.id);
                                      setCommentDraft(item.text);
                                    }}
                                  >
                                    Bearbeiten
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setConfirmDelete(item.id)}
                                  >
                                    Löschen
                                  </Button>
                                </>
                              ))}
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                  {!comments.length && (
                    <p className="text-sm text-muted-foreground">Noch keine Kommentare.</p>
                  )}
                </div>

                <form
                  className="mt-3 space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!comment.trim()) return;
                    void workspace.writeComment({ text: comment });
                    setComment("");
                  }}
                >
                  <Label htmlFor="task-detail-comment" className="sr-only">
                    Kommentar schreiben
                  </Label>
                  <textarea
                    id="task-detail-comment"
                    className={control}
                    rows={2}
                    placeholder="Kommentar schreiben …"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                  <Button type="submit" variant="outline" size="sm" disabled={busy}>
                    Kommentieren
                  </Button>
                </form>
              </section>
            )}

            {editable && (
              <section className="border-t pt-4">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Paperclip className="size-4" /> Dateien
                </h3>
                <ul className="mt-2 space-y-2">
                  {attachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="flex items-center gap-2 rounded-md border p-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.ceil(attachment.size / 1024)} KB
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`${attachment.fileName} herunterladen`}
                        onClick={() => void downloadAttachment(attachment)}
                      >
                        <Download className="size-4" />
                      </Button>
                    </li>
                  ))}
                  {!attachments.length && (
                    <li className="text-sm text-muted-foreground">Noch keine Dateien.</li>
                  )}
                </ul>
                <Label htmlFor="task-attachment" className="mt-3 block">
                  Datei hochladen
                </Label>
                <Input
                  id="task-attachment"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx,.xlsx"
                  disabled={attachmentBusy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.currentTarget.value = "";
                    if (!file || !task.id) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const contentBase64 = String(reader.result).split(",")[1] ?? "";
                      void workspace.uploadAttachment({
                        fileName: file.name,
                        mimeType: file.type || "text/plain",
                        contentBase64,
                      });
                    };
                    reader.onerror = () => undefined;
                    reader.readAsDataURL(file);
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, Bilder, Text, CSV, Word oder Excel · maximal 5 MB
                </p>
              </section>
            )}

            {canEdit && (
              <section className="border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-expanded={historyOpen}
                  onClick={() => setHistoryOpen((open) => !open)}
                  className="px-0"
                >
                  <History aria-hidden="true" className="size-4" />
                  Verlauf ({activities.length})
                  <ChevronDown
                    aria-hidden="true"
                    className={cn("size-4 transition-transform", historyOpen && "rotate-180")}
                  />
                </Button>
                {historyOpen && (
                  <ul className="mt-2 space-y-1">
                    {activities.map((item) => (
                      <li key={item.id} className="text-xs text-muted-foreground">
                        {item.action} · {formatDatumMitZeit(item.createdAt)}
                      </li>
                    ))}
                    {!activities.length && (
                      <li className="text-xs text-muted-foreground">Kein Verlauf.</li>
                    )}
                  </ul>
                )}
              </section>
            )}

            {canEdit && (
              <section className="border-t pt-4">
                {confirmDelete === "task" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex-1 text-sm text-destructive">
                      Aufgabe dauerhaft löschen?
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => void workspace.delete()}
                    >
                      Löschen
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(null)}
                    >
                      Abbrechen
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0 text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete("task")}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Aufgabe löschen
                  </Button>
                )}
              </section>
            )}
          </div>
        )}

        {task && !readOnly && (
          <div className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-5 py-3">
            <p className="flex-1 text-xs text-muted-foreground">
              {unsaved.length > 0 ? (
                <span className="font-medium text-task-waiting-strong">
                  Nicht gespeichert: {unsaved.map(([, label]) => label).join(", ")}
                </span>
              ) : editable ? (
                task.endDate ? (
                  `Ende ${formatDatum(task.endDate)}`
                ) : (
                  "Ohne Ende"
                )
              ) : (
                "Wird beim Anlegen gespeichert"
              )}
            </p>

            {editable && unsaved.length > 0 && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => workspace.updateDraft(task)}
              >
                Verwerfen
              </Button>
            )}
            <Button type="button" disabled={busy} onClick={() => void workspace.save()}>
              {editable ? (
                <>
                  <Check aria-hidden="true" className="size-4" />
                  Änderungen speichern
                </>
              ) : (
                <>
                  <Plus aria-hidden="true" className="size-4" />
                  Aufgabe anlegen
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
