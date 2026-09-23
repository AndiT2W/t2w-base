import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  ColumnPicker,
  DataTable,
  TableToolbar,
  useTableBehavior,
} from "@/components/t2w/DataTable";
import { eventDateCollisionSurfaceClass } from "@/components/t2w/EventDateCollision";
import { EventMobileList } from "@/components/t2w/EventMobileList";
import {
  EVENT_COLUMNS,
  EVENT_SORT_COLUMNS,
  EventHeaderCells,
  EventRowCells,
  type EventCellContext,
  type EventColumn,
} from "@/components/t2w/EventTableColumns";
import { FilterBar } from "@/components/t2w/FilterBar";
import type { EventDateCollision } from "@/lib/t2w/event-date-collisions";
import type { SelectionListSnapshot } from "@/lib/t2w/selection-list-workspace";
import type { Settings, T2WEvent } from "@/lib/t2w/types";

type EventTablePresentationProps = {
  /** The route has already selected its events; this module owns their table order. */
  events: readonly T2WEvent[];
  settings: Settings;
  selectionLists: SelectionListSnapshot;
  tableId: string;
  exportName: string;
  emptyText: string;
  children: ReactNode;
  emptyReset?: { count: number; onReset: () => void };
  dateCollisions?: ReadonlyMap<string, EventDateCollision>;
  statusTitle?: EventCellContext["statusTitle"];
  desktopFooter?: ReactNode;
};

/**
 * Shared presentation for the two Event lists. Each route selects events and
 * supplies its filter controls; preference handling, sorting, tools, cards,
 * desktop rows and collision decoration stay together here.
 */
export function EventTablePresentation({
  events,
  settings,
  selectionLists,
  tableId,
  exportName,
  emptyText,
  children,
  emptyReset,
  dateCollisions,
  statusTitle,
  desktopFooter,
}: EventTablePresentationProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const table = useTableBehavior<T2WEvent, EventColumn>({
    storageKey: tableId,
    columns: EVENT_SORT_COLUMNS,
    initialSort: { key: "Zeitraum", direction: "asc" },
  });
  const { visibleColumns, toggleColumn, moveColumn, sort, sortBy } = table;
  const rows = table.rows(events);

  return (
    <>
      <FilterBar
        werkzeuge={
          <div className="hidden md:block">
            <TableToolbar
              tableRef={tableRef}
              exportName={exportName}
              columnPicker={
                <ColumnPicker
                  columns={EVENT_COLUMNS}
                  visibleColumns={visibleColumns}
                  toggleColumn={toggleColumn}
                  moveColumn={moveColumn}
                />
              }
            />
          </div>
        }
      >
        {children}
      </FilterBar>

      <EventMobileList
        events={rows}
        settings={settings}
        selectionLists={selectionLists}
        emptyText={emptyText}
        {...(dateCollisions ? { dateCollisions } : {})}
      />
      <div className="hidden md:block">
        <DataTable ref={tableRef} exportName={exportName} tools="extern" className="min-w-[54rem]">
          <thead className="text-left">
            <tr>
              <EventHeaderCells visibleColumns={visibleColumns} sort={sort} onSort={sortBy} />
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => {
              const dateCollision = dateCollisions?.get(event.id);
              return (
                <tr
                  key={event.id}
                  className={eventDateCollisionSurfaceClass(dateCollision, "table")}
                  data-date-collision-group={
                    dateCollision ? String(dateCollision.groupIndex + 1) : undefined
                  }
                >
                  <EventRowCells
                    event={event}
                    visibleColumns={visibleColumns}
                    context={{ settings, selectionLists, statusTitle, dateCollision }}
                  />
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                {emptyReset ? (
                  <td
                    colSpan={visibleColumns.length}
                    className="!h-auto !max-w-none !overflow-visible !whitespace-normal py-8"
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <p className="text-sm font-medium text-foreground">{emptyText}</p>
                      {emptyReset.count > 0 && (
                        <Button size="sm" variant="outline" onClick={emptyReset.onReset}>
                          {emptyReset.count} Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </td>
                ) : (
                  <td
                    colSpan={visibleColumns.length}
                    className="px-2 py-8 text-center text-muted-foreground"
                  >
                    {emptyText}
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </DataTable>
        {desktopFooter}
      </div>
    </>
  );
}
