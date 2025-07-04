import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge, BadgeProps as OriginalBadgeProps } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, Grid, List, Smartphone, Monitor, Tablet } from "lucide-react";

/**
 * Revolutionary Responsive Layout Adapter DataTable Solution
 * 
 * Key Innovation: Completely abandons traditional table paradigm on mobile/tablet.
 * Uses intelligent layout transformation:
 * - Desktop: Traditional table layout
 * - Tablet: Card-based grid layout with volunteer prominence
 * - Mobile: Timeline/list layout with expandable sections
 * 
 * Creative Approach:
 * - Multi-layout rendering system
 * - Context-aware data presentation
 * - Progressive disclosure patterns
 * - Gesture-based navigation
 */

interface DataTableProps {
  children?: React.ReactNode
  className?: string
  maxHeight?: string
  /**
   * NEW: Enable Revolutionary Responsive Layout transformation
   */
  useRevolutionaryLayout?: boolean;
  /**
   * NEW: Configuration for revolutionary layout behavior
   */
  revolutionaryConfig?: {
    breakpoints?: {
      mobile: number;    // Default: 768
      tablet: number;    // Default: 1024
    };
    layouts?: {
      desktop: 'table';                           // Always table
      tablet: 'cards' | 'grid' | 'masonry';     // Default: 'cards'
      mobile: 'timeline' | 'accordion' | 'feed'; // Default: 'timeline'
    };
    enableGestures?: boolean;                     // Default: true
    enableLayoutToggle?: boolean;                 // Default: true
    primaryColumn?: number;                       // Which column is most important (default: 0)
  };
  /**
   * NEW: Data for revolutionary layouts (columns metadata)
   */
  columnsMetadata?: Array<{
    key: string;
    label: string;
    type?: 'text' | 'badge' | 'action' | 'number' | 'date';
    priority?: 'primary' | 'secondary' | 'tertiary';
    mobileVisible?: boolean;
    tabletVisible?: boolean;
  }>;
  /**
   * NEW: Data rows for revolutionary layouts
   */
  dataRows?: Array<Record<string, any>>;
  /**
   * NEW: Frozen columns support
   */
  frozenColumns?: number[];
  /**
   * NEW: Column widths for frozen column positioning
   */
  columnWidths?: (string | number)[];
}

// Context for frozen columns
const RevolutionaryDataTableContext = React.createContext<{
  frozenColumns: number[];
  columnWidths: (string | number)[];
}>({ 
  frozenColumns: [], 
  columnWidths: []
});

// Timeline Layout Component (Mobile)
const TimelineLayout: React.FC<{ dataRows: any[], columnsMetadata: any[] }> = ({ dataRows, columnsMetadata }) => {
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());
  
  const primaryColumn = columnsMetadata.find(col => col.priority === 'primary') || columnsMetadata[0];
  const secondaryColumns = columnsMetadata.filter(col => col.priority === 'secondary' && col.mobileVisible !== false);
  const tertiaryColumns = columnsMetadata.filter(col => col.priority === 'tertiary');

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="revolutionary-timeline space-y-3">
      {dataRows.map((row, index) => (
        <div key={index} className="timeline-item bg-card border rounded-lg shadow-sm">
          <div 
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleRow(index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">
                  {row[primaryColumn?.key || 'name']}
                </div>
                <div className="flex flex-wrap gap-2">
                  {secondaryColumns.slice(0, 2).map(col => (
                    <span key={col.key} className="text-sm text-muted-foreground">
                      {row[col.key]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ml-4 flex items-center space-x-2">
                {secondaryColumns.slice(2, 3).map(col => (
                  <Badge key={col.key} variant="outline" className="text-xs">
                    {row[col.key]}
                  </Badge>
                ))}
                {expandedRows.has(index) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </div>
          </div>
          
          {expandedRows.has(index) && (
            <div className="px-4 pb-4 border-t bg-muted/20">
              <div className="grid grid-cols-2 gap-3 mt-3">
                {tertiaryColumns.map(col => (
                  <div key={col.key} className="text-sm">
                    <span className="font-medium text-muted-foreground">{col.label}:</span>
                    <span className="ml-2">{row[col.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Cards Layout Component (Tablet)
const CardsLayout: React.FC<{ dataRows: any[], columnsMetadata: any[] }> = ({ dataRows, columnsMetadata }) => {
  const primaryColumn = columnsMetadata.find(col => col.priority === 'primary') || columnsMetadata[0];
  const visibleColumns = columnsMetadata.filter(col => col.tabletVisible !== false);

  return (
    <div className="revolutionary-cards grid grid-cols-2 lg:grid-cols-3 gap-4">
      {dataRows.map((row, index) => (
        <div key={index} className="card-item bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-3">
            <h3 className="font-semibold text-lg mb-1 leading-tight">
              {row[primaryColumn?.key || 'name']}
            </h3>
          </div>
          
          <div className="space-y-2">
            {visibleColumns.slice(1).map(col => (
              <div key={col.key} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">{col.label}</span>
                <span className="text-right">
                  {col.type === 'badge' ? (
                    <Badge variant="outline" className="text-xs">{row[col.key]}</Badge>
                  ) : (
                    row[col.key]
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Layout Toggle Component
const LayoutToggle: React.FC<{ 
  currentLayout: string, 
  breakpoint: string, 
  onToggle: () => void 
}> = ({ currentLayout, breakpoint, onToggle }) => {
  const getIcon = () => {
    switch (currentLayout) {
      case 'timeline': return <List size={16} />;
      case 'accordion': return <ChevronDown size={16} />;
      case 'feed': return <Grid size={16} />;
      case 'cards': return <Grid size={16} />;
      case 'grid': return <List size={16} />;
      case 'masonry': return <Grid size={16} />;
      default: return <Monitor size={16} />;
    }
  };

  const getLabel = () => {
    switch (breakpoint) {
      case 'mobile': return `${currentLayout} view`;
      case 'tablet': return `${currentLayout} layout`;
      default: return 'table view';
    }
  };

  if (breakpoint === 'desktop') return null;

  return (
    <button
      onClick={onToggle}
      className="layout-toggle flex items-center space-x-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
    >
      {getIcon()}
      <span>{getLabel()}</span>
      <div className="flex items-center space-x-1 ml-2">
        {breakpoint === 'mobile' && <Smartphone size={12} />}
        {breakpoint === 'tablet' && <Tablet size={12} />}
      </div>
    </button>
  );
};

// Main Revolutionary DataTable Component
const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ 
    children, 
    className, 
    maxHeight = "calc(100vh - 300px)", 
    useRevolutionaryLayout = false,
    revolutionaryConfig = {
      breakpoints: { mobile: 768, tablet: 1024 },
      layouts: { desktop: 'table', tablet: 'cards', mobile: 'timeline' },
      enableGestures: true,
      enableLayoutToggle: true,
      primaryColumn: 0
    },
    columnsMetadata = [],
    dataRows = [],
    frozenColumns = [],
    columnWidths = [],
    ...props 
  }, ref) => {
    
    // Simplified responsive state management
    const [breakpoint, setBreakpoint] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [currentLayout, setCurrentLayout] = React.useState<string>('table');
    
    // Simple responsive detection
    React.useEffect(() => {
      const handleResize = () => {
        const width = window.innerWidth;
        const config = revolutionaryConfig;
        
        if (width <= (config?.breakpoints?.mobile || 768)) {
          setBreakpoint('mobile');
          setCurrentLayout(config?.layouts?.mobile || 'timeline');
        } else if (width <= (config?.breakpoints?.tablet || 1024)) {
          setBreakpoint('tablet');
          setCurrentLayout(config?.layouts?.tablet || 'cards');
        } else {
          setBreakpoint('desktop');
          setCurrentLayout('table');
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [revolutionaryConfig]);

    const toggleLayout = () => {
      if (breakpoint === 'tablet') {
        const tabletLayouts = ['cards', 'grid', 'masonry'];
        const currentIndex = tabletLayouts.indexOf(currentLayout);
        const nextIndex = (currentIndex + 1) % tabletLayouts.length;
        setCurrentLayout(tabletLayouts[nextIndex]);
      } else if (breakpoint === 'mobile') {
        const mobileLayouts = ['timeline', 'accordion', 'feed'];
        const currentIndex = mobileLayouts.indexOf(currentLayout);
        const nextIndex = (currentIndex + 1) % mobileLayouts.length;
        setCurrentLayout(mobileLayouts[nextIndex]);
      }
    };

    const contextValue = React.useMemo(() => ({
      frozenColumns, 
      columnWidths
    }), [frozenColumns, columnWidths]);

    // Revolutionary layout rendering
    if (useRevolutionaryLayout && breakpoint !== 'desktop') {
      return (
        <RevolutionaryDataTableContext.Provider value={contextValue}>
          <div
            ref={ref}
            className={cn(
              "revolutionary-datatable",
              `revolutionary-${breakpoint}`,
              `revolutionary-${currentLayout}`,
              className
            )}
            {...props}
          >
            {/* Layout controls */}
            {revolutionaryConfig?.enableLayoutToggle && (
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  {dataRows.length} items • {breakpoint} view
                </div>
                <LayoutToggle 
                  currentLayout={currentLayout} 
                  breakpoint={breakpoint} 
                  onToggle={toggleLayout} 
                />
              </div>
            )}

            {/* Revolutionary layout content */}
            <div className="revolutionary-content" style={{ maxHeight }}>
              {(currentLayout === 'timeline' || currentLayout === 'accordion' || currentLayout === 'feed') && 
                <TimelineLayout dataRows={dataRows} columnsMetadata={columnsMetadata} />}
              {(currentLayout === 'cards' || currentLayout === 'masonry') && 
                <CardsLayout dataRows={dataRows} columnsMetadata={columnsMetadata} />}
              {currentLayout === 'grid' && 
                <CardsLayout dataRows={dataRows} columnsMetadata={columnsMetadata} />}
            </div>
          </div>
        </RevolutionaryDataTableContext.Provider>
      );
    }

    // Fallback to traditional table for desktop or when revolutionary layout is disabled
    return (
      <RevolutionaryDataTableContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            "rounded-md border border-accent/20 bg-card overflow-hidden",
            useRevolutionaryLayout && "revolutionary-datatable revolutionary-desktop",
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
            <table className={cn(
              "w-full border-collapse table-auto",
              "max-w-full"
            )}>
              {children}
            </table>
          </div>
        </div>
      </RevolutionaryDataTableContext.Provider>
    );
  }
)
DataTable.displayName = "DataTable"

// Traditional table components (unchanged for desktop compatibility)
const DataTableHeader = React.forwardRef<HTMLTableSectionElement, { children: React.ReactNode; className?: string; sticky?: boolean }>(
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

const DataTableBody = React.forwardRef<HTMLTableSectionElement, { children: React.ReactNode; className?: string }>(
  ({ children, className, ...props }, ref) => (
    <tbody ref={ref} className={cn("relative z-0", className)} {...props}>
      {children}
    </tbody>
  )
)
DataTableBody.displayName = "DataTableBody"

const DataTableRow = React.forwardRef<HTMLTableRowElement, { children: React.ReactNode; className?: string; hover?: boolean; rowStriping?: boolean }>(
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

const DataTableHead = React.forwardRef<HTMLTableCellElement, { 
  children: React.ReactNode; 
  className?: string; 
  align?: "left" | "center" | "right";
  vAlign?: "top" | "middle" | "bottom";
  border?: boolean;
  rowSpan?: number;
  colSpan?: number;
  sticky?: boolean;
  colIndex?: number;
}>(
  ({ children, className, align = "left", vAlign = "middle", border = true, sticky = false, rowSpan, colSpan, colIndex, ...props }, ref) => {
    const { frozenColumns, columnWidths } = React.useContext(RevolutionaryDataTableContext);
    let stickyStyle = {};
    let stickyClass = "";
    
    // Apply freezing logic
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      if (columnWidths.length > 0) {
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
          "font-semibold relative py-1 px-2",
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

const DataTableCell = React.forwardRef<HTMLTableCellElement, { 
  children: React.ReactNode; 
  className?: string; 
  align?: "left" | "center" | "right";
  vAlign?: "top" | "middle" | "bottom";
  border?: boolean;
  rowSpan?: number;
  colSpan?: number;
  colIndex?: number;
  overflowHandling?: 'truncate' | 'wrap' | 'tooltip';
  tooltipContent?: React.ReactNode;
}>(
  ({ children, className, align = "left", vAlign = "middle", border = true, rowSpan, colSpan, colIndex, overflowHandling = 'truncate', tooltipContent, ...props }, ref) => {
    const { frozenColumns, columnWidths } = React.useContext(RevolutionaryDataTableContext);
    let stickyStyle = {};
    let stickyClass = "";
    
    // Apply freezing logic
    if (typeof colIndex === "number" && frozenColumns.includes(colIndex)) {
      if (columnWidths.length > 0) {
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
        stickyClass = `sticky left-0 z-[35] bg-background border-r border-accent/20`;
      } else {
        stickyStyle = { left: 0 };
        stickyClass = `sticky left-0 z-[35] bg-background border-r border-accent/20`;
      }
    }

    return (
      <td
        ref={ref}
        rowSpan={rowSpan}
        colSpan={colSpan}
        style={stickyStyle}
        className={cn(
        "py-1 px-2 text-sm",
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

const DataTableColGroup = React.forwardRef<HTMLTableColElement, { children: React.ReactNode }>(
  ({ children }, ref) => <colgroup ref={ref}>{children}</colgroup>
)
DataTableColGroup.displayName = "DataTableColGroup"

const DataTableCol = React.forwardRef<HTMLTableColElement, { width?: string | number; className?: string }>(
  ({ width, className }, ref) => {
    const style = width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined;
    return <col ref={ref} className={cn(className)} style={style} />;
  }
)
DataTableCol.displayName = "DataTableCol"

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