export type TableSortDirection = "asc" | "desc";
export type TableColumn<T, K extends string = string> = { key: K; sortValue: (row: T) => string | number | undefined };
export type TablePreferenceAdapter = {
  read(key: string): string | null;
  write(key: string, value: string): void;
  clear(key: string): void;
};
export function recoverVisibleColumns<T extends string>(stored: unknown, columns: readonly T[]) {
  if (!Array.isArray(stored)) return [...columns];
  const valid = stored.filter((column): column is T => typeof column === "string" && columns.includes(column as T));
  return columns.filter((column) => valid.includes(column) || !stored.includes(column));
}
export function sortTableRows<T>(rows: readonly T[], column: TableColumn<T>, direction: TableSortDirection) {
  return rows.map((row, index) => ({ row, index, value: column.sortValue(row) ?? "" })).sort((a, b) => {
    const comparison = typeof a.value === "number" && typeof b.value === "number" ? a.value - b.value : String(a.value).localeCompare(String(b.value), "de", { numeric: true });
    return (direction === "asc" ? comparison : -comparison) || a.index - b.index;
  }).map(({ row }) => row);
}

export function createTablePreferences<T extends string>(
  adapter: TablePreferenceAdapter,
  key: string,
  columns: readonly T[],
) {
  return {
    load(): T[] {
      try {
        const stored = adapter.read(key);
        if (!stored) return [...columns];
        const parsed: unknown = JSON.parse(stored);
        const visible = isStoredPreference(parsed)
          ? parsed.visible.filter((column): column is T => typeof column === "string" && columns.includes(column as T))
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
      adapter.write(key, JSON.stringify({ visible: next }));
      return next;
    },
  };
}

function isStoredPreference(value: unknown): value is { visible: unknown[] } {
  return typeof value === "object" && value !== null && "visible" in value && Array.isArray(value.visible);
}
