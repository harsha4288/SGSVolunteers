# Solution 8: Adaptive Breakpoint System with Content-Aware Switching

## Overview
Create an intelligent responsive system that switches between different table layouts based on content density, viewport size, and column count, ensuring optimal volunteer column sizing across all scenarios.

## Key Innovation
Use multiple layout strategies that activate based on computed breakpoints considering not just screen size, but also data characteristics and content complexity.

## Technical Implementation

### Adaptive Breakpoint Logic
```typescript
interface AdaptiveConfig {
  columnCount: number;
  maxNameLength: number;
  averageNameLength: number;
  viewportWidth: number;
  contentDensity: 'low' | 'medium' | 'high';
}

const useAdaptiveLayout = (config: AdaptiveConfig) => {
  return useMemo(() => {
    const { columnCount, maxNameLength, viewportWidth, contentDensity } = config;
    
    // Calculate content-aware breakpoints
    const nameWidthRequirement = maxNameLength * 8 + 40; // 8px per char + padding
    const availableSpace = viewportWidth - nameWidthRequirement - 60; // scrollbar/padding
    const spacePerColumn = availableSpace / (columnCount - 1);
    
    // Determine optimal layout strategy
    if (viewportWidth < 640) {
      return 'mobile-stack'; // Stack volunteer info
    } else if (spacePerColumn < 60) {
      return 'compact-grid'; // Use CSS Grid with minimum widths
    } else if (contentDensity === 'high' && columnCount > 10) {
      return 'virtual-columns'; // Hide some columns, show on demand
    } else if (nameWidthRequirement > viewportWidth * 0.3) {
      return 'constrained-names'; // Truncate names, show full on hover
    } else {
      return 'flexible-table'; // Standard responsive table
    }
  }, [config]);
};
```

### Layout Strategy Components
```typescript
const AdaptiveDataTable: React.FC<AdaptiveDataTableProps> = ({
  data,
  columns,
  ...props
}) => {
  const [viewportWidth, setViewportWidth] = useState(0);
  
  // Analyze content characteristics
  const contentConfig = useMemo(() => {
    const names = data.map(row => getVolunteerName(row));
    const maxNameLength = Math.max(...names.map(name => name.length));
    const averageNameLength = names.reduce((sum, name) => sum + name.length, 0) / names.length;
    
    return {
      columnCount: columns.length,
      maxNameLength,
      averageNameLength,
      viewportWidth,
      contentDensity: columns.length > 15 ? 'high' : columns.length > 8 ? 'medium' : 'low'
    };
  }, [data, columns, viewportWidth]);
  
  const layoutStrategy = useAdaptiveLayout(contentConfig);
  
  // Render appropriate layout
  switch (layoutStrategy) {
    case 'mobile-stack':
      return <MobileStackLayout {...props} />;
    case 'compact-grid':
      return <CompactGridLayout {...props} />;
    case 'virtual-columns':
      return <VirtualColumnsLayout {...props} />;
    case 'constrained-names':
      return <ConstrainedNamesLayout {...props} />;
    default:
      return <FlexibleTableLayout {...props} />;
  }
};
```

### Mobile Stack Layout
```typescript
const MobileStackLayout: React.FC<LayoutProps> = ({ data, columns }) => {
  return (
    <div className="mobile-stack-container">
      {data.map((row, index) => (
        <div key={index} className="mobile-stack-card">
          <div className="volunteer-info">
            <h3 className="volunteer-name">{getVolunteerName(row)}</h3>
            <p className="volunteer-email">{row.volunteer.email}</p>
          </div>
          <div className="assignments-grid">
            {columns.slice(1).map(column => (
              <div key={column.key} className="assignment-item">
                <span className="assignment-label">{column.header}</span>
                <span className="assignment-value">{column.accessor(row)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### Compact Grid Layout
```typescript
const CompactGridLayout: React.FC<LayoutProps> = ({ data, columns }) => {
  const gridColumns = useMemo(() => {
    // Calculate optimal grid columns based on available space
    const volunteerWidth = 'minmax(100px, 200px)';
    const dataWidth = `repeat(${columns.length - 1}, minmax(50px, 1fr))`;
    return `${volunteerWidth} ${dataWidth}`;
  }, [columns.length]);
  
  return (
    <div 
      className="compact-grid-table"
      style={{ gridTemplateColumns: gridColumns }}
    >
      {/* Header */}
      {columns.map(column => (
        <div key={column.key} className="compact-grid-header">
          {column.header}
        </div>
      ))}
      
      {/* Data rows */}
      {data.map((row, rowIndex) => (
        columns.map(column => (
          <div 
            key={`${rowIndex}-${column.key}`}
            className={cn(
              "compact-grid-cell",
              column.key === 'volunteer' && "volunteer-cell"
            )}
          >
            {column.accessor(row)}
          </div>
        ))
      ))}
    </div>
  );
};
```

### Virtual Columns Layout
```typescript
const VirtualColumnsLayout: React.FC<LayoutProps> = ({ data, columns }) => {
  const [visibleColumns, setVisibleColumns] = useState(() => 
    columns.slice(0, 6) // Show first 6 columns initially
  );
  const [hiddenColumns] = useState(() => columns.slice(6));
  
  return (
    <div className="virtual-columns-container">
      {/* Main table with visible columns */}
      <table className="virtual-columns-table">
        <thead>
          <tr>
            {visibleColumns.map(column => (
              <th key={column.key}>{column.header}</th>
            ))}
            <th className="more-columns-header">
              <ColumnSelector
                hiddenColumns={hiddenColumns}
                onColumnToggle={(column) => {
                  // Toggle column visibility
                }}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {visibleColumns.map(column => (
                <td key={column.key}>{column.accessor(row)}</td>
              ))}
              <td className="more-columns-cell">
                <ExpandableCell 
                  row={row} 
                  hiddenColumns={hiddenColumns}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Constrained Names Layout
```typescript
const ConstrainedNamesLayout: React.FC<LayoutProps> = ({ data, columns }) => {
  const maxNameWidth = Math.min(window.innerWidth * 0.25, 180);
  
  return (
    <table className="constrained-names-table">
      <colgroup>
        <col style={{ width: `${maxNameWidth}px` }} />
        {columns.slice(1).map(() => (
          <col key={Math.random()} style={{ width: '1fr' }} />
        ))}
      </colgroup>
      <thead>
        {/* Standard header */}
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id}>
            <td className="constrained-name-cell">
              <Tooltip content={getVolunteerName(row)}>
                <div className="truncate max-w-full">
                  {getVolunteerName(row)}
                </div>
              </Tooltip>
            </td>
            {/* Other cells */}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

## File Changes Required

### 1. data-table.tsx - Adaptive System Integration
```typescript
export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ adaptive = true, ...props }, ref) => {
    if (adaptive) {
      return <AdaptiveDataTable ref={ref} {...props} />;
    }
    
    return <StandardDataTable ref={ref} {...props} />;
  }
);

// New adaptive-specific props
interface AdaptiveDataTableProps extends DataTableProps {
  adaptiveConfig?: {
    enableMobileStack?: boolean;
    enableVirtualColumns?: boolean;
    enableConstrainedNames?: boolean;
    breakpoints?: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
}
```

### 2. Responsive CSS Framework
```css
/* Adaptive layout utilities */
.mobile-stack-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-stack-card {
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  padding: 1rem;
}

.compact-grid-table {
  display: grid;
  gap: 1px;
  background: hsl(var(--border));
  border-radius: 0.5rem;
  overflow: hidden;
}

.compact-grid-cell {
  background: hsl(var(--card));
  padding: 0.5rem;
  min-height: 2.5rem;
  display: flex;
  align-items: center;
}

.volunteer-cell {
  position: sticky;
  left: 0;
  background: hsl(var(--muted));
  z-index: 10;
}
```

### 3. Module Integration
```typescript
// Assignments table with adaptive behavior
export function AssignmentsTable({ ... }) {
  return (
    <DataTable
      adaptive
      adaptiveConfig={{
        enableMobileStack: true,
        enableVirtualColumns: timeSlots.length > 12,
        breakpoints: {
          mobile: 640,
          tablet: 1024,
          desktop: 1280
        }
      }}
      data={filteredAssignments}
      columns={tableColumns}
      frozenColumns={[0]}
    />
  );
}
```

## Advantages
- **Context-aware**: Adapts to actual content, not just screen size
- **Optimal UX**: Different strategies for different use cases
- **Performance**: Only renders what's needed for each layout
- **Flexible**: Easy to add new layout strategies
- **Progressive**: Graceful degradation across device types

## Potential Challenges
- **Complexity**: Multiple layout strategies increase maintenance
- **Testing overhead**: Need to test all layout combinations
- **Inconsistent UX**: Users may be confused by changing layouts
- **Performance**: Layout switching calculations add overhead
- **State management**: Need to track layout state across re-renders

## Success Metrics
- Volunteer column never exceeds 25% on any layout
- Smooth transitions between layout strategies
- Zero content truncation across all breakpoints
- Performance < 50ms for layout decision making
- User preference retention across sessions

## Implementation Priority
**Medium** - Comprehensive solution that handles edge cases well, but complexity may outweigh benefits for simpler use cases. Best for applications with highly variable content and user scenarios.