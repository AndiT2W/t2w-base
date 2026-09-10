import type { SelectionListKind, SelectionListPatch } from "./selection-list-workspace";
type Operations = {
  create(kind: SelectionListKind, name: string): Promise<void>;
  update(kind: SelectionListKind, id: string, patch: SelectionListPatch): Promise<void>;
  reorder(kind: SelectionListKind, id: string, targetId: string): Promise<void>;
};
export function createSelectionListManagementWorkspace(operations: Operations) {
  const run = async (work: () => Promise<void>) => {
    try {
      await work();
      return { kind: "saved" as const };
    } catch {
      return { kind: "failed" as const };
    }
  };
  return {
    create(kind: SelectionListKind, name: string) {
      const normalized = name.trim();
      return normalized
        ? run(() => operations.create(kind, normalized))
        : Promise.resolve({ kind: "invalid" as const });
    },
    update: (kind: SelectionListKind, id: string, patch: SelectionListPatch) =>
      run(() => operations.update(kind, id, patch)),
    reorder: (kind: SelectionListKind, id: string, targetId: string) =>
      id === targetId
        ? Promise.resolve({ kind: "saved" as const })
        : run(() => operations.reorder(kind, id, targetId)),
  };
}
