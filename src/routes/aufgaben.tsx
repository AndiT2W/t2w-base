import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { projectTaskPortfolios, type Task } from "@t2w/domain/project-management";
import { PageHeader } from "@/components/t2w/PageHeader";
import { TaskFlowBadges } from "@/components/t2w/TaskFlowBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/t2w/DataTable";
import { TaskDetailSheet } from "@/components/t2w/TaskDetailSheet";
import { pmRequest, priorityLabel, statusLabel, type PmGlobal } from "@/lib/t2w/project-management";
import {
  createTaskInteractionWorkspace,
  createHttpTaskInteractionAdapter,
} from "@/lib/t2w/task-interaction-workspace";

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
type VisibleTask = ReturnType<
  typeof projectTaskPortfolios
>[number]["portfolio"]["tasks"][number] & {
  event: PmGlobal["eventChoices"][number] | null;
};
function portfolioBlocks(data: PmGlobal, sourceTasks: PmGlobal["tasks"]) {
  return projectTaskPortfolios(
    sourceTasks,
    data.edges,
    { owners: data.owners, groups: data.groups },
    data.referenceTime,
  ).map(({ eventId, portfolio }) => {
    const event = sourceTasks.find((task) => task.eventId === eventId)?.event ?? null;
    return {
      key: eventId ?? "global",
      event,
      categories: portfolio.categories.map((category) => {
        const tasks = portfolio.tasks
          .filter((task) => task.groupId === category.groupId)
          .map((task) => ({ ...task, event }));
        return { ...category, tasks, flows: category.flows };
      }),
    };
  });
}
function visibleTask(data: PmGlobal, taskId: string): VisibleTask | null {
  return (
    portfolioBlocks(data, data.tasks)
      .flatMap((block) => block.categories.flatMap((category) => category.tasks))
      .find((task) => task.id === taskId) ?? null
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
  const [range, setRange] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [months, setMonths] = useState(3);
  const [loadError, setLoadError] = useState("");
  const dataRef = useRef<PmGlobal | undefined>(undefined);
  const interaction = useMemo(
    () =>
      createTaskInteractionWorkspace(
        createHttpTaskInteractionAdapter<PmGlobal, VisibleTask>(async (command) => {
          const current = dataRef.current;
          if (!current) throw new Error("Aufgaben sind noch nicht geladen.");
          const source = command.taskId
            ? current.tasks.find((candidate) => candidate.id === command.taskId)
            : null;
          if (source?.event) {
            const event = current.events.find((candidate) => candidate.id === source.event?.id);
            await pmRequest(`/events/${source.event.id}/commands`, {
              ...command,
              graphVersion: event?.pmGraphVersion,
            });
          } else {
            await pmRequest("/commands", command);
          }
          const next = await pmRequest<PmGlobal>("");
          dataRef.current = next;
          return {
            state: next,
            task:
              command.taskId && command.type === "delete"
                ? null
                : command.taskId
                  ? visibleTask(next, command.taskId)
                  : (next.tasks
                      .filter((candidate) => candidate.title === command.task?.title)
                      .map((candidate) => visibleTask(next, candidate.id))
                      .find(Boolean) ?? null),
          };
        }),
      ),
    [],
  );
  const [interactionSnapshot, setInteractionSnapshot] = useState(() => interaction.snapshot());
  useEffect(
    () => interaction.subscribe(() => setInteractionSnapshot(interaction.snapshot())),
    [interaction],
  );
  const task = interactionSnapshot.task;
  const draft = interactionSnapshot.draft;
  const { activities, comments } = interactionSnapshot;
  const error = loadError || interactionSnapshot.error || "";
  const load = async (): Promise<PmGlobal | undefined> => {
    try {
      const next = await pmRequest<PmGlobal>("");
      dataRef.current = next;
      setData(next);
      setLoadError("");
      return next;
    } catch (value) {
      setLoadError(value instanceof Error ? value.message : "Laden fehlgeschlagen");
      return undefined;
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const rawTasks = useMemo(
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
  const blocks = useMemo(() => {
    if (!data) return [];
    return portfolioBlocks(data, rawTasks);
  }, [data, rawTasks]);
  const tasks = useMemo(
    () => blocks.flatMap((block) => block.categories.flatMap((category) => category.tasks)),
    [blocks],
  );
  const taskById = useMemo(() => new Map(tasks.map((item) => [item.id, item])), [tasks]);
  const allTaskById = useMemo(
    () => new Map((data?.tasks ?? []).map((item) => [item.id, item])),
    [data],
  );
  const categoryName = (id: string | null) =>
    data?.groups.find((group) => group.id === id)?.name ?? "Ohne Kategorie";
  async function save() {
    if (!task) return;
    const next = await interaction.command({
      type: "update",
      taskId: task.id,
      taskVersion: task.version,
      task: draft,
    });
    if (next) setData(next);
  }
  async function createGlobal(): Promise<void> {
    const next = await interaction.command({
      type: "create",
      task: { ...draft, title: draft.title ?? "" },
    });
    if (next) setData(next);
  }
  async function updateDependency(
    type: "add-dependency" | "remove-dependency",
    predecessorId: string,
  ) {
    if (!task) return;
    const next = await interaction.command({
      type,
      taskId: task.id,
      taskVersion: task.version,
      predecessorId,
    });
    if (next) setData(next);
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
    .map((block) => ({
      key: block.key,
      name: block.event?.name ?? "Globale Aufgaben",
      categories: block.categories
        .map((category) => ({
          key: `${block.key}:${category.groupId ?? "none"}`,
          name: categoryName(category.groupId),
          items: category.tasks.filter((item) => {
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
            void interaction.open({
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
          {blocks.map((block) => (
            <section key={block.key} className="rounded-lg border">
              <header className="border-b px-4 py-3">
                <h2 className="font-semibold">{block.event?.name ?? "Globale Aufgaben"}</h2>
              </header>
              {block.categories.map((category) => {
                const key = `${block.key}:${category.groupId ?? "none"}`,
                  shown = expanded === key;
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
                            className={`h-3 w-3 rounded-full ${healthClass[category.health]}`}
                            aria-hidden="true"
                          />
                          <strong>{categoryName(category.groupId)}</strong>
                          <span className="text-sm text-muted-foreground">
                            {healthLabel[category.health]}
                          </span>
                        </span>
                        <span className="text-sm">
                          {category.counts.open} offen · {category.counts.inProgress} in Arbeit ·{" "}
                          {category.counts.done} erledigt
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nächster Schritt: {taskById.get(category.nextTaskId ?? "")?.title ?? "—"}
                        {category.nextEndDate ? ` · Ende ${category.nextEndDate}` : ""}
                      </p>
                      <TaskFlowBadges flows={category.flows} taskById={taskById} />
                    </button>
                    {shown && (
                      <div className="hidden overflow-x-auto md:block">
                        <DataTable>
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
                            {category.tasks.map((item) => (
                              <tr key={item.id} className="border-t">
                                <td className="p-3">
                                  <button
                                    className="min-h-11 text-left font-medium underline"
                                    onClick={() => void interaction.open(item)}
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
                        </DataTable>
                      </div>
                    )}
                    {shown && (
                      <div className="space-y-2 p-3 md:hidden">
                        {category.tasks.map((item) => (
                          <button
                            key={item.id}
                            className="w-full rounded-md border p-3 text-left"
                            onClick={() => void interaction.open(item)}
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
                            onClick={() => void interaction.open(item)}
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
                  onClick={() => void interaction.open(item)}
                >
                  {item.title}
                </button>
              ))}
          </aside>
        </section>
      )}
      <TaskDetailSheet
        task={task}
        draft={draft}
        owners={data?.owners ?? []}
        groups={data?.groups ?? []}
        tasks={(data?.tasks ?? []).filter(
          (candidate) => candidate.scope === task?.scope && candidate.eventId === task?.eventId,
        )}
        edges={data?.edges ?? []}
        comments={comments}
        activities={activities}
        busy={interactionSnapshot.busy}
        title={task?.id ? "Aufgabe bearbeiten" : "Globale Aufgabe anlegen"}
        description="Details, Termine, Voraussetzungen und Kommentare"
        onClose={() => interaction.close()}
        onDraftChange={(patch) => interaction.updateDraft(patch)}
        onSubmit={() => (task?.id ? save() : createGlobal())}
        onAddDependency={(predecessorId) => updateDependency("add-dependency", predecessorId)}
        onRemoveDependency={(predecessorId) => updateDependency("remove-dependency", predecessorId)}
        onWriteComment={(input) => interaction.writeComment(input)}
        onDelete={async () => {
          if (!task) return;
          const next = await interaction.command({
            type: "delete",
            taskId: task.id,
            taskVersion: task.version,
          });
          if (next) setData(next);
        }}
      />
    </main>
  );
}
