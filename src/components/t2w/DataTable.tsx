import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * TIME2WIN's compact, desktop-first table primitive.  It owns table rhythm and
 * focus treatment; domain workspaces only provide columns and cell content.
 */
export const DataTable = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto rounded-md border border-border bg-card">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-[13px] leading-4", className)}
        {...props}
      />
    </div>
  ),
);
DataTable.displayName = "DataTable";

export const DataTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-muted/45 text-[11px] uppercase tracking-wide text-muted-foreground [&_tr]:border-b",
      className,
    )}
    {...props}
  />
));
DataTableHeader.displayName = "DataTableHeader";

export const DataTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-b-0", className)} {...props} />
));
DataTableBody.displayName = "DataTableBody";

export const DataTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "h-[34px] border-b border-border/80 transition-colors hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=selected]:bg-primary/10",
      className,
    )}
    {...props}
  />
));
DataTableRow.displayName = "DataTableRow";

export const DataTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-[30px] whitespace-nowrap px-2 text-left align-middle font-semibold",
      className,
    )}
    {...props}
  />
));
DataTableHead.displayName = "DataTableHead";

export const DataTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("h-[34px] max-w-0 truncate px-2 py-1 align-middle", className)}
    {...props}
  />
));
DataTableCell.displayName = "DataTableCell";

export const DataTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn("border-t bg-muted/45 font-medium", className)} {...props} />
));
DataTableFooter.displayName = "DataTableFooter";

export const dataTableBadgeClass =
  "inline-flex h-5 max-w-full items-center truncate rounded-[4px] px-1.5 text-[11px] font-semibold leading-4";
