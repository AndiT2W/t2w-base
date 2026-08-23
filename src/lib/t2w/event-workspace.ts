import type { T2WEvent } from "./types";

type Transport = {
  save(id: string, patch: Partial<T2WEvent>): Promise<T2WEvent>;
  syncOutlook(id: string): Promise<T2WEvent>;
  outlookPlan(id: string): Promise<OutlookFolderPlan>;
};
export type OutlookFolderPlan = {
  year?: string;
  yearFolderName?: string;
  quarter?: string;
  eventFolderName?: string;
  path: string;
  drifted: boolean;
};
export type SaveResult =
  { kind: "saved"; event: T2WEvent } | { kind: "conflict" } | { kind: "failed"; error: Error };
export type SyncResult = { kind: "synced"; event: T2WEvent } | { kind: "failed"; error: Error };

export function createEventWorkspace(transport: Transport) {
  return {
    async save(current: T2WEvent, patch: Partial<T2WEvent>): Promise<SaveResult> {
      const start = patch.start ?? current.start;
      const ende = patch.ende && patch.ende >= start ? patch.ende : start;
      try {
        const event = await transport.save(current.id, {
          ...patch,
          ende,
          version: current.version,
        });
        return { kind: "saved", event };
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "EVENT_VERSION_CONFLICT")
          return { kind: "conflict" };
        return {
          kind: "failed",
          error: error instanceof Error ? error : new Error("EVENT_SAVE_FAILED"),
        };
      }
    },
    async syncOutlook(id: string): Promise<SyncResult> {
      try {
        return { kind: "synced", event: await transport.syncOutlook(id) };
      } catch (error) {
        return {
          kind: "failed",
          error: error instanceof Error ? error : new Error("OUTLOOK_FOLDER_SYNC_FAILED"),
        };
      }
    },
    outlookPlan: (id: string) => transport.outlookPlan(id),
  };
}
