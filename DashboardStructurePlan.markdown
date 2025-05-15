# Dashboard Structure Plan for SGSVolunteers

## Objective
Replace the clunky multi-screen UI with a single, role-based dashboard for volunteers, team leaders, and admins, streamlining task assignment and check-in processes.

## Layout
- **Header**: Displays the app title ("SGSVolunteers Dashboard") and user info (e.g., display name from `profiles`).
- **Main Content**: A responsive grid or flex container that switches between:
  - **VolunteerView**: List of tasks (`seva_categories.category_name`) and time slots (`time_slots.slot_name`) with action buttons.
  - **TeamLeaderView**: Table of team members (`volunteers`), their tasks, and attendance checkboxes.
  - **AdminView**: Filterable table of all volunteers, tasks, and reassignment controls.
- **Sidebar**: Reuses existing navigation component for consistency.

## Component Structure
- **DashboardLayout**: Manages layout and role-based rendering (fetches role from `profile_roles`).
- **VolunteerView**: Displays task list with confirm/view buttons.
- **TeamLeaderView**: Shows team assignments and attendance controls.
- **AdminView**: Includes filters and task reassignment UI.
- **Shared Components**:
  - `TaskList`: Reusable list for tasks, configurable for different views.
  - `FilterControls`: Reusable component for search and filtering data.
  - `DataTable`: Generic table component with pagination, sorting, and filtering.
  - `EventSelector`: Dropdown for selecting events.
  - `CheckInToggle`: Reusable component for toggling check-in status.
  - `StatsCards`: Reusable component for displaying dashboard statistics.
  - `LazyLoadedList`: Component for lazy loading data with pagination and infinite scroll.

## Notes
- Reuse components from `/src/components` to avoid redundancy.
- Design components to be reusable in other projects (e.g., generic `TaskList`).
- Keep files under 500 lines, splitting logic if needed.
- Use Tailwind CSS and Radix UI for styling and accessibility.