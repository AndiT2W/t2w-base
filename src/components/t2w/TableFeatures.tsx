import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SortDirection = "asc" | "desc";

export function useStoredColumns<T extends string>(storageKey: string, columns: readonly T[]) {
  const [visibleColumns, setVisibleColumns] = useState<T[]>([...columns]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      const next = parsed.filter(
        (column): column is T => typeof column === "string" && columns.includes(column as T),
      );
      if (next.length) setVisibleColumns(next);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [columns, storageKey]);

  function toggleColumn(column: T) {
    setVisibleColumns((current) => {
      const next = current.includes(column)
        ? current.filter((item) => item !== column)
        : columns.filter((item) => current.includes(item) || item === column);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  return { visibleColumns, toggleColumn };
}

export function ColumnPicker<T extends string>({
  columns,
  visibleColumns,
  toggleColumn,
}: {
  columns: readonly T[];
  visibleColumns: T[];
  toggleColumn: (column: T) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-end">
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Spalten auswählen
      </Button>
      {open && (
        <div className="absolute top-9 z-10 w-48 rounded border border-border bg-background p-2 shadow-md">
          {columns.map((column) => (
            <label
              key={column}
              className="flex cursor-pointer items-center gap-2 px-1 py-1 text-sm"
            >
              <input
                type="checkbox"
                checked={visibleColumns.includes(column)}
                onChange={() => toggleColumn(column)}
              />
              {column}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function SortHeader({
  label,
  active,
  direction,
  onSort,
  children,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onSort: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
      onClick={onSort}
      aria-label={`${label} sortieren`}
    >
      {children ?? label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-50" />
      )}
    </button>
  );
}
