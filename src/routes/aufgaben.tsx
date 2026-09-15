import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { projectTaskPortfolios, type Task } from "@t2w/domain/project-management";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  CircleDollarSign,
  CirclePlay,
  Clock3,
  FolderKanban,
  Package,
  Ticket,
  type LucideIcon,
} from "lucide-react";
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
} from "@/lib/t2w/project-management";
import { createTaskInteractionWorkspace } from "@/lib/t2w/task-interaction-workspace";

export const Route = createFileRoute("/aufgaben")({ component: Aufgaben });
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
type VisibleTask = ReturnType<
  typeof projectTaskPortfolios
>[number]["portfolio"]["tasks"][number] & {
  event: PmGlobal["eventChoices"][number] | null;
};

type CategoryPresentation = {
  Icon: LucideIcon;
  accent: string;
  icon: string;
  tone: string;
};

function categoryPresentation(name: string): CategoryPresentation {
  const normalized = name.toLocaleLowerCase("de-AT");
  if (normalized.includes("hardware")) {
    return {
      Icon: Package,
      accent: "border-l-teal-600",
      icon: "bg-teal-700/10 text-teal-800 dark:text-teal-300",
      tone: "hardware",
    };
  }
  if (normalized.includes("startnummer") || normalized.includes("anmeldung")) {
    return {
      Icon: Ticket,
      accent: "border-l-sky-600",
      icon: "bg-sky-700/10 text-sky-800 dark:text-sky-300",
      tone: "anmeldung",
    };
  }
  if (normalized.includes("finanz") || normalized.includes("zahlung")) {
    return {
      Icon: CircleDollarSign,
      accent: "border-l-violet-600",
      icon: "bg-violet-700/10 text-violet-800 dark:text-violet-300",
      tone: "finanzen",
    };
  }
  return {
    Icon: FolderKanban,
    accent: "border-l-primary",
    icon: "bg-primary/10 text-primary",
    tone: "standard",
  };
}

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
  const [range, setRange] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [months, setMonths] = useState(3);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
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
    return portfolioBlocks(data, rawTasks);
  }, [data, rawTasks]);
  const tasks = useMemo(
    () => blocks.flatMap((block) => block.categories.flatMap((category) => category.tasks)),
    [blocks],
  );
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
  const categoryName = (id: string | null) =>
    data?.groups.find((group) => group.id === id)?.name ?? "Ohne Kategorie";
  function toggleCategory(key: string) {
    setExpandedCategories((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
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
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <Label htmlFor="task-search">Suche</Label>
          <Input
            id="task-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 md:h-8"
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
      <details className="rounded-md border border-border bg-muted/20 px-3 py-2">
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
              className="h-11 md:h-8"
            />
          </div>
          <div>
            <Label htmlFor="task-to">Ende bis</Label>
            <Input
              id="task-to"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-11 md:h-8"
            />
          </div>
        </div>
      </details>
      {view === "table" ? (
        <>
          <section
            aria-label="Aufgabenprioritäten"
            data-testid="task-priority-summary"
            className="grid overflow-hidden rounded-lg border border-border bg-card shadow-sm sm:grid-cols-3"
          >
            <div className="flex min-h-20 items-center gap-3 px-4 py-3 sm:border-r sm:border-border">
              <span className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle aria-hidden="true" className="size-5" />
              </span>
              <span>
                <strong className="block text-xl font-semibold tabular-nums">
                  {overviewCounts.blocked}
                </strong>
                <span className="text-sm text-muted-foreground">Blockiert oder überfällig</span>
              </span>
            </div>
            <div className="flex min-h-20 items-center gap-3 border-t border-border px-4 py-3 sm:border-t-0 sm:border-r">
              <span className="flex size-9 items-center justify-center rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-300">
                <Clock3 aria-hidden="true" className="size-5" />
              </span>
              <span>
                <strong className="block text-xl font-semibold tabular-nums">
                  {overviewCounts.dueSoon}
                </strong>
                <span className="text-sm text-muted-foreground">Fällig diese Woche</span>
              </span>
            </div>
            <div className="flex min-h-20 items-center gap-3 border-t border-border px-4 py-3 sm:border-t-0">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CircleDot aria-hidden="true" className="size-5" />
              </span>
              <span>
                <strong className="block text-xl font-semibold tabular-nums">
                  {overviewCounts.open}
                </strong>
                <span className="text-sm text-muted-foreground">Offene Aufgaben</span>
              </span>
            </div>
          </section>

          <section
            data-testid="task-overview"
            className="space-y-4"
            aria-label="Aufgaben nach Event"
          >
            {blocks.map((block) => {
              const eventName = block.event?.name ?? "Globale Aufgaben";
              const eventTasks = block.categories.flatMap((category) => category.tasks);
              const eventOpen = eventTasks.filter((item) => item.status !== "DONE").length;
              const eventDueSoon = eventTasks.filter(
                (item) => item.dueSoon && !item.overdue && item.blockedBy.length === 0,
              ).length;
              return (
                <section
                  key={block.key}
                  data-testid="task-event-card"
                  aria-label={eventName}
                  className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
                >
                  <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-nav px-4 py-3 text-nav-foreground">
                    <div className="flex min-w-0 items-center gap-2">
                      <CalendarDays aria-hidden="true" className="size-5 shrink-0" />
                      <h2 className="truncate text-base font-semibold sm:text-lg">{eventName}</h2>
                    </div>
                    <p className="text-sm text-nav-foreground/85">
                      <strong className="font-semibold text-nav-foreground tabular-nums">
                        {eventOpen} offen
                      </strong>
                      {eventDueSoon > 0 && <span> · {eventDueSoon} diese Woche</span>}
                    </p>
                  </header>
                  <div className="space-y-3 bg-muted/25 p-3 sm:p-4">
                    {block.categories.map((category) => {
                      const key = `${block.key}:${category.groupId ?? "none"}`;
                      const expanded = expandedCategories.includes(key);
                      const categoryNameValue = categoryName(category.groupId);
                      const categoryStyle = categoryPresentation(categoryNameValue);
                      const categoryHealth = categoryHealthPresentation(category.health);
                      const nextTask =
                        category.tasks.find((item) => item.id === category.nextTaskId) ??
                        category.tasks[0];
                      const CategoryIcon = categoryStyle.Icon;
                      const HealthIcon = categoryHealth.Icon;
                      return (
                        <article
                          key={key}
                          data-testid="task-category-card"
                          data-category-tone={categoryStyle.tone}
                          className={`overflow-hidden rounded-md border border-border border-l-4 bg-card shadow-sm transition-shadow hover:shadow-md ${categoryStyle.accent}`}
                        >
                          <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:p-4">
                            <span
                              aria-hidden="true"
                              className={`flex size-11 shrink-0 items-center justify-center rounded-md ${categoryStyle.icon}`}
                            >
                              <CategoryIcon className="size-6" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-foreground">
                                  {categoryNameValue}
                                </h3>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${categoryHealth.tone}`}
                                >
                                  <HealthIcon aria-hidden="true" className="size-3.5" />
                                  {categoryHealth.label}
                                </span>
                              </div>
                              {nextTask ? (
                                <button
                                  type="button"
                                  className="mt-1.5 inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-sm text-left text-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  onClick={() => void interaction.open(nextTask)}
                                >
                                  <span className="font-medium text-foreground">
                                    Nächster Schritt:
                                  </span>
                                  <span className="truncate">{nextTask.title}</span>
                                  {nextTask.endDate && (
                                    <span className="shrink-0">
                                      · {formatDatum(nextTask.endDate)}
                                    </span>
                                  )}
                                </button>
                              ) : (
                                <p className="mt-1.5 text-sm text-muted-foreground">
                                  Keine Aufgaben
                                </p>
                              )}
                            </div>
                            <div className="grid shrink-0 grid-cols-3 overflow-hidden rounded-md border border-border text-center text-xs">
                              <span className="min-w-16 border-r border-border px-2 py-1.5">
                                <strong className="block text-sm tabular-nums">
                                  {category.counts.open}
                                </strong>
                                offen
                              </span>
                              <span className="min-w-16 border-r border-border px-2 py-1.5">
                                <strong className="block text-sm tabular-nums">
                                  {category.counts.inProgress}
                                </strong>
                                in Arbeit
                              </span>
                              <span className="min-w-16 px-2 py-1.5">
                                <strong className="block text-sm tabular-nums">
                                  {category.counts.done}
                                </strong>
                                erledigt
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="min-h-11 shrink-0"
                              aria-expanded={expanded}
                              aria-controls={`${key}-tasks`}
                              onClick={() => toggleCategory(key)}
                            >
                              {expanded
                                ? "Workflow ausblenden"
                                : `Workflow anzeigen (${category.count})`}
                              {expanded ? (
                                <ChevronUp aria-hidden="true" className="size-4" />
                              ) : (
                                <ChevronDown aria-hidden="true" className="size-4" />
                              )}
                            </Button>
                          </div>
                          {expanded && (
                            <ul
                              id={`${key}-tasks`}
                              aria-label={`Aufgaben in ${categoryNameValue}`}
                              className="border-t border-border bg-muted/30 p-2 sm:p-3"
                            >
                              {category.tasks.map((item) => (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    onClick={() => void interaction.open(item)}
                                  >
                                    <span className="min-w-0">
                                      <strong className="block truncate text-sm">
                                        {item.title}
                                      </strong>
                                      <span className="text-xs text-muted-foreground">
                                        {item.endDate
                                          ? `Ende ${formatDatum(item.endDate)}`
                                          : "Ohne Ende"}
                                      </span>
                                    </span>
                                    <span
                                      className={`shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-medium ${taskStatusTone(item)}`}
                                    >
                                      {item.blockedBy.length
                                        ? "Blockiert"
                                        : statusLabel[item.status]}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            {!blocks.length && (
              <p className="rounded-lg border border-border bg-card py-8 text-center text-sm text-muted-foreground">
                Keine Aufgaben für diese Filter gefunden.
              </p>
            )}
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
      />
    </main>
  );
}
