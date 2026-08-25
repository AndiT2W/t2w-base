export type TableSortDirection = "asc" | "desc";
export type TableColumn<T, K extends string = string> = { key: K; sortValue: (row: T) => string | number | undefined };
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
