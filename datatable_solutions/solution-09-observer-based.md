# Solution 9: ResizeObserver-Based Dynamic Sizing

## Overview
Use ResizeObserver API to continuously monitor table container size and dynamically adjust column widths in real-time, ensuring optimal volunteer column sizing regardless of container changes.

## Key Innovation
Implement intelligent width redistribution that responds to container resize events, viewport changes, and content updates to maintain perfect column proportions.

## Technical Implementation

### ResizeObserver Integration
```typescript
interface ObserverBasedTableProps extends DataTableProps {
  targetVolunteerPercent?: number;
  minVolunteerWidth?: number;
  maxVolunteerWidth?: number;
  redistributionStrategy?: 'proportional' | 'equal' | 'priority';
}

const useResizeObserverSizing = (
  containerRef: RefObject<HTMLElement>,
  config: ObserverBasedTableProps
) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  
  // ResizeObserver setup
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [containerRef]);
  
  // Calculate optimal column widths based on container size
  useEffect(() => {
    if (dimensions.width === 0) return;
    
    const {
      targetVolunteerPercent = 22,
      minVolunteerWidth = 120,
      maxVolunteerWidth = 250,
      redistributionStrategy = 'proportional'
    } = config;
    
    const volunteerWidth = Math.max(
      minVolunteerWidth,
      Math.min(
        maxVolunteerWidth,
        dimensions.width * (targetVolunteerPercent / 100)
      )
    );
    
    const remainingWidth = dimensions.width - volunteerWidth - 20; // scrollbar buffer
    const otherColumnsCount = (config.columns?.length || 2) - 1;
    
    let otherColumnWidths: number[];
    
    switch (redistributionStrategy) {
      case 'equal':
        otherColumnWidths = Array(otherColumnsCount).fill(remainingWidth / otherColumnsCount);
        break;
      case 'priority':
        otherColumnWidths = calculatePriorityWidths(remainingWidth, otherColumnsCount);
        break;
      default: // proportional
        otherColumnWidths = Array(otherColumnsCount).fill(remainingWidth / otherColumnsCount);
    }
    
    setColumnWidths([volunteerWidth, ...otherColumnWidths]);
  }, [dimensions, config]);
  
  return { dimensions, columnWidths };
};
```

### Dynamic Style Application
```typescript
const ObserverBasedDataTable = React.forwardRef<HTMLDivElement, ObserverBasedTableProps>(
  ({ children, columns, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { dimensions, columnWidths } = useResizeObserverSizing(containerRef, { columns, ...props });
    
    // Generate dynamic CSS custom properties
    const dynamicStyles = useMemo(() => {
      if (columnWidths.length === 0) return {};
      
      const styles: Record<string, string> = {};
      columnWidths.forEach((width, index) => {
        styles[`--col-${index}-width`] = `${width}px`;
      });
      
      return styles;
    }, [columnWidths]);
    
    // Apply column widths to table
    const tableStyle = useMemo(() => ({
      tableLayout: 'fixed' as const,
      width: dimensions.width ? `${dimensions.width}px` : '100%',
      ...dynamicStyles
    }), [dimensions.width, dynamicStyles]);
    
    return (
      <div
        ref={containerRef}
        className="observer-table-container"
        style={{ maxHeight: props.maxHeight }}
      >
        <div className="observer-table-wrapper">
          <table style={tableStyle} className="observer-table">
            <colgroup>
              {columnWidths.map((width, index) => (
                <col 
                  key={index} 
                  style={{ width: `${width}px` }}
                />
              ))}
            </colgroup>
            {children}
          </table>
        </div>
      </div>
    );
  }
);
```

### Adaptive Column Width Strategies
```typescript
// Priority-based width distribution
const calculatePriorityWidths = (availableWidth: number, columnCount: number) => {
  // Define column priorities (higher = more important)
  const priorities = [3, 2, 2, 1, 1, 1]; // Example priorities
  const totalPriority = priorities.slice(0, columnCount).reduce((sum, p) => sum + p, 0);
  
  return priorities.slice(0, columnCount).map(priority => 
    (priority / totalPriority) * availableWidth
  );
};

// Content-aware width calculation
const useContentAwareWidths = (data: any[], columns: Column[]) => {
  return useMemo(() => {
    if (data.length === 0) return [];
    
    // Sample data to estimate content widths
    const sampleSize = Math.min(10, data.length);
    const samples = data.slice(0, sampleSize);
    
    return columns.map((column, index) => {
      if (index === 0) {
        // Volunteer column - measure actual names
        const maxNameWidth = Math.max(
          ...samples.map(row => measureTextWidth(getVolunteerName(row)))
        );
        return Math.min(maxNameWidth + 40, 250); // Add padding, cap at 250px
      }
      
      // Other columns - estimate based on content type
      const sampleContent = samples.map(row => column.accessor(row));
      const avgContentWidth = sampleContent.reduce((sum, content) => {
        return sum + estimateContentWidth(content);
      }, 0) / sampleContent.length;
      
      return Math.max(avgContentWidth + 20, 80); // Min 80px
    });
  }, [data, columns]);
};
```

### Real-time Width Adjustment
```typescript
const useResponsiveWidthAdjustment = (
  containerRef: RefObject<HTMLElement>,
  initialWidths: number[]
) => {
  const [adjustedWidths, setAdjustedWidths] = useState(initialWidths);
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  // Debounced resize handler
  const debouncedResize = useMemo(
    () => debounce((newWidth: number) => {
      setIsAdjusting(true);
      
      // Recalculate widths based on new container width
      const volunteerWidth = Math.min(newWidth * 0.25, 250);
      const remainingWidth = newWidth - volunteerWidth - 20;
      const otherColumnWidth = remainingWidth / (initialWidths.length - 1);
      
      const newWidths = [
        volunteerWidth,
        ...Array(initialWidths.length - 1).fill(Math.max(otherColumnWidth, 60))
      ];
      
      setAdjustedWidths(newWidths);
      
      // Smooth animation completion
      setTimeout(() => setIsAdjusting(false), 150);
    }, 100),
    [initialWidths.length]
  );
  
  // Monitor container width changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      debouncedResize(width);
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [debouncedResize]);
  
  return { adjustedWidths, isAdjusting };
};
```

## File Changes Required

### 1. data-table.tsx - Observer Integration
```typescript
// Enhanced DataTable with observer-based sizing
export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ useObserverSizing = false, ...props }, ref) => {
    if (useObserverSizing) {
      return <ObserverBasedDataTable ref={ref} {...props} />;
    }
    
    return <StandardDataTable ref={ref} {...props} />;
  }
);

// New observer-specific hooks
export const useTableResizeObserver = (
  containerRef: RefObject<HTMLElement>
) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(
      debounce(entries => {
        setIsResizing(true);
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
        setTimeout(() => setIsResizing(false), 100);
      }, 50)
    );
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);
  
  return { containerSize, isResizing };
};
```

### 2. Animation and Transition Support
```css
/* Smooth column width transitions */
.observer-table {
  transition: all 150ms ease-out;
}

.observer-table col {
  transition: width 150ms ease-out;
}

.observer-table-container {
  position: relative;
  overflow: hidden;
}

.observer-table-wrapper {
  overflow: auto;
  transition: opacity 100ms ease-in-out;
}

/* Loading state during resize */
.observer-table-container.resizing .observer-table-wrapper {
  opacity: 0.8;
}

/* Frozen column support with observer */
.observer-table .frozen-cell {
  position: sticky;
  left: 0;
  background: hsl(var(--card));
  z-index: 10;
  transition: left 150ms ease-out;
}
```

### 3. Module Integration Examples
```typescript
// Assignments table with observer-based sizing
export function AssignmentsTable({ ... }) {
  return (
    <DataTable
      useObserverSizing
      targetVolunteerPercent={22}
      minVolunteerWidth={150}
      maxVolunteerWidth={250}
      redistributionStrategy="proportional"
      frozenColumns={[0]}
      maxHeight="calc(100vh - 300px)"
    >
      {/* Table content */}
    </DataTable>
  );
}

// T-shirts table with observer-based sizing
export function TShirtTable({ ... }) {
  return (
    <DataTable
      useObserverSizing
      targetVolunteerPercent={25}
      minVolunteerWidth={120}
      maxVolunteerWidth={200}
      redistributionStrategy="equal"
      frozenColumns={[0]}
    >
      {/* Table content */}
    </DataTable>
  );
}
```

## Advantages
- **Real-time adaptation**: Responds instantly to container changes
- **Precise control**: Exact pixel-level width management
- **Smooth animations**: Transitions between different sizes
- **Content awareness**: Can factor in actual content for sizing
- **Performance**: Only recalculates when container actually changes
- **Flexible strategies**: Multiple redistribution algorithms

## Potential Challenges
- **Browser support**: ResizeObserver requires polyfill for older browsers
- **Performance overhead**: Continuous monitoring and calculations
- **Animation complexity**: Smooth transitions require careful timing
- **State management**: Need to synchronize observer state with React state
- **Memory leaks**: Must properly cleanup observers

## Performance Optimizations
```typescript
// Debounced calculations to prevent excessive re-renders
const useDebouncedColumnCalculation = (
  containerWidth: number,
  config: SizingConfig
) => {
  const [debouncedWidth, setDebouncedWidth] = useState(containerWidth);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWidth(containerWidth);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [containerWidth]);
  
  return useMemo(() => 
    calculateColumnWidths(debouncedWidth, config)
  , [debouncedWidth, config]);
};
```

## Success Metrics
- Volunteer column maintains 20-25% width across all container sizes
- Smooth resize animations < 150ms
- Zero layout jumping during resize
- Memory usage stable during extended use
- Responsive to container changes within 100ms

## Implementation Priority
**Medium-High** - Excellent balance of control and performance. ResizeObserver has good browser support and provides precise control over layout behavior.