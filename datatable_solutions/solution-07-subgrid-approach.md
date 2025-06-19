# Solution 7: CSS Subgrid with Hierarchical Layout

## Overview
Utilize CSS Subgrid to create a sophisticated table layout where each row participates in a parent grid, ensuring perfect column alignment while allowing flexible content-based sizing.

## Key Innovation
Use CSS Grid with Subgrid for rows to inherit column definitions from parent, enabling both flexible volunteer column sizing and perfect alignment across all rows.

## Technical Implementation

### Subgrid Architecture
```css
.subgrid-table {
  display: grid;
  grid-template-columns: 
    minmax(min-content, min(250px, 25%))  /* Volunteer column */
    repeat(auto-fit, minmax(80px, 1fr));   /* Data columns */
  gap: 0;
  border: 1px solid hsl(var(--border));
}

.subgrid-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  border-bottom: 1px solid hsl(var(--border));
}

.subgrid-header {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  background: hsl(var(--muted));
  font-weight: 600;
}
```

### Component Structure
```typescript
interface SubgridDataTableProps extends DataTableProps {
  columns: Column[];
  data: any[];
  volunteerColumnConfig?: {
    minWidth: string;
    maxWidth: string;
    maxPercent: number;
  };
}

const SubgridDataTable: React.FC<SubgridDataTableProps> = ({
  columns,
  data,
  volunteerColumnConfig = {
    minWidth: '120px',
    maxWidth: '250px', 
    maxPercent: 25
  },
  frozenColumns = [0],
  ...props
}) => {
  // Generate grid template based on column count and constraints
  const gridTemplate = useMemo(() => {
    const { minWidth, maxWidth, maxPercent } = volunteerColumnConfig;
    const volunteerColumn = `minmax(${minWidth}, min(${maxWidth}, ${maxPercent}%))`;
    const dataColumns = `repeat(${columns.length - 1}, minmax(80px, 1fr))`;
    return `${volunteerColumn} ${dataColumns}`;
  }, [columns.length, volunteerColumnConfig]);
  
  return (
    <div 
      className="subgrid-table"
      style={{ 
        gridTemplateColumns: gridTemplate,
        maxHeight: props.maxHeight 
      }}
    >
      <SubgridHeader columns={columns} />
      <SubgridBody data={data} columns={columns} />
    </div>
  );
};
```

### Header and Body Components
```typescript
const SubgridHeader: React.FC<{ columns: Column[] }> = ({ columns }) => {
  return (
    <div className="subgrid-header sticky top-0 z-10">
      {columns.map((column, index) => (
        <div
          key={column.key}
          className={cn(
            "subgrid-header-cell",
            index === 0 && "frozen-cell"
          )}
        >
          {column.header}
        </div>
      ))}
    </div>
  );
};

const SubgridBody: React.FC<{ data: any[]; columns: Column[] }> = ({ data, columns }) => {
  return (
    <>
      {data.map((row, rowIndex) => (
        <SubgridRow key={rowIndex} row={row} columns={columns} />
      ))}
    </>
  );
};

const SubgridRow: React.FC<{ row: any; columns: Column[] }> = ({ row, columns }) => {
  return (
    <div className="subgrid-row">
      {columns.map((column, colIndex) => (
        <div
          key={column.key}
          className={cn(
            "subgrid-cell",
            colIndex === 0 && "frozen-cell"
          )}
        >
          {column.accessor(row)}
        </div>
      ))}
    </div>
  );
};
```

### Frozen Column Implementation
```css
.frozen-cell {
  position: sticky;
  left: 0;
  background: hsl(var(--card));
  z-index: 5;
  border-right: 2px solid hsl(var(--border));
}

.subgrid-header .frozen-cell {
  z-index: 15; /* Higher than body frozen cells */
  background: hsl(var(--muted));
}

/* Enhanced shadow for frozen columns */
.frozen-cell::after {
  content: '';
  position: absolute;
  top: 0;
  right: -8px;
  width: 8px;
  height: 100%;
  background: linear-gradient(90deg, 
    rgba(0,0,0,0.1) 0%, 
    transparent 100%
  );
  pointer-events: none;
}
```

## File Changes Required

### 1. data-table.tsx - Subgrid Implementation
```typescript
// Check for subgrid support and provide fallback
const supportsSubgrid = CSS.supports('grid-template-columns', 'subgrid');

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ useSubgrid = true, ...props }, ref) => {
    if (useSubgrid && supportsSubgrid) {
      return <SubgridDataTable ref={ref} {...props} />;
    }
    
    // Fallback to regular table or grid
    return <FallbackDataTable ref={ref} {...props} />;
  }
);

// Subgrid-specific components
export const SubgridDataTable = React.forwardRef<HTMLDivElement, SubgridDataTableProps>(
  ({ columns, data, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    return (
      <div 
        ref={containerRef}
        className={cn("subgrid-table-container", className)}
      >
        <SubgridTable columns={columns} data={data} {...props} />
      </div>
    );
  }
);
```

### 2. Module Integration
```typescript
// Assignments table with subgrid
export function AssignmentsTable({ ... }) {
  const columns = useMemo(() => [
    {
      key: 'volunteer',
      header: 'Volunteer',
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.volunteer.first_name} {row.volunteer.last_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.volunteer.email}
          </span>
        </div>
      ),
    },
    ...visibleTimeSlots.map(slot => ({
      key: slot.id.toString(),
      header: slot.slot_name,
      accessor: (row) => renderAssignmentCell(row, slot.id),
    }))
  ], [visibleTimeSlots]);
  
  return (
    <SubgridDataTable
      columns={columns}
      data={filteredAssignments}
      maxHeight="calc(100vh - 300px)"
      frozenColumns={[0]}
      volunteerColumnConfig={{
        minWidth: '150px',
        maxWidth: '250px',
        maxPercent: 25
      }}
    />
  );
}
```

### 3. Responsive Subgrid Adjustments
```css
/* Mobile-first responsive subgrid */
.subgrid-table {
  grid-template-columns: 
    minmax(120px, min(200px, 30%))
    repeat(auto-fit, minmax(60px, 1fr));
}

@media (min-width: 768px) {
  .subgrid-table {
    grid-template-columns: 
      minmax(150px, min(250px, 25%))
      repeat(auto-fit, minmax(80px, 1fr));
  }
}

@media (min-width: 1024px) {
  .subgrid-table {
    grid-template-columns: 
      minmax(180px, min(300px, 22%))
      repeat(auto-fit, minmax(100px, 1fr));
  }
}
```

## Advantages
- **Perfect alignment**: Subgrid ensures all rows align perfectly
- **Content-aware sizing**: Volunteer column sizes to content naturally
- **Modern CSS**: Leverages cutting-edge CSS Grid features
- **Flexible layout**: Easy to adjust column behavior per use case
- **Performance**: Browser-native layout calculations
- **Semantic flexibility**: Can use divs or maintain table semantics

## Potential Challenges
- **Limited browser support**: Subgrid only available in recent browsers
- **Complexity**: Subgrid concepts are advanced CSS
- **Fallback requirements**: Need comprehensive fallback strategy
- **Debugging difficulty**: Grid inspector tools still evolving
- **Learning curve**: Team needs deep CSS Grid knowledge

## Browser Support Strategy
```typescript
// Progressive enhancement with feature detection
const BrowserCompatibleDataTable: React.FC<DataTableProps> = (props) => {
  const [supportsSubgrid, setSupportsSubgrid] = useState(false);
  
  useEffect(() => {
    setSupportsSubgrid(CSS.supports('grid-template-columns', 'subgrid'));
  }, []);
  
  if (supportsSubgrid) {
    return <SubgridDataTable {...props} />;
  }
  
  // Fallback to CSS Grid without subgrid
  return <StandardGridDataTable {...props} />;
};
```

## Success Metrics
- Volunteer column 20-25% of available width
- Perfect column alignment across all rows
- Zero layout shifts during data updates
- Smooth responsive behavior
- Consistent frozen column behavior

## Browser Support Timeline
- **Safari 16+ (2022)**: Full support
- **Firefox 115+ (2023)**: Full support  
- **Chrome 117+ (2023)**: Full support
- **Edge 117+ (2023)**: Full support

## Implementation Priority
**Low-Medium** - Excellent technical solution for modern browsers, but limited support makes it better suited for forward-looking implementations or internal tools with controlled browser requirements.