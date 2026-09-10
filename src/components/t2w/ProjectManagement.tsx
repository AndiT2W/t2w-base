import { useCallback, useEffect, useRef, useState } from "react";
import { validateDependency, type Task } from "@t2w/domain/project-management";
import {
  pmCommand,
  pmRead,
  pmRequest,
  statusLabel,
  type PmCommand,
  type PmState,
} from "@/lib/t2w/project-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskChangeDetails, TaskActivityDetails, activityLabel } from "./TaskChangeDetails";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const control = "min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
function readSelection() {
  const q = new URLSearchParams(window.location.search);
  return {
    group: q.get("pmGroup") ?? "",
    flow: q.get("pmFlow") ?? "",
    task: q.get("pmTask") ?? "",
  };
}
export function ProjectManagement({ eventId }: { eventId: string }) {
  const [state, setState] = useState<PmState>();
  const [error, setError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [selection, setSelection] = useState({ group: "", flow: "", task: "" });
  const [draft, setDraft] = useState<Task | null>(null);
  const [conflict, setConflict] = useState<Task | null>(null);
  const [references, setReferences] = useState<
    {
      kind: NonNullable<Task["references"]>[number]["kind"];
      id: string;
      title: string;
      href: string;
    }[]
  >([]);
  const [reason, setReason] = useState("");
  const [predecessor, setPredecessor] = useState("");
  const [activities, setActivities] = useState<
    { id: string; action: string; actorId: string; createdAt: string; details: unknown }[]
  >([]);
  const [activityError, setActivityError] = useState("");
  const [activityRevision, setActivityRevision] = useState(0);
  const mutationRunning = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (mutationRunning.current) return;
    const current = ++generation.current;
    try {
      const next = await pmRead(eventId);
      if (generation.current === current) {
        setState(next);
        setError("");
      }
    } catch (e) {
      if (generation.current === current)
        setError(e instanceof Error ? e.message : "Bewertung nicht verfügbar");
    }
  }, [eventId]);
  useEffect(() => {
    const counter = generation;
    void load();
    const interval = setInterval(() => void load(), 30000);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", load);
      counter.current++;
    };
  }, [load]);
  useEffect(() => {
    const sync = () => setSelection(readSelection());
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    if (selection.task)
      document.getElementById(`pm-row-${selection.task}`)?.scrollIntoView({ block: "nearest" });
  }, [selection, state]);
  const draftId = draft?.id;
  useEffect(() => {
    setConflict(null);
    setMutationError("");
  }, [draftId]);
  useEffect(() => {
    if (!draftId) return;
    let alive = true;
    setActivityError("");
    pmRequest<typeof references>(`/events/${eventId}/references`)
      .then((r) => {
        if (alive) setReferences(r);
      })
      .catch((e) => {
        if (alive) setActivityError(e.message);
      });
    pmRequest<typeof activities>(`/tasks/${draftId}/activities`)
      .then((a) => {
        if (alive) setActivities(a);
      })
      .catch((e) => {
        if (alive) setActivityError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [draftId, activityRevision, eventId]);
  function select(group: string, flow = "", task = "") {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries({ pmGroup: group, pmFlow: flow, pmTask: task })) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    url.searchParams.set("tab", "aufgaben");
    window.history.pushState(null, "", url);
    setSelection({ group, flow, task });
  }
  async function mutate(command: PmCommand) {
    if (!state || mutationRunning.current) return false;
    mutationRunning.current = true;
    generation.current++;
    setBusy(true);
    setError("");
    try {
      const next = await pmCommand(state, command);
      setState(next);
      setActivityRevision((v) => v + 1);
      if (draft) {
        const saved = next.tasks.find((t) => t.id === draft.id);
        if (saved)
          setDraft(
            command.type === "add-dependency" || command.type === "remove-dependency"
              ? { ...draft, version: saved.version }
              : saved,
          );
      }
      setReason("");
      setMutationError("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
      setMutationError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
      return false;
    } finally {
      mutationRunning.current = false;
      setBusy(false);
    }
  }
  function locate(task: Task) {
    select(
      task.groupId ?? "none",
      state?.flows.find((f) => f.includes(task.id))?.[0] ?? "",
      task.id,
    );
  }
  const names = (id: string) => state?.tasks.find((t) => t.id === id)?.title ?? id;
  const groupName = (id: string | null) =>
    state?.groups.find((g) => g.id === id)?.name ?? "Ohne Kategorie";
  const table = (tasks: PmState["tasks"], label: string) => (
    <div className="overflow-x-auto border-t border-border">
      <table className="w-full min-w-[780px] text-left text-sm" aria-label={label}>
        <thead>
          <tr>
            {[
              "Aufgabe",
              "Status",
              "Owner",
              "Priorität",
              "Frist",
              "Voraussetzungen",
              "Nächster Schritt",
            ].map((h) => (
              <th key={h} className="p-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr
              key={t.id}
              id={`pm-row-${t.id}`}
              className={`border-t border-border ${selection.task === t.id ? "bg-accent ring-2 ring-inset ring-primary" : ""}`}
            >
              <td className="p-3">
                <button
                  className="min-h-11 text-left font-medium underline underline-offset-4"
                  onClick={() => {
                    setDraft(t);
                    setReason("");
                    setPredecessor("");
                  }}
                >
                  {t.title}
                </button>
                {t.reasons.map((r) => (
                  <p key={r} className="text-xs text-destructive">
                    {r}
                  </p>
                ))}
              </td>
              <td className="p-3">{statusLabel[t.status]}</td>
              <td className="p-3">
                {state?.owners.find((o) => o.id === t.ownerId)?.displayName ?? "Nicht zugeordnet"}
              </td>
              <td className="p-3">{t.priority === "HIGH" ? "Hoch" : "Normal"}</td>
              <td className="p-3">
                {t.dueDate ??
                  (t.dueAt
                    ? new Date(t.dueAt).toLocaleString("de-AT", {
                        timeZone: state?.event.pmTimeZone,
                      })
                    : "Ohne Frist")}
              </td>
              <td className="p-3">
                {t.blockedBy.length
                  ? t.blockedBy.map((id) => (
                      <button
                        key={id}
                        className="block min-h-11 underline"
                        onClick={() => {
                          const source = state?.tasks.find((t) => t.id === id);
                          if (source) locate(source);
                        }}
                      >
                        {names(id)} ·{" "}
                        {groupName(state?.tasks.find((t) => t.id === id)?.groupId ?? null)}
                      </button>
                    ))
                  : "Bereit"}
              </td>
              <td className="p-3">{t.nextStep || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!tasks.length && <p className="p-4 text-sm text-muted-foreground">Keine Aufgaben erfasst</p>}
    </div>
  );
  return (
    <section aria-label="Projektmanagement" className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Projektmanagement</h2>
          <p className="text-sm text-muted-foreground">Bezieht sich auf erfasste Aufgaben</p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void load()}>
          Aktuellen Stand laden
        </Button>
      </header>
      {error && (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          Bewertung nicht verfügbar: {error}
        </p>
      )}
      {!state && !error && <p role="status">Projektmanagement wird geladen …</p>}
      {state && (
        <>
          {state.legacyCount > 0 ? (
            <div className="space-y-3 rounded-md border p-4">
              <p>
                {state.legacyCount} bisherige Checkbox-Aufgaben müssen vor dem Start vollständig
                gesichert werden. Sie werden nicht in neue Aufgaben übernommen.
              </p>
              <Button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await pmRequest(`/events/${eventId}/cutover`, {});
                    await load();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Sicherung fehlgeschlagen");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Als Admin sichern und umstellen
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await mutate({ type: "create", task: { title } })) setTitle("");
              }}
            >
              <div className="min-w-40 flex-1">
                <Label htmlFor="pm-title">Neue Aufgabe</Label>
                <Input
                  id="pm-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={state.event.archived || busy}
                />
              </div>
              <Button disabled={busy || state.event.archived}>Aufgabe anlegen</Button>
            </form>
          )}
          {state.event.archived && <p>Archiviert · Projektmanagement ist schreibgeschützt.</p>}
          <details className="rounded-md border p-3">
            <summary className="min-h-11 cursor-pointer">
              Eventzeitzone: {state.event.pmTimeZone}
            </summary>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                mutationRunning.current = true;
                generation.current++;
                try {
                  setState(
                    await pmRequest<PmState>(`/events/${eventId}/config`, {
                      graphVersion: state.event.pmGraphVersion,
                      timeZone: timeZone || state.event.pmTimeZone,
                    }),
                  );
                  setError("");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
                } finally {
                  setBusy(false);
                  mutationRunning.current = false;
                }
              }}
            >
              <div>
                <Label htmlFor="pm-timezone">IANA-Zeitzone</Label>
                <Input
                  id="pm-timezone"
                  value={timeZone || state.event.pmTimeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                />
              </div>
              <Button disabled={busy || state.event.archived}>Zeitzone speichern</Button>
            </form>
          </details>
          {!!state.legacySnapshots?.length && (
            <details className="rounded-md border p-3">
              <summary className="min-h-11 cursor-pointer">Gesicherte bisherige Aufgaben</summary>
              {state.legacySnapshots.map((s) => (
                <p key={s.id} className="text-sm">
                  <a
                    className="underline"
                    href={`/api/v1/pm/snapshots/${s.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Snapshot vom {new Date(s.createdAt).toLocaleString("de-AT")} · {s.count}{" "}
                    Aufgaben (Admin)
                  </a>
                </p>
              ))}
            </details>
          )}
          {selection.task && !state.tasks.some((t) => t.id === selection.task) && (
            <p role="alert">Die verlinkte Aufgabe ist nicht mehr verfügbar.</p>
          )}
          {selection.group &&
            !state.categories.some((c) => (c.groupId ?? "none") === selection.group) && (
              <p role="alert">Die verlinkte Kategorie ist nicht verfügbar.</p>
            )}
          {selection.task &&
            state.tasks.some(
              (t) => t.id === selection.task && (t.groupId ?? "none") !== selection.group,
            ) && (
              <p role="alert">
                Die Aufgabe gehört inzwischen zu einer anderen Kategorie.{" "}
                <button
                  className="underline"
                  onClick={() => locate(state.tasks.find((t) => t.id === selection.task)!)}
                >
                  Aktuelle Kategorie öffnen
                </button>
              </p>
            )}
          {selection.flow && !state.flows.some((f) => f.includes(selection.flow)) && (
            <p role="alert">Der verlinkte Ablauf besteht nicht mehr. Bitte Kategorie öffnen.</p>
          )}
          {selection.flow &&
            state.flows.some((f) => f.includes(selection.flow)) &&
            !state.flows
              .find((f) => f.includes(selection.flow))
              ?.some((id) =>
                state.tasks.some((t) => t.id === id && (t.groupId ?? "none") === selection.group),
              ) && (
              <p role="alert">
                Der verlinkte Ablauf gehört nicht zu dieser Kategorie.{" "}
                <button
                  className="underline"
                  onClick={() => locate(state.tasks.find((t) => t.id === selection.flow)!)}
                >
                  Aktuelle Kategorie öffnen
                </button>
              </p>
            )}
          {state.categories.map((category) => {
            const group = category.groupId ?? "none";
            const members = state.tasks.filter((t) => t.groupId === category.groupId);
            const flows = state.flows.filter((f) => members.some((t) => f.includes(t.id)));
            const selectedFlow = state.flows.find((f) => f.includes(selection.flow));
            const other = members.filter((t) => !state.flows.some((f) => f.includes(t.id)));
            return (
              <article key={group} className="rounded-lg border border-border bg-background">
                <button
                  className="flex min-h-16 w-full flex-wrap items-center justify-between gap-2 p-4 text-left"
                  aria-expanded={selection.group === group && !selection.flow}
                  onClick={() => select(selection.group === group && !selection.flow ? "" : group)}
                >
                  <span className="font-semibold">
                    {groupName(category.groupId)}{" "}
                    <span className="font-normal text-muted-foreground">({category.count})</span>
                  </span>
                  <span className="text-sm">
                    {error ? "Bewertung nicht verfügbar" : category.summary} ·{" "}
                    {selection.group === group && !selection.flow
                      ? "Schließen"
                      : "Alle Kategorieaufgaben öffnen"}
                  </span>
                </button>
                {!error && category.reasons.length > 0 && (
                  <ul className="px-4 pb-3 text-sm text-destructive">
                    {category.reasons.map((r) => (
                      <li key={`${r.taskId}-${r.message}`}>
                        <button
                          className="min-h-8 text-left underline"
                          onClick={() => locate(state.tasks.find((t) => t.id === r.taskId)!)}
                        >
                          {names(r.taskId)}: {r.message}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selection.group === group &&
                  !selection.flow &&
                  table(members, `Alle Aufgaben: ${groupName(category.groupId)}`)}
                {flows.map((flow) => (
                  <div key={flow[0]} className="border-t border-border">
                    <button
                      className="min-h-11 w-full px-4 py-2 text-left text-sm font-medium"
                      aria-expanded={selection.group === group && selectedFlow === flow}
                      onClick={() =>
                        select(
                          selection.group === group && selectedFlow === flow ? "" : group,
                          selection.group === group && selectedFlow === flow ? "" : flow[0],
                        )
                      }
                    >
                      Ablauf ·{" "}
                      {flow
                        .filter((id) => members.some((t) => t.id === id))
                        .map(names)
                        .join(" / ")}{" "}
                      · Aufgaben dieser Kategorie öffnen
                    </button>
                    <div className="flex flex-wrap gap-2 px-4 pb-4">
                      {flow
                        .filter((id) => members.some((t) => t.id === id))
                        .map((id) => (
                          <div
                            key={id}
                            className="max-w-full rounded-md border border-border p-2 text-sm"
                          >
                            <button
                              className="min-h-11 text-left font-medium"
                              onClick={() => select(group, flow[0], id)}
                            >
                              {names(id)} ·{" "}
                              {statusLabel[state.tasks.find((t) => t.id === id)!.status]}
                            </button>
                            <p className="text-xs text-muted-foreground">
                              {state.edges.filter((e) => e.successorId === id).length
                                ? `Nach: ${state.edges
                                    .filter((e) => e.successorId === id)
                                    .map((e) => names(e.predecessorId))
                                    .join(" + ")}`
                                : "Unabhängiger Start"}
                            </p>
                            {state.edges
                              .filter((e) => e.successorId === id || e.predecessorId === id)
                              .map((e) => {
                                const otherId =
                                  e.successorId === id ? e.predecessorId : e.successorId;
                                const other = state.tasks.find((t) => t.id === otherId)!;
                                return other.groupId !== category.groupId ? (
                                  <button
                                    key={`${e.predecessorId}:${e.successorId}`}
                                    className="block min-h-11 text-left text-xs underline"
                                    onClick={() => locate(other)}
                                  >
                                    {e.successorId === id ? "Vorgänger" : "Nachfolger"}:{" "}
                                    {other.title} · {groupName(other.groupId)}
                                  </button>
                                ) : null;
                              })}
                          </div>
                        ))}
                    </div>
                    {selection.group === group &&
                      selectedFlow === flow &&
                      table(
                        members.filter((t) => flow.includes(t.id)),
                        `Ablauf: ${groupName(category.groupId)}`,
                      )}
                  </div>
                ))}
                {!!flows.length && !!other.length && (
                  <div className="border-t p-4 text-sm">
                    <p className="font-medium">Weitere Aufgaben ({other.length})</p>
                    {other.map((t) => (
                      <button
                        key={t.id}
                        className="mr-4 min-h-11 underline"
                        onClick={() => locate(t)}
                      >
                        {t.title} · {statusLabel[t.status]}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
          <div>
            <h3 className="font-medium">Nächste Schritte</h3>
            {state.next.map((id) => (
              <button
                key={id}
                className="block min-h-11 text-left underline"
                onClick={() => locate(state.tasks.find((t) => t.id === id)!)}
              >
                {names(id)} · {state.tasks.find((t) => t.id === id)?.nextStep}
              </button>
            ))}
            <a
              className="inline-block min-h-11 py-2 underline"
              href={`/aufgaben?event=${eventId}&view=tasks&all=true`}
            >
              Alle Aufgaben
            </a>
          </div>
          <Sheet
            open={!!draft}
            onOpenChange={(open) => {
              if (!open && !busy) setDraft(null);
            }}
          >
            <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>Aufgabe bearbeiten</SheetTitle>
                <SheetDescription>Status, Voraussetzungen und Verlauf</SheetDescription>
              </SheetHeader>
              {draft && (
                <div className="space-y-5 p-4">
                  {(error || mutationError) && (
                    <p role="alert" className="text-destructive">
                      {error || mutationError}
                    </p>
                  )}
                  {(error || mutationError) && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        try {
                          const latest = await pmRead(eventId);
                          setState(latest);
                          setConflict(latest.tasks.find((t) => t.id === draft.id) ?? null);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Laden fehlgeschlagen");
                        }
                      }}
                    >
                      Konflikt mit aktuellem Stand vergleichen
                    </Button>
                  )}
                  {conflict && conflict.id === draft.id && (
                    <div className="space-y-3 rounded-md border p-3">
                      <p>
                        Aktueller Stand: {conflict.title} · {statusLabel[conflict.status]} ·{" "}
                        {conflict.nextStep}
                      </p>
                      <p>
                        Meine Eingabe: {draft.title} · {statusLabel[draft.status]} ·{" "}
                        {draft.nextStep}
                      </p>
                      <TaskChangeDetails before={conflict} after={draft} state={state} />
                      <p>
                        Mit Bestätigung werden die eigenen Formularwerte gegen die angezeigte
                        aktuelle Version gespeichert.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDraft({ ...draft, version: conflict.version });
                          setConflict(null);
                          setError("");
                        }}
                      >
                        Eigene Eingaben zur erneuten Prüfung übernehmen
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDraft(conflict);
                          setConflict(null);
                          setError("");
                        }}
                      >
                        Aktuellen Stand übernehmen
                      </Button>
                    </div>
                  )}
                  <form
                    className="space-y-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await mutate({
                        type: "update",
                        taskId: draft.id,
                        taskVersion: draft.version,
                        task: draft,
                        reason,
                      });
                    }}
                  >
                    <Label htmlFor="pm-edit-title">Titel</Label>
                    <Input
                      id="pm-edit-title"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      required
                    />
                    <Label htmlFor="pm-status">Arbeitsstatus</Label>
                    <select
                      id="pm-status"
                      className={control}
                      value={draft.status}
                      onChange={(e) =>
                        setDraft({ ...draft, status: e.target.value as Task["status"] })
                      }
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Label htmlFor="pm-owner">Owner</Label>
                    <select
                      id="pm-owner"
                      className={control}
                      value={draft.ownerId ?? ""}
                      onChange={(e) => setDraft({ ...draft, ownerId: e.target.value || null })}
                    >
                      <option value="">Nicht zugeordnet</option>
                      {state.owners
                        .filter((o) => o.active || o.id === draft.ownerId)
                        .map((o) => (
                          <option key={o.id} value={o.id} disabled={!o.active}>
                            {o.displayName}
                            {o.active ? "" : " (inaktiv)"}
                          </option>
                        ))}
                    </select>
                    <Label htmlFor="pm-group">Kategorie</Label>
                    <select
                      id="pm-group"
                      className={control}
                      value={draft.groupId ?? ""}
                      onChange={(e) => setDraft({ ...draft, groupId: e.target.value || null })}
                    >
                      <option value="">Nicht zugeordnet</option>
                      {state.groups
                        .filter((g) => g.active || g.id === draft.groupId)
                        .map((g) => (
                          <option key={g.id} value={g.id} disabled={!g.active}>
                            {g.name}
                            {g.active ? "" : " (inaktiv)"}
                          </option>
                        ))}
                    </select>
                    <Label htmlFor="pm-priority">Priorität</Label>
                    <select
                      id="pm-priority"
                      className={control}
                      value={draft.priority}
                      onChange={(e) =>
                        setDraft({ ...draft, priority: e.target.value as Task["priority"] })
                      }
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">Hoch</option>
                    </select>
                    <Label htmlFor="pm-next">Nächster Schritt</Label>
                    <Input
                      id="pm-next"
                      value={draft.nextStep}
                      onChange={(e) => setDraft({ ...draft, nextStep: e.target.value })}
                    />
                    <Label htmlFor="pm-due-type">Fristtyp ({state.event.pmTimeZone})</Label>
                    <select
                      id="pm-due-type"
                      className={control}
                      value={draft.dueType}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          dueType: e.target.value as Task["dueType"],
                          dueDate: null,
                          dueAt: null,
                        })
                      }
                    >
                      <option value="NONE">Ohne Frist</option>
                      <option value="DATE">Tagesfrist</option>
                      <option value="INSTANT">Zeitpunkt (UTC)</option>
                    </select>
                    {draft.dueType === "DATE" && (
                      <>
                        <Label htmlFor="pm-date">Tagesfrist</Label>
                        <Input
                          id="pm-date"
                          type="date"
                          value={draft.dueDate ?? ""}
                          onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || null })}
                          required
                        />
                      </>
                    )}
                    {draft.dueType === "INSTANT" && (
                      <>
                        <Label htmlFor="pm-instant">Zeitpunkt in UTC</Label>
                        <Input
                          id="pm-instant"
                          type="datetime-local"
                          value={draft.dueAt?.slice(0, 16) ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              dueAt: e.target.value ? `${e.target.value}:00Z` : null,
                            })
                          }
                          required
                        />
                      </>
                    )}
                    <Label htmlFor="pm-result">Abschlussergebnis</Label>
                    <fieldset className="space-y-2 rounded-md border p-3">
                      <legend>Fachreferenzen</legend>
                      {references.map((ref) => (
                        <label
                          key={`${ref.kind}:${ref.id}`}
                          className="flex min-h-11 items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={
                              draft.references?.some(
                                (r) => r.kind === ref.kind && r.id === ref.id,
                              ) ?? false
                            }
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                references: e.target.checked
                                  ? [...(draft.references ?? []), { kind: ref.kind, id: ref.id }]
                                  : (draft.references ?? []).filter(
                                      (r) => r.kind !== ref.kind || r.id !== ref.id,
                                    ),
                              })
                            }
                          />
                          <a href={ref.href} target="_blank" rel="noreferrer" className="underline">
                            {ref.kind}: {ref.title}
                          </a>
                        </label>
                      ))}
                      {!references.length && (
                        <p className="text-sm">Keine verknüpfbaren Fachdaten in diesem Event.</p>
                      )}
                    </fieldset>
                    <textarea
                      id="pm-result"
                      className={control}
                      value={draft.result}
                      onChange={(e) => setDraft({ ...draft, result: e.target.value })}
                    />
                    <Label htmlFor="pm-reason">
                      Begründung (Friständerung, Storno, Wiederöffnung oder Entfernen)
                    </Label>
                    <textarea
                      id="pm-reason"
                      className={control}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <Button disabled={busy || state.event.archived}>Änderungen speichern</Button>
                  </form>
                  <div className="space-y-2 border-t pt-4">
                    <h3 className="font-medium">Voraussetzungen</h3>
                    {state.edges
                      .filter((e) => e.successorId === draft.id)
                      .map((e) => (
                        <div
                          key={e.predecessorId}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <span>{names(e.predecessorId)}</span>
                          <Button
                            variant="outline"
                            disabled={busy || state.event.archived}
                            onClick={() =>
                              void mutate({
                                type: "remove-dependency",
                                taskId: draft.id,
                                taskVersion: draft.version,
                                predecessorId: e.predecessorId,
                                reason,
                              })
                            }
                          >
                            Begründet entfernen
                          </Button>
                        </div>
                      ))}
                    <Label htmlFor="pm-predecessor">Vorgängeraufgabe</Label>
                    <select
                      id="pm-predecessor"
                      className={control}
                      value={predecessor}
                      onChange={(e) => setPredecessor(e.target.value)}
                    >
                      <option value="">Aufgabe auswählen</option>
                      {state.tasks
                        .filter(
                          (t) =>
                            (() => {
                              try {
                                validateDependency(state.tasks, state.edges, {
                                  predecessorId: t.id,
                                  successorId: draft.id,
                                });
                                return true;
                              } catch {
                                return false;
                              }
                            })() &&
                            !state.edges.some(
                              (e) => e.successorId === draft.id && e.predecessorId === t.id,
                            ),
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} · {groupName(t.groupId)}
                          </option>
                        ))}
                    </select>
                    <Button
                      variant="outline"
                      disabled={!predecessor || busy || state.event.archived}
                      onClick={async () => {
                        if (
                          await mutate({
                            type: "add-dependency",
                            taskId: draft.id,
                            taskVersion: draft.version,
                            predecessorId: predecessor,
                          })
                        )
                          setPredecessor("");
                      }}
                    >
                      Abhängigkeit hinzufügen
                    </Button>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="font-medium">Verlauf</h3>
                    {activityError && <p role="alert">{activityError}</p>}
                    {activities.map((a) => (
                      <details key={a.id} className="border-b py-2 text-sm">
                        <summary className="min-h-11 cursor-pointer">
                          {activityLabel[a.action] ?? a.action} ·{" "}
                          {new Date(a.createdAt).toLocaleString("de-AT")} ·{" "}
                          {state.owners.find((o) => o.id === a.actorId)?.displayName ?? a.actorId}
                        </summary>
                        <TaskActivityDetails details={a.details} state={state} />
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </section>
  );
}
