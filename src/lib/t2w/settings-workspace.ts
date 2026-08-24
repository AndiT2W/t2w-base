import type { Settings } from "./types";
export type OutlookConnection = "idle" | "checking" | "success" | "error";
export type SettingsDraft = Required<Pick<Settings, "outlookJahresordner" | "jahresSites">> & {
  outlookMailbox: string;
};
type Persistence = {
  save(settings: Settings): Promise<Settings>;
  checkOutlook(): Promise<boolean>;
};
const sorted = <T extends { jahr: string }>(entries: T[]) =>
  [...entries].sort((a, b) => {
    const left = Number.parseInt(a.jahr, 10),
      right = Number.parseInt(b.jahr, 10);
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    return right - left;
  });
const draftFrom = (settings: Settings): SettingsDraft => ({
  outlookJahresordner: settings.outlookJahresordner,
  jahresSites: sorted(settings.jahresSites),
  outlookMailbox: settings.outlookMailbox ?? "",
});

export function createSettingsWorkspace(persistence: Persistence, initial: Settings) {
  let draft = draftFrom(initial),
    dirty = false,
    connection: OutlookConnection = "idle",
    error: string | null = null;
  let snapshot = { draft, dirty, connection, error };
  const subscribers = new Set<() => void>();
  const publish = () => {
    snapshot = { draft, dirty, connection, error };
    subscribers.forEach((fn) => fn());
  };
  return {
    snapshot: () => snapshot,
    subscribe(fn: () => void) {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
      };
    },
    acceptLoaded(settings: Settings) {
      if (!dirty) {
        draft = draftFrom(settings);
        publish();
      }
    },
    update(patch: Partial<SettingsDraft>) {
      draft = { ...draft, ...patch };
      dirty = true;
      error = null;
      publish();
    },
    async save() {
      try {
        const saved = await persistence.save({
          outlookJahresordner: draft.outlookJahresordner,
          jahresSites: sorted(draft.jahresSites),
          outlookMailbox: draft.outlookMailbox.trim() || null,
        });
        draft = draftFrom(saved);
        dirty = false;
        error = null;
        publish();
        return { kind: "saved" as const, settings: saved };
      } catch (cause) {
        error = "SETTINGS_SAVE_FAILED";
        publish();
        return {
          kind: "failed" as const,
          error: cause instanceof Error ? cause : new Error("SETTINGS_SAVE_FAILED"),
        };
      }
    },
    async checkOutlook() {
      connection = "checking";
      publish();
      try {
        connection = (await persistence.checkOutlook()) ? "success" : "error";
      } catch {
        connection = "error";
      }
      publish();
      return connection;
    },
  };
}
