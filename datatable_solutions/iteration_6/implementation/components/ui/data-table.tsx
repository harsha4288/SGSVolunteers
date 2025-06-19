import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge, BadgeProps as OriginalBadgeProps } from "./badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

/**
 * Solution 6: CSS Intrinsic Sizing DataTable
 * 
 * Uses CSS intrinsic sizing keywords (fit-content, min-content, max-content)
 * to create naturally adaptive column widths that solve the volunteer column issue.
 * 
 * Key Innovation: fit-content(clamp(120px, 20%, 250px)) for volunteer column
 * and minmax(80px, 1fr) for other columns achieve perfect content-based sizing.
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
  /**
   * Enable CSS intrinsic sizing (Solution 6 feature)
   */
  useIntrinsicSizing?: boolean;
  /**
   * Configuration for volunteer column constraints
   */
  volunteerColumnConstraints?: {
    minWidth: string;
    maxWidth: string;
    idealWidth: string;
  };
}

// Context to provide frozenColumns, columnWidths, defaultColumnWidth, density, and intrinsic sizing to all descendants
const DataTableContext = React.createContext<{
  frozenColumns: number[];
  columnWidths: (string | number)[];
  defaultColumnWidth?: string;
  density: 'compact' | 'default' | 'spacious';
  useIntrinsicSizing: boolean;
  volunteerColumnConstraints: {
    minWidth: string;
    maxWidth: string;
    idealWidth: string;
  };
}>({ 
  frozenColumns: [], 
  columnWidths: [], 
  defaultColumnWidth: undefined, 
  density: 'default',
  useIntrinsicSizing: true,
  volunteerColumnConstraints: {
    minWidth: '120px',
    maxWidth: '250px',
    idealWidth: '20%'
  }
});

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
  vAlign?: "top" | "middle" | "bottom"
  border?: boolean
  rowSpan?: number
  colSpan?: number
  overflowHandling?: 'truncate' | 'wrap' | 'tooltip'
  tooltipContent?: React.ReactNode
}

interface DataTableHeadProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
  vAlign?: "top" | "middle" | "bottom"
  border?: boolean
  rowSpan?: number
  colSpan?: number
  sticky?: boolean
  /**
   * The column index for this header cell, used to determine if it should be frozen
   */
  colIndex?: number
}

// Main table container with intrinsic sizing support
const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ 
    children, 
    className, 
    maxHeight = "calc(100vh - 300px)", 
    frozenColumns = [], 
    columnWidths = [], 
    defaultColumnWidth, 
    density = 'default',
    useIntrinsicSizing = true,
    volunteerColumnConstraints = {
      minWidth: '120px',
      maxWidth: '250px',
      idealWidth: '20%'
    },
    ...props 
  }, ref) => {
    
    // CSS custom properties for intrinsic sizing
    const intrinsicStyles = React.useMemo(() => {
      if (!useIntrinsicSizing) return {};
      
      const { minWidth, maxWidth, idealWidth } = volunteerColumnConstraints;
      
      return {
        '--volunteer-column-width': `fit-content(clamp(${minWidth}, ${idealWidth}, ${maxWidth}))`,
        '--data-column-width': 'minmax(80px, 1fr)',
        '--compact-column-width': 'min-content',
        '--expand-column-width': 'max-content',
      };
    }, [useIntrinsicSizing, volunteerColumnConstraints]);

    // Diagnostic logging
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        console.log('[DataTable Solution 6 - Intrinsic Sizing]',
          '\nPath:', window.location.pathname,
          '\nIntrinsic Sizing:', useIntrinsicSizing,
          '\nVolunteer Constraints:', volunteerColumnConstraints,
          '\nFrozen Columns:', JSON.stringify(frozenColumns),
          '\nDensity:', density
        );
      }
    }, [useIntrinsicSizing, volunteerColumnConstraints, frozenColumns, density]);

    return (
      <DataTableContext.Provider value={{ 
        frozenColumns, 
        columnWidths, 
        defaultColumnWidth, 
        density,
        useIntrinsicSizing,
        volunteerColumnConstraints
      }}>
        <div
          ref={ref}
          className={cn(
            "rounded-md border border-accent/20 bg-card overflow-hidden",
            useIntrinsicSizing && "intrinsic-table-container"
          )}
          style={intrinsicStyles}
          {...props}
        >
          <div
            className={cn(
              "overflow-auto custom-scrollbar",
              "relative"
            )}
            style={{ maxHeight, paddingRight: "16px" }}
          >
            <table className={cn(
              "w-full border-collapse",
              useIntrinsicSizing ? "intrinsic-table" : "table-auto",
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
        "bg-card/95",
        sticky && "sticky top-0 z-40",
        "border-b border-accent/20",
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
        "border-b border-accent/20",
        hover && "hover:bg-muted/30",
        rowStriping && "even:bg-muted/10",
        className
      )}
      {...props}
    >{children}</tr>
  )
)
DataTableRow.displayName = "DataTableRow"

// Standardized table header cell with intrinsic sizing support
const DataTableHead = React.forwardRef<HTMLTableCellElement, DataTableHeadProps>(
  ({ children, className, align = "left", vAlign = "middle", border = true, sticky = false, rowSpan, colSpan, colIndex, ...props }, ref) => {
    const { frozenColumns, useIntrinsicSizing, density } = React.useContext(DataTableContext);
    
    let stickyStyle = {};
    let stickyClass = "";
    
    // Apply freezing logic for columns if colIndex is provided and it's in frozenColumns
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      // For intrinsic sizing, use simplified sticky positioning
      stickyStyle = { left: 0 };
      stickyClass = `sticky left-0 z-[51] bg-muted shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`;
    }

    return (
      <th
        ref={ref}
        rowSpan={rowSpan}
        colSpan={colSpan}
        style={stickyStyle}
        className={cn(
          "font-semibold relative",
          density === "compact" && "py-0.5 px-1",
          density === "default" && "py-1 px-2",
          density === "spacious" && "py-2 px-3",
          "bg-muted/50",
          "text-xs uppercase tracking-wide",
          align === "left" && "text-left",
          align === "center" && "text-center",
          align === "right" && "text-right",
          vAlign === "top" && "align-top",
          vAlign === "middle" && "align-middle",
          vAlign === "bottom" && "align-bottom",
          border && "border-r border-accent/20 last:border-r-0",
          sticky && "sticky top-0 z-50 bg-muted/90",
          stickyClass,
          // Intrinsic sizing classes
          useIntrinsicSizing && typeof colIndex === "number" && colIndex === 0 && "volunteer-column",
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

// Standardized table data cell with intrinsic sizing support
const DataTableCell = React.forwardRef<HTMLTableCellElement, DataTableCellProps & { colIndex?: number }>(
  ({ children, className, align = "left", vAlign = "middle", border = true, rowSpan, colSpan, colIndex, overflowHandling = 'truncate', tooltipContent, ...props }, ref) => {
    const { frozenColumns, useIntrinsicSizing, density } = React.useContext(DataTableContext);
    
    let stickyStyle = {};
    let stickyClass = "";
    
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      // For intrinsic sizing, use simplified sticky positioning
      stickyStyle = { left: 0 };
      stickyClass = `sticky z-[35] bg-gray-100 dark:bg-neutral-800`;
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
          "text-sm",
          align === "left" && "text-left",
          align === "center" && "text-center",
          align === "right" && "text-right",
          vAlign === "top" && "align-top",
          vAlign === "middle" && "align-middle",
          vAlign === "bottom" && "align-bottom",
          border && "border-r border-accent/20 last:border-r-0",
          stickyClass,
          // Intrinsic sizing classes
          useIntrinsicSizing && typeof colIndex === "number" && colIndex === 0 && "volunteer-column",
          useIntrinsicSizing && typeof colIndex === "number" && colIndex > 0 && "data-column",
          className
        )}
        {...props}
      >
        {overflowHandling === 'tooltip' ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
            "block w-full",
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

// Column group for intrinsic sizing
const DataTableColGroup = React.forwardRef<HTMLTableColElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <colgroup ref={ref}>{children}</colgroup>
  )
)
DataTableColGroup.displayName = "DataTableColGroup"

// Enhanced DataTableCol with intrinsic sizing types
interface DataTableColProps {
  width?: string | number;
  className?: string;
  intrinsicType?: 'volunteer' | 'data' | 'compact' | 'expand' | 'auto';
}

const DataTableCol = React.forwardRef<HTMLTableColElement, DataTableColProps>(
  ({ width, className, intrinsicType = 'auto', ...props }, ref) => {
    const { useIntrinsicSizing } = React.useContext(DataTableContext);
    
    const intrinsicWidth = React.useMemo(() => {
      if (!useIntrinsicSizing) return width;
      
      switch (intrinsicType) {
        case 'volunteer':
          return 'var(--volunteer-column-width)';
        case 'data':
          return 'var(--data-column-width)';
        case 'compact':
          return 'var(--compact-column-width)';
        case 'expand':
          return 'var(--expand-column-width)';
        default:
          return width;
      }
    }, [useIntrinsicSizing, intrinsicType, width]);
    
    return (
      <col
        ref={ref}
        className={cn(
          intrinsicType === 'volunteer' && 'volunteer-column',
          intrinsicType === 'data' && 'data-column',
          intrinsicType === 'compact' && 'compact-column',
          intrinsicType === 'expand' && 'expand-column',
          className
        )}
        style={{ width: intrinsicWidth }}
        {...props}
      />
    );
  }
)
DataTableCol.displayName = "DataTableCol"

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

export {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableColGroup,
  DataTableCol,
  DataTableBadge
}