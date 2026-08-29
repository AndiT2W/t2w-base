import {
  apiCreateEventRole,
  apiCreateSport,
  apiManageEventRoles,
  apiManageSports,
  apiUpdateEventRole,
  apiUpdateSport,
} from "./api";
import type {
  SelectionListAdapter,
  SelectionListKind,
  SelectionListPatch,
  SelectionListValue,
} from "./selection-list-workspace";

/** Browser adapter for the generic selection-list module. Route names stay internal. */
export function createHttpSelectionListAdapter(): SelectionListAdapter {
  return {
    load(kind: SelectionListKind): Promise<SelectionListValue[]> {
      return kind === "sports" ? apiManageSports() : apiManageEventRoles();
    },
    create(kind: SelectionListKind, name: string): Promise<SelectionListValue> {
      return kind === "sports" ? apiCreateSport(name) : apiCreateEventRole(name);
    },
    update(
      kind: SelectionListKind,
      id: string,
      patch: SelectionListPatch,
    ): Promise<SelectionListValue> {
      return kind === "sports" ? apiUpdateSport(id, patch) : apiUpdateEventRole(id, patch);
    },
  };
}
