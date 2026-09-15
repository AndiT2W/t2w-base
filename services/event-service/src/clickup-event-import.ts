import { EventStatus, Prisma, PrismaClient } from "@prisma/client";

export type ClickUpTaskRecord = {
  id: string;
  name?: string | null;
  url?: string | null;
  status?: unknown;
  date_created?: unknown;
  date_updated?: unknown;
  due_date?: unknown;
  start_date?: unknown;
  description?: unknown;
  assignees?: unknown;
  custom_fields?: unknown;
  sourceSnapshots?: unknown;
  [key: string]: unknown;
};

export type ClickUpEventImportReport = {
  total: number;
  imported: number;
  errors: { clickUpId: string; reason: string }[];
};

type ClickUpEventImportClient = Pick<PrismaClient, "event" | "sport">;

type NormalizedClickUpEvent = {
  clickUpId: string;
  clickUpUrl: string | null;
  clickUpUpdatedAt: Date | null;
  eventCode: string;
  name: string;
  status: EventStatus;
  startAt: Date;
  endAt: Date;
  location: string | null;
  responsible: string | null;
  participantForecast: number | null;
  t2wEventId: number | null;
  notes: string | null;
  sportName: string | null;
  sourceData: Prisma.InputJsonValue;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null => {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const asDate = (value: unknown): Date | null => {
  const raw = asString(value);
  if (!raw) return null;

  const numeric = Number(raw);
  const date = Number.isFinite(numeric)
    ? new Date(Math.abs(numeric) < 10_000_000_000 ? numeric * 1_000 : numeric)
    : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const asInteger = (value: unknown): number | null => {
  const raw = asString(value);
  if (!raw) return null;
  const parsed = Number(raw.replace(/[^\d-]/g, ""));
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const customFieldValue = (task: ClickUpTaskRecord, name: string): unknown => {
  if (!Array.isArray(task.custom_fields)) return null;
  const field = task.custom_fields
    .map(asRecord)
    .find((candidate) => candidate?.name === name);
  if (!field) return null;
  return field.value_richtext ?? field.value ?? null;
};

const locationValue = (value: unknown): string | null => {
  const direct = asString(value);
  if (direct) return direct;
  const location = asRecord(value);
  if (!location) return null;
  return (
    asString(location.formatted_address) ??
    asString(location.address) ??
    asString(location.name) ??
    null
  );
};

const statusValue = (value: unknown): string => {
  const status = asRecord(value);
  return (
    asString(status?.status) ??
    asString(status?.name) ??
    asString(value) ??
    ""
  ).toLocaleLowerCase("de-AT");
};

const toEventStatus = (sourceStatus: unknown): EventStatus => {
  const status = statusValue(sourceStatus);
  if (/(abgesag|absage|storniert)/.test(status)) return EventStatus.ABGESAGT;
  if (/(angebot|rückmeldung)/.test(status)) return EventStatus.ANGEBOT_GESENDET;
  if (status.includes("akquise")) return EventStatus.AKQUISE;
  if (status.includes("datum")) return EventStatus.DATUM_PRUEFEN;
  if (/(zusage|zugesag|abgeschlossen|closed|done)/.test(status)) return EventStatus.ZUGESAGT;
  return EventStatus.ANFRAGE;
};

const responsibleValue = (value: unknown): string | null => {
  if (!Array.isArray(value)) return null;
  const names = value
    .map(asRecord)
    .map((assignee) => asString(assignee?.username) ?? asString(assignee?.email))
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join(", ") : null;
};

const jsonValue = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;

export const mergeClickUpTaskSnapshots = (
  listTasks: ClickUpTaskRecord[],
  detailedTasks: ClickUpTaskRecord[],
): ClickUpTaskRecord[] => {
  const detailedById = new Map(detailedTasks.map((task) => [task.id, task]));
  return listTasks.map((listTask) => {
    const detailTask = detailedById.get(listTask.id);
    return {
      ...listTask,
      ...detailTask,
      sourceSnapshots: {
        listTask,
        detailTask: detailTask ?? null,
      },
    };
  });
};

export const normalizeClickUpEvent = (task: ClickUpTaskRecord): NormalizedClickUpEvent => {
  const clickUpId = asString(task.id);
  if (!clickUpId) throw new Error("MISSING_CLICKUP_ID");

  const startAt =
    asDate(task.start_date) ??
    asDate(task.due_date) ??
    asDate(task.date_created) ??
    asDate(task.date_updated);
  if (!startAt) throw new Error("MISSING_EVENT_DATE");

  const explicitSport = customFieldValue(task, "Sportart");
  return {
    clickUpId,
    clickUpUrl: asString(task.url),
    clickUpUpdatedAt: asDate(task.date_updated),
    eventCode: "clickup-" + clickUpId,
    name: asString(task.name) ?? "ClickUp " + clickUpId,
    status: toEventStatus(task.status),
    startAt,
    endAt: asDate(task.due_date) ?? startAt,
    location: locationValue(customFieldValue(task, "Ort")),
    responsible: responsibleValue(task.assignees),
    participantForecast: asInteger(customFieldValue(task, "Teilnehmer")),
    t2wEventId: asInteger(customFieldValue(task, "Event Id")),
    notes: asString(task.description),
    // Detail responses retain dropdown values by their stable ClickUp field IDs. Do not
    // guess display labels from an option index; the raw source snapshot remains canonical.
    sportName: typeof explicitSport === "string" ? explicitSport.trim() || null : null,
    sourceData: jsonValue(task.sourceSnapshots ?? task),
  };
};

export class ClickUpEventImportService {
  constructor(private readonly prisma: ClickUpEventImportClient) {}

  async run(tasks: ClickUpTaskRecord[]): Promise<ClickUpEventImportReport> {
    const report: ClickUpEventImportReport = { total: tasks.length, imported: 0, errors: [] };

    for (const task of tasks) {
      const clickUpId = asString(task.id) ?? "(ohne ID)";
      try {
        const item = normalizeClickUpEvent(task);
        const sport = item.sportName
          ? await this.prisma.sport.upsert({
              where: { name: item.sportName },
              update: {},
              create: { name: item.sportName },
              select: { id: true },
            })
          : null;

        const source = {
          clickUpId: item.clickUpId,
          taskUrl: item.clickUpUrl,
          taskUpdatedAt: item.clickUpUpdatedAt,
          sourceData: item.sourceData,
        };
        const eventData = {
          clickUpUrl: item.clickUpUrl,
          clickUpUpdatedAt: item.clickUpUpdatedAt,
          name: item.name,
          status: item.status,
          startAt: item.startAt,
          endAt: item.endAt,
          location: item.location ?? undefined,
          responsible: item.responsible ?? undefined,
          participantForecast: item.participantForecast ?? undefined,
          t2wEventId: item.t2wEventId ?? undefined,
          notes: item.notes ?? undefined,
          ...(sport ? { sport: { connect: { id: sport.id } } } : {}),
        };

        await this.prisma.event.upsert({
          where: { clickUpId: item.clickUpId },
          create: {
            ...eventData,
            eventCode: item.eventCode,
            clickUpId: item.clickUpId,
            clickUpSource: { create: source },
          },
          update: {
            ...eventData,
            clickUpSource: {
              upsert: {
                create: source,
                update: source,
              },
            },
          },
        });
        report.imported++;
      } catch (error) {
        report.errors.push({
          clickUpId,
          reason: error instanceof Error ? error.message : "INVALID_CLICKUP_TASK",
        });
      }
    }
    return report;
  }
}
