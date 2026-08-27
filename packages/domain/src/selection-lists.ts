export type SelectionListKind = "sports" | "eventRoles";
export type SelectionListValue = { id: string; name: string; active: boolean };
export type SelectionListSnapshot = Record<SelectionListKind, SelectionListValue[]> & { loaded: boolean };
export type SelectionListPatch = { name?: string; active?: boolean };

export const SELECTION_LIST_KINDS: readonly SelectionListKind[] = ["sports", "eventRoles"];

export interface SelectionListAdapter {
  load(kind: SelectionListKind): Promise<SelectionListValue[]>;
  create(kind: SelectionListKind, name: string): Promise<SelectionListValue>;
  update(kind: SelectionListKind, id: string, patch: SelectionListPatch): Promise<SelectionListValue>;
}

const normalizeName = (name: string) => {
  const normalized = name.trim();
  if (!normalized) throw new Error("SELECTION_LIST_NAME_REQUIRED");
  return normalized;
};
const sortValues = (values: SelectionListValue[]) =>
  [...values].sort((left, right) => left.name.localeCompare(right.name, "de"));

export class SelectionLists {
  constructor(private readonly adapter: SelectionListAdapter) {}

  list(kind: SelectionListKind, includeInactive = false) {
    return this.adapter.load(kind).then((values) =>
      sortValues(includeInactive ? values : values.filter((value) => value.active)),
    );
  }
  create(kind: SelectionListKind, name: string) {
    return this.adapter.create(kind, normalizeName(name));
  }
  update(kind: SelectionListKind, id: string, patch: SelectionListPatch) {
    return this.adapter.update(kind, id, {
      ...patch,
      ...(patch.name === undefined ? {} : { name: normalizeName(patch.name) }),
    });
  }
}

export function createSelectionListWorkspace(adapter: SelectionListAdapter) {
  const lists = new SelectionLists(adapter);
  let snapshot: SelectionListSnapshot = { sports: [], eventRoles: [], loaded: false };
  const subscribers = new Set<() => void>();
  const publish = () => subscribers.forEach((subscriber) => subscriber());
  const replace = (kind: SelectionListKind, values: SelectionListValue[]) => {
    snapshot = { ...snapshot, [kind]: sortValues(values) };
    publish();
  };

  return {
    snapshot: () => snapshot,
    subscribe(subscriber: () => void) { subscribers.add(subscriber); return () => subscribers.delete(subscriber); },
    active(kind: SelectionListKind) { return snapshot[kind].filter((value) => value.active); },
    async load() {
      const [sports, eventRoles] = await Promise.all([
        lists.list("sports", true),
        lists.list("eventRoles", true),
      ]);
      snapshot = { sports, eventRoles, loaded: true };
      publish();
      return snapshot;
    },
    async create(kind: SelectionListKind, name: string) {
      const value = await lists.create(kind, name);
      replace(kind, [...snapshot[kind], value]);
      return value;
    },
    async update(kind: SelectionListKind, id: string, patch: SelectionListPatch) {
      const value = await lists.update(kind, id, patch);
      replace(kind, snapshot[kind].map((current) => current.id === id ? value : current));
      return value;
    },
  };
}
