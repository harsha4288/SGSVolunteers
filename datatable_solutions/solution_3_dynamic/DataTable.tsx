import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge, BadgeProps as OriginalBadgeProps } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

/**
 * Dynamic CSS Variables Integration DataTable Solution
 * 
 * Key Innovation: Uses CSS custom properties that adapt to content measurements
 * while maintaining existing component architecture. The first column width is 
 * dynamically calculated based on content but capped to prevent 40% width issue.
 * 
 * Architecture Compliance:
 * - Builds on existing component patterns
 * - Uses current TypeScript interfaces  
 * - Integrates with existing useEffect patterns
 * - Maintains current prop drilling structure
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
   * NEW: Enable Dynamic CSS Variables for adaptive column sizing
   */
  useDynamicSizing?: boolean;
  /**
   * NEW: Configuration for dynamic sizing behavior
   */
  dynamicConfig?: {
    enableContentMeasurement?: boolean; // Default: true
    firstColumnMaxWidth?: number;       // Default: 300 (px)
    firstColumnMinWidth?: number;       // Default: 150 (px)
    otherColumnsMinWidth?: number;      // Default: 80 (px)
    measurementDebounce?: number;       // Default: 100 (ms)
  };
}

// Enhanced context to include dynamic sizing options
const DataTableContext = React.createContext<{
  frozenColumns: number[];
  columnWidths: (string | number)[];
  defaultColumnWidth?: string;
  density: 'compact' | 'default' | 'spacious';
  useDynamicSizing: boolean;
  dynamicConfig: {
    enableContentMeasurement: boolean;
    firstColumnMaxWidth: number;
    firstColumnMinWidth: number;
    otherColumnsMinWidth: number;
    measurementDebounce: number;
  };
}>({ 
  frozenColumns: [], 
  columnWidths: [], 
  defaultColumnWidth: undefined, 
  density: 'default',
  useDynamicSizing: false,
  dynamicConfig: {
    enableContentMeasurement: true,
    firstColumnMaxWidth: 300,
    firstColumnMinWidth: 150,
    otherColumnsMinWidth: 80,
    measurementDebounce: 100
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

// Content Measurement Hook
const useContentMeasurement = (
  enabled: boolean,
  config: {
    firstColumnMaxWidth: number;
    firstColumnMinWidth: number;
    otherColumnsMinWidth: number;
    measurementDebounce: number;
  }
) => {
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [measurements, setMeasurements] = React.useState<{
    firstColumnWidth: number;
    totalColumns: number;
    availableWidth: number;
  }>({
    firstColumnWidth: config.firstColumnMinWidth,
    totalColumns: 1,
    availableWidth: 800
  });

  const measureContent = React.useCallback(() => {
    if (!enabled || !tableRef.current) return;

    const table = tableRef.current;
    const container = table.closest('.dynamic-table-container') as HTMLElement;
    if (!container) return;

    try {
      // Measure container width
      const containerWidth = container.getBoundingClientRect().width - 32; // Account for padding
      
      // Count total columns
      const firstRow = table.querySelector('thead tr, tbody tr:first-child');
      const totalColumns = firstRow ? firstRow.children.length : 1;
      
      // Measure content of first column cells to determine optimal width
      const firstColumnCells = table.querySelectorAll('th:first-child, td:first-child');
      let maxContentWidth = config.firstColumnMinWidth;
      
      firstColumnCells.forEach(cell => {
        const cellElement = cell as HTMLElement;
        const tempDiv = document.createElement('div');
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.position = 'absolute';
        tempDiv.style.whiteSpace = 'nowrap';
        tempDiv.style.fontSize = window.getComputedStyle(cellElement).fontSize;
        tempDiv.style.fontFamily = window.getComputedStyle(cellElement).fontFamily;
        tempDiv.style.fontWeight = window.getComputedStyle(cellElement).fontWeight;
        tempDiv.innerHTML = cellElement.innerHTML;
        
        document.body.appendChild(tempDiv);
        const contentWidth = tempDiv.getBoundingClientRect().width + 24; // Add padding
        document.body.removeChild(tempDiv);
        
        maxContentWidth = Math.max(maxContentWidth, contentWidth);
      });
      
      // Constrain first column width
      const firstColumnWidth = Math.min(
        Math.max(maxContentWidth, config.firstColumnMinWidth),
        config.firstColumnMaxWidth,
        containerWidth * 0.35 // Never more than 35% of container
      );
      
      setMeasurements({
        firstColumnWidth,
        totalColumns,
        availableWidth: containerWidth
      });
      
      // Set CSS variables
      const root = table.closest('.dynamic-table-container') as HTMLElement;
      if (root) {
        root.style.setProperty('--first-column-width', `${firstColumnWidth}px`);
        root.style.setProperty('--other-columns-min-width', `${config.otherColumnsMinWidth}px`);
        root.style.setProperty('--total-columns', totalColumns.toString());
        root.style.setProperty('--available-width', `${containerWidth}px`);
        
        // Calculate remaining width for other columns
        const remainingWidth = containerWidth - firstColumnWidth;
        const otherColumnsCount = totalColumns - 1;
        const otherColumnWidth = otherColumnsCount > 0 
          ? Math.max(remainingWidth / otherColumnsCount, config.otherColumnsMinWidth)
          : config.otherColumnsMinWidth;
        
        root.style.setProperty('--other-column-width', `${otherColumnWidth}px`);
      }
      
    } catch (error) {
      console.warn('Content measurement failed:', error);
    }
  }, [enabled, config]);

  const debouncedMeasure = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(measureContent, config.measurementDebounce);
    };
  }, [measureContent, config.measurementDebounce]);

  React.useEffect(() => {
    if (!enabled) return;

    measureContent();

    const resizeObserver = new ResizeObserver(debouncedMeasure);
    const mutationObserver = new MutationObserver(debouncedMeasure);
    
    if (tableRef.current) {
      const container = tableRef.current.closest('.dynamic-table-container');
      if (container) {
        resizeObserver.observe(container);
        mutationObserver.observe(tableRef.current, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [enabled, debouncedMeasure, measureContent]);

  return { tableRef, measurements };
};

// Enhanced DataTable with Dynamic CSS Variables support
const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ 
    children, 
    className, 
    maxHeight = "calc(100vh - 300px)", 
    frozenColumns = [], 
    columnWidths = [], 
    defaultColumnWidth, 
    density = 'default',
    useDynamicSizing = false,
    dynamicConfig = {
      enableContentMeasurement: true,
      firstColumnMaxWidth: 300,
      firstColumnMinWidth: 150,
      otherColumnsMinWidth: 80,
      measurementDebounce: 100
    },
    ...props 
  }, ref) => {
    
    const { tableRef, measurements } = useContentMeasurement(
      useDynamicSizing && dynamicConfig.enableContentMeasurement,
      dynamicConfig
    );

    // Diagnostic logging
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        console.log('[Dynamic CSS Variables DataTable]',
          '\nPath:', window.location.pathname,
          '\nDynamic Sizing:', useDynamicSizing,
          '\nContent Measurement:', dynamicConfig.enableContentMeasurement,
          '\nMeasurements:', measurements,
          '\nConfig:', dynamicConfig,
          '\nFrozen Columns:', JSON.stringify(frozenColumns),
          '\nDensity:', density
        );
      }
    }, [frozenColumns, columnWidths, defaultColumnWidth, density, useDynamicSizing, dynamicConfig, measurements]);

    const contextValue = React.useMemo(() => ({
      frozenColumns, 
      columnWidths, 
      defaultColumnWidth, 
      density,
      useDynamicSizing,
      dynamicConfig
    }), [frozenColumns, columnWidths, defaultColumnWidth, density, useDynamicSizing, dynamicConfig]);

    return (
      <DataTableContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            "rounded-md border border-accent/20 bg-card overflow-hidden",
            useDynamicSizing && "dynamic-table-container",
            className
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
                useDynamicSizing ? "dynamic-table" : "table-auto",
                "max-w-full"
              )}
            >
              {children}
            </table>
          </div>
        </div>
      </DataTableContext.Provider>
    );
  }
)
DataTable.displayName = "DataTable"

// Enhanced header with dynamic sizing support
const DataTableHeader = React.forwardRef<HTMLTableSectionElement, DataTableHeaderProps>(
  ({ children, className, sticky = true, ...props }, ref) => {
    const { useDynamicSizing } = React.useContext(DataTableContext);
    
    return (
      <thead
        ref={ref}
        className={cn(
          "bg-card/95",
          sticky && "sticky top-0 z-40",
          "border-b border-accent/20",
          useDynamicSizing && "dynamic-table-header",
          className
        )}
        {...props}
      >
        {children}
      </thead>
    )
  }
)
DataTableHeader.displayName = "DataTableHeader"

// Enhanced body with dynamic sizing support
const DataTableBody = React.forwardRef<HTMLTableSectionElement, DataTableBodyProps>(
  ({ children, className, ...props }, ref) => {
    const { useDynamicSizing } = React.useContext(DataTableContext);
    
    return (
      <tbody 
        ref={ref} 
        className={cn(
          "relative z-0", 
          useDynamicSizing && "dynamic-table-body",
          className
        )} 
        {...props}
      >
        {children}
      </tbody>
    )
  }
)
DataTableBody.displayName = "DataTableBody"

// Enhanced row with dynamic sizing support
const DataTableRow = React.forwardRef<HTMLTableRowElement, DataTableRowProps>(
  ({ children, className, hover = true, rowStriping = true, ...props }, ref) => {
    const { useDynamicSizing } = React.useContext(DataTableContext);
    
    return (
      <tr
        ref={ref}
        className={cn(
          "border-b border-accent/20",
          hover && "hover:bg-muted/30",
          rowStriping && "even:bg-muted/10",
          useDynamicSizing && "dynamic-table-row",
          className
        )}
        {...props}
      >
        {children}
      </tr>
    )
  }
)
DataTableRow.displayName = "DataTableRow"

// Enhanced header cell with dynamic sizing support
const DataTableHead = React.forwardRef<HTMLTableCellElement, DataTableHeadProps>(
  ({ children, className, align = "left", vAlign = "middle", border = true, sticky = false, rowSpan, colSpan, colIndex, ...props }, ref) => {
    const { frozenColumns, columnWidths, density, useDynamicSizing } = React.useContext(DataTableContext);
    let stickyStyle = {};
    let stickyClass = "";
    
    // Apply freezing logic for both traditional and dynamic sizing
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      if (useDynamicSizing) {
        // For dynamic sizing, frozen columns are always positioned at left 0
        stickyStyle = { left: 0 };
        stickyClass = `sticky left-0 z-[51] bg-muted shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`;
      } else if (columnWidths.length > 0) {
        let left = 0;
        for (let i = 0; i < colIndex; ++i) {
          if (frozenColumns.includes(i)) {
            const width = columnWidths[i];
            if (typeof width === "number") left += width;
            else if (typeof width === "string" && width.endsWith("px")) left += parseInt(width);
            else if (typeof width === "string") left += parseInt(width);
          }
        }
        stickyStyle = { left };
        stickyClass = `sticky left-0 z-[51] bg-muted shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`;
      } else {
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
          // Dynamic sizing specific styling
          useDynamicSizing && [
            "sticky top-0 z-50 bg-muted/90",
            typeof colIndex === "number" && colIndex === 0 && "dynamic-first-column",
            typeof colIndex === "number" && colIndex > 0 && "dynamic-other-column"
          ],
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

// Enhanced data cell with dynamic sizing support
const DataTableCell = React.forwardRef<HTMLTableCellElement, DataTableCellProps & { colIndex?: number }>(
  ({ children, className, align = "left", vAlign = "middle", border = true, rowSpan, colSpan, colIndex, overflowHandling = 'truncate', tooltipContent, ...props }, ref) => {
    const { frozenColumns, columnWidths, density, useDynamicSizing } = React.useContext(DataTableContext);
    
    // Diagnostic logging for frozen column issues (only for traditional layout)
    React.useEffect(() => {
      if (!useDynamicSizing && typeof window !== 'undefined' && frozenColumns.length > 0 && typeof colIndex === 'undefined') {
        console.warn('[DataTableCell Warning]', {
          path: window.location.pathname,
          message: 'Frozen columns configured but colIndex prop is missing',
          frozenColumns,
          hasColIndex: typeof colIndex !== 'undefined'
        });
      }
    }, [frozenColumns, colIndex, useDynamicSizing]);

    let stickyStyle = {};
    let stickyClass = "";
    
    // Apply freezing logic for both traditional and dynamic sizing
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      if (useDynamicSizing) {
        // For dynamic sizing, frozen columns are always positioned at left 0
        stickyStyle = { left: 0 };
        stickyClass = `sticky left-0 z-[35] bg-background border-r border-accent/20`;
      } else if (columnWidths.length > 0) {
        let left = 0;
        for (let i = 0; i < colIndex; ++i) {
          if (frozenColumns.includes(i)) {
            const width = columnWidths[i];
            if (typeof width === "number") left += width;
            else if (typeof width === "string" && width.endsWith("px")) left += parseInt(width);
            else if (typeof width === "string") left += parseInt(width);
          }
        }
        stickyStyle = { left };
        stickyClass = `sticky z-[35] bg-background border-r border-accent/20`;
      } else {
        stickyStyle = { left: 0 };
        stickyClass = `sticky z-[35] bg-background border-r border-accent/20`;
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
          "text-sm",
          align === "left" && "text-left",
          align === "center" && "text-center",
          align === "right" && "text-right",
          vAlign === "top" && "align-top",
          vAlign === "middle" && "align-middle",
          vAlign === "bottom" && "align-bottom",
          border && "border-r border-accent/20 last:border-r-0",
          stickyClass,
          // Dynamic sizing specific styling
          useDynamicSizing && [
            typeof colIndex === "number" && colIndex === 0 && "dynamic-first-column",
            typeof colIndex === "number" && colIndex > 0 && "dynamic-other-column"
          ],
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

// Column group - same as original
const DataTableColGroup = React.forwardRef<HTMLTableColElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <colgroup ref={ref}>{children}</colgroup>
  )
)
DataTableColGroup.displayName = "DataTableColGroup"

// Column definition - same as original
const DataTableCol = React.forwardRef<HTMLTableColElement, { width?: string | number; className?: string }>(
  ({ width, className }, ref) => {
    const style = width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined;
    return (
      <col
        ref={ref}
        className={cn(className)}
        style={style}
      />
    );
  }
)
DataTableCol.displayName = "DataTableCol"

// Badge component - same as original
export interface DataTableBadgeProps extends OriginalBadgeProps {}

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