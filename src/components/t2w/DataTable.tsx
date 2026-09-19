import * as React from "react";
import { useCallback, useEffect, useRef, useState, type ForwardedRef, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  FileSpreadsheet,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  createTableBehavior,
  createTablePreferences,
  type TableColumn,
  type TablePreferenceAdapter,
  type TableSortDirection,
} from "./table-model";
import { cn } from "@/lib/utils";

/**
 * TIME2WIN's compact, desktop-first table primitive.  It owns table rhythm and
 * focus treatment; domain workspaces only provide columns and cell content.
 */
type DataTableProps = React.HTMLAttributes<HTMLTableElement> & {
  exportName: string;
  exportFileName?: string;
  /**
   * Die `ColumnPicker` der Seite.  Sie steht in derselben Symbolleiste wie der
   * Export; beide sind Werkzeuge der Tabelle, nicht der Seite.
   */
  columnPicker?: ReactNode;
  /**
   * "ueber-tabelle" stellt die Symbolleiste in einer eigenen schmalen Zeile.
   * "extern" lässt sie weg: Seiten mit Filterzeile setzen `TableToolbar` an
   * deren rechtes Ende und sparen damit die Zeile.  Das Aussehen der Werkzeuge
   * bleibt in beiden Fällen dasselbe.
   */
  tools?: "ueber-tabelle" | "extern";
};

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

function normalizedText(value: string) {
  return value.replaceAll(/\s+/g, " ").trim();
}

function cellText(cell: HTMLTableCellElement) {
  const explicitValue = cell.dataset["exportValue"];
  if (explicitValue != null) return explicitValue;
  if (cell.tagName === "TH") {
    const sortButton = cell.querySelector<HTMLElement>('[aria-label$=" sortieren"]');
    if (sortButton?.ariaLabel) return sortButton.ariaLabel.replace(/ sortieren$/, "");
  }

  const clone = cell.cloneNode(true) as HTMLTableCellElement;
  const originalControls = cell.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >("input, select, textarea");
  clone
    .querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea",
    )
    .forEach((control, index) => {
      const original = originalControls[index];
      let value = "";
      if (original instanceof HTMLInputElement && original.type === "checkbox") {
        value = original.checked ? "Ja" : "Nein";
      } else if (original instanceof HTMLSelectElement) {
        value = original.selectedOptions[0]?.text ?? "";
      } else if (original) {
        value = original.value;
      }
      control.replaceWith(document.createTextNode(value));
    });
  clone
    .querySelectorAll("svg, [aria-hidden='true'], [data-export-ignore]")
    .forEach((node) => node.remove());
  const text = normalizedText(clone.textContent ?? "");
  if (text) return text.replace(/:$/, "");

  return normalizedText(
    [...cell.querySelectorAll<HTMLElement>("[aria-label], [title]")]
      .map((node) => node.ariaLabel || node.title)
      .filter(Boolean)
      .join(", "),
  );
}

const ignoredHeader = /^(aktion|aktionen)$/i;

function tableData(table: HTMLTableElement) {
  const headerCells = [...(table.tHead?.rows[table.tHead.rows.length - 1]?.cells ?? [])];
  const ignoredColumns = new Set(
    headerCells.flatMap((cell, index) => {
      const text = cellText(cell);
      return cell.dataset["exportIgnore"] != null || !text || ignoredHeader.test(text)
        ? [index]
        : [];
    }),
  );
  const rows = [...table.rows].map((row, rowIndex) =>
    [...row.cells]
      .filter((cell, index) => !ignoredColumns.has(index) && cell.dataset["exportIgnore"] == null)
      .map((cell) => {
        const value = cellText(cell);
        return rowIndex < (table.tHead?.rows.length ?? 0)
          ? { value, fontWeight: "bold" as const, backgroundColor: "#E9EDF2" }
          : value;
      }),
  );
  return rows.filter((row) => row.length > 0);
}

function excelFileName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
  return `${slug || "tabelle"}.xlsx`;
}

/**
 * Der Excel-Export einer gemeinsamen Tabelle: ein Symbol in der Leiste über der
 * Tabelle.  Der ausgeschriebene Name steckt im barrierefreien Namen und im
 * Tooltip, damit die Leiste nicht mit der Tabelle um Aufmerksamkeit streitet.
 */
export function TableExportButton({
  tableRef,
  exportName,
  exportFileName,
}: {
  tableRef: React.RefObject<HTMLTableElement | null>;
  exportName: string;
  exportFileName?: string | undefined;
}) {
  const [exporting, setExporting] = useState(false);
  async function exportTable() {
    if (!tableRef.current || exporting) return;
    setExporting(true);
    try {
      const data = tableData(tableRef.current);
      const columnCount = data.reduce((maximum, row) => Math.max(maximum, row.length), 0);
      const columns = Array.from({ length: columnCount }, (_, columnIndex) => ({
        width: Math.min(
          50,
          Math.max(
            10,
            ...data.map((row) => {
              const cell = row[columnIndex];
              return (
                String(typeof cell === "object" && cell ? cell.value : (cell ?? "")).length + 2
              );
            }),
          ),
        ),
      }));
      const { default: writeExcelFile } = await import("write-excel-file/browser");
      const blob = await writeExcelFile(data, {
        columns,
        sheet: exportName.replaceAll(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Tabelle",
        stickyRowsCount: tableRef.current.tHead?.rows.length ?? 0,
      }).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFileName ?? excelFileName(exportName);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Excel export failed", error);
      toast.error("Excel-Export konnte nicht erstellt werden.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="size-7 text-muted-foreground hover:text-foreground"
      disabled={exporting}
      aria-label={`${exportName} als Excel exportieren`}
      title={exporting ? "Excel wird erstellt …" : "Als Excel exportieren"}
      onClick={() => void exportTable()}
    >
      {exporting ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <FileSpreadsheet className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}

/**
 * Spalten und Export als Symbolpaar.  `DataTable` stellt sie selbst über die
 * Tabelle; Seiten mit eigener Filterzeile setzen sie mit `tools="extern"` an
 * deren rechtes Ende und sparen so eine Zeile Höhe.  So oder so sehen die
 * Werkzeuge in jeder Tabelle gleich aus.
 */
export function TableToolbar({
  tableRef,
  exportName,
  exportFileName,
  columnPicker,
}: {
  tableRef: React.RefObject<HTMLTableElement | null>;
  exportName: string;
  exportFileName?: string | undefined;
  columnPicker?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {columnPicker}
      <TableExportButton
        tableRef={tableRef}
        exportName={exportName}
        exportFileName={exportFileName}
      />
    </div>
  );
}

export const DataTable = React.forwardRef<HTMLTableElement, DataTableProps>(
  (
    { className, exportName, exportFileName, columnPicker, tools = "ueber-tabelle", ...props },
    ref,
  ) => {
    const tableRef = useRef<HTMLTableElement>(null);
    return (
      <div className="space-y-1">
        {tools === "ueber-tabelle" && (
          <div className="flex justify-end">
            <TableToolbar
              tableRef={tableRef}
              exportName={exportName}
              exportFileName={exportFileName}
              columnPicker={columnPicker}
            />
          </div>
        )}
        <div
          className="relative w-full overflow-x-auto rounded-xl border border-border bg-card xl:overflow-visible"
          data-density="compact"
        >
          <table
            ref={(value) => {
              tableRef.current = value;
              assignRef(ref, value);
            }}
            className={cn(
              "t2w-data-table w-full caption-bottom text-[13px] leading-4 [&_thead_tr]:h-[30px] [&_th]:h-[30px] [&_th]:whitespace-nowrap [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:align-middle [&_tbody_tr]:h-[34px] [&_tbody_tr]:border-b [&_tbody_tr]:border-border/70 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/40 [&_tbody_tr:last-child]:border-b-0 [&_td]:h-[34px] [&_td]:max-w-0 [&_td]:truncate [&_td]:px-2 [&_td]:py-1 [&_td]:align-middle [&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-ring [&_button:focus-visible]:outline-none [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-ring [&_input:focus-visible]:outline-none [&_input:focus-visible]:ring-2 [&_input:focus-visible]:ring-ring",
              className,
            )}
            {...props}
          />
        </div>
      </div>
    );
  },
);
DataTable.displayName = "DataTable";

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

  const persist = useCallback(() => {
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
  }, [behavior, options.storageKey]);

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
  }, [behavior, options.storageKey, persist]);

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

/**
 * Spaltenauswahl und -reihenfolge.  Sie gehört in die Symbolleiste der Tabelle
 * (`DataTable` nimmt sie als `columnPicker` entgegen); die Liste steht in der
 * Anzeigereihenfolge der Spalten, oben ist links.
 */
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
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 text-muted-foreground hover:text-foreground"
          aria-label="Spalten auswählen"
          title="Spalten auswählen und ordnen"
        >
          <Columns3 className="size-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <p className="px-1 pb-1 text-xs text-muted-foreground">
          Sichtbarkeit und Reihenfolge — oben ist links
        </p>
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
                    aria-label={`${column} nach links verschieben`}
                    disabled={visibleIndex === 0}
                    onClick={() => moveColumn(column, -1)}
                  >
                    <ChevronLeft className="size-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    aria-label={`${column} nach rechts verschieben`}
                    disabled={visibleIndex === visibleColumns.length - 1}
                    onClick={() => moveColumn(column, 1)}
                  >
                    <ChevronRight className="size-3.5" aria-hidden="true" />
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
      className="inline-flex items-center gap-1 rounded-sm font-semibold hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
