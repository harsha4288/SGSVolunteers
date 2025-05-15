# Dashboard Structure Plan for SGSVolunteers

## Overview

This document outlines a comprehensive plan to refactor the SGSVolunteers UI into a single, role-based dashboard that streamlines task assignment and check-in processes. The current multi-screen approach will be replaced with a unified dashboard that adapts its content based on the user's role (Volunteer, Team Lead, or Admin).

## Current Architecture Analysis

### Existing Components
- **Layout**: App uses a sidebar navigation (`SidebarProvider`, `Sidebar`, etc.) with a main content area
- **UI Components**: Built with Radix UI primitives and styled with Tailwind CSS (shadcn/ui approach)
- **Data Tables**: Uses TanStack Table for data display with filtering, sorting, and pagination
- **Cards**: Used for displaying information in sections
- **Authentication**: Supabase Auth with role-based access control
- **Roles**: Admin, Team Lead, and Volunteer roles defined in the database

### Current Pain Points
- Multiple screens and tabs create a disjointed user experience
- Volunteer assignment interface is not user-friendly with large numbers of users
- Check-in process is separate from assignment management
- No unified view based on user roles

## Dashboard Structure

### Layout Components

1. **DashboardLayout**
   - Reuses existing `SidebarProvider` and `Sidebar` components
   - Contains logic to determine user role and render appropriate view
   - Maintains consistent header and navigation

2. **RoleBasedDashboard**
   - Container component that switches between role-specific views
   - Fetches user role from `profile_roles` table
   - Handles loading states and error messages

3. **Role-Specific Views**
   - **VolunteerView**: For users with Volunteer role
   - **TeamLeadView**: For users with Team Lead role
   - **AdminView**: For users with Admin role

### Shared Components

1. **TaskList**
   - Reusable component for displaying tasks
   - Configurable for different views and interaction levels
   - Uses existing `Table` components with role-specific actions

2. **FilterDropdown**
   - Reusable filter component for all views
   - Leverages existing `DataTableFacetedFilter` component
   - Allows filtering by event, time slot, seva category, etc.

3. **AttendanceTracker**
   - Component for check-in functionality
   - Uses `Checkbox` component for marking attendance
   - Displays different information based on user role

4. **EventSelector**
   - Dropdown to select current event
   - Affects all data displayed in the dashboard
   - Persists selection in localStorage

## Role-Based Views

### 1. Volunteer View

**Purpose**: Allow volunteers to see their assigned tasks and confirm availability.

**Components**:
- **MyTasksCard**: Displays tasks assigned to the current volunteer
  - Task name (`seva_categories.category_name`)
  - Time slot (`time_slots.slot_name`, `start_time`, `end_time`)
  - Status (Confirmed, Pending, Completed)
  - Action buttons (Confirm, View Details)
- **UpcomingEventsCard**: Shows upcoming events the volunteer is registered for
- **AttendanceHistoryCard**: Displays past attendance records

**Data Sources**:
- `volunteer_commitments` table filtered by current user's volunteer ID
- `volunteer_check_ins` table for attendance history

### 2. Team Lead View

**Purpose**: Enable team leads to manage their team members and track attendance.

**Components**:
- **TeamMembersTable**: Displays volunteers assigned to the team lead's seva categories
  - Volunteer name and contact info
  - Assigned tasks and time slots
  - Attendance status with check-in toggle
  - Quick action buttons (Message, Reassign)
- **TeamMetricsCard**: Shows attendance statistics for the team
- **TaskManagementPanel**: Interface for managing task assignments within the team

**Data Sources**:
- `volunteer_commitments` filtered by seva categories the team lead manages
- `volunteer_check_ins` for attendance data
- `seva_categories` for task categories

### 3. Admin View

**Purpose**: Provide comprehensive management of all volunteers, tasks, and assignments.

**Components**:
- **VolunteerManagementTable**: Complete volunteer database with filtering and search
  - All volunteer information
  - Task assignments
  - Attendance records
  - Action buttons (Assign, Edit, Remove)
- **AssignmentDashboard**: Interface for assigning volunteers to tasks
  - Drag-and-drop functionality
  - Bulk assignment options
  - Conflict detection
- **EventOverviewCard**: Statistics and metrics for the current event
- **SystemStatusCard**: System health and database status

**Data Sources**:
- All database tables with no filtering
- Aggregated statistics from multiple tables

## Implementation Plan

### Iteration 1: Assessment and Planning
- Review existing components and UI structure
- Document reusable components
- Design dashboard layout and role-based views

### Iteration 2: Role-Based Rendering Logic
- Implement `RoleBasedDashboard` component
- Create role detection logic using Supabase queries
- Set up skeleton for role-specific views

### Iteration 3: Volunteer View
- Implement `VolunteerView` component
- Create `MyTasksCard` and other volunteer-specific components
- Connect to Supabase data sources

### Iteration 4: Team Lead View
- Implement `TeamLeadView` component
- Create `TeamMembersTable` with attendance tracking
- Implement task management functionality

### Iteration 5: Admin View
- Implement `AdminView` component
- Create comprehensive management interfaces
- Implement advanced filtering and search

### Iteration 6: Data Integration
- Connect all views to appropriate data sources
- Implement real-time updates where needed
- Optimize database queries

### Iteration 7: Interactive Features
- Add action buttons and interactive elements
- Implement attendance tracking functionality
- Add confirmation dialogs and feedback mechanisms

### Iteration 8: Testing and Optimization
- Test all views with different user roles
- Optimize for performance and responsiveness
- Ensure accessibility compliance

## Technical Considerations

### State Management
- Use React Query for data fetching and caching
- Implement optimistic updates for better UX
- Use context for shared state across components

### Performance
- Implement pagination for large data sets
- Use virtualization for long lists
- Optimize database queries with proper indexing

### Accessibility
- Ensure all components meet WCAG standards
- Implement keyboard navigation
- Provide appropriate ARIA attributes

### Mobile Responsiveness
- Design all views to work on mobile devices
- Use responsive design patterns
- Test on various screen sizes

## Conclusion

This dashboard structure plan provides a comprehensive approach to refactoring the SGSVolunteers UI into a single, role-based dashboard. By implementing this plan, we will create a more intuitive and efficient user experience that streamlines task assignment and check-in processes while maintaining the existing functionality and data structure.
