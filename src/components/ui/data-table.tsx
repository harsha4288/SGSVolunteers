import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge, BadgeProps as OriginalBadgeProps } from "./badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

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
  density?: 'compact' | 'default' | 'spacious';
}

// Context to provide frozenColumns, columnWidths, defaultColumnWidth, and density to all descendants
const DataTableContext = React.createContext<{
  frozenColumns: number[];
  columnWidths: (string | number)[];
  defaultColumnWidth?: string;
  density: 'compact' | 'default' | 'spacious';
}>({ frozenColumns: [], columnWidths: [], defaultColumnWidth: undefined, density: 'default' });

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
  rowStriping?: boolean
}

interface DataTableCellProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
  vAlign?: "top" | "middle" | "bottom" // Renamed from verticalAlign
  border?: boolean
  rowSpan?: number
  colSpan?: number
  overflowHandling?: 'truncate' | 'wrap' | 'tooltip'
  tooltipContent?: React.ReactNode // Explicit content for tooltip
}

interface DataTableHeadProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
  vAlign?: "top" | "middle" | "bottom" // Renamed from verticalAlign
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
  ({ children, className, maxHeight = "calc(100vh - 300px)", frozenColumns = [], columnWidths = [], defaultColumnWidth, density = 'default', ...props }, ref) => {
    // Diagnostic logging
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        console.log('[DataTable Diagnostic]',
          '\nPath:', window.location.pathname,
          '\nFrozen Columns:', JSON.stringify(frozenColumns),
          '\nColumn Widths:', JSON.stringify(columnWidths),
          '\nDefault Width:', defaultColumnWidth,
          '\nDensity:', density,
          '\nHas Frozen:', frozenColumns.length > 0,
          '\nHas Widths:', columnWidths.length > 0
        );
      }
    }, [frozenColumns, columnWidths, defaultColumnWidth, density]);

    return (
    <DataTableContext.Provider value={{ frozenColumns, columnWidths, defaultColumnWidth, density }}>
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
            "w-full border-collapse table-auto", // Always use table-auto for flexible layout
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
  ({ children, className, hover = true, rowStriping = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-accent/20", // Consistent row borders
        hover && "hover:bg-muted/30", // Consistent hover effect
        rowStriping && "even:bg-muted/10", // Row striping
        className
      )}
      {...props}
    >{children}</tr>
  )
)
DataTableRow.displayName = "DataTableRow"

// Standardized table header cell
const DataTableHead = React.forwardRef<HTMLTableCellElement, DataTableHeadProps>(
  ({ children, className, align = "left", vAlign = "middle", border = true, sticky = false, rowSpan, colSpan, colIndex, ...props }, ref) => {
    // Get frozenColumns, columnWidths, and density from context
    const { frozenColumns, columnWidths, density } = React.useContext(DataTableContext);
    let stickyStyle = {};
    let stickyClass = "";
    
    // Apply freezing logic for columns if colIndex is provided and it's in frozenColumns
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      // Only apply sticky positioning if we have explicit column widths
      // Without columnWidths, browser handles table-auto layout naturally
      if (columnWidths.length > 0) {
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
      } else {
        // For natural table-auto layout, use simpler sticky positioning
        stickyStyle = { left: 0 };
        stickyClass = `sticky left-0 z-[51] bg-muted shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`;
      }
    }

    return (
      <th
        ref={ref}
        rowSpan={rowSpan}
        colSpan={colSpan}
        style={stickyStyle}
        className={cn(
          "font-semibold relative", // Base styling
          density === "compact" && "py-0.5 px-1",
          density === "default" && "py-1 px-2", // Adjusted default padding
          density === "spacious" && "py-2 px-3",
          "bg-muted/50", // Header background (removed backdrop-blur-sm)
          "text-xs uppercase tracking-wide", // Professional header text styling
          align === "left" && "text-left",
          align === "center" && "text-center",
          align === "right" && "text-right",
          vAlign === "top" && "align-top",
          vAlign === "middle" && "align-middle",
          vAlign === "bottom" && "align-bottom",
          border && "border-r border-accent/20 last:border-r-0", // Consistent borders, no border on last column
          sticky && "sticky top-0 z-50 bg-muted/90", // Individual cell stickiness with higher z-index
          stickyClass, // Apply frozen column classes if applicable
          className
        )}
        {...props} // vAlign is destructured and not in props
      >
        {children}
      </th>
    );
  }
)
DataTableHead.displayName = "DataTableHead"

// Standardized table data cell
const DataTableCell = React.forwardRef<HTMLTableCellElement, DataTableCellProps & { colIndex?: number }>(
  ({ children, className, align = "left", vAlign = "middle", border = true, rowSpan, colSpan, colIndex, overflowHandling = 'truncate', tooltipContent, ...props }, ref) => {
    // Get frozenColumns, columnWidths, and density from context
    const { frozenColumns, columnWidths, density } = React.useContext(DataTableContext);
    
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
      // Only apply complex sticky positioning if we have explicit column widths
      if (columnWidths.length > 0) {
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
      } else {
        // For natural table-auto layout, use simpler sticky positioning
        stickyStyle = { left: 0 };
        stickyClass = `sticky z-[35] bg-gray-100 dark:bg-neutral-800`;
      }
    }
    return (
      <td
        ref={ref}
        rowSpan={rowSpan}
        colSpan={colSpan}
        style={stickyStyle}
        className={cn(
          density === "compact" && "py-0.5 px-1",
          density === "default" && "py-1 px-2",
          density === "spacious" && "py-2 px-3",
          "text-sm", // Consistent font size
          align === "left" && "text-left",
          align === "center" && "text-center",
          align === "right" && "text-right",
          vAlign === "top" && "align-top",
          vAlign === "middle" && "align-middle",
          vAlign === "bottom" && "align-bottom",
          // Overflow classes are applied to a child span, not the td itself, to ensure vertical alignment still works.
          border && "border-r border-accent/20 last:border-r-0", // Consistent borders, no border on last column
          stickyClass,
          className
        )}
        {...props} // vAlign is destructured and not in props
      >
        {overflowHandling === 'tooltip' ? (
          <TooltipProvider> {/* Assuming TooltipProvider might be needed here if not global */}
            <Tooltip>
              <TooltipTrigger asChild>
                {/* For tooltip, content must be in a block or inline-block for truncate to work effectively */}
                <span className="block truncate w-full">
                  {children}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {tooltipContent || (typeof children === 'string' ? children : <p>Use tooltipContent for complex nodes</p>)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className={cn(
            "block w-full", // Make span take full width of cell for truncation
            {
              "truncate": overflowHandling === 'truncate',
              "whitespace-normal": overflowHandling === 'wrap',
            }
          )}>
            {children}
          </span>
        )}
      </td>
    );
  }
)
DataTableCell.displayName = "DataTableCell"

// Column group for consistent column widths
const DataTableColGroup = React.forwardRef<HTMLTableColElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <colgroup ref={ref}>{children}</colgroup>
  )
)
DataTableColGroup.displayName = "DataTableColGroup"

// DataTableCol component: width prop is primarily for direct style, className for Tailwind width utilities.
// columnWidths on DataTable is used for sticky calculations and can override these if table-layout: fixed is used by DataTable.
// For now, this component just renders a col with given style/class.
const DataTableCol = React.forwardRef<HTMLTableColElement, { width?: string | number; className?: string }>(
  ({ width, className }, ref) => {
    const style = width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined;
    // Removed defaultColumnWidth logic here as it's complex and an explicit width or className (like w-xx) from parent is clearer.
    // DataTable's columnWidths prop is the primary source for widths used in frozen calculations.
    return (
      <col
        ref={ref}
        className={cn(className)} // Pass className directly
        style={style}
      /> // Ensure no whitespace
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
  DataTableCol,
  DataTableBadge // Exporting the new Badge component
}

// Define props for DataTableBadge by extending original BadgeProps
export interface DataTableBadgeProps extends OriginalBadgeProps {}

// DataTableBadge component to be used within DataTableCell
const DataTableBadge: React.FC<DataTableBadgeProps> = ({ className, variant, children, ...props }) => {
  return (
    <Badge className={className} variant={variant} {...props}>
      {children}
    </Badge>
  );
};
DataTableBadge.displayName = "DataTableBadge";
