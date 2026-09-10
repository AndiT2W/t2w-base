import type { ApiAuditLog } from "./api";

export type AuditLogEntity = "" | "Event" | "Payout" | "Hardware";

type AuditLogReader = {
  load(filters?: { entity?: string }): Promise<ApiAuditLog[]>;
};

const searchableText = (entry: ApiAuditLog) =>
  [
    entry.entity,
    entry.entityId,
    entry.action,
    entry.user?.displayName,
    entry.user?.email,
    JSON.stringify(entry.details),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("de-AT");

const visibleEntries = (entries: ApiAuditLog[], search: string) => {
  const query = search.trim().toLocaleLowerCase("de-AT");
  return query ? entries.filter((entry) => searchableText(entry).includes(query)) : entries;
};

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function createAuditLogWorkspace(reader: AuditLogReader) {
  let entries: ApiAuditLog[] = [];
  let entity: AuditLogEntity = "";
  let search = "";
  let loading = false;
  let error: "AUDIT_LOG_LOAD_FAILED" | null = null;
  let requestGeneration = 0;
  let snapshot = buildSnapshot();
  const subscribers = new Set<() => void>();

  function buildSnapshot() {
    return {
      entries,
      visibleEntries: visibleEntries(entries, search),
      entity,
      search,
      loading,
      error,
    };
  }

  function publish() {
    snapshot = buildSnapshot();
    subscribers.forEach((subscriber) => subscriber());
  }

  async function load() {
    const generation = ++requestGeneration;
    loading = true;
    error = null;
    publish();
    try {
      const loaded = await reader.load({ entity: entity || undefined });
      if (generation !== requestGeneration) return { kind: "stale" as const };
      entries = loaded;
      loading = false;
      publish();
      return { kind: "loaded" as const, entries: loaded };
    } catch (cause) {
      if (generation !== requestGeneration) return { kind: "stale" as const };
      loading = false;
      error = "AUDIT_LOG_LOAD_FAILED";
      publish();
      return {
        kind: "failed" as const,
        error: cause instanceof Error ? cause : new Error("AUDIT_LOG_LOAD_FAILED"),
      };
    }
  }

  return {
    snapshot: () => snapshot,
    subscribe(subscriber: () => void) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    load,
    selectEntity(next: AuditLogEntity) {
      if (entity === next) return Promise.resolve({ kind: "unchanged" as const });
      entity = next;
      publish();
      return load();
    },
    search(next: string) {
      search = next;
      publish();
    },
    exportCsv(now = new Date()) {
      const rows = [
        ["Zeitpunkt", "Entität", "Aktion", "Benutzer", "Datensatz", "Details"],
        ...snapshot.visibleEntries.map((entry) => [
          new Date(entry.createdAt).toISOString(),
          entry.entity,
          entry.action,
          entry.user?.displayName ?? entry.user?.email ?? "System",
          entry.entityId,
          JSON.stringify(entry.details ?? {}),
        ]),
      ];
      return {
        contents: rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
        fileName: `auditlog-${now.toISOString().slice(0, 10)}.csv`,
        mimeType: "text/csv;charset=utf-8",
      };
    },
  };
}
