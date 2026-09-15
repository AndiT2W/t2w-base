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
  sports: ClickUpFieldImportReport;
  services: ClickUpFieldImportReport;
  organizers: {
    mapped: number;
    preserved: number;
    sourceMissing: number;
    unresolved: ClickUpOrganizerReview[];
  };
};

export type ClickUpFieldImportReport = {
  mapped: number;
  sourceMissing: number;
  unresolved: ClickUpFieldReview[];
};

export type ClickUpFieldReview = {
  clickUpId: string;
  eventCode: string;
  eventName: string;
  sourceValue: string;
  reason: "UNMAPPED_SPORT" | "MISSING_SERVICE_OPTION" | "UNMAPPED_SERVICE";
};

export type ClickUpOrganizerReview = {
  clickUpId: string;
  eventCode: string;
  eventName: string;
  sourceOrganizerNames: string[];
  reason:
    | "NO_MATCHING_ORGANIZER"
    | "MULTIPLE_SOURCE_ORGANIZERS"
    | "AMBIGUOUS_MATCHING_ORGANIZERS";
  candidates?: { id: string; name: string }[];
};

type ClickUpEventImportClient = Pick<
  PrismaClient,
  "event" | "sport" | "organizer" | "serviceOption" | "eventService"
>;

type NormalizedClickUpEvent = {
  clickUpId: string;
  clickUpUrl: string | null;
  clickUpUpdatedAt: Date | null;
  eventCode: string;
  name: string;
  status: EventStatus;
  hasMappedEventStatus: boolean;
  startAt: Date;
  endAt: Date;
  location: string | null;
  responsible: string | null;
  participantForecast: number | null;
  t2wEventId: number | null;
  notes: string | null;
  sportName: string | null;
  sourceSportValue: string | null;
  serviceName: string | null;
  sourceServiceValue: string | null;
  sourceData: Prisma.InputJsonValue;
};

type ExistingEventCode = {
  clickUpId: string | null;
  eventCode: string;
  organizerId: string | null;
};

type OrganizerRecord = { id: string; name: string };
type ServiceOptionRecord = { id: string; name: string };

type OrganizerResolution =
  | { kind: "missing" }
  | { kind: "matched"; organizer: OrganizerRecord; sourceOrganizerNames: string[] }
  | { kind: "multiple-source"; sourceOrganizerNames: string[] }
  | { kind: "no-match"; sourceOrganizerNames: string[] }
  | {
      kind: "ambiguous-match";
      sourceOrganizerNames: string[];
      candidates: OrganizerRecord[];
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

const asPositiveInteger = (value: unknown): number | null => {
  const parsed = asInteger(value);
  return parsed && parsed > 0 ? parsed : null;
};

const customFieldValue = (task: ClickUpTaskRecord, name: string): unknown => {
  if (!Array.isArray(task.custom_fields)) return null;
  const field = task.custom_fields.map(asRecord).find((candidate) => candidate?.name === name);
  if (!field) return null;
  return field.value_richtext ?? field.value ?? null;
};

const relationshipNames = (task: ClickUpTaskRecord, name: string): string[] => {
  const value = customFieldValue(task, name);
  if (!Array.isArray(value)) return [];
  return value
    .map(asRecord)
    .map((item) => asString(item?.name))
    .filter((item): item is string => Boolean(item));
};

const normalizeOrganizerName = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-AT")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const resolveOrganizer = (
  task: ClickUpTaskRecord,
  organizersByName: Map<string, OrganizerRecord[]>,
): OrganizerResolution => {
  const sourceOrganizerNames = relationshipNames(task, "Veranstalter");
  if (!sourceOrganizerNames.length) return { kind: "missing" };
  if (sourceOrganizerNames.length > 1) return { kind: "multiple-source", sourceOrganizerNames };

  const candidates = organizersByName.get(normalizeOrganizerName(sourceOrganizerNames[0])) ?? [];
  if (!candidates.length) return { kind: "no-match", sourceOrganizerNames };
  if (candidates.length > 1)
    return { kind: "ambiguous-match", sourceOrganizerNames, candidates };
  return { kind: "matched", sourceOrganizerNames, organizer: candidates[0] };
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

/**
 * Verified against the ClickUp export captured on 2026-08-19 and the live
 * snapshot from 2026-09-15. ClickUp returns a dropdown's selected option as
 * its numeric order index, not its label, in the task-detail response.
 */
const CLICKUP_EVENTSTATUS_DROPDOWN: Readonly<Record<string, EventStatus>> = {
  "0": EventStatus.ANFRAGE,
  "1": EventStatus.ZUGESAGT,
  "2": EventStatus.ANGEBOT_GESENDET,
  "3": EventStatus.ANGEBOT_GESENDET,
  "4": EventStatus.ZUGESAGT,
  "7": EventStatus.ZUGESAGT,
};

const CLICKUP_SPORT_DROPDOWN: Readonly<Record<string, string>> = {
  "0": "Skibergsteigen",
  "1": "Langlauf",
  "2": "Lauf",
  "5": "Trail",
  "6": "Trailrunning",
  "7": "Dirtrun",
  "8": "Triathlon",
  "9": "Rennrad",
  "11": "MTB",
  "12": "Bike",
  "13": "Mountainbike",
  "14": "Berglauf",
  "16": "Multisport",
  "17": "SUP",
  "18": "CX",
  "21": "Hyrox",
};

const CLICKUP_SERVICE_DROPDOWN: Readonly<Record<string, string>> = {
  "0": "Active",
  "1": "App",
  "2": "UHF",
  "3": "Anmeldung (only)",
  "4": "GPS",
  "5": "Virtuell",
  "7": "Jörg",
  Anmeldung: "Anmeldung (only)",
};

const dropdownName = (value: unknown, values: Readonly<Record<string, string>>): string | null => {
  const raw = asString(value);
  if (!raw) return null;
  return values[raw] ?? (Number.isNaN(Number(raw)) ? raw : null);
};

const mappedEventStatus = (sourceStatus: unknown): EventStatus | null => {
  const status = statusValue(sourceStatus);
  const dropdownStatus = CLICKUP_EVENTSTATUS_DROPDOWN[status];
  if (dropdownStatus) return dropdownStatus;
  if (/(abgesag|absage|storniert)/.test(status)) return EventStatus.ABGESAGT;
  if (/(angebot|rückmeldung)/.test(status)) return EventStatus.ANGEBOT_GESENDET;
  if (status.includes("akquise")) return EventStatus.AKQUISE;
  if (status.includes("datum")) return EventStatus.DATUM_PRUEFEN;
  if (/(zusage|zugesag|abgeschlossen|closed|done)/.test(status)) return EventStatus.ZUGESAGT;
  if (/(anfrage|offen)/.test(status)) return EventStatus.ANFRAGE;
  return null;
};

const toEventStatus = (sourceStatus: unknown): EventStatus =>
  mappedEventStatus(sourceStatus) ?? EventStatus.ANFRAGE;

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

const UMLAUTE: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  Ä: "ae",
  Ö: "oe",
  Ü: "ue",
  ß: "ss",
  é: "e",
  è: "e",
  ê: "e",
  á: "a",
  à: "a",
  â: "a",
  ó: "o",
  ò: "o",
  ô: "o",
  í: "i",
  ú: "u",
  ñ: "n",
  ç: "c",
};

const eventSlug = (name: string): string => {
  let slug = name.toLowerCase();
  slug = slug.replace(/[äöüßÄÖÜéèêáàâóòôíúñç]/g, (character) => UMLAUTE[character] ?? character);
  slug = slug.replace(/\b(19|20)\d{2}\b/g, " ");
  slug = slug.replace(/'\d{2}\b/g, " ");
  slug = slug
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return (slug.length > 30 ? slug.slice(0, 30).replace(/_$/, "") : slug) || "event";
};

/** Uses the same stable YYMMDD_slug convention as the event master-data UI. */
export const clickUpEventCode = (name: string, startAt: Date): string => {
  const date = startAt.toISOString().slice(2, 10).replaceAll("-", "");
  return `${date}_${eventSlug(name)}`;
};

const clickUpFallbackCode = (eventCode: string, clickUpId: string): boolean =>
  eventCode === `clickup-${clickUpId}`;

const uniqueEventCode = (candidate: string, occupied: Set<string>): string => {
  if (!occupied.has(candidate)) return candidate;
  let sequence = 2;
  while (occupied.has(`${candidate}_${String(sequence).padStart(2, "0")}`)) sequence += 1;
  return `${candidate}_${String(sequence).padStart(2, "0")}`;
};

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

  const name = asString(task.name) ?? `ClickUp ${clickUpId}`;
  const explicitSport = customFieldValue(task, "Sportart");
  const explicitEventStatus = customFieldValue(task, "Eventstatus");
  const explicitService = customFieldValue(task, "Typ");
  const mappedExplicitEventStatus = mappedEventStatus(explicitEventStatus);
  return {
    clickUpId,
    clickUpUrl: asString(task.url),
    clickUpUpdatedAt: asDate(task.date_updated),
    eventCode: clickUpEventCode(name, startAt),
    name,
    // Eventstatus is the business status. The ClickUp task workflow is only
    // a fallback when creating a record without that custom field.
    status: mappedExplicitEventStatus ?? toEventStatus(task.status),
    hasMappedEventStatus: mappedExplicitEventStatus !== null,
    startAt,
    endAt: asDate(task.due_date) ?? startAt,
    location: locationValue(customFieldValue(task, "Ort")),
    responsible: responsibleValue(task.assignees),
    participantForecast: asInteger(customFieldValue(task, "Teilnehmer")),
    t2wEventId: asPositiveInteger(customFieldValue(task, "Event Id")),
    notes: asString(task.description),
    sportName: dropdownName(explicitSport, CLICKUP_SPORT_DROPDOWN),
    sourceSportValue: asString(explicitSport),
    serviceName: dropdownName(explicitService, CLICKUP_SERVICE_DROPDOWN),
    sourceServiceValue: asString(explicitService),
    sourceData: jsonValue(task.sourceSnapshots ?? task),
  };
};

export class ClickUpEventImportService {
  constructor(private readonly prisma: ClickUpEventImportClient) {}

  async run(tasks: ClickUpTaskRecord[]): Promise<ClickUpEventImportReport> {
    const report: ClickUpEventImportReport = {
      total: tasks.length,
      imported: 0,
      errors: [],
      sports: { mapped: 0, sourceMissing: 0, unresolved: [] },
      services: { mapped: 0, sourceMissing: 0, unresolved: [] },
      organizers: { mapped: 0, preserved: 0, sourceMissing: 0, unresolved: [] },
    };

    const items: NormalizedClickUpEvent[] = [];
    for (const task of tasks) {
      const clickUpId = asString(task.id) ?? "(ohne ID)";
      try {
        items.push(normalizeClickUpEvent(task));
      } catch (error) {
        report.errors.push({
          clickUpId,
          reason: error instanceof Error ? error.message : "INVALID_CLICKUP_TASK",
        });
      }
    }
    const tasksByClickUpId = new Map(tasks.map((task) => [task.id, task]));

    const existingEvents = (await this.prisma.event.findMany({
      select: { clickUpId: true, eventCode: true, organizerId: true },
    })) as ExistingEventCode[];
    const organizers = (await this.prisma.organizer.findMany({
      where: { active: true },
      select: { id: true, name: true },
    })) as OrganizerRecord[];
    const serviceOptions = items.some((item) => item.sourceServiceValue)
      ? ((await this.prisma.serviceOption.findMany({
          where: { active: true },
          select: { id: true, name: true },
        })) as ServiceOptionRecord[])
      : [];
    const organizersByName = new Map<string, OrganizerRecord[]>();
    for (const organizer of organizers) {
      const key = normalizeOrganizerName(organizer.name);
      organizersByName.set(key, [...(organizersByName.get(key) ?? []), organizer]);
    }
    const servicesByName = new Map<string, ServiceOptionRecord[]>();
    for (const service of serviceOptions) {
      const key = normalizeOrganizerName(service.name);
      servicesByName.set(key, [...(servicesByName.get(key) ?? []), service]);
    }
    const existingByClickUpId = new Map(
      existingEvents
        .filter((event): event is ExistingEventCode & { clickUpId: string } =>
          Boolean(event.clickUpId),
        )
        .map((event) => [event.clickUpId, event]),
    );
    const occupiedCodes = new Set(
      existingEvents
        .filter(
          (event) => !event.clickUpId || !clickUpFallbackCode(event.eventCode, event.clickUpId),
        )
        .map((event) => event.eventCode),
    );
    const codesByClickUpId = new Map<string, string>();
    for (const item of items) {
      const existing = existingByClickUpId.get(item.clickUpId);
      const eventCode =
        existing && !clickUpFallbackCode(existing.eventCode, item.clickUpId)
          ? existing.eventCode
          : uniqueEventCode(item.eventCode, occupiedCodes);
      occupiedCodes.add(eventCode);
      codesByClickUpId.set(item.clickUpId, eventCode);
    }

    for (const item of items) {
      try {
        const task = tasksByClickUpId.get(item.clickUpId);
        const existing = existingByClickUpId.get(item.clickUpId);
        const organizerResolution = task
          ? resolveOrganizer(task, organizersByName)
          : { kind: "missing" as const };
        const sport = item.sportName
          ? await this.prisma.sport.upsert({
              where: { name: item.sportName },
              update: {},
              create: { name: item.sportName },
              select: { id: true },
            })
          : null;
        const serviceCandidates = item.serviceName
          ? servicesByName.get(normalizeOrganizerName(item.serviceName)) ?? []
          : [];
        const service = serviceCandidates.length === 1 ? serviceCandidates[0] : null;

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
          // A partial ClickUp snapshot must not revert an existing business
          // status merely because it lacks the Eventstatus custom field.
          ...(!existing || item.hasMappedEventStatus ? { status: item.status } : {}),
          startAt: item.startAt,
          endAt: item.endAt,
          location: item.location ?? undefined,
          responsible: item.responsible ?? undefined,
          participantForecast: item.participantForecast ?? undefined,
          t2wEventId: item.t2wEventId ?? undefined,
          notes: item.notes ?? undefined,
          ...(sport ? { sport: { connect: { id: sport.id } } } : {}),
        };
        const eventCode = codesByClickUpId.get(item.clickUpId) ?? item.eventCode;
        const shouldSetOrganizer =
          organizerResolution.kind === "matched" && !existing?.organizerId;
        const organizerData = shouldSetOrganizer
          ? { organizer: { connect: { id: organizerResolution.organizer.id } } }
          : {};

        if (organizerResolution.kind === "missing") report.organizers.sourceMissing++;
        else if (organizerResolution.kind === "no-match") {
          report.organizers.unresolved.push({
            clickUpId: item.clickUpId,
            eventCode,
            eventName: item.name,
            sourceOrganizerNames: organizerResolution.sourceOrganizerNames,
            reason: "NO_MATCHING_ORGANIZER",
          });
        } else if (organizerResolution.kind === "multiple-source") {
          report.organizers.unresolved.push({
            clickUpId: item.clickUpId,
            eventCode,
            eventName: item.name,
            sourceOrganizerNames: organizerResolution.sourceOrganizerNames,
            reason: "MULTIPLE_SOURCE_ORGANIZERS",
          });
        } else if (organizerResolution.kind === "ambiguous-match") {
          report.organizers.unresolved.push({
            clickUpId: item.clickUpId,
            eventCode,
            eventName: item.name,
            sourceOrganizerNames: organizerResolution.sourceOrganizerNames,
            reason: "AMBIGUOUS_MATCHING_ORGANIZERS",
            candidates: organizerResolution.candidates,
          });
        }

        const event = await this.prisma.event.upsert({
          where: { clickUpId: item.clickUpId },
          create: {
            ...eventData,
            ...organizerData,
            eventCode,
            clickUpId: item.clickUpId,
            clickUpSource: { create: source },
          },
          update: {
            ...eventData,
            ...organizerData,
            ...(existing && clickUpFallbackCode(existing.eventCode, item.clickUpId)
              ? { eventCode }
              : {}),
            clickUpSource: {
              upsert: {
                create: source,
                update: source,
              },
            },
          },
          select: { id: true },
        });
        if (!item.sourceSportValue) report.sports.sourceMissing++;
        else if (sport) report.sports.mapped++;
        else {
          report.sports.unresolved.push({
            clickUpId: item.clickUpId,
            eventCode,
            eventName: item.name,
            sourceValue: item.sourceSportValue,
            reason: "UNMAPPED_SPORT",
          });
        }
        if (!item.sourceServiceValue) report.services.sourceMissing++;
        else if (service) {
          await this.prisma.eventService.upsert({
            where: { eventId_serviceId: { eventId: event.id, serviceId: service.id } },
            create: { eventId: event.id, serviceId: service.id },
            update: {},
          });
          report.services.mapped++;
        } else {
          report.services.unresolved.push({
            clickUpId: item.clickUpId,
            eventCode,
            eventName: item.name,
            sourceValue: item.sourceServiceValue,
            reason: item.serviceName ? "MISSING_SERVICE_OPTION" : "UNMAPPED_SERVICE",
          });
        }
        report.imported++;
        if (organizerResolution.kind === "matched") {
          if (existing?.organizerId) report.organizers.preserved++;
          else report.organizers.mapped++;
        }
      } catch (error) {
        report.errors.push({
          clickUpId: item.clickUpId,
          reason: error instanceof Error ? error.message : "INVALID_CLICKUP_TASK",
        });
      }
    }
    return report;
  }
}
