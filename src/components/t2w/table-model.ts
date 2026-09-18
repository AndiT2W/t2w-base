export type TableSortDirection = "asc" | "desc";
export type TableColumn<T, K extends string = string> = {
  key: K;
  sortValue: (row: T) => string | number | undefined;
};
export type TablePreferenceAdapter = {
  read(key: string): string | null;
  write(key: string, value: string): void;
  clear(key: string): void;
};
export type TableViewPreference<K extends string = string> = {
  version: 1;
  /** The order is intentional: it is both the visible-column list and its display order. */
  visible: K[];
  sort?: { key: K; direction: TableSortDirection };
};
export function recoverVisibleColumns<T extends string>(stored: unknown, columns: readonly T[]) {
  if (!Array.isArray(stored)) return [...columns];
  const valid = stored.filter(
    (column): column is T => typeof column === "string" && columns.includes(column as T),
  );
  const known = valid.filter((column, index) => valid.indexOf(column) === index);
  return [...known, ...columns.filter((column) => !stored.includes(column))];
}
export function sortTableRows<T>(
  rows: readonly T[],
  column: TableColumn<T>,
  direction: TableSortDirection,
) {
  return rows
    .map((row, index) => ({ row, index, value: column.sortValue(row) ?? "" }))
    .sort((a, b) => {
      const comparison =
        typeof a.value === "number" && typeof b.value === "number"
          ? a.value - b.value
          : String(a.value).localeCompare(String(b.value), "de", { numeric: true });
      return (direction === "asc" ? comparison : -comparison) || a.index - b.index;
    })
    .map(({ row }) => row);
}

export function createTablePreferences<T extends string>(
  adapter: TablePreferenceAdapter,
  key: string,
  columns: readonly T[],
) {
  function save(visible: readonly T[], sort?: { key: string; direction: TableSortDirection }) {
    adapter.write(
      key,
      JSON.stringify({
        version: 1,
        visible: [...visible],
        ...(sort ? { sort } : {}),
      } satisfies TableViewPreference),
    );
  }
  return {
    load(): T[] {
      try {
        const stored = adapter.read(key);
        if (!stored) return [...columns];
        const parsed: unknown = JSON.parse(stored);
        const visible = isStoredPreference(parsed)
          ? validVisibleColumns(parsed.visible, columns)
          : recoverVisibleColumns(parsed, columns);
        return visible.length ? visible : [...columns];
      } catch {
        adapter.clear(key);
        return [...columns];
      }
    },
    toggle(visible: readonly T[], column: T): T[] {
      const next = visible.includes(column)
        ? visible.filter((item) => item !== column)
        : columns.filter((item) => visible.includes(item) || item === column);
      save(next);
      return next;
    },
    save,
  };
}

function isStoredPreference(value: unknown): value is { visible: unknown[]; sort?: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "visible" in value &&
    Array.isArray(value.visible)
  );
}

function validVisibleColumns<T extends string>(stored: unknown[], columns: readonly T[]) {
  return stored.filter(
    (column, index): column is T =>
      typeof column === "string" &&
      columns.includes(column as T) &&
      stored.indexOf(column) === index,
  );
}

export function createTableBehavior<T, K extends string>(options: {
  adapter: TablePreferenceAdapter;
  storageKey: string;
  columns: readonly TableColumn<T, K>[];
  initialSort: { key: K; direction: TableSortDirection };
}) {
  const keys = options.columns.map((column) => column.key);
  const preferences = createTablePreferences(options.adapter, options.storageKey, keys);
  let visibleColumns = [...keys];
  let sort = { ...options.initialSort };

  return {
    load() {
      visibleColumns = preferences.load();
      return this.snapshot();
    },
    snapshot() {
      return { visibleColumns: [...visibleColumns], sort: { ...sort } };
    },
    preference(): TableViewPreference<K> {
      return { version: 1, visible: [...visibleColumns], sort: { ...sort } };
    },
    hydrate(preference: unknown) {
      if (isStoredPreference(preference)) {
        const visible = validVisibleColumns(preference.visible, keys);
        visibleColumns = visible.length ? visible : [...keys];
        const candidate = preference.sort;
        if (
          candidate &&
          typeof candidate === "object" &&
          candidate !== null &&
          "key" in candidate &&
          "direction" in candidate &&
          typeof candidate.key === "string" &&
          keys.includes(candidate.key as K) &&
          (candidate.direction === "asc" || candidate.direction === "desc")
        ) {
          sort = { key: candidate.key as K, direction: candidate.direction };
        }
      }
      return this.snapshot();
    },
    toggleColumn(column: K) {
      visibleColumns = preferences.toggle(visibleColumns, column);
      preferences.save(visibleColumns, sort);
      return this.snapshot();
    },
    moveColumn(column: K, offset: -1 | 1) {
      const index = visibleColumns.indexOf(column);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= visibleColumns.length) return this.snapshot();
      const next = [...visibleColumns];
      const current = next[index]!;
      next[index] = next[target]!;
      next[target] = current;
      visibleColumns = next;
      preferences.save(visibleColumns, sort);
      return this.snapshot();
    },
    sortBy(column: K) {
      sort = {
        key: column,
        direction:
          sort.key === column && sort.direction === "asc" ? ("desc" as const) : ("asc" as const),
      };
      preferences.save(visibleColumns, sort);
      return this.snapshot();
    },
    rows(rows: readonly T[]) {
      const column = options.columns.find((candidate) => candidate.key === sort.key);
      return column ? sortTableRows(rows, column, sort.direction) : [...rows];
    },
  };
}
