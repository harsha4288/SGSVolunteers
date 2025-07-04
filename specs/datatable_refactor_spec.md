# DataTable Component Refactoring Specification

## OBJECTIVE
Create a truly reusable DataTable component that works seamlessly across Assignments, T-shirts, and Requirements modules while solving the frozen column + flexible width challenge.

## CURRENT PROBLEM ANALYSIS
- **Assignments Module**: Volunteer column takes ~40% mobile width despite removing fixed widths
- **T-shirts Module**: Better natural sizing due to fewer columns (7 vs 20+)
- **Requirements Module**: Works with explicit columnWidths but lacks flexibility
- **Root Issue**: Frozen column sticky positioning conflicts with table-auto layout

## REQUIREMENTS

### Core Functionality
1. **Flexible width based on content** - No fixed widths, columns size naturally
2. **Frozen column support** - First column stays sticky during horizontal scroll
3. **Responsive design** - Works on mobile and desktop
4. **Full content visibility** - No text truncation
5. **Consistent behavior** - Same component works across all modules

### Technical Constraints
- Must work with React + TypeScript
- Uses Tailwind CSS (core utilities only)
- Integrates with existing shadcn/ui components
- No external dependencies beyond current stack

### Module-Specific Requirements

#### Assignments Module
- Volunteer column (frozen): Natural width based on name length
- Time slot columns: Compact headers, minimal width
- Handle 5-20+ dynamic columns
- Priority: Volunteer names fully visible

#### T-shirts Module  
- Volunteer column (frozen): Natural width based on name length
- Size columns (XS-3XL): Equal width distribution
- Handle 7 predictable columns
- Priority: Balanced layout

#### Requirements Module
- Volunteer column (frozen): Natural width based on name length  
- Requirement columns: Flexible based on requirement text length
- Handle 2-5 requirement columns
- Priority: Requirement text fully readable

## SOLUTION APPROACH

### Component Architecture
1. **Single DataTable component** with intelligent sizing logic
2. **Automatic column detection** - determines optimal sizing strategy
3. **Adaptive frozen column handling** - works with or without explicit widths
4. **Content-aware responsiveness** - adjusts based on content and viewport

### Key Innovations Needed
1. **Smart sizing algorithm** that balances:
   - Content length requirements
   - Available screen space
   - Column count implications
   - Mobile vs desktop differences

2. **Enhanced frozen column logic** that:
   - Works with table-auto layout
   - Maintains sticky positioning
   - Calculates proper left offsets dynamically
   - Handles edge cases gracefully

3. **Responsive strategy** that:
   - Prioritizes essential content visibility
   - Adapts to different column counts
   - Maintains usability across devices

## SUCCESS CRITERIA

### Functional Requirements
- [ ] Volunteer column uses natural width (no more 40% issue)
- [ ] All content visible without truncation
- [ ] Frozen column works on all modules
- [ ] Responsive behavior consistent
- [ ] Table uses full available width

### Technical Requirements
- [ ] Single reusable component
- [ ] Clean, maintainable code
- [ ] Proper TypeScript types
- [ ] Performance optimized
- [ ] No breaking changes to existing data

### User Experience
- [ ] Intuitive scrolling behavior
- [ ] Fast loading and rendering
- [ ] Consistent visual design
- [ ] Accessible interactions

## DELIVERABLES

1. **Refactored DataTable component** (`src/components/ui/data-table.tsx`)
2. **Updated module implementations**:
   - `src/app/app/assignments/components/assignments-table.tsx`
   - `src/app/app/tshirts/components/unified-tshirt-table.tsx`
   - `src/app/app/requirements/components/requirements-table.tsx`
3. **Type definitions** and interfaces
4. **Documentation** with usage examples
5. **Migration guide** for any breaking changes
6. **Test suite** with component and integration tests
7. **Demo pages** for each solution variant
8. **Validation script** to test all solutions automatically

## CONSTRAINTS AND CONSIDERATIONS

### Performance
- Handle large datasets (100+ rows)
- Smooth scrolling on mobile
- Minimal re-renders

### Accessibility
- Proper ARIA labels
- Keyboard navigation
- Screen reader support

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Maintenance
- Clear separation of concerns
- Testable component structure
- Easy to extend for future modules

## CONTEXT FILES TO ANALYZE

Examine these files to understand current implementation:
- `src/components/ui/data-table.tsx` - Main component
- `src/app/app/assignments/components/assignments-table.tsx` - Assignments usage
- `src/app/app/tshirts/components/unified-tshirt-table.tsx` - T-shirts usage
- `src/app/app/requirements/components/requirements-table.tsx` - Requirements usage

## EXPECTED OUTCOME

A single, elegant DataTable component that:
- Automatically adapts to different content types and column counts
- Provides consistent, intuitive user experience across all modules
- Maintains all existing functionality while solving the width distribution issues
- Serves as a foundation for future table needs in the application

## TESTING REQUIREMENTS

Each solution must include:
1. **Standalone demo page** (`/test-solution-X`) showing all three table variants
2. **Jest/Vitest unit tests** for component logic
3. **Cypress/Playwright integration tests** for user interactions
4. **Performance benchmarks** (render time, memory usage)
5. **Mobile responsive validation** (multiple viewport sizes)
6. **Accessibility audit results** (axe-core compliance)

## VALIDATION CRITERIA

### Visual Testing
- [ ] Volunteer column uses natural width (measure actual px)
- [ ] No text truncation in any column
- [ ] Frozen column sticky behavior works
- [ ] Responsive breakpoints function correctly
- [ ] Consistent styling across modules

### Functional Testing  
- [ ] Sorting works on all columns
- [ ] Filtering maintains column widths
- [ ] Horizontal scrolling smooth
- [ ] Touch gestures work on mobile
- [ ] Keyboard navigation accessible

### Performance Testing
- [ ] Initial render < 100ms
- [ ] Scroll performance > 60fps
- [ ] Memory usage stable
- [ ] Bundle size impact < 5kb