# Iteration 1: Assessment and Dashboard Structure Planning

## Objective
Evaluate existing components and design the foundation for a single, role-based dashboard to streamline task assignment and check-in processes.

## Tasks

### 1. Review Existing Components

#### UI Components
- **Card Components**: `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`
  - Used for displaying grouped information
  - Already implemented in `/src/components/ui/card.tsx`
  - Can be reused for dashboard sections

- **Table Components**: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, etc.
  - Used for displaying tabular data
  - Already implemented in `/src/components/ui/table.tsx`
  - Enhanced with TanStack Table in `/src/app/app/volunteers/components/data-table.tsx`

- **Form Components**: `Input`, `Select`, `Checkbox`, `Button`, etc.
  - Used for user input and interaction
  - Already implemented in various files under `/src/components/ui/`

- **Navigation Components**: `Sidebar`, `SidebarContent`, `SidebarHeader`, etc.
  - Used for application navigation
  - Already implemented in `/src/components/ui/sidebar.tsx`

- **Data Display Components**: `DataTable`, `DataTableToolbar`, `DataTableFacetedFilter`, etc.
  - Used for advanced data display with filtering and sorting
  - Already implemented in `/src/app/app/volunteers/components/`

#### Data Fetching
- Server actions for data fetching in `/src/app/app/volunteer-assignments/actions.ts`
- Authentication and role checking in `/src/app/app/user-management/actions.ts`
- Supabase client creation in `/src/lib/supabase/`

### 2. Analyze Current UI Structure

#### Current Dashboard
- Located at `/src/app/app/dashboard/page.tsx`
- Client component that fetches data from Supabase
- Displays cards with event information and volunteer registrations
- Not role-specific

#### Volunteer Assignments
- Located at `/src/app/app/volunteer-assignments/page.tsx`
- Displays a table of volunteer commitments
- Allows admins to assign volunteers to tasks
- Separate from check-in functionality

#### Check-in System
- Located at `/src/app/app/check-in/page.tsx`
- Allows team leaders to mark attendance
- Uses checkboxes for check-in status
- Separate from assignment management

#### Layout Structure
- Root layout at `/src/app/layout.tsx`
- App layout at `/src/app/app/layout.tsx`
- Uses sidebar navigation with main content area

### 3. Design the Dashboard Layout

#### Proposed Structure
```
/src/app/app/dashboard/
  ├── page.tsx                  # Main dashboard page with role detection
  ├── components/               # Dashboard-specific components
  │   ├── role-based-dashboard.tsx    # Container for role-specific views
  │   ├── volunteer-view.tsx          # View for volunteers
  │   ├── team-lead-view.tsx          # View for team leads
  │   ├── admin-view.tsx              # View for admins
  │   ├── shared/                     # Shared components
  │   │   ├── task-list.tsx           # Reusable task list
  │   │   ├── filter-dropdown.tsx     # Reusable filter dropdown
  │   │   ├── attendance-tracker.tsx  # Attendance tracking component
  │   │   └── event-selector.tsx      # Event selection component
  │   └── cards/                      # Card components for different views
  │       ├── my-tasks-card.tsx       # Tasks card for volunteers
  │       ├── team-members-card.tsx   # Team members card for team leads
  │       └── system-status-card.tsx  # System status card for admins
  └── actions.ts                # Server actions for dashboard data
```

#### Layout Design
- **Header**: Reuse existing `SiteHeader` component
- **Sidebar**: Reuse existing sidebar navigation
- **Main Content**: Responsive grid layout with role-specific content
  - Use CSS Grid or Flexbox for responsive layout
  - Implement conditional rendering based on user role

### 4. Plan Role-Based Rendering

#### Role Detection
- Query `profile_roles` table to determine user's role
- Use the highest privilege role if multiple roles exist (Admin > Team Lead > Volunteer)
- Implement caching to avoid repeated database queries

#### Component Structure
- **RoleBasedDashboard**: Container component that:
  - Fetches user role from Supabase
  - Renders appropriate view based on role
  - Handles loading and error states

- **VolunteerView**: Component for volunteers that:
  - Displays assigned tasks and time slots
  - Shows attendance history
  - Provides buttons to confirm availability

- **TeamLeadView**: Component for team leads that:
  - Displays team members and their assignments
  - Provides interface for marking attendance
  - Shows team performance metrics

- **AdminView**: Component for admins that:
  - Provides comprehensive volunteer management
  - Allows task assignment and reassignment
  - Displays system-wide metrics and status

### 5. Define Component Interfaces

#### RoleBasedDashboard
```typescript
interface RoleBasedDashboardProps {
  userId: string;
  profileId: string;
}
```

#### VolunteerView
```typescript
interface VolunteerViewProps {
  volunteerId: string;
  profileId: string;
  currentEventId: number;
}
```

#### TeamLeadView
```typescript
interface TeamLeadViewProps {
  profileId: string;
  currentEventId: number;
  managedCategories?: number[]; // IDs of seva categories managed by this team lead
}
```

#### AdminView
```typescript
interface AdminViewProps {
  profileId: string;
  currentEventId: number;
}
```

#### TaskList
```typescript
interface TaskListProps {
  tasks: VolunteerCommitment[];
  viewMode: 'volunteer' | 'teamLead' | 'admin';
  onCheckIn?: (commitmentId: number, isCheckedIn: boolean) => Promise<void>;
  onAssign?: (volunteerId: string, timeSlotId: number, sevaCategoryId: number) => Promise<void>;
  onRemove?: (commitmentId: number) => Promise<void>;
}
```

### 6. Data Requirements

#### Volunteer View Data
- Volunteer's assigned tasks from `volunteer_commitments`
- Volunteer's attendance history from `volunteer_check_ins`
- Current event details from `events`

#### Team Lead View Data
- Team members from `volunteers` filtered by managed seva categories
- Task assignments from `volunteer_commitments`
- Attendance records from `volunteer_check_ins`

#### Admin View Data
- All volunteers from `volunteers`
- All task assignments from `volunteer_commitments`
- All attendance records from `volunteer_check_ins`
- System statistics (aggregated data)

## Next Steps

1. Create the basic folder structure for the dashboard components
2. Implement the `RoleBasedDashboard` component with role detection
3. Create skeleton implementations of the role-specific views
4. Test the role detection and view switching functionality
5. Proceed to Iteration 2 for full implementation of role-based rendering logic

## Technical Considerations

- Ensure all components follow the existing styling patterns
- Reuse existing components wherever possible
- Keep files under 500 lines by splitting complex logic
- Follow SOLID principles, especially Single Responsibility
- Ensure accessibility compliance for all new components
- Optimize database queries to minimize load times
