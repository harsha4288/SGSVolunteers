# Solution 2: Dynamic Table Layout with Intelligent Width Detection

## Overview
Enhance existing table structure with dynamic width calculation that adapts based on content analysis and viewport constraints.

## Key Innovation
Pre-render content invisibly to measure natural widths, then apply calculated percentages that prevent the volunteer column width issue.

## Technical Implementation

### Core Algorithm
1. **Content Analysis Phase**
   ```typescript
   const analyzeContentWidths = () => {
     // Measure volunteer name lengths
     const maxVolunteerWidth = Math.max(...volunteers.map(v => 
       measureTextWidth(`${v.first_name} ${v.last_name}`)
     ));
     
     // Calculate optimal distribution
     const volunteerPercent = Math.min(maxVolunteerWidth / totalWidth * 100, 25);
     const otherColPercent = (100 - volunteerPercent) / otherColumns.length;
     
     return { volunteerPercent, otherColPercent };
   };
   ```

2. **Dynamic Style Generation**
   - Generate `<style>` tag with calculated widths
   - Use CSS custom properties for runtime updates
   - Maintain table-auto as fallback

3. **Responsive Breakpoints**
   - Mobile: Max 25% for volunteer column
   - Tablet: Max 30% for volunteer column  
   - Desktop: Natural sizing up to 35%

### Enhanced Frozen Column Logic

```typescript
const calculateStickyOffsets = (widthPercentages: number[]) => {
  let offset = 0;
  return frozenColumns.map(colIndex => {
    const currentOffset = offset;
    if (colIndex < widthPercentages.length) {
      offset += (widthPercentages[colIndex] / 100) * containerWidth;
    }
    return currentOffset;
  });
};
```

## File Changes Required

### 1. data-table.tsx
- Add content measurement utilities
- Implement dynamic style injection
- Update frozen column calculations
- Add responsive width logic

### 2. New Hook: useIntelligentColumnWidths
```typescript
export const useIntelligentColumnWidths = (
  data: any[],
  columns: Column[],
  containerRef: RefObject<HTMLElement>
) => {
  // Implementation details
  return { columnWidths, isCalculating };
};
```

### 3. Module Tables
- Replace hardcoded columnWidths with hook
- Remove width-related styling hacks

## Advantages
- **Maintains table semantics**: Screen readers work perfectly
- **Content-aware sizing**: Adapts to actual data
- **Gradual enhancement**: Falls back to table-auto if calculation fails
- **Print-friendly**: Standard table structure prints well

## Potential Challenges
- **Performance overhead**: Text measurement requires DOM operations
- **Flash of unstyled content**: Brief moment before widths calculated
- **Complex edge cases**: Very long names or many columns

## Success Metrics
- Volunteer column 15-25% on all screen sizes
- Zero text truncation across all modules
- < 100ms delay for width calculation
- Smooth transitions when data changes

## Implementation Priority
**Medium-High** - Balanced approach that solves the issue while maintaining existing table benefits.