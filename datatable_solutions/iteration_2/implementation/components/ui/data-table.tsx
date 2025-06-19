import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge, BadgeProps as OriginalBadgeProps } from "./badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

/**
 * Solution 2: Dynamic Table Layout DataTable
 * 
 * Intelligent width detection with content analysis and responsive distribution.
 * Uses ResizeObserver and content measurement for optimal column sizing.
 * 
 * Key Innovation: Dynamic analysis of content width combined with percentage-based 
 * constraints ensures volunteer column adapts to content while staying within limits.
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
   * Array of column widths (in px or with units, e.g. '120px', '10rem'). Used for initial sizing.
   */
  columnWidths?: (string | number)[]
  /**
   * Default width for columns that don't have an explicit width set.
   */
  defaultColumnWidth?: string;
  density?: 'compact' | 'default' | 'spacious';
  /**
   * Enable dynamic table layout (Solution 2 feature)
   */
  useDynamicLayout?: boolean;
  /**
   * Dynamic sizing configuration
   */
  dynamicConfig?: {
    volunteerColumnConstraints: {
      minWidth: number;
      maxWidth: number;
      targetPercentage: number;
    };
    contentAnalysis: boolean;
    responsiveAdjustment: boolean;
  };
}

// Context to provide dynamic layout configuration to all descendants
const DataTableContext = React.createContext<{
  frozenColumns: number[];
  columnWidths: (string | number)[];
  defaultColumnWidth?: string;
  density: 'compact' | 'default' | 'spacious';
  useDynamicLayout: boolean;
  dynamicConfig: {
    volunteerColumnConstraints: {
      minWidth: number;
      maxWidth: number;
      targetPercentage: number;
    };
    contentAnalysis: boolean;
    responsiveAdjustment: boolean;
  };
}>({ 
  frozenColumns: [], 
  columnWidths: [], 
  defaultColumnWidth: undefined, 
  density: 'default',
  useDynamicLayout: true,
  dynamicConfig: {
    volunteerColumnConstraints: {
      minWidth: 150,
      maxWidth: 250,
      targetPercentage: 22
    },
    contentAnalysis: true,
    responsiveAdjustment: true
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
   * The column index for this header cell, used for dynamic sizing
   */
  colIndex?: number
}

// Hook for dynamic content analysis and width calculation
function useDynamicColumnSizing(
  tableRef: React.RefObject<HTMLTableElement>,
  config: DataTableProps['dynamicConfig'],
  enabled: boolean
) {
  const [columnWidths, setColumnWidths] = React.useState<string[]>([]);
  const [containerWidth, setContainerWidth] = React.useState(0);
  
  const analyzeContent = React.useCallback(() => {
    if (!enabled || !tableRef.current || !config) return;
    
    const table = tableRef.current;
    const container = table.parentElement;
    if (!container) return;
    
    // Measure container width
    const containerRect = container.getBoundingClientRect();
    setContainerWidth(containerRect.width);
    
    // Analyze content in volunteer column (first column)
    const volunteerCells = table.querySelectorAll('tbody tr td:first-child');
    let maxContentWidth = config.volunteerColumnConstraints.minWidth;
    
    if (config.contentAnalysis && volunteerCells.length > 0) {
      // Create temporary element to measure text width
      const measureElement = document.createElement('div');
      measureElement.style.position = 'absolute';
      measureElement.style.visibility = 'hidden';
      measureElement.style.whiteSpace = 'nowrap';
      measureElement.style.fontSize = window.getComputedStyle(volunteerCells[0] as Element).fontSize;
      measureElement.style.fontFamily = window.getComputedStyle(volunteerCells[0] as Element).fontFamily;
      document.body.appendChild(measureElement);
      
      volunteerCells.forEach(cell => {
        measureElement.textContent = cell.textContent || '';
        const width = measureElement.getBoundingClientRect().width + 32; // Add padding
        maxContentWidth = Math.max(maxContentWidth, width);
      });
      
      document.body.removeChild(measureElement);
    }
    
    // Calculate optimal volunteer column width
    const { minWidth, maxWidth, targetPercentage } = config.volunteerColumnConstraints;
    const targetWidth = (containerRect.width * targetPercentage) / 100;
    const optimalWidth = Math.min(
      Math.max(maxContentWidth, minWidth),
      Math.min(targetWidth, maxWidth)
    );
    
    // Calculate remaining width for other columns
    const remainingWidth = containerRect.width - optimalWidth;
    const columnCount = table.querySelectorAll('thead tr th').length;
    const otherColumnWidth = Math.max(80, remainingWidth / (columnCount - 1));
    
    // Generate column width array
    const newWidths = [`${optimalWidth}px`];
    for (let i = 1; i < columnCount; i++) {
      newWidths.push(`${otherColumnWidth}px`);
    }
    
    setColumnWidths(newWidths);
  }, [enabled, config, tableRef]);
  
  // Set up ResizeObserver for responsive adjustments
  React.useEffect(() => {
    if (!enabled || !tableRef.current || !config?.responsiveAdjustment) return;
    
    const resizeObserver = new ResizeObserver(() => {
      analyzeContent();
    });
    
    const container = tableRef.current.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }
    
    // Initial analysis
    analyzeContent();
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [analyzeContent, enabled, config?.responsiveAdjustment]);
  
  return { columnWidths, containerWidth };
}

// Main table container with dynamic layout
const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ 
    children, 
    className, 
    maxHeight = "calc(100vh - 300px)", 
    frozenColumns = [], 
    columnWidths = [], 
    defaultColumnWidth, 
    density = 'default',
    useDynamicLayout = true,
    dynamicConfig = {
      volunteerColumnConstraints: {
        minWidth: 150,
        maxWidth: 250,
        targetPercentage: 22
      },
      contentAnalysis: true,
      responsiveAdjustment: true
    },
    ...props 
  }, ref) => {
    
    const tableRef = React.useRef<HTMLTableElement>(null);
    const { columnWidths: dynamicWidths } = useDynamicColumnSizing(
      tableRef, 
      dynamicConfig, 
      useDynamicLayout
    );

    // Diagnostic logging
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        console.log('[DataTable Solution 2 - Dynamic Layout]',
          '\nPath:', window.location.pathname,
          '\nDynamic Layout:', useDynamicLayout,
          '\nColumn Widths:', dynamicWidths,
          '\nConfig:', dynamicConfig,
          '\nFrozen Columns:', JSON.stringify(frozenColumns),
          '\nDensity:', density
        );
      }
    }, [useDynamicLayout, dynamicWidths, dynamicConfig, frozenColumns, density]);

    return (
      <DataTableContext.Provider value={{ 
        frozenColumns, 
        columnWidths, 
        defaultColumnWidth, 
        density,
        useDynamicLayout,
        dynamicConfig
      }}>
        <div
          ref={ref}
          className={cn(
            "rounded-md border border-accent/20 bg-card overflow-hidden",
            useDynamicLayout && "dynamic-table-container"
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
            <table 
              ref={tableRef}
              className={cn(
                "w-full border-collapse",
                useDynamicLayout ? "dynamic-table" : "table-auto",
                "max-w-full"
              )}
              style={{
                tableLayout: useDynamicLayout ? 'fixed' : 'auto'
              }}
            >
              {useDynamicLayout && dynamicWidths.length > 0 && (
                <colgroup>
                  {dynamicWidths.map((width, index) => (
                    <col key={index} style={{ width }} />
                  ))}
                </colgroup>
              )}
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

// Standardized table header cell with dynamic sizing support
const DataTableHead = React.forwardRef<HTMLTableCellElement, DataTableHeadProps>(
  ({ children, className, align = "left", vAlign = "middle", border = true, sticky = false, rowSpan, colSpan, colIndex, ...props }, ref) => {
    const { frozenColumns, useDynamicLayout, density } = React.useContext(DataTableContext);
    
    let stickyStyle = {};
    let stickyClass = "";
    
    // Apply freezing logic for columns if colIndex is provided and it's in frozenColumns
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
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

// Standardized table data cell with dynamic sizing support
const DataTableCell = React.forwardRef<HTMLTableCellElement, DataTableCellProps & { colIndex?: number }>(
  ({ children, className, align = "left", vAlign = "middle", border = true, rowSpan, colSpan, colIndex, overflowHandling = 'truncate', tooltipContent, ...props }, ref) => {
    const { frozenColumns, useDynamicLayout, density } = React.useContext(DataTableContext);
    
    let stickyStyle = {};
    let stickyClass = "";
    
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
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

// Column group for dynamic layout
const DataTableColGroup = React.forwardRef<HTMLTableColElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <colgroup ref={ref}>{children}</colgroup>
  )
)
DataTableColGroup.displayName = "DataTableColGroup"

// Enhanced DataTableCol with dynamic sizing types
interface DataTableColProps {
  width?: string | number;
  className?: string;
  dynamic?: boolean;
}

const DataTableCol = React.forwardRef<HTMLTableColElement, DataTableColProps>(
  ({ width, className, dynamic = false, ...props }, ref) => {
    const { useDynamicLayout } = React.useContext(DataTableContext);
    
    return (
      <col
        ref={ref}
        className={className}
        style={{ width: (useDynamicLayout && dynamic) ? 'auto' : width }}
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