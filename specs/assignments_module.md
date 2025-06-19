# Assignments Module: Full Functionality Overview

## Purpose

The Assignments module manages the assignment of volunteers to tasks (seva categories) across time slots for an event. It supports role-based access (admin, team lead, volunteer), attendance tracking, and responsive UI for both desktop and mobile.

## Key Features

- **Assignment Management**: Assign volunteers to tasks and time slots, update or remove assignments, and prevent duplicates.
- **Attendance Tracking**: Mark attendance (checked in/absent), undo attendance, and display status with icons (check, X, clock).
- **Role-Based Access**:
  - **Admin**: Full access to all assignments, can assign any volunteer, modify/remove assignments, and access all time slots.
  - **Team Lead**: Access limited to their team, can manage assignments and attendance for their team only.
  - **Volunteer**: Read-only view of their own assignments and attendance, including family members if applicable.
- **Search & Filtering**: Filter assignments by seva category, time slot, and search by volunteer name/email. Supports combined filters.
- **Responsive UI**: Table layout adapts for mobile and desktop, with sticky columns and container queries for usability.
- **Data Consistency**: Ensures referential integrity, prevents double-booking, and supports real-time updates.

## Data Model

- **Assignment**: Links volunteer, seva category, time slot, and includes status (checked_in/absent/pending).
- **Attendance**: Stored in a separate table, linked to assignments, with timestamps and status.

## Main Components & Hooks

- `AssignmentsTable`: Renders the assignment grid, handles role-based controls, and attendance actions.
- `AssignmentsDashboard`: Provides filters, search, and summary statistics.
- `useAssignments`: Custom hook for fetching, filtering, and managing assignment data.
- `assignVolunteerToTask`: Service function to create/update assignments.

## UI/UX Details

- **Table**: Rows = volunteers, columns = time slots. Each cell shows assignment status and controls (if permitted).
- **Icons**: Check (present), X (absent), clock (pending/future), minus (not assigned).
- **Loading/Error States**: Skeletons and alerts for loading and error handling.
- **Accessibility**: Keyboard navigation, ARIA attributes, and color contrast considered.

## Business Rules

- No duplicate assignments per volunteer/time slot.
- Cannot check in for future slots.
- Undo attendance only for past/today slots.
- Admin/team lead can override attendance; volunteers cannot.
- Assignment and attendance changes trigger data refresh.

## Extensibility

- Designed for multi-event support and family member visibility.
- Hooks and services are reusable and testable.

---
