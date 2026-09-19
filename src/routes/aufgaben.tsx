import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Task } from "@t2w/domain/project-management";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  CirclePlay,
  Clock3,
  Search,
  type LucideIcon,
} from "lucide-react";
import { SelectionBadge } from "@/components/t2w/ServiceBadge";
import { PageHeader } from "@/components/t2w/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskDetailSheet } from "@/components/t2w/TaskDetailSheet";
import { formatDatum } from "@/lib/t2w/format";
import {
  createGlobalTaskInteractionAdapter,
  pmGlobalRead,
  priorityLabel,
  statusLabel,
  type PmGlobal,
  type PmGlobalTask,
} from "@/lib/t2w/project-management";
import { createTaskInteractionWorkspace } from "@/lib/t2w/task-interaction-workspace";
import { TaskQueue } from "@/components/t2w/TaskQueue";
import { useT2W } from "@/lib/t2w/store";
import {
  QUEUE_GROUP_LABEL,
  queueCounts,
  queueGroupOf,
  type QueueGroupKey,
} from "@/lib/t2w/task-queue";

export const Route = createFileRoute("/aufgaben")({ component: Aufgaben });
/**
 * Ein Filter als Chip. Die Auswahl bleibt ein natives select: es bringt
 * Tastaturbedienung, Bildschirmleser und die Mobilauswahl des Systems mit,
 * ein nachgebautes Menü müsste das alles erst wieder herstellen.
 */
function FilterChip({
  label,
  value,
  inaktiv,
  onChange,
  children,
}: {
  label: string;
  value: string;
  inaktiv: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const aktiv = value !== inaktiv;
  return (
    <label
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm md:min-h-8 ${
        aktiv ? "border-primary/50 bg-primary/10" : "border-input bg-card"
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className={`max-w-40 cursor-pointer truncate bg-transparent pr-1 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          aktiv ? "font-semibold" : ""
        }`}
      >
        {children}
      </select>
    </label>
  );
}

function DateChip({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm md:min-h-8 ${
        value ? "border-primary/50 bg-primary/10" : "border-input bg-card"
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className={`cursor-pointer bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          value ? "font-semibold" : "text-muted-foreground"
        }`}
      />
    </label>
  );
}

const FOKUS = [
  {
    key: "overdue" as const,
    label: QUEUE_GROUP_LABEL.overdue.toLowerCase(),
    dot: "bg-task-overdue",
    activeClass: "border-task-overdue/50 bg-task-overdue-soft",
  },
  {
    key: "thisWeek" as const,
    label: QUEUE_GROUP_LABEL.thisWeek.toLowerCase(),
    dot: "bg-task-waiting",
    activeClass: "border-task-waiting/50 bg-task-waiting-soft",
  },
  {
    key: "blocked" as const,
    label: QUEUE_GROUP_LABEL.blocked.toLowerCase(),
    dot: "bg-task-open",
    activeClass: "border-input bg-muted",
  },
];

const control =
  "min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:min-h-8 md:py-1";
const dateValue = (value: string) => new Date(`${value}T00:00:00Z`).getTime();
const isoWeek = (date: Date) => {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  return Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};
const dateText = (date: Date, options: Intl.DateTimeFormatOptions) =>
  date.toLocaleDateString("de-AT", { timeZone: "UTC", ...options });
const taskStatusTone = (task: VisibleTask) => {
  if (task.overdue || task.blockedBy.length)
    return "border-destructive/30 bg-destructive/10 text-destructive";
  if (task.status === "DONE")
    return "border-emerald-700/25 bg-emerald-700/10 text-emerald-800 dark:text-emerald-300";
  if (task.status === "IN_PROGRESS")
    return "border-sky-700/25 bg-sky-700/10 text-sky-800 dark:text-sky-300";
  return "border-border bg-muted text-muted-foreground";
};
type VisibleTask = PmGlobalTask;

function categoryHealthPresentation(
  health: "critical" | "warning" | "active" | "done" | "neutral",
): { Icon: LucideIcon; label: string; tone: string } {
  if (health === "critical")
    return {
      Icon: AlertTriangle,
      label: "Blockiert oder überfällig",
      tone: "border-destructive/30 bg-destructive/10 text-destructive",
    };
  if (health === "warning")
    return {
      Icon: Clock3,
      label: "In den nächsten 7 Tagen fällig",
      tone: "border-amber-700/25 bg-amber-700/10 text-amber-800 dark:text-amber-300",
    };
  if (health === "active")
    return {
      Icon: CirclePlay,
      label: "In Arbeit",
      tone: "border-sky-700/25 bg-sky-700/10 text-sky-800 dark:text-sky-300",
    };
  if (health === "done")
    return {
      Icon: CheckCircle2,
      label: "Erledigt",
      tone: "border-emerald-700/25 bg-emerald-700/10 text-emerald-800 dark:text-emerald-300",
    };
  return {
    Icon: CircleDot,
    label: "Offen",
    tone: "border-border bg-muted text-muted-foreground",
  };
}

function Aufgaben() {
  const { currentUser } = useT2W();
  const readOnly = currentUser.role === "ORGANIZER";
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
  const [range, setRange] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [months, setMonths] = useState(3);
  const [focus, setFocus] = useState<QueueGroupKey | "all">("all");
  const [loadError, setLoadError] = useState("");
  const interaction = useMemo(
    () =>
      createTaskInteractionWorkspace(
        createGlobalTaskInteractionAdapter({
          update: setData,
        }),
      ),
    [],
  );
  const interactionSnapshot = useSyncExternalStore(
    interaction.subscribe,
    interaction.snapshot,
    interaction.snapshot,
  );
  const error = loadError || interactionSnapshot.error || "";
  const load = async (): Promise<PmGlobal | undefined> => {
    try {
      const next = await pmGlobalRead();
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
    const visibleTaskIds = new Set(rawTasks.map((task) => task.id));
    return data.blocks
      .map((block) => ({
        ...block,
        categories: block.categories
          .map((category) => ({
            ...category,
            tasks: category.tasks.filter((task) => visibleTaskIds.has(task.id)),
          }))
          .filter((category) => category.tasks.length),
      }))
      .filter((block) => block.categories.length);
  }, [data, rawTasks]);
  const tasks = useMemo(
    () => blocks.flatMap((block) => block.categories.flatMap((category) => category.tasks)),
    [blocks],
  );
  const aktiveFilter = [
    search,
    eventFilter === "all" ? "" : eventFilter,
    statusFilter === "all" ? "" : statusFilter,
    ownerFilter === "all" ? "" : ownerFilter,
    categoryFilter === "all" ? "" : categoryFilter,
    priorityFilter === "all" ? "" : priorityFilter,
    fromDate,
    toDate,
  ].filter(Boolean).length;
  const counts = useMemo(() => queueCounts(tasks), [tasks]);
  const sichtbareAufgaben = useMemo(
    () => (focus === "all" ? tasks : tasks.filter((item) => queueGroupOf(item) === focus)),
    [tasks, focus],
  );
  const ownerName = (id: string | null) =>
    data?.owners.find((owner) => owner.id === id)?.displayName ?? "—";
  const overviewCounts = useMemo(
    () => ({
      blocked: tasks.filter((item) => item.blockedBy.length > 0 || item.overdue).length,
      dueSoon: tasks.filter((item) => item.dueSoon && !item.overdue && item.blockedBy.length === 0)
        .length,
      open: tasks.filter((item) => item.status !== "DONE").length,
    }),
    [tasks],
  );
  const allTaskById = useMemo(
    () => new Map((data?.tasks ?? []).map((item) => [item.id, item])),
    [data],
  );
  const categoryDetails = (id: string | null) => {
    const group = data?.groups.find((item) => item.id === id);
    return group
      ? { name: group.name, icon: group.icon, color: group.color }
      : { name: "Ohne Kategorie", icon: null, color: null };
  };
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
          ...categoryDetails(category.groupId),
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
    <main className="space-y-3">
      <PageHeader
        titel="Aufgaben"
        beschreibung="Gesamtübersicht über Event- und globale Aufgaben"
      />
      {error && (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <Button
          className="min-h-11 md:min-h-8"
          size="sm"
          variant={view === "table" ? "default" : "outline"}
          onClick={() => setView("table")}
        >
          Übersicht
        </Button>
        <Button
          className="hidden min-h-8 md:inline-flex"
          size="sm"
          variant={view === "gantt" ? "default" : "outline"}
          onClick={() => setView("gantt")}
        >
          Gantt
        </Button>
        {!readOnly && (
          <Button
            className="min-h-11 md:min-h-8"
            size="sm"
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
              });
            }}
          >
            Globale Aufgabe anlegen
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Aufgaben durchsuchen</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="task-search"
            value={search}
            placeholder="Aufgabe, Event oder Person …"
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-64 rounded-full pl-8"
          />
        </label>

        <FilterChip label="Event" value={eventFilter} onChange={setEventFilter} inaktiv="all">
          <option value="all">alle</option>
          {!readOnly && <option value="global">Global</option>}
          {data?.eventChoices.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </FilterChip>

        <FilterChip label="Status" value={statusFilter} onChange={setStatusFilter} inaktiv="all">
          <option value="all">alle</option>
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FilterChip>

        <FilterChip label="Person" value={ownerFilter} onChange={setOwnerFilter} inaktiv="all">
          <option value="all">alle</option>
          <option value="none">nicht zugeordnet</option>
          {data?.owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.displayName}
            </option>
          ))}
        </FilterChip>

        <FilterChip
          label="Kategorie"
          value={categoryFilter}
          onChange={setCategoryFilter}
          inaktiv="all"
        >
          <option value="all">alle</option>
          <option value="none">ohne</option>
          {data?.groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </FilterChip>

        <FilterChip
          label="Priorität"
          value={priorityFilter}
          onChange={setPriorityFilter}
          inaktiv="all"
        >
          <option value="all">alle</option>
          {Object.entries(priorityLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FilterChip>

        <DateChip label="Ende ab" value={fromDate} onChange={setFromDate} />
        <DateChip label="Ende bis" value={toDate} onChange={setToDate} />

        {aktiveFilter > 0 && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setEventFilter("all");
              setStatusFilter("all");
              setOwnerFilter("all");
              setCategoryFilter("all");
              setPriorityFilter("all");
              setFromDate("");
              setToDate("");
            }}
            className="min-h-11 rounded-full px-3 text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline md:min-h-8"
          >
            {aktiveFilter} Filter zurücksetzen
          </button>
        )}
      </div>
      {view === "table" ? (
        <>
          <section
            aria-label="Aufgabenprioritäten"
            data-testid="task-priority-summary"
            className="flex flex-wrap gap-2"
          >
            {FOKUS.map((fokus) => {
              const aktiv = focus === fokus.key;
              return (
                <button
                  key={fokus.key}
                  type="button"
                  aria-pressed={aktiv}
                  onClick={() => setFocus(aktiv ? "all" : fokus.key)}
                  className={`flex min-h-11 min-w-44 items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                    aktiv ? fokus.activeClass : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${fokus.dot}`}
                    aria-hidden="true"
                  />
                  <strong className="text-xl font-semibold tabular-nums">
                    {counts[fokus.key]}
                  </strong>
                  <span className="text-sm text-muted-foreground">{fokus.label}</span>
                </button>
              );
            })}
          </section>

          <section data-testid="task-overview" aria-label="Aufgaben nach Dringlichkeit">
            <TaskQueue
              tasks={sichtbareAufgaben}
              categoryDetails={categoryDetails}
              ownerName={ownerName}
              taskTitle={(taskId) => allTaskById.get(taskId)?.title ?? taskId}
              onOpen={(task) => void interaction.open(task)}
            />
          </section>
        </>
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
                        <span className="sticky left-0 z-20 border-r bg-muted/30 px-3 py-2 pl-7">
                          <SelectionBadge
                            name={category.name}
                            icon={category.icon}
                            color={category.color}
                            className="text-xs font-semibold"
                          />
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
                                {item.endDate ? formatDatum(item.endDate) : "—"}
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
        workspace={interaction}
        planning={{
          owners: data?.owners ?? [],
          groups: data?.groups ?? [],
          tasks: data?.tasks ?? [],
          edges: data?.edges ?? [],
        }}
        variant="global"
        readOnly={readOnly}
        currentUserId={currentUser.id}
      />
    </main>
  );
}
