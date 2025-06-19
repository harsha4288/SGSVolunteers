# Requirements Module: Full Functionality Overview

## Purpose

The Requirements module manages volunteer requirements for each seva category and time slot, supporting both generic and location-specific breakdowns. It enables admins and coordinators to set, edit, and track requirements, and provides a grid-based UI for overview and editing.

## Key Features

- **Requirements Management**: Set required volunteer counts for each seva category and time slot, with optional breakdown by location.
- **Location Breakdown**: Supports both generic (total) and per-location requirements, enforcing that the sum of location requirements does not exceed the generic total.
- **Role-Based Access**:
  - **Admin/Coordinator**: Can edit all requirements, including location breakdowns and notes.
  - **Volunteer**: Read-only access to view requirements.
- **Grid UI**: Matrix of seva categories (rows) vs. time slots (columns), with each cell showing required, assigned, and attended counts.
- **Inline & Modal Editing**: Edit requirements directly in the grid or via modal dialogs, with validation and notes support.
- **Statistics**: Shows variance (assigned - required), fulfillment rate, and attendance rate per cell/location.
- **Data Consistency**: Enforces business rules and validates input before saving.

## Data Model

- **Requirement**: Links seva category, time slot, and location (optional), with required count and notes.
- **RequirementWithDetails**: Enhanced with assigned/attended counts and references to related entities.

## Main Components & Hooks

- `EnhancedRequirementsGrid`: Renders the requirements matrix and handles cell selection/editing.
- `EnhancedRequirementEditModal`: Modal for editing requirements with location breakdown.
- `useRequirementsData` / `useUnifiedRequirements`: Hooks for fetching, filtering, and updating requirements.
- `createUnifiedRequirementsService`: Service for CRUD operations and data fetching.

## UI/UX Details

- **Grid**: Rows = seva categories, columns = time slots. Each cell shows required, assigned, attended, and variance.
- **Editing**: Admins/coordinators can edit requirements inline or via modal, with validation for location breakdown.
- **Notes**: Optional notes per requirement/location.
- **Loading/Error States**: Skeletons and alerts for loading and error handling.
- **Accessibility**: Keyboard navigation and ARIA attributes considered.

## Business Rules

- Sum of location requirements ≤ generic requirement for that seva/time slot.
- Only admins/coordinators can edit requirements.
- Changes trigger data refresh and validation.

## Extensibility

- Designed for additional breakdowns (e.g., by skill) and integration with assignments/attendance.
- Hooks and services are reusable and testable.

---

_For implementation notes and test data, see `requirements-test-data-population.md`_
