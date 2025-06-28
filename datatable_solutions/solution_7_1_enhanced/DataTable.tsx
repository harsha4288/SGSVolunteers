import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge, BadgeProps as OriginalBadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, LayoutGrid, List, Maximize2, Minimize2 } from "lucide-react";

/**
 * Solution 7.1: Enhanced Context-Aware Responsive DataTable
 * 
 * Key Innovation: Intelligent content-aware responsive behavior with enhanced scrolling
 * - Analyzes actual content length to determine optimal layout
 * - Implements collapsible row expansion for detailed content
 * - Smart condensed view with expandable details
 * - Context-sensitive column grouping
 * - Adaptive density based on content importance
 * - Enhanced frozen columns with proper table-level scrolling
 * - Fixed content cutting issue with intelligent overflow handling
 */

interface DataTableProps {
  children?: React.ReactNode
  className?: string
  maxHeight?: string
  /**
   * Enable context-aware responsive behavior
   */
  useContextualLayout?: boolean;
  /**
   * Content analysis configuration
   */
  contentAnalysis?: {
    enableContentMeasurement?: boolean;
    longContentThreshold?: number;        // Characters (default: 50)
    enableRowExpansion?: boolean;         // Default: true
    enableColumnGrouping?: boolean;       // Default: true
    densityMode?: 'compact' | 'normal' | 'comfortable'; // Default: 'normal'
    preventContentCutting?: boolean;     // Default: true - prevents cell content truncation
  };
  /**
   * Column grouping configuration
   */
  columnGroups?: {
    [groupName: string]: {
      title: string;
      columns: number[];
      priority: 'primary' | 'secondary' | 'tertiary';
      collapsible?: boolean;
    };
  };
  /**
   * Freeze first column(s) for horizontal scrolling
   */
  frozenColumns?: number[];
  /**
   * Minimum column widths to prevent content cutting
   */
  minColumnWidths?: {
    [columnIndex: number]: number; // minimum width in pixels
  };
}

// Content analysis hook
const useContentAnalysis = (
  tableRef: React.RefObject<HTMLTableElement>,
  config: any = {}
) => {
  const [contentMetrics, setContentMetrics] = React.useState({
    averageContentLength: 0,
    longContentColumns: new Set<number>(),
    screenWidth: 1200,
    recommendedLayout: 'table' as 'table' | 'condensed' | 'expanded'
  });

  React.useEffect(() => {
    const analyzeContent = () => {
      if (!tableRef.current) return;

      const screenWidth = window.innerWidth;
      const cells = tableRef.current.querySelectorAll('tbody td');
      const longContentThreshold = config.longContentThreshold || 50;
      
      let totalLength = 0;
      const longColumns = new Set<number>();
      
      cells.forEach((cell, index) => {
        const content = cell.textContent || '';
        totalLength += content.length;
        
        const columnIndex = index % (cells.length / Math.max(1, tableRef.current!.querySelectorAll('tbody tr').length));
        if (content.length > longContentThreshold) {
          longColumns.add(Math.floor(columnIndex));
        }
      });

      const averageLength = totalLength / Math.max(1, cells.length);
      
      // Determine recommended layout
      let recommendedLayout: 'table' | 'condensed' | 'expanded' = 'table';
      if (screenWidth < 768 && (averageLength > 30 || longColumns.size > 0)) {
        recommendedLayout = 'condensed';
      } else if (screenWidth < 480) {
        recommendedLayout = 'expanded';
      }

      setContentMetrics({
        averageContentLength: averageLength,
        longContentColumns: longColumns,
        screenWidth,
        recommendedLayout
      });
    };

    analyzeContent();
    window.addEventListener('resize', analyzeContent);
    return () => window.removeEventListener('resize', analyzeContent);
  }, [config, tableRef]);

  return contentMetrics;
};

// Expandable row component
const ExpandableRow: React.FC<{
  children: React.ReactNode[];
  isExpanded: boolean;
  onToggle: () => void;
  primaryContent: React.ReactNode[];
  secondaryContent: React.ReactNode[];
  columnGroups: any;
  headers?: React.ReactNode[];
}> = ({ children, isExpanded, onToggle, primaryContent, secondaryContent, columnGroups, headers = [] }) => {
  return (
    <>
      {/* Primary row (always visible) */}
      <tr className="border-b border-accent/20 hover:bg-muted/30 transition-colors">
        <td className="px-2 py-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </Button>
        </td>
        {primaryContent.map((content, index) => (
          <td key={index} className="px-2 py-1 text-sm">
            {React.isValidElement(content) ? content.props.children : content}
          </td>
        ))}
      </tr>
      
      {/* Expanded content */}
      {isExpanded && (
        <tr className="bg-muted/20 border-b border-accent/20">
          <td></td>
          <td colSpan={primaryContent.length} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(columnGroups).map(([groupName, group]: [string, any]) => {
                if (group.priority === 'primary') return null;
                
                return (
                  <div key={groupName} className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      {group.title}
                    </h4>
                    <div className="space-y-1">
                      {group.columns.map((colIndex: number, idx: number) => {
                        const header = headers[colIndex];
                        const content = secondaryContent[idx];
                        
                        return (
                          <div key={colIndex} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {React.isValidElement(header) ? header.props?.children || `Column ${colIndex + 1}` : header || `Column ${colIndex + 1}`}
                            </span>
                            <span className="text-right">
                              {React.isValidElement(content) ? content.props.children : content}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// Context-aware DataTable component
const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ 
    children, 
    className, 
    maxHeight = "calc(100vh - 300px)", 
    useContextualLayout = true,
    contentAnalysis = {
      enableContentMeasurement: true,
      longContentThreshold: 50,
      enableRowExpansion: true,
      enableColumnGrouping: true,
      densityMode: 'normal',
      preventContentCutting: true
    },
    columnGroups = {
      primary: {
        title: 'Primary Information',
        columns: [0, 1],
        priority: 'primary'
      },
      secondary: {
        title: 'Additional Details',
        columns: [2, 3, 4],
        priority: 'secondary',
        collapsible: true
      },
      tertiary: {
        title: 'Optional Information',
        columns: [5, 6, 7],
        priority: 'tertiary',
        collapsible: true
      }
    },
    frozenColumns = [],
    minColumnWidths = {},
    ...props 
  }, ref) => {
    
    const tableRef = React.useRef<HTMLTableElement>(null);
    const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());
    const [layoutMode, setLayoutMode] = React.useState<'table' | 'condensed' | 'expanded'>('table');
    
    const contentMetrics = useContentAnalysis(tableRef, contentAnalysis);

    // Update layout based on content analysis
    React.useEffect(() => {
      if (useContextualLayout) {
        setLayoutMode(contentMetrics.recommendedLayout);
      }
    }, [contentMetrics.recommendedLayout, useContextualLayout]);

    // Apply enhanced frozen column styling and content overflow protection
    React.useEffect(() => {
      if (!tableRef.current) return;

      const table = tableRef.current;
      const allCells = table.querySelectorAll('th, td');
      const rows = table.querySelectorAll('tr');
      
      if (rows.length === 0) return;
      const columnsPerRow = rows[0].children.length;
      
      // Calculate cumulative left offsets for frozen columns
      const frozenColumnOffsets: { [key: number]: number } = {};
      let cumulativeOffset = 0;
      
      frozenColumns.forEach((columnIndex, frozenIndex) => {
        frozenColumnOffsets[columnIndex] = cumulativeOffset;
        
        // Calculate the width of this frozen column for the next offset
        const columnCells = Array.from(allCells).filter((_, index) => 
          index % columnsPerRow === columnIndex
        );
        
        if (columnCells.length > 0) {
          const maxWidth = Math.max(
            ...columnCells.map(cell => {
              const element = cell as HTMLElement;
              return element.offsetWidth || minColumnWidths[columnIndex] || 150;
            })
          );
          cumulativeOffset += maxWidth;
        }
      });
      
      allCells.forEach((cell, index) => {
        const columnIndex = index % columnsPerRow;
        const cellElement = cell as HTMLElement;
        
        // Apply frozen column styling
        if (frozenColumns.includes(columnIndex)) {
          cellElement.style.position = 'sticky';
          cellElement.style.left = `${frozenColumnOffsets[columnIndex]}px`;
          cellElement.style.zIndex = '20';
          cellElement.style.backgroundColor = 'hsl(var(--background))';
          cellElement.style.borderRight = '1px solid hsl(var(--border))';
          cellElement.classList.add('sticky-column');
          
          // Ensure minimum width for frozen columns
          const minWidth = minColumnWidths[columnIndex] || 150;
          cellElement.style.minWidth = `${minWidth}px`;
        } else {
          // Reset non-frozen column styles
          cellElement.style.position = '';
          cellElement.style.left = '';
          cellElement.style.zIndex = '';
          cellElement.style.backgroundColor = '';
          cellElement.style.borderRight = '';
          cellElement.classList.remove('sticky-column');
        }
        
        // Apply content cutting prevention
        if (contentAnalysis?.preventContentCutting) {
          cellElement.style.whiteSpace = 'nowrap';
          cellElement.style.overflow = 'visible';
          
          // Set minimum width based on content or configuration
          const minWidth = minColumnWidths[columnIndex] || 
            (frozenColumns.includes(columnIndex) ? 150 : 80);
          cellElement.style.minWidth = `${minWidth}px`;
        }
      });
      
      // Ensure table has proper min-width to accommodate all columns
      if (contentAnalysis?.preventContentCutting) {
        const totalMinWidth = Array.from({ length: columnsPerRow }, (_, i) => 
          minColumnWidths[i] || (frozenColumns.includes(i) ? 150 : 80)
        ).reduce((sum, width) => sum + width, 0);
        
        table.style.minWidth = `${totalMinWidth}px`;
      }
    }, [frozenColumns, minColumnWidths, contentAnalysis]);

    const toggleRow = (rowIndex: number) => {
      const newExpanded = new Set(expandedRows);
      if (newExpanded.has(rowIndex)) {
        newExpanded.delete(rowIndex);
      } else {
        newExpanded.add(rowIndex);
      }
      setExpandedRows(newExpanded);
    };

    const toggleLayoutMode = () => {
      const modes: Array<'table' | 'condensed' | 'expanded'> = ['table', 'condensed', 'expanded'];
      const currentIndex = modes.indexOf(layoutMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      setLayoutMode(modes[nextIndex]);
    };

    if (!useContextualLayout || layoutMode === 'table') {
      // Standard table layout
      return (
        <div
          ref={ref}
          className={cn(
            "contextual-datatable rounded-md border border-accent/20 bg-card overflow-hidden",
            className
          )}
          {...props}
        >
          {useContextualLayout && (
            <div className="flex items-center justify-between p-2 bg-muted/20 border-b border-accent/20">
              <div className="text-xs text-muted-foreground">
                Context-Aware Table • {contentMetrics.screenWidth < 768 ? 'Mobile' : 
                                     contentMetrics.screenWidth < 1024 ? 'Tablet' : 'Desktop'} • 
                Avg Content: {Math.round(contentMetrics.averageContentLength)} chars
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLayoutMode}
                className="h-7 px-2 text-xs"
              >
                <LayoutGrid size={12} className="mr-1" />
                {layoutMode}
              </Button>
            </div>
          )}
          
          <div className="overflow-auto" style={{ maxHeight }}>
            <table 
              ref={tableRef} 
              className={cn(
                "w-full border-collapse",
                contentAnalysis?.preventContentCutting && "table-fixed min-w-full"
              )}
            >
              {children}
            </table>
          </div>
        </div>
      );
    }

    // Condensed layout with expandable rows
    return (
      <div
        ref={ref}
        className={cn(
          "contextual-datatable contextual-condensed rounded-md border border-accent/20 bg-card overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Layout controls */}
        <div className="flex items-center justify-between p-2 bg-muted/20 border-b border-accent/20">
          <div className="text-xs text-muted-foreground">
            Context-Aware • {layoutMode} Mode • 
            {contentMetrics.longContentColumns.size > 0 && 
              ` ${contentMetrics.longContentColumns.size} long columns detected`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLayoutMode}
              className="h-7 px-2 text-xs"
            >
              <List size={12} className="mr-1" />
              {layoutMode}
            </Button>
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight }}>
          {/* Custom condensed table rendering */}
          <div className="contextual-condensed-content">
            <table ref={tableRef} className="w-full">
              {(() => {
                let headerCells: React.ReactNode[] = [];
                
                return React.Children.map(children, (child) => {
                  if (!React.isValidElement(child)) return null;
                  
                  // Process DataTableHeader
                  if (child.type === DataTableHeader) {
                    const headerRow = React.Children.toArray(child.props.children)[0] as React.ReactElement;
                    if (!headerRow || !React.isValidElement(headerRow)) return null;
                    
                    headerCells = React.Children.toArray(headerRow.props.children);
                    const primaryHeaders = columnGroups.primary?.columns.map(i => headerCells[i]) || headerCells.slice(0, 2);
                    
                    return (
                      <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-8"></th>
                          {primaryHeaders.map((header, index) => (
                            <th key={index} className="px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-r border-accent/20 last:border-r-0">
                              {React.isValidElement(header) ? header.props.children : header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    );
                  }
                  
                  // Process DataTableBody
                  if (child.type === DataTableBody) {
                    const bodyRows = React.Children.toArray(child.props.children);
                    
                    return (
                      <tbody>
                        {bodyRows.map((row, rowIndex) => {
                          if (!React.isValidElement(row)) return null;
                          
                          const cells = React.Children.toArray(row.props.children);
                          const primaryCells = columnGroups.primary?.columns.map(i => cells[i]) || cells.slice(0, 2);
                          const secondaryCells = columnGroups.secondary?.columns.map(i => cells[i]) || cells.slice(2);
                          
                          return (
                            <ExpandableRow
                              key={rowIndex}
                              children={cells}
                              isExpanded={expandedRows.has(rowIndex)}
                              onToggle={() => toggleRow(rowIndex)}
                              primaryContent={primaryCells}
                              secondaryContent={secondaryCells}
                              columnGroups={columnGroups}
                              headers={headerCells}
                            />
                          );
                        })}
                      </tbody>
                    );
                  }
                  
                  return null;
                });
              })()}
            </table>
          </div>
        </div>
      </div>
    );
  }
)
DataTable.displayName = "DataTable"

// Standard table components
const DataTableHeader = React.forwardRef<HTMLTableSectionElement, { children: React.ReactNode; className?: string }>(
  ({ children, className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        "bg-muted/50 sticky top-0 z-10",
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
    <tbody ref={ref} className={className} {...props}>
      {children}
    </tbody>
  )
)
DataTableBody.displayName = "DataTableBody"

const DataTableRow = React.forwardRef<HTMLTableRowElement, { children: React.ReactNode; className?: string }>(
  ({ children, className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-accent/20 hover:bg-muted/30 even:bg-muted/10",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
)
DataTableRow.displayName = "DataTableRow"

const DataTableHead = React.forwardRef<HTMLTableCellElement, { 
  children: React.ReactNode; 
  className?: string;
}>(
  ({ children, className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-r border-accent/20 last:border-r-0",
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
)
DataTableHead.displayName = "DataTableHead"

const DataTableCell = React.forwardRef<HTMLTableCellElement, { 
  children: React.ReactNode; 
  className?: string;
  isLongContent?: boolean;
  noTruncate?: boolean;
}>(
  ({ children, className, isLongContent, noTruncate, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-2 py-1 text-sm border-r border-accent/20 last:border-r-0",
        // Only apply truncation if specifically requested and noTruncate is not set
        isLongContent && !noTruncate && "max-w-32 truncate",
        noTruncate && "whitespace-nowrap",
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
)
DataTableCell.displayName = "DataTableCell"

const DataTableColGroup = React.forwardRef<HTMLTableColElement, { children: React.ReactNode }>(
  ({ children }, ref) => <colgroup ref={ref}>{children}</colgroup>
)
DataTableColGroup.displayName = "DataTableColGroup"

const DataTableCol = React.forwardRef<HTMLTableColElement, { width?: string | number; className?: string }>(
  ({ width, className }, ref) => {
    const style = width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined;
    return <col ref={ref} className={className} style={style} />;
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