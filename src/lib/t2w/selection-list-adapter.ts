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
  apiManageCommunicationChannels,
  apiCreateCommunicationChannel,
  apiUpdateCommunicationChannel,
  apiManageCommunicationTopics,
  apiCreateCommunicationTopic,
  apiUpdateCommunicationTopic,
} from "./api";
import type {
  SelectionListAdapter,
  SelectionListKind,
  SelectionListPatch,
  SelectionListValue,
} from "./selection-list-workspace";

/**
 * Was jede Auswahlliste zum Laden, Anlegen, Ändern und Sortieren braucht —
 * einmal je Art statt viermal als Fallunterscheidung.  Vorher stand dieselbe
 * Kette in `load`, `create`, `update` und `reorder`; eine neue Art bedeutete
 * vier Stellen, und eine vergessene fiel erst im Betrieb auf.
 */
type Listenzugriff = {
  load: () => Promise<SelectionListValue[]>;
  create: (name: string) => Promise<SelectionListValue>;
  update: (id: string, patch: SelectionListPatch) => Promise<SelectionListValue>;
  /** Pfad unter /api/v1 für das Sortieren. */
  reorderPfad: string;
};

async function senden(pfad: string, body: unknown, fehler: string) {
  const antwort = await fetch(`/api/v1/${pfad}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!antwort.ok) throw new Error(fehler);
  return antwort.json();
}

/**
 * Aufgabenkategorien sind eine Auswahlliste wie die anderen sechs, liegen im
 * Backend aber seit jeher unter dem Projektmanagement-Controller (api/v1/pm).
 * Statt dafür einen zweiten Satz Endpunkte für dieselben Daten aufzumachen,
 * führt die Karte hier auf die vorhandenen.
 */
const gruppenPfad = "pm/groups";

async function gruppenLaden(): Promise<SelectionListValue[]> {
  const antwort = await fetch(`/api/v1/${gruppenPfad}`, { credentials: "include" });
  if (!antwort.ok) throw new Error("SELECTION_LIST_LOAD_FAILED");
  return antwort.json();
}

const ZUGRIFF: Record<SelectionListKind, Listenzugriff> = {
  sports: {
    load: apiManageSports,
    create: apiCreateSport,
    update: apiUpdateSport,
    reorderPfad: "sports",
  },
  services: {
    load: apiManageServices,
    create: apiCreateService,
    update: apiUpdateService,
    reorderPfad: "services",
  },
  hardwareObjects: {
    load: apiManageHardwareObjects,
    create: apiCreateHardwareObject,
    update: apiUpdateHardwareObject,
    reorderPfad: "hardware-objects",
  },
  communicationChannels: {
    load: apiManageCommunicationChannels,
    create: apiCreateCommunicationChannel,
    update: apiUpdateCommunicationChannel,
    reorderPfad: "communication-channels",
  },
  communicationTopics: {
    load: apiManageCommunicationTopics,
    create: apiCreateCommunicationTopic,
    update: apiUpdateCommunicationTopic,
    reorderPfad: "communication-topics",
  },
  eventRoles: {
    load: apiManageEventRoles,
    create: apiCreateEventRole,
    update: apiUpdateEventRole,
    reorderPfad: "event-roles",
  },
  taskCategories: {
    load: gruppenLaden,
    create: async (name) =>
      senden(gruppenPfad, { name, active: true, sortOrder: 0 }, "SELECTION_LIST_CREATE_FAILED"),
    update: async (id, patch) =>
      senden(
        gruppenPfad,
        { id, active: true, sortOrder: 0, ...patch },
        "SELECTION_LIST_UPDATE_FAILED",
      ),
    reorderPfad: `${gruppenPfad}/reorder`,
  },
};

/** Browser adapter for the generic selection-list module. Route names stay internal. */
export function createHttpSelectionListAdapter(): SelectionListAdapter {
  return {
    load: (kind) => ZUGRIFF[kind].load(),
    create: (kind, name) => ZUGRIFF[kind].create(name),
    update: (kind, id, patch) => ZUGRIFF[kind].update(id, patch),
    reorder: (kind, ids) => {
      const zugriff = ZUGRIFF[kind];
      const pfad = zugriff.reorderPfad.endsWith("/reorder")
        ? zugriff.reorderPfad
        : `${zugriff.reorderPfad}/reorder`;
      return senden(pfad, { ids }, "SELECTION_LIST_REORDER_FAILED");
    },
  };
}
