export type SelectionListKind = "sports" | "eventRoles";
export type SelectionListValue = { id: string; name: string; active: boolean };
export type SelectionListSnapshot = Record<SelectionListKind, SelectionListValue[]> & {
  loaded: boolean;
};

export type SelectionListAdapter = {
  load(kind: SelectionListKind): Promise<SelectionListValue[]>;
  create(kind: SelectionListKind, name: string): Promise<SelectionListValue>;
  update(
    kind: SelectionListKind,
    id: string,
    patch: { name?: string; active?: boolean },
  ): Promise<SelectionListValue>;
};

const sortValues = (values: SelectionListValue[]) =>
  [...values].sort((left, right) => left.name.localeCompare(right.name, "de"));

export function createSelectionListWorkspace(adapter: SelectionListAdapter) {
  let snapshot: SelectionListSnapshot = { sports: [], eventRoles: [], loaded: false };
  const subscribers = new Set<() => void>();
  const publish = () => subscribers.forEach((subscriber) => subscriber());
  const replace = (kind: SelectionListKind, values: SelectionListValue[]) => {
    snapshot = { ...snapshot, [kind]: sortValues(values) };
    publish();
  };

  return {
    snapshot: () => snapshot,
    subscribe(subscriber: () => void) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    active(kind: SelectionListKind) {
      return snapshot[kind].filter((value) => value.active);
    },
    async load() {
      const [sports, eventRoles] = await Promise.all([
        adapter.load("sports"),
        adapter.load("eventRoles"),
      ]);
      snapshot = {
        sports: sortValues(sports),
        eventRoles: sortValues(eventRoles),
        loaded: true,
      };
      publish();
      return snapshot;
    },
    async create(kind: SelectionListKind, name: string) {
      const value = await adapter.create(kind, name.trim());
      replace(kind, [...snapshot[kind], value]);
      return value;
    },
    async update(kind: SelectionListKind, id: string, patch: { name?: string; active?: boolean }) {
      const value = await adapter.update(kind, id, patch);
      replace(
        kind,
        snapshot[kind].map((current) => (current.id === id ? value : current)),
      );
      return value;
    },
  };
}
