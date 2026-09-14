import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpDown, ArrowUpToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  createTableBehavior,
  createTablePreferences,
  type TableColumn,
  type TablePreferenceAdapter,
  type TableSortDirection,
} from "./table-model";

export type SortDirection = "asc" | "desc";

const browserTablePreferenceAdapter: TablePreferenceAdapter = {
  read: (key) => localStorage.getItem(key),
  write: (key, value) => localStorage.setItem(key, value),
  clear: (key) => localStorage.removeItem(key),
};

export function useStoredColumns<T extends string>(storageKey: string, columns: readonly T[]) {
  const [visibleColumns, setVisibleColumns] = useState<T[]>([...columns]);

  useEffect(() => {
    setVisibleColumns(
      createTablePreferences(browserTablePreferenceAdapter, storageKey, columns).load(),
    );
  }, [columns, storageKey]);

  function toggleColumn(column: T) {
    setVisibleColumns((current) => {
      const next = createTablePreferences(
        browserTablePreferenceAdapter,
        storageKey,
        columns,
      ).toggle(current, column);
      return next;
    });
  }

  return { visibleColumns, toggleColumn };
}

export function useTableBehavior<T, K extends string>(options: {
  storageKey: string;
  columns: readonly TableColumn<T, K>[];
  initialSort: { key: K; direction: TableSortDirection };
}) {
  const [behavior] = useState(() =>
    createTableBehavior({ ...options, adapter: browserTablePreferenceAdapter }),
  );
  const [snapshot, setSnapshot] = useState(behavior.snapshot());
  const writes = useRef(Promise.resolve());

  function persist() {
    const preference = behavior.preference();
    writes.current = writes.current
      .then(async () => {
        await fetch(`/api/v1/table-preferences/${encodeURIComponent(options.storageKey)}`, {
          method: "PUT",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(preference),
        });
      })
      .catch(() => undefined);
  }

  useEffect(() => setSnapshot(behavior.load()), [behavior]);
  useEffect(() => {
    let active = true;
    void fetch(`/api/v1/table-preferences/${encodeURIComponent(options.storageKey)}`, {
      credentials: "include",
    })
      .then(async (response) =>
        response.ok ? ((await response.json()) as { value?: unknown }) : null,
      )
      .then((remote) => {
        if (!active) return;
        if (remote?.value) setSnapshot(behavior.hydrate(remote.value));
        else if (browserTablePreferenceAdapter.read(options.storageKey)) persist();
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [behavior, options.storageKey]);

  return {
    ...snapshot,
    rows: (rows: readonly T[]) => behavior.rows(rows),
    sortBy: (column: K) => {
      setSnapshot(behavior.sortBy(column));
      persist();
    },
    toggleColumn: (column: K) => {
      setSnapshot(behavior.toggleColumn(column));
      persist();
    },
    moveColumn: (column: K, offset: -1 | 1) => {
      setSnapshot(behavior.moveColumn(column, offset));
      persist();
    },
  };
}

export function ColumnPicker<T extends string>({
  columns,
  visibleColumns,
  toggleColumn,
  moveColumn,
}: {
  columns: readonly T[];
  visibleColumns: T[];
  toggleColumn: (column: T) => void;
  moveColumn?: (column: T, offset: -1 | 1) => void;
}) {
  const orderedColumns = [
    ...visibleColumns,
    ...columns.filter((column) => !visibleColumns.includes(column)),
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Spalten auswählen
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-2">
        <p className="px-1 pb-1 text-xs text-muted-foreground">Sichtbarkeit und Reihenfolge</p>
        {orderedColumns.map((column) => {
          const isVisible = visibleColumns.includes(column);
          const visibleIndex = visibleColumns.indexOf(column);
          return (
            <div key={column} className="flex min-h-8 items-center gap-1 px-1 text-sm">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 truncate">
                <input type="checkbox" checked={isVisible} onChange={() => toggleColumn(column)} />
                <span className="truncate">{column}</span>
              </label>
              {moveColumn && isVisible && (
                <span className="flex">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    aria-label={`${column} nach oben verschieben`}
                    disabled={visibleIndex === 0}
                    onClick={() => moveColumn(column, -1)}
                  >
                    <ArrowUpToLine className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    aria-label={`${column} nach unten verschieben`}
                    disabled={visibleIndex === visibleColumns.length - 1}
                    onClick={() => moveColumn(column, 1)}
                  >
                    <ArrowDownToLine className="size-3" />
                  </Button>
                </span>
              )}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
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
      aria-pressed={active}
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
