# Solution 4: CSS Container Queries with Adaptive Layout

## Overview
Leverage modern CSS Container Queries to create truly responsive column layouts that adapt based on the table container's size rather than viewport size.

## Key Innovation
Use `@container` queries to dynamically adjust column layouts based on the actual table container dimensions, enabling precise control over column distribution.

## Technical Implementation

### Container Query Setup
```css
.data-table-container {
  container-type: inline-size;
  container-name: data-table;
}

/* Volunteer column sizing based on container width */
@container data-table (min-width: 400px) {
  .volunteer-column {
    width: clamp(120px, 20vw, 200px);
  }
}

@container data-table (min-width: 768px) {
  .volunteer-column {
    width: clamp(150px, 25vw, 250px);
  }
}

@container data-table (min-width: 1200px) {
  .volunteer-column {
    width: clamp(180px, 30vw, 300px);
  }
}
```

### Adaptive Column Distribution
```typescript
const AdaptiveDataTable = ({ children, columns, ...props }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Use ResizeObserver to track container size
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setContainerWidth(width);
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  // Generate CSS custom properties for column sizing
  const columnSizeStyles = useMemo(() => {
    const volunteerWidth = Math.min(containerWidth * 0.25, 250);
    const remainingWidth = containerWidth - volunteerWidth;
    const otherColumnWidth = remainingWidth / (columns.length - 1);
    
    return {
      '--volunteer-column-width': `${volunteerWidth}px`,
      '--other-column-width': `${otherColumnWidth}px`,
    };
  }, [containerWidth, columns.length]);
  
  return (
    <div 
      ref={containerRef}
      className="data-table-container"
      style={columnSizeStyles}
    >
      <table className="adaptive-table">
        {children}
      </table>
    </div>
  );
};
```

### Enhanced Table Structure
```css
.adaptive-table {
  width: 100%;
  table-layout: fixed;
}

.adaptive-table .volunteer-column {
  width: var(--volunteer-column-width);
}

.adaptive-table .other-column {
  width: var(--other-column-width);
}

.adaptive-table .frozen-column {
  position: sticky;
  left: 0;
  background: hsl(var(--card));
  z-index: 10;
}
```

## File Changes Required

### 1. data-table.tsx - Container Query Integration
```typescript
// Add container query support
const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ children, className, frozenColumns, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    
    // Container resize observer
    useResizeObserver(containerRef, setContainerSize);
    
    // Dynamic CSS custom properties
    const dynamicStyles = useContainerSizing(containerSize, frozenColumns);
    
    return (
      <div 
        ref={containerRef}
        className={cn("data-table-container", className)}
        style={dynamicStyles}
        {...props}
      >
        <table className="adaptive-table">
          {children}
        </table>
      </div>
    );
  }
);
```

### 2. New Hook: useContainerSizing
```typescript
export const useContainerSizing = (
  containerSize: { width: number; height: number },
  frozenColumns: number[]
) => {
  return useMemo(() => {
    const { width } = containerSize;
    if (width === 0) return {};
    
    // Calculate volunteer column width (20-25% of container)
    const volunteerWidth = Math.min(width * 0.25, 250);
    const remainingWidth = width - volunteerWidth;
    
    return {
      '--volunteer-column-width': `${volunteerWidth}px`,
      '--container-width': `${width}px`,
      '--remaining-width': `${remainingWidth}px`,
    };
  }, [containerSize, frozenColumns]);
};
```

### 3. CSS Container Query Definitions
```css
/* Add to global styles */
@supports (container-type: inline-size) {
  .data-table-container {
    container-type: inline-size;
    container-name: data-table;
    position: relative;
  }
  
  @container data-table (max-width: 600px) {
    .volunteer-column {
      width: clamp(100px, 30%, 150px) !important;
    }
  }
  
  @container data-table (min-width: 600px) and (max-width: 1000px) {
    .volunteer-column {
      width: clamp(120px, 25%, 200px) !important;
    }
  }
  
  @container data-table (min-width: 1000px) {
    .volunteer-column {
      width: clamp(150px, 20%, 250px) !important;
    }
  }
}
```

## Advantages
- **True responsive design**: Adapts to actual container size, not viewport
- **Precise control**: Container queries more accurate than media queries
- **Future-proof**: Uses cutting-edge CSS features
- **Semantic HTML**: Maintains proper table structure
- **Performance**: Browser-native responsive behavior

## Potential Challenges
- **Browser support**: Container queries are relatively new (2022+)
- **Fallback complexity**: Need graceful degradation for older browsers
- **Debugging difficulty**: New CSS feature with limited dev tools
- **Learning curve**: Team needs to understand container query concepts

## Browser Support Strategy
```typescript
// Feature detection and fallback
const supportsContainerQueries = CSS.supports('container-type', 'inline-size');

if (!supportsContainerQueries) {
  // Fallback to ResizeObserver + CSS custom properties
  return <LegacyDataTable {...props} />;
}

return <ContainerQueryDataTable {...props} />;
```

## Success Metrics
- Volunteer column 20-25% of container width
- Smooth transitions during container resize
- Zero layout shifts
- Consistent behavior across supported browsers

## Implementation Priority
**Medium-Low** - Cutting-edge approach that solves the problem elegantly, but browser support concerns limit immediate adoption.