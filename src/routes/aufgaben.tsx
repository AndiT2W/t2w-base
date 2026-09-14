import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Task } from "@t2w/domain/project-management";
import { PageHeader } from "@/components/t2w/PageHeader";
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
import {
  pmGlobalCommand,
  pmRequest,
  priorityLabel,
  statusLabel,
  type PmCommand,
  type PmGlobal,
} from "@/lib/t2w/project-management";

export const Route = createFileRoute("/aufgaben")({ component: Aufgaben });
const control = "min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const healthClass: Record<string, string> = {
  critical: "bg-destructive",
  warning: "bg-amber-500",
  active: "bg-blue-600",
  done: "bg-emerald-600",
  neutral: "bg-muted-foreground",
};
const healthLabel: Record<string, string> = {
  critical: "Blockiert oder überfällig",
  warning: "In 7 Tagen fällig",
  active: "In Arbeit",
  done: "Erledigt",
  neutral: "Offen",
};
const dateValue = (value: string) => new Date(`${value}T00:00:00Z`).getTime();
const isoWeek = (date: Date) => {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  return Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};
const dateText = (date: Date, options: Intl.DateTimeFormatOptions) =>
  date.toLocaleDateString("de-AT", { timeZone: "UTC", ...options });
function urlText(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a key={index} className="underline" href={part} target="_blank" rel="noreferrer">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

function Aufgaben() {
  const [data, setData] = useState<PmGlobal>();
  const [view, setView] = useState<"table" | "gantt">("table");
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [task, setTask] = useState<PmGlobal["tasks"][number] | null>(null);
  const [draft, setDraft] = useState<Partial<Task>>({
    title: "",
    description: "",
    status: "OPEN",
    priority: "NORMAL",
    ownerId: null,
    groupId: null,
    startDate: null,
    endDate: null,
  });
  const [comments, setComments] = useState<
    { id: string; authorId: string; text: string; createdAt: string; updatedAt: string }[]
  >([]);
  const [activities, setActivities] = useState<{ id: string; action: string; createdAt: string }[]>(
    [],
  );
  const [comment, setComment] = useState("");
  const [range, setRange] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [months, setMonths] = useState(3);
  const [error, setError] = useState("");
  const load = async (): Promise<PmGlobal | undefined> => {
    try {
      const next = await pmRequest<PmGlobal>("");
      setData(next);
      setError("");
      return next;
    } catch (value) {
      setError(value instanceof Error ? value.message : "Laden fehlgeschlagen");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!task) return;
    setDraft(task);
    void Promise.all([
      pmRequest<typeof comments>(`/tasks/${task.id}/comments`),
      pmRequest<typeof activities>(`/tasks/${task.id}/activities`),
    ]).then(([nextComments, nextActivities]) => {
      setComments(nextComments);
      setActivities(nextActivities);
    });
  }, [task]);
  const tasks = useMemo(
    () =>
      (data?.tasks ?? []).filter(
        (item) =>
          (!search ||
            `${item.title} ${item.event?.name ?? "Globale Aufgabe"}`
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          (eventFilter === "all" || eventFilter === (item.event?.id ?? "global")) &&
          (statusFilter === "all" || item.status === statusFilter) &&
          (ownerFilter === "all" || (item.ownerId ?? "none") === ownerFilter) &&
          (categoryFilter === "all" || (item.groupId ?? "none") === categoryFilter) &&
          (priorityFilter === "all" || item.priority === priorityFilter) &&
          (!fromDate || (!!item.endDate && item.endDate >= fromDate)) &&
          (!toDate || (!!item.endDate && item.endDate <= toDate)),
      ),
    [
      data,
      search,
      eventFilter,
      statusFilter,
      ownerFilter,
      categoryFilter,
      priorityFilter,
      fromDate,
      toDate,
    ],
  );
  const taskById = useMemo(() => new Map(tasks.map((item) => [item.id, item])), [tasks]);
  const allTaskById = useMemo(
    () => new Map((data?.tasks ?? []).map((item) => [item.id, item])),
    [data],
  );
  const blocks = useMemo(() => {
    const result = new Map<
      string,
      {
        event: PmGlobal["eventChoices"][number] | null;
        categories: Map<string | null, typeof tasks>;
      }
    >();
    for (const item of tasks) {
      const key = item.event?.id ?? "global";
      if (!result.has(key)) result.set(key, { event: item.event, categories: new Map() });
      const categories = result.get(key)!.categories;
      const group = item.groupId;
      if (!categories.has(group)) categories.set(group, []);
      categories.get(group)!.push(item);
    }
    return [...result.entries()];
  }, [tasks]);
  const categoryName = (id: string | null) =>
    data?.groups.find((group) => group.id === id)?.name ?? "Ohne Kategorie";
  const health = (items: typeof tasks) =>
    items.some((item) => item.overdue || item.blockedBy.length)
      ? "critical"
      : items.some((item) => item.dueSoon)
        ? "warning"
        : items.every((item) => item.status === "DONE") && items.length
          ? "done"
          : items.some((item) => item.status === "IN_PROGRESS")
            ? "active"
            : "neutral";
  const next = (items: typeof tasks) =>
    items
      .filter((item) => item.status !== "DONE" && !item.blockedBy.length)
      .sort((a, b) => (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999"))[0];
  async function command(command: PmCommand) {
    if (task?.event) {
      const event = data?.events.find((item) => item.id === task.event?.id);
      return pmRequest(`/events/${task.event.id}/commands`, {
        ...command,
        graphVersion: event?.pmGraphVersion,
      });
    }
    return pmGlobalCommand(command);
  }
  async function save() {
    if (!task) return;
    try {
      await command({ type: "update", taskId: task.id, taskVersion: task.version, task: draft });
      await load();
      setTask(null);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Speichern fehlgeschlagen");
    }
  }
  async function createGlobal(): Promise<void> {
    try {
      await pmGlobalCommand({ type: "create", task: { ...draft, title: draft.title ?? "" } });
      await load();
      setTask(null);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Anlegen fehlgeschlagen");
    }
  }
  async function updateDependency(
    type: "add-dependency" | "remove-dependency",
    predecessorId: string,
  ) {
    if (!task) return;
    try {
      await command({ type, taskId: task.id, taskVersion: task.version, predecessorId });
      const next = await load();
      setTask(next?.tasks.find((item) => item.id === task.id) ?? null);
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Voraussetzung konnte nicht geändert werden",
      );
    }
  }
  const start = new Date(`${range}T00:00:00Z`),
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1)),
    duration = end.getTime() - start.getTime();
  const timelineDays = Array.from({ length: Math.round(duration / 86400000) }, (_, index) => {
    const date = new Date(start.getTime() + index * 86400000);
    return { date, index, weekend: [0, 6].includes(date.getUTCDay()) };
  });
  const calendarWeeks = timelineDays.reduce<{ index: number; length: number; label: string }[]>(
    (weeks, day) => {
      const week = weeks.at(-1);
      if (!week || day.date.getUTCDay() === 1) {
        weeks.push({ index: day.index, length: 1, label: `KW ${isoWeek(day.date)}` });
      } else {
        week.length += 1;
      }
      return weeks;
    },
    [],
  );
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const todayIndex = Math.round((today - start.getTime()) / 86400000);
  const ganttEvents = blocks
    .map(([eventId, block]) => ({
      key: eventId,
      name: block.event?.name ?? "Globale Aufgaben",
      categories: [...block.categories.entries()]
        .map(([groupId, items]) => ({
          key: `${eventId}:${groupId ?? "none"}`,
          name: categoryName(groupId),
          items: items.filter((item) => {
            const itemStart = dateValue(item.startDate ?? item.endDate!);
            const itemEnd = dateValue(item.endDate ?? item.startDate!);
            return itemEnd >= start.getTime() && itemStart < end.getTime();
          }),
        }))
        .filter((category) => category.items.length),
    }))
    .filter((event) => event.categories.length);
  return (
    <main className="space-y-5">
      <PageHeader
        titel="Aufgaben"
        beschreibung="Gesamtübersicht über Event- und globale Aufgaben"
      />
      {error && (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>
          Übersicht
        </Button>
        <Button
          className="hidden md:inline-flex"
          variant={view === "gantt" ? "default" : "outline"}
          onClick={() => setView("gantt")}
        >
          Gantt
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setTask({
              id: "",
              scope: "GLOBAL",
              eventId: null,
              title: "",
              description: "",
              status: "OPEN",
              priority: "NORMAL",
              ownerId: null,
              groupId: null,
              startDate: null,
              endDate: null,
              version: 0,
              blockedBy: [],
              overdue: false,
              dueSoon: false,
              event: null,
            });
            setDraft({
              title: "",
              description: "",
              status: "OPEN",
              priority: "NORMAL",
              ownerId: null,
              groupId: null,
              startDate: null,
              endDate: null,
            });
          }}
        >
          Globale Aufgabe anlegen
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <Label htmlFor="task-search">Suche</Label>
          <Input
            id="task-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="task-event">Event</Label>
          <select
            id="task-event"
            className={control}
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
          >
            <option value="all">Alle Events</option>
            <option value="global">Global</option>
            {data?.eventChoices.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="task-status">Status</Label>
          <select
            id="task-status"
            className={control}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Alle Status</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="task-owner">Person</Label>
          <select
            id="task-owner"
            className={control}
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
          >
            <option value="all">Alle Personen</option>
            <option value="none">Nicht zugeordnet</option>
            {data?.owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>
      <details className="rounded-md border p-3">
        <summary className="cursor-pointer font-medium">Weitere Filter</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div>
            <Label htmlFor="task-category">Kategorie</Label>
            <select
              id="task-category"
              className={control}
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">Alle Kategorien</option>
              <option value="none">Ohne Kategorie</option>
              {data?.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="task-priority">Priorität</Label>
            <select
              id="task-priority"
              className={control}
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="all">Alle Prioritäten</option>
              {Object.entries(priorityLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="task-from">Ende ab</Label>
            <Input
              id="task-from"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="task-to">Ende bis</Label>
            <Input
              id="task-to"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>
        </div>
      </details>
      {view === "table" ? (
        <div className="space-y-4">
          {blocks.map(([eventId, block]) => (
            <section key={eventId} className="rounded-lg border">
              <header className="border-b px-4 py-3">
                <h2 className="font-semibold">{block.event?.name ?? "Globale Aufgaben"}</h2>
              </header>
              {[...block.categories.entries()].map(([groupId, items]) => {
                const key = `${eventId}:${groupId ?? "none"}`,
                  state = health(items),
                  ready = next(items),
                  shown = expanded === key;
                const stages: string[][] = [];
                const remaining = new Set(items.map((item) => item.id));
                while (remaining.size) {
                  const stage = [...remaining].filter(
                    (id) =>
                      !data?.edges.some(
                        (edge) => edge.successorId === id && remaining.has(edge.predecessorId),
                      ),
                  );
                  if (!stage.length) break;
                  stages.push(stage);
                  stage.forEach((id) => remaining.delete(id));
                }
                return (
                  <article key={key} className="border-b last:border-0">
                    <button
                      className="w-full cursor-pointer p-4 text-left"
                      aria-expanded={shown}
                      onClick={() => setExpanded(shown ? null : key)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-3 w-3 rounded-full ${healthClass[state]}`}
                            aria-hidden="true"
                          />
                          <strong>{categoryName(groupId)}</strong>
                          <span className="text-sm text-muted-foreground">
                            {healthLabel[state]}
                          </span>
                        </span>
                        <span className="text-sm">
                          {items.filter((item) => item.status === "OPEN").length} offen ·{" "}
                          {items.filter((item) => item.status === "IN_PROGRESS").length} in Arbeit ·{" "}
                          {items.filter((item) => item.status === "DONE").length} erledigt
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nächster Schritt: {ready?.title ?? "—"}
                        {ready?.endDate ? ` · Ende ${ready.endDate}` : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stages.flatMap((stage, index) => [
                          index ? (
                            <span key={`a-${index}`} aria-hidden="true">
                              →
                            </span>
                          ) : null,
                          ...stage.map((id) => (
                            <span key={id} className="rounded-full border px-2 py-1 text-xs">
                              {taskById.get(id)?.title}
                            </span>
                          )),
                        ])}
                      </div>
                    </button>
                    {shown && (
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-t text-muted-foreground">
                              <th className="p-3">Name</th>
                              <th className="p-3">Person</th>
                              <th className="p-3">Ende</th>
                              <th className="p-3">Priorität</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.id} className="border-t">
                                <td className="p-3">
                                  <button
                                    className="min-h-11 text-left font-medium underline"
                                    onClick={() => setTask(item)}
                                  >
                                    {item.title}
                                  </button>
                                  {item.blockedBy.length > 0 && (
                                    <p className="text-xs text-destructive">Blockiert</p>
                                  )}
                                </td>
                                <td className="p-3">
                                  {data?.owners.find((owner) => owner.id === item.ownerId)
                                    ?.displayName ?? "—"}
                                </td>
                                <td className="p-3">{item.endDate ?? "—"}</td>
                                <td className="p-3">{priorityLabel[item.priority]}</td>
                                <td className="p-3">{statusLabel[item.status]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {shown && (
                      <div className="space-y-2 p-3 md:hidden">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            className="w-full rounded-md border p-3 text-left"
                            onClick={() => setTask(item)}
                          >
                            <strong>{item.title}</strong>
                            <p className="text-sm text-muted-foreground">
                              {statusLabel[item.status]} · {item.endDate ?? "Ohne Ende"}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      ) : (
        <section className="hidden rounded-lg border p-4 md:block">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Gantt</h2>
              <p className="text-sm text-muted-foreground">
                Zeitraum, Meilensteine und Voraussetzungen
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="gantt-range">Startmonat</Label>
                <Input
                  id="gantt-range"
                  type="month"
                  value={range.slice(0, 7)}
                  onChange={(event) => setRange(`${event.target.value}-01`)}
                />
              </div>
              <div>
                <Label htmlFor="gantt-months">Zeitraum</Label>
                <select
                  id="gantt-months"
                  className={control}
                  value={months}
                  onChange={(event) => setMonths(Number(event.target.value))}
                >
                  <option value={3}>3 Monate</option>
                  <option value={6}>6 Monate</option>
                  <option value={12}>12 Monate</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-auto rounded-md border bg-background">
            <div style={{ minWidth: `${352 + timelineDays.length * 32}px` }}>
              <div className="grid grid-cols-[22rem_minmax(0,1fr)] border-b">
                <div className="sticky left-0 z-30 grid grid-cols-[1fr_5rem] border-r bg-background text-xs text-muted-foreground">
                  <span className="px-3 py-2">Name</span>
                  <span className="px-2 py-2">Ende</span>
                </div>
                <div
                  className="grid text-xs text-muted-foreground"
                  style={{ gridTemplateColumns: `repeat(${timelineDays.length}, 32px)` }}
                >
                  {calendarWeeks.map((week) => (
                    <span
                      key={`${week.index}-${week.label}`}
                      className="border-l px-2 py-2 font-medium"
                      style={{ gridColumn: `${week.index + 1} / span ${week.length}` }}
                    >
                      {week.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[22rem_minmax(0,1fr)] border-b">
                <div className="sticky left-0 z-30 border-r bg-background" />
                <div
                  className="grid text-center text-[11px] text-muted-foreground"
                  style={{ gridTemplateColumns: `repeat(${timelineDays.length}, 32px)` }}
                >
                  {timelineDays.map((day) => (
                    <span
                      key={day.index}
                      className={`min-h-9 border-l py-1 ${day.weekend ? "bg-muted/60" : ""} ${day.index === todayIndex ? "bg-destructive text-destructive-foreground" : ""}`}
                    >
                      <span className="block font-medium">
                        {dateText(day.date, { weekday: "short" })}
                      </span>
                      <span>{dateText(day.date, { day: "numeric" })}</span>
                    </span>
                  ))}
                </div>
              </div>
              {ganttEvents.map((event) => (
                <section key={event.key} data-testid="gantt-event">
                  <div className="grid grid-cols-[22rem_minmax(0,1fr)] border-b bg-muted/70">
                    <span className="sticky left-0 z-20 border-r bg-muted/70 px-3 py-2 text-sm font-semibold">
                      {event.name}
                    </span>
                    <span />
                  </div>
                  {event.categories.map((category) => (
                    <div key={category.key} data-testid="gantt-category">
                      <div className="grid grid-cols-[22rem_minmax(0,1fr)] border-b bg-muted/30">
                        <span className="sticky left-0 z-20 border-r bg-muted/30 px-3 py-2 pl-7 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {category.name}
                        </span>
                        <span />
                      </div>
                      {category.items.map((item) => {
                        const itemStart = item.startDate ?? item.endDate!;
                        const itemEnd = item.endDate ?? item.startDate!;
                        const left = Math.max(
                          0,
                          Math.min(
                            timelineDays.length - 1,
                            Math.floor((dateValue(itemStart) - start.getTime()) / 86400000),
                          ),
                        );
                        const endOffset = Math.max(
                          left + 1,
                          Math.min(
                            timelineDays.length,
                            Math.ceil((dateValue(itemEnd) - start.getTime()) / 86400000) + 1,
                          ),
                        );
                        const width = Math.max(16, (endOffset - left) * 32);
                        const dependency = data?.edges.find(
                          (edge) =>
                            edge.successorId === item.id && allTaskById.has(edge.predecessorId),
                        );
                        const predecessor = dependency
                          ? allTaskById.get(dependency.predecessorId)
                          : undefined;
                        const predecessorEnd = predecessor?.endDate ?? predecessor?.startDate;
                        const dependencyLeft = predecessorEnd
                          ? Math.max(
                              0,
                              Math.min(
                                timelineDays.length - 1,
                                Math.floor(
                                  (dateValue(predecessorEnd) - start.getTime()) / 86400000,
                                ),
                              ),
                            )
                          : null;
                        const dependencyWidth =
                          dependencyLeft === null ? 0 : Math.max(0, (left - dependencyLeft) * 32);
                        const tone =
                          item.status === "DONE"
                            ? "bg-emerald-600"
                            : item.status === "IN_PROGRESS"
                              ? "bg-sky-600"
                              : item.blockedBy.length
                                ? "bg-amber-600"
                                : "bg-primary";
                        return (
                          <button
                            key={item.id}
                            className="grid w-full grid-cols-[22rem_minmax(0,1fr)] border-b text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => setTask(item)}
                          >
                            <span className="sticky left-0 z-20 grid min-h-11 grid-cols-[1fr_5rem] border-r bg-background">
                              <span className="flex min-w-0 items-center gap-2 px-3">
                                <span
                                  className={`size-2 shrink-0 rounded-full ${tone}`}
                                  aria-label={statusLabel[item.status]}
                                />
                                <strong className="truncate text-sm">{item.title}</strong>
                              </span>
                              <time className="self-center px-2 text-xs text-muted-foreground">
                                {item.endDate ?? "—"}
                              </time>
                            </span>
                            <span
                              className="relative grid min-h-11"
                              style={{
                                gridTemplateColumns: `repeat(${timelineDays.length}, 32px)`,
                              }}
                            >
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 grid"
                                style={{
                                  gridTemplateColumns: `repeat(${timelineDays.length}, 32px)`,
                                }}
                              >
                                {timelineDays.map((day) => (
                                  <span
                                    key={day.index}
                                    className={`border-l border-border/40 ${day.weekend ? "bg-muted/60" : ""}`}
                                  />
                                ))}
                              </span>
                              {todayIndex >= 0 && todayIndex < timelineDays.length && (
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-y-0 z-10 w-px bg-destructive"
                                  style={{ left: `${todayIndex * 32 + 16}px` }}
                                />
                              )}
                              {dependencyWidth > 0 && (
                                <span
                                  className="absolute top-1 z-10 h-px bg-muted-foreground"
                                  style={{
                                    left: `${dependencyLeft! * 32 + 16}px`,
                                    width: `${dependencyWidth}px`,
                                  }}
                                  title={`Voraussetzung: ${predecessor?.title}`}
                                >
                                  <span className="absolute -right-1 -top-1.5">›</span>
                                </span>
                              )}
                              <span
                                className={`absolute top-1/2 z-20 -translate-y-1/2 ${tone} ${item.startDate && item.endDate ? "h-5 rounded-sm" : "size-4 rotate-45"}`}
                                style={{
                                  left: `${left * 32 + 4}px`,
                                  width:
                                    item.startDate && item.endDate ? `${width - 8}px` : undefined,
                                }}
                                aria-label={`${item.title}: ${itemStart} bis ${itemEnd}`}
                              />
                              <span
                                className="absolute top-1/2 z-20 -translate-y-1/2 whitespace-nowrap pl-2 text-xs font-medium"
                                style={{ left: `${left * 32 + width}px` }}
                              >
                                {item.title}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </div>
          <aside className="mt-5 border-t pt-4">
            <h3 className="font-medium">Noch nicht terminiert</h3>
            {tasks
              .filter((item) => !item.startDate && !item.endDate)
              .map((item) => (
                <button
                  key={item.id}
                  className="mr-3 mt-2 rounded border px-3 py-2 text-sm underline"
                  onClick={() => setTask(item)}
                >
                  {item.title}
                </button>
              ))}
          </aside>
        </section>
      )}
      <Sheet open={!!task} onOpenChange={(shown) => !shown && setTask(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{task?.id ? "Aufgabe bearbeiten" : "Globale Aufgabe anlegen"}</SheetTitle>
            <SheetDescription>Details, Termine, Voraussetzungen und Kommentare</SheetDescription>
          </SheetHeader>
          {task && (
            <div className="space-y-4 p-4">
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void (task.id ? save() : createGlobal());
                }}
              >
                <Label htmlFor="global-title">Titel</Label>
                <Input
                  id="global-title"
                  required
                  value={draft.title ?? ""}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
                <Label htmlFor="global-description">Beschreibung</Label>
                <textarea
                  id="global-description"
                  className={control}
                  rows={5}
                  value={draft.description ?? ""}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="global-status">Status</Label>
                    <select
                      id="global-status"
                      className={control}
                      value={draft.status ?? "OPEN"}
                      onChange={(event) =>
                        setDraft({ ...draft, status: event.target.value as Task["status"] })
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
                    <Label htmlFor="global-priority">Priorität</Label>
                    <select
                      id="global-priority"
                      className={control}
                      value={draft.priority ?? "NORMAL"}
                      onChange={(event) =>
                        setDraft({ ...draft, priority: event.target.value as Task["priority"] })
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
                    <Label htmlFor="global-owner">Person</Label>
                    <select
                      id="global-owner"
                      className={control}
                      value={draft.ownerId ?? ""}
                      onChange={(event) =>
                        setDraft({ ...draft, ownerId: event.target.value || null })
                      }
                    >
                      <option value="">Nicht zugeordnet</option>
                      {data?.owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="global-category">Kategorie</Label>
                    <select
                      id="global-category"
                      className={control}
                      value={draft.groupId ?? ""}
                      onChange={(event) =>
                        setDraft({ ...draft, groupId: event.target.value || null })
                      }
                    >
                      <option value="">Ohne Kategorie</option>
                      {data?.groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="global-start">Start</Label>
                    <Input
                      id="global-start"
                      type="date"
                      value={draft.startDate ?? ""}
                      onChange={(event) =>
                        setDraft({ ...draft, startDate: event.target.value || null })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="global-end">Ende</Label>
                    <Input
                      id="global-end"
                      type="date"
                      value={draft.endDate ?? ""}
                      onChange={(event) =>
                        setDraft({ ...draft, endDate: event.target.value || null })
                      }
                    />
                  </div>
                </div>
                <Button>{task.id ? "Änderungen speichern" : "Aufgabe anlegen"}</Button>
              </form>
              {task.id && (
                <section className="border-t pt-4">
                  <h3 className="font-medium">Voraussetzungen</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Eine Aufgabe kann erst erledigt werden, wenn alle Vorgänger erledigt sind.
                  </p>
                  <div className="mt-2 space-y-2">
                    {data?.edges
                      .filter((edge) => edge.successorId === task.id)
                      .map((edge) => {
                        const predecessor = allTaskById.get(edge.predecessorId);
                        return (
                          <div
                            key={edge.predecessorId}
                            className="flex items-center justify-between gap-3 rounded border p-2 text-sm"
                          >
                            <span>{predecessor?.title ?? "Gelöschte Aufgabe"}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                void updateDependency("remove-dependency", edge.predecessorId)
                              }
                            >
                              Entfernen
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                  <Label className="mt-3 block" htmlFor="global-predecessor">
                    Vorgänger hinzufügen
                  </Label>
                  <select
                    id="global-predecessor"
                    className={control}
                    defaultValue=""
                    onChange={(event) => {
                      if (event.target.value)
                        void updateDependency("add-dependency", event.target.value);
                      event.currentTarget.value = "";
                    }}
                  >
                    <option value="">Aufgabe auswählen</option>
                    {data?.tasks
                      .filter(
                        (candidate) =>
                          candidate.id !== task.id &&
                          candidate.scope === task.scope &&
                          candidate.eventId === task.eventId &&
                          !data.edges.some(
                            (edge) =>
                              edge.successorId === task.id && edge.predecessorId === candidate.id,
                          ),
                      )
                      .map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.title}
                        </option>
                      ))}
                  </select>
                </section>
              )}
              {task.id && (
                <section className="border-t pt-4">
                  <h3 className="font-medium">Beschreibung</h3>
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {urlText(task.description)}
                  </p>
                  <h3 className="mt-4 font-medium">Kommentare</h3>
                  {comments.map((item) => (
                    <article key={item.id} className="border-b py-2">
                      <p className="whitespace-pre-wrap">{urlText(item.text)}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.updatedAt).toLocaleString("de-AT")}
                          {item.updatedAt !== item.createdAt ? " · bearbeitet" : ""}
                        </p>
                        <span className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              const text = window.prompt("Kommentar bearbeiten", item.text);
                              if (text === null) return;
                              await pmRequest(`/tasks/${task.id}/comments`, { id: item.id, text });
                              const [nextComments, nextActivities] = await Promise.all([
                                pmRequest<typeof comments>(`/tasks/${task.id}/comments`),
                                pmRequest<typeof activities>(`/tasks/${task.id}/activities`),
                              ]);
                              setComments(nextComments);
                              setActivities(nextActivities);
                            }}
                          >
                            Bearbeiten
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              if (!window.confirm("Kommentar dauerhaft löschen?")) return;
                              await pmRequest(`/tasks/${task.id}/comments`, {
                                id: item.id,
                                delete: true,
                              });
                              const [nextComments, nextActivities] = await Promise.all([
                                pmRequest<typeof comments>(`/tasks/${task.id}/comments`),
                                pmRequest<typeof activities>(`/tasks/${task.id}/activities`),
                              ]);
                              setComments(nextComments);
                              setActivities(nextActivities);
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
                      await pmRequest(`/tasks/${task.id}/comments`, { text: comment });
                      setComment("");
                      const [nextComments, nextActivities] = await Promise.all([
                        pmRequest<typeof comments>(`/tasks/${task.id}/comments`),
                        pmRequest<typeof activities>(`/tasks/${task.id}/activities`),
                      ]);
                      setComments(nextComments);
                      setActivities(nextActivities);
                    }}
                  >
                    <Label htmlFor="global-comment">Kommentar</Label>
                    <textarea
                      id="global-comment"
                      className={control}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                    />
                    <Button variant="outline">Kommentieren</Button>
                  </form>
                  <h3 className="mt-5 font-medium">Verlauf</h3>
                  {activities.map((item) => (
                    <p key={item.id} className="border-b py-2 text-sm">
                      {item.action} · {new Date(item.createdAt).toLocaleString("de-AT")}
                    </p>
                  ))}
                  <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={async () => {
                      if (window.confirm("Aufgabe dauerhaft löschen?")) {
                        await pmGlobalCommand({
                          type: "delete",
                          taskId: task.id,
                          taskVersion: task.version,
                        });
                        await load();
                        setTask(null);
                      }
                    }}
                  >
                    Aufgabe löschen
                  </Button>
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
