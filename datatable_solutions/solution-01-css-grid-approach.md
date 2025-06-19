# Solution 1: CSS Grid Approach

## Overview
Replace table-auto with CSS Grid layout to achieve flexible column sizing with frozen column support.

## Key Innovation
Use CSS Grid container with `grid-template-columns` that dynamically adjusts based on content while maintaining sticky positioning for frozen columns.

## Technical Implementation

### Core Changes
1. **Replace table with div grid structure**
   - `display: grid` on container
   - `grid-template-columns: minmax(min-content, max-content) repeat(auto-fit, minmax(80px, 1fr))`
   - First column uses content-based sizing
   - Remaining columns distribute evenly

2. **Enhanced Frozen Column Logic**
   ```typescript
   const gridTemplateColumns = React.useMemo(() => {
     const firstCol = "minmax(min-content, max-content)";
     const otherCols = `repeat(${visibleColumns.length}, minmax(80px, 1fr))`;
     return `${firstCol} ${otherCols}`;
   }, [visibleColumns]);
   ```

3. **Sticky Positioning Strategy**
   - Use `position: sticky` with `left: 0` for first column
   - No complex width calculations needed
   - Browser handles grid layout naturally

### Responsive Strategy
- Grid automatically adapts to content
- Mobile: Reduce column min-width to 60px
- Desktop: Allow natural expansion up to max-content

## File Changes Required

### 1. data-table.tsx
- Replace `<table>` with grid container
- Update cell components to use `<div>`
- Add grid-specific styling classes
- Maintain existing prop interface

### 2. Module Tables
- No breaking changes to props
- Automatic benefit from new layout system
- Remove any existing width workarounds

## Advantages
- **Natural content sizing**: No more 40% volunteer column issue
- **Simplified sticky logic**: No width calculations needed
- **Better mobile response**: Grid adapts more fluidly than table
- **Consistent behavior**: Same logic works across all modules

## Potential Challenges
- **Screen reader compatibility**: Need proper ARIA roles
- **Print styling**: May need table fallback for printing
- **Browser support**: IE11 not supported (acceptable for modern apps)

## Success Metrics
- Volunteer column width matches content (15-25% on mobile)
- All text visible without truncation
- Smooth horizontal scrolling
- Consistent frozen column behavior

## Implementation Priority
**High** - Addresses core issue with clean, modern approach that works across all browsers and devices.