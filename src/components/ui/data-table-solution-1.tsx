import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge, BadgeProps as OriginalBadgeProps } from "./badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

/**
 * Solution 1: CSS Grid Approach DataTable
 * 
 * Replaces table structure with CSS Grid for flexible column sizing and frozen columns.
 * Uses grid-template-columns with fr units for responsive distribution.
 * 
 * Key Innovation: display: grid with grid-template-columns: minmax(150px, 0.2fr) repeat(auto-fit, 1fr)
 * provides natural volunteer column constraint and flexible data columns.
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
   * Array of column widths (in px or with units, e.g. '120px', '10rem'). Used for grid template calculation.
   */
  columnWidths?: (string | number)[]
  /**
   * Default width for columns that don't have an explicit width set.
   */
  defaultColumnWidth?: string;
  density?: 'compact' | 'default' | 'spacious';
  /**
   * Enable CSS Grid layout (Solution 1 feature)
   */
  useGridLayout?: boolean;
  /**
   * Grid column configuration for volunteer column
   */
  volunteerColumnGrid?: {
    minWidth: string;
    maxFraction: string;
  };
}

// Context to provide grid layout configuration to all descendants
const DataTableContext = React.createContext<{
  frozenColumns: number[];
  columnWidths: (string | number)[];
  defaultColumnWidth?: string;
  density: 'compact' | 'default' | 'spacious';
  useGridLayout: boolean;
  volunteerColumnGrid: {
    minWidth: string;
    maxFraction: string;
  };
}>({ 
  frozenColumns: [], 
  columnWidths: [], 
  defaultColumnWidth: undefined, 
  density: 'default',
  useGridLayout: true,
  volunteerColumnGrid: {
    minWidth: '150px',
    maxFraction: '0.2fr'
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
   * The column index for this header cell, used to determine grid position
   */
  colIndex?: number
}

// Main grid container with CSS Grid layout
const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ 
    children, 
    className, 
    maxHeight = "calc(100vh - 300px)", 
    frozenColumns = [], 
    columnWidths = [], 
    defaultColumnWidth, 
    density = 'default',
    useGridLayout = true,
    volunteerColumnGrid = {
      minWidth: '150px',
      maxFraction: '0.2fr'
    },
    ...props 
  }, ref) => {
    
    // Generate grid template columns based on configuration
    const gridTemplate = React.useMemo(() => {
      if (!useGridLayout) return 'none';
      
      const { minWidth, maxFraction } = volunteerColumnGrid;
      
      // First column (volunteer) gets constrained width, others get flexible distribution
      return `minmax(${minWidth}, ${maxFraction}) repeat(auto-fit, minmax(80px, 1fr))`;
    }, [useGridLayout, volunteerColumnGrid]);

    // Diagnostic logging
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        console.log('[DataTable Solution 1 - CSS Grid]',
          '\nPath:', window.location.pathname,
          '\nGrid Layout:', useGridLayout,
          '\nGrid Template:', gridTemplate,
          '\nFrozen Columns:', JSON.stringify(frozenColumns),
          '\nDensity:', density
        );
      }
    }, [useGridLayout, gridTemplate, frozenColumns, density]);

    return (
      <DataTableContext.Provider value={{ 
        frozenColumns, 
        columnWidths, 
        defaultColumnWidth, 
        density,
        useGridLayout,
        volunteerColumnGrid
      }}>
        <div
          ref={ref}
          className={cn(
            "rounded-md border border-accent/20 bg-card overflow-hidden",
            useGridLayout && "grid-table-container"
          )}
          {...props}
        >
          <div
            className={cn(
              "overflow-auto custom-scrollbar",
              "relative"
            )}
            style={{ maxHeight, paddingRight: "16px" }}
          >
            {/* CSS Grid replaces traditional table structure */}
            <div 
              className={cn(
                "grid-table",
                useGridLayout ? "grid" : "table w-full"
              )}
              style={{
                display: useGridLayout ? 'grid' : 'table',
                gridTemplateColumns: useGridLayout ? gridTemplate : undefined,
                gap: useGridLayout ? '1px' : undefined,
                backgroundColor: useGridLayout ? 'hsl(var(--accent) / 0.1)' : undefined
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </DataTableContext.Provider>
    );
  }
)
DataTable.displayName = "DataTable"

// Grid-based header section
const DataTableHeader = React.forwardRef<HTMLDivElement, DataTableHeaderProps>(
  ({ children, className, sticky = true, ...props }, ref) => {
    const { useGridLayout } = React.useContext(DataTableContext);
    
    if (useGridLayout) {
      return (
        <div
          ref={ref}
          className={cn(
            "grid-header contents",
            sticky && "sticky top-0 z-40",
            className
          )}
          {...props}
        >
          {children}
        </div>
      );
    }
    
    return (
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
    );
  }
)
DataTableHeader.displayName = "DataTableHeader"

// Grid-based body section
const DataTableBody = React.forwardRef<HTMLDivElement, DataTableBodyProps>(
  ({ children, className, ...props }, ref) => {
    const { useGridLayout } = React.useContext(DataTableContext);
    
    if (useGridLayout) {
      return (
        <div ref={ref} className={cn("grid-body contents", className)} {...props}>
          {children}
        </div>
      );
    }
    
    return (
      <tbody ref={ref} className={cn("relative z-0", className)} {...props}>
        {children}
      </tbody>
    );
  }
)
DataTableBody.displayName = "DataTableBody"

// Grid-based row (becomes grid container)
const DataTableRow = React.forwardRef<HTMLDivElement, DataTableRowProps>(
  ({ children, className, hover = true, rowStriping = true, ...props }, ref) => {
    const { useGridLayout } = React.useContext(DataTableContext);
    
    if (useGridLayout) {
      return (
        <div
          ref={ref}
          className={cn(
            "grid-row contents",
            hover && "[&>*]:hover:bg-muted/30",
            className
          )}
          {...props}
        >
          {children}
        </div>
      );
    }
    
    return (
      <tr
        ref={ref}
        className={cn(
          "border-b border-accent/20",
          hover && "hover:bg-muted/30",
          rowStriping && "even:bg-muted/10",
          className
        )}
        {...props}
      >
        {children}
      </tr>
    );
  }
)
DataTableRow.displayName = "DataTableRow"

// Grid-based header cell
const DataTableHead = React.forwardRef<HTMLDivElement, DataTableHeadProps>(
  ({ children, className, align = "left", vAlign = "middle", border = true, sticky = false, rowSpan, colSpan, colIndex, ...props }, ref) => {
    const { frozenColumns, useGridLayout, density } = React.useContext(DataTableContext);
    
    let stickyStyle = {};
    let stickyClass = "";
    
    // Apply freezing logic for grid layout
    if (useGridLayout && typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      stickyStyle = { position: 'sticky', left: 0, zIndex: 51 };
      stickyClass = "bg-muted shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]";
    }

    if (useGridLayout) {
      return (
        <div
          ref={ref}
          style={stickyStyle}
          className={cn(
            "grid-header-cell",
            "font-semibold relative bg-muted/50",
            density === "compact" && "py-0.5 px-1",
            density === "default" && "py-1 px-2",
            density === "spacious" && "py-2 px-3",
            "text-xs uppercase tracking-wide",
            "flex items-center",
            align === "left" && "justify-start",
            align === "center" && "justify-center",
            align === "right" && "justify-end",
            border && "border-r border-accent/20",
            sticky && "sticky top-0 z-50 bg-muted/90",
            stickyClass,
            className
          )}
          {...props}
        >
          {children}
        </div>
      );
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

// Grid-based data cell
const DataTableCell = React.forwardRef<HTMLDivElement, DataTableCellProps & { colIndex?: number }>(
  ({ children, className, align = "left", vAlign = "middle", border = true, rowSpan, colSpan, colIndex, overflowHandling = 'truncate', tooltipContent, ...props }, ref) => {
    const { frozenColumns, useGridLayout, density } = React.useContext(DataTableContext);
    
    let stickyStyle = {};
    let stickyClass = "";
    
    if (useGridLayout && typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      stickyStyle = { position: 'sticky', left: 0, zIndex: 35 };
      stickyClass = "bg-card";
    }
    
    if (useGridLayout) {
      return (
        <div
          ref={ref}
          style={stickyStyle}
          className={cn(
            "grid-cell bg-card",
            density === "compact" && "py-0.5 px-1",
            density === "default" && "py-1 px-2",
            density === "spacious" && "py-2 px-3",
            "text-sm flex items-center",
            align === "left" && "justify-start",
            align === "center" && "justify-center",
            align === "right" && "justify-end",
            border && "border-r border-accent/20",
            stickyClass,
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
        </div>
      );
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

// Column group for grid layout (optional)
const DataTableColGroup = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    const { useGridLayout } = React.useContext(DataTableContext);
    
    if (useGridLayout) {
      return null; // Grid doesn't need colgroup
    }
    
    return <colgroup ref={ref}>{children}</colgroup>;
  }
)
DataTableColGroup.displayName = "DataTableColGroup"

// Column definition (not needed for grid layout)
interface DataTableColProps {
  width?: string | number;
  className?: string;
  gridArea?: string;
}

const DataTableCol = React.forwardRef<HTMLElement, DataTableColProps>(
  ({ width, className, gridArea, ...props }, ref) => {
    const { useGridLayout } = React.useContext(DataTableContext);
    
    if (useGridLayout) {
      return null; // Grid uses gridTemplateColumns instead
    }
    
    return (
      <col
        ref={ref}
        className={className}
        style={{ width }}
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