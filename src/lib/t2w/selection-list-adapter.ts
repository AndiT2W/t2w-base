import {
  apiCreateEventRole,
  apiCreateSport,
  apiManageEventRoles,
  apiManageServices,
  apiManageSports,
  apiUpdateEventRole,
  apiUpdateSport,
  apiCreateService,
  apiUpdateService,
  apiManageHardwareObjects,
  apiCreateHardwareObject,
  apiUpdateHardwareObject,
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
      return kind === "sports"
        ? apiManageSports()
        : kind === "services"
          ? apiManageServices()
          : kind === "hardwareObjects"
            ? apiManageHardwareObjects()
            : apiManageEventRoles();
    },
    create(kind: SelectionListKind, name: string): Promise<SelectionListValue> {
      return kind === "sports"
        ? apiCreateSport(name)
        : kind === "services"
          ? apiCreateService(name)
          : kind === "hardwareObjects"
            ? apiCreateHardwareObject(name)
            : apiCreateEventRole(name);
    },
    update(
      kind: SelectionListKind,
      id: string,
      patch: SelectionListPatch,
    ): Promise<SelectionListValue> {
      return kind === "sports"
        ? apiUpdateSport(id, patch)
        : kind === "services"
          ? apiUpdateService(id, patch)
          : kind === "hardwareObjects"
            ? apiUpdateHardwareObject(id, patch)
            : apiUpdateEventRole(id, patch);
    },
    reorder(kind, ids) {
      const path = kind === "sports" ? "sports" : kind === "services" ? "services" : kind === "hardwareObjects" ? "hardware-objects" : "event-roles";
      return fetch(`/api/v1/${path}/reorder`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }).then(async (response) => { if (!response.ok) throw new Error("SELECTION_LIST_REORDER_FAILED"); return response.json(); });
    },
  };
}
