# Regressions Log & Lessons Learned

This document logs notable regressions, their causes, fixes, and key lessons learned to prevent future occurrences.

## 1. Loss of Responsive Design in Volunteer Requirements Module (Date: 2025-06-15)

*   **Issue:**
    The Volunteer Requirements module (`src/app/app/requirements/`) lost its responsive design capabilities for mobile/narrow screens. The matrix grid extended beyond the screen width, causing horizontal scrolling for the entire page, and degrading user experience compared to the functional Volunteer Assignments module.

*   **Root Cause Analysis:**
    *   The `EnhancedRequirementsGrid` component used a `DataTable` with fixed-width columns (e.g., `120px` per timeslot).
    *   With a moderate to large number of timeslots displayed, the cumulative width of these fixed columns significantly exceeded mobile viewport widths.
    *   While the `DataTable` provided internal horizontal scrolling, the overall component became too wide, leading to the main page scroll.

*   **Fix Implemented:**
    *   Modified `src/app/app/requirements/components/enhanced-requirements-grid.tsx`.
    *   Reduced the fixed width of timeslot columns from `120px` to `90px` (both in the `columnWidths` prop of `DataTable` and the `widthClass` of `DataTableCol`).
    *   This change ensures the grid is more compact, and its internal scrolling feature handles overflow without breaking the main page layout, similar to the Volunteer Assignments module.

*   **Lessons Learned:**
    1.  **Fixed Widths in Dynamic Tables:** When using fixed column widths in tables where the number of columns can vary (e.g., timeslots, dynamic categories), carefully consider the impact on narrower viewports.
    2.  **Test with Realistic Data:** Always test components with a realistic range of data inputs (e.g., few columns vs. many columns) across all target screen sizes.
    3.  **Component vs. Page Scroll:** Ensure that internal scrolling mechanisms within components (like `DataTable`) are effective and do not translate to full-page scrolling. Parent containers should manage overflow appropriately (e.g., using `overflow-hidden` if a child is expected to self-scroll, or `overflow-auto` if the parent itself should scroll).
    4.  **CSS Specificity & Overrides:** Be mindful of how CSS width declarations (`w-[]` utilities, inline styles, component props) interact and potentially override each other.
    5.  **AI-Assisted Development & Responsiveness:** If leveraging AI for code generation or modification, it is crucial to thoroughly test the outputs for responsiveness across all standard breakpoints. AI-generated code is not exempt from responsive design requirements. Refer to `/specs/responsive-design-guidelines.md`.
    6.  **Regular Regression Testing:** Implement regular checks, ideally automated, for responsive layouts to catch such issues early.

*   **Documentation Updated:**
    *   `/specs/responsive-design-guidelines.md` (updated with a case study of this regression).
    *   `AI_CONTEXT.md` (updated to emphasize responsiveness and link to guidelines).
