import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Standardized Data Table System
 * Handles all table features consistently across modules:
 * - Frozen headers (Excel-like)
 * - Custom scrollbars
 * - Consistent fonts, spacing, borders
 * - Hover effects
 * - Responsive design
 * - Column alignment
 */

interface DataTableProps {
  children: React.ReactNode
  className?: string
  maxHeight?: string
  /**
   * Indices of columns to freeze (left-side). Example: [0] to freeze first column.
   */
  frozenColumns?: number[]
  /**
   * Array of column widths (in px or with units, e.g. '120px', '10rem'). Used for sticky offset calculation.
   */
  columnWidths?: (string | number)[]
  /**
   * Default width for columns that don't have an explicit width set.
   * Can be 'auto', 'min-content', 'max-content', or a fixed value like '100px'.
   */
  defaultColumnWidth?: string;
}

// Context to provide frozenColumns, columnWidths, and defaultColumnWidth to all descendants
const DataTableContext = React.createContext<{
  frozenColumns: number[];
  columnWidths: (string | number)[];
  defaultColumnWidth?: string;
}>({ frozenColumns: [], columnWidths: [], defaultColumnWidth: undefined });

interface DataTableHeaderProps {
  children: React.ReactNode
  className?: string
  sticky?: boolean
}

interface DataTableBodyProps {
  children: React.ReactNode
  className?: string
}

interface DataTableRowProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

interface DataTableCellProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
  border?: boolean
  rowSpan?: number
  colSpan?: number
}

interface DataTableHeadProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
  border?: boolean
  rowSpan?: number
  colSpan?: number
  sticky?: boolean
  /**
   * The column index for this header cell, used to determine if it should be frozen
   */
  colIndex?: number
}

// Main table container with standardized styling and proper sticky header support
const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ children, className, maxHeight = "calc(100vh - 300px)", frozenColumns = [], columnWidths = [], defaultColumnWidth, ...props }, ref) => {
    // Diagnostic logging
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        console.log('[DataTable Diagnostic]',
          '\nPath:', window.location.pathname,
          '\nFrozen Columns:', JSON.stringify(frozenColumns),
          '\nColumn Widths:', JSON.stringify(columnWidths),
          '\nDefault Width:', defaultColumnWidth,
          '\nHas Frozen:', frozenColumns.length > 0,
          '\nHas Widths:', columnWidths.length > 0
        );
      }
    }, [frozenColumns, columnWidths, defaultColumnWidth]);

    return (
    <DataTableContext.Provider value={{ frozenColumns, columnWidths, defaultColumnWidth }}>
      <div
        ref={ref}
        className={cn(
          "rounded-md border border-accent/20 bg-card overflow-hidden", // Consistent container styling
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "overflow-auto custom-scrollbar", // Custom scrollbar with proper height
            "relative" // For sticky positioning context
          )}
          style={{ maxHeight, paddingRight: "16px" }} // Add padding for scrollbar
        >
          <table className={cn(
            "w-full border-collapse table-auto", // Remove table-fixed, use table-auto for flexible columns
            "max-w-full"
          )}>
            {children}
          </table>
        </div>
      </div>
    </DataTableContext.Provider>
    );
  }
)
DataTable.displayName = "DataTable"

// Standardized table header with sticky functionality
const DataTableHeader = React.forwardRef<HTMLTableSectionElement, DataTableHeaderProps>(
  ({ children, className, sticky = true, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        "bg-card/95", // Consistent header background (removed backdrop-blur-sm)
        sticky && "sticky top-0 z-40", // Excel-like frozen headers
        "border-b border-accent/20", // Header bottom border
        className
      )}
      {...props}
    >
      {children}
    </thead>
  )
)
DataTableHeader.displayName = "DataTableHeader"

// Standardized table body
const DataTableBody = React.forwardRef<HTMLTableSectionElement, DataTableBodyProps>(
  ({ children, className, ...props }, ref) => (
    <tbody ref={ref} className={cn("relative z-0", className)} {...props}>
      {children}
    </tbody>
  )
)
DataTableBody.displayName = "DataTableBody"

// Standardized table row with consistent hover effects
const DataTableRow = React.forwardRef<HTMLTableRowElement, DataTableRowProps>(
  ({ children, className, hover = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-accent/20", // Consistent row borders
        hover && "hover:bg-muted/30", // Consistent hover effect
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
)
DataTableRow.displayName = "DataTableRow"

// Standardized table header cell
const DataTableHead = React.forwardRef<HTMLTableCellElement, DataTableHeadProps>(
  ({ children, className, align = "left", border = true, sticky = false, rowSpan, colSpan, colIndex, ...props }, ref) => {
    // Get frozenColumns and defaultColumnWidth from context for checking if this header is frozen
    const { frozenColumns, columnWidths } = React.useContext(DataTableContext);
    let stickyStyle = {};
    let stickyClass = "";
    
    // Apply freezing logic for columns if colIndex is provided and it's in frozenColumns
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      // Calculate left offset based on previous frozen columns
      let left = 0;
      for (let i = 0; i < colIndex; ++i) {
        if (frozenColumns.includes(i)) {
          const width = columnWidths[i];
          if (typeof width === "number") left += width;
          else if (typeof width === "string" && width.endsWith("px")) left += parseInt(width);
          else if (typeof width === "string") left += parseInt(width); // fallback
        }
      }
      stickyStyle = { left };
      stickyClass = `sticky left-0 z-[51] bg-muted shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`;
    }

    return (
      <th
        ref={ref}
        rowSpan={rowSpan}
        colSpan={colSpan}
        style={stickyStyle}
        className={cn(
          "font-semibold py-2 px-2 relative", // Consistent header styling with better padding
          "bg-muted/50", // Header background (removed backdrop-blur-sm)
          "text-xs uppercase tracking-wide", // Professional header text styling
          align === "left" && "text-left",
          align === "center" && "text-center",
          align === "right" && "text-right",
          border && "border-r border-accent/20 last:border-r-0", // Consistent borders, no border on last column
          sticky && "sticky top-0 z-50 bg-muted/90", // Individual cell stickiness with higher z-index
          stickyClass, // Apply frozen column classes if applicable
          className
        )}
        {...props}
      >
        {children}
      </th>
    );
  }
)
DataTableHead.displayName = "DataTableHead"

// Standardized table data cell
const DataTableCell = React.forwardRef<HTMLTableCellElement, DataTableCellProps & { colIndex?: number }>(
  ({ children, className, align = "left", border = true, rowSpan, colSpan, colIndex, ...props }, ref) => {
    // Get frozenColumns and columnWidths from context
    const { frozenColumns, columnWidths } = React.useContext(DataTableContext);
    
    // Diagnostic logging for frozen column issues
    React.useEffect(() => {
      if (typeof window !== 'undefined' && frozenColumns.length > 0 && typeof colIndex === 'undefined') {
        console.warn('[DataTableCell Warning]', {
          path: window.location.pathname,
          message: 'Frozen columns configured but colIndex prop is missing',
          frozenColumns,
          hasColIndex: typeof colIndex !== 'undefined'
        });
      }
    }, [frozenColumns, colIndex]);
    let stickyStyle = {};
    let stickyClass = "";
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      // Calculate left offset by summing widths of previous frozen columns
      let left = 0;
      for (let i = 0; i < colIndex; ++i) {
        if (frozenColumns.includes(i)) {
          const width = columnWidths[i];
          if (typeof width === "number") left += width;
          else if (typeof width === "string" && width.endsWith("px")) left += parseInt(width);
          else if (typeof width === "string") left += parseInt(width); // fallback
        }
      }
      stickyStyle = { left };
      stickyClass = `sticky z-[35] bg-gray-100 dark:bg-neutral-800`;
    }
    return (
      <td
        ref={ref}
        rowSpan={rowSpan}
        colSpan={colSpan}
        style={{ ...stickyStyle, minWidth: colIndex === 0 ? "60px" : undefined }} // Adjust freeze column width
        className={cn(
          "py-1 px-1", // Adjust inline grid spacing
          "text-sm", // Consistent font size
          align === "left" && "text-left",
          align === "center" && "text-center",
          align === "right" && "text-right",
          border && "border-r border-accent/20 last:border-r-0", // Consistent borders, no border on last column
          stickyClass,
          className
        )}
        {...props}
      >
        {children}
      </td>
    );
  }
)
DataTableCell.displayName = "DataTableCell"

// Column group for consistent column widths
const DataTableColGroup = React.forwardRef<HTMLTableColElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <colgroup ref={ref}>
      {children}
    </colgroup>
  )
)
DataTableColGroup.displayName = "DataTableColGroup"

const DataTableCol = React.forwardRef<HTMLTableColElement, { widthClass?: string; width?: string | number; className?: string }>(
  ({ widthClass, width, className }, ref) => {
    const { defaultColumnWidth } = React.useContext(DataTableContext);
    
    // Diagnostic logging
    React.useEffect(() => {
      if (typeof window !== 'undefined' && (widthClass || width)) {
        console.log('[DataTableCol Diagnostic]', {
          path: window.location.pathname,
          widthClass,
          width,
          defaultColumnWidth,
          resolvedClass: widthClass || `w-${defaultColumnWidth}`
        });
      }
    }, [widthClass, width, defaultColumnWidth]);
    
    // Handle both width and widthClass props for compatibility
    const style = width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined;
    
    return (
      <col
        ref={ref}
        className={cn(widthClass || (defaultColumnWidth && `w-${defaultColumnWidth}`), className)}
        style={style}
      />
    );
  }
)
DataTableCol.displayName = "DataTableCol"

// USAGE EXAMPLE:
// <DataTable frozenColumns={[0]} columnWidths={[80, 120, 120, ...]}>
//   ...
//   <DataTableRow>
//     <DataTableCell colIndex={0}>Frozen 1st col</DataTableCell>
//     <DataTableCell colIndex={1}>...</DataTableCell>
//     ...
//   </DataTableRow>
// </DataTable>

export {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol
}
