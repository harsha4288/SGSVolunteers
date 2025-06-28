# T-Shirts Module: Full Functionality Overview

## Purpose

The T-Shirts module manages volunteer T-shirt preferences, inventory, and issuance for events. It supports both admin and volunteer workflows, including allocation limits, inventory management, and QR code-based operations.

## Key Features

- **Preference Management**: Volunteers can select preferred T-shirt sizes and quantities, subject to allocation limits.
- **Issuance Management**: Admins can issue T-shirts, override allocation limits, and undo issuances. All actions update inventory in real time.
- **Inventory Management**: Admins can add, update, and remove T-shirt sizes, manage stock levels, and view inventory statistics.
- **Role-Based Access**:
  - **Admin**: Full access to all volunteers, inventory, and issuance operations. Can override allocation limits and perform bulk actions.
  - **Volunteer**: Can set preferences for themselves and family members, view allocation, and see issued T-shirts.
- **QR Code Integration**: Generate and scan QR codes for volunteers to streamline issuance and check-in.
- **Search & Filtering**: Admins can search volunteers by name, email, or phone. Filtering by size, status, and role is supported.
- **Responsive UI**: Table layout adapts for mobile and desktop, with touch-friendly controls and horizontal scrolling.
- **Data Consistency**: Ensures allocation, inventory, and issuance records are synchronized and validated.

## Data Model

- **Volunteer**: Includes T-shirt preferences, allocation, and issuance records.
- **TShirtSize/Inventory**: Tracks available sizes, quantities, and stock levels.
- **Issuance/Preference**: Records for each volunteer, size, and status (preferred/issued).

## Main Components & Hooks

- `UnifiedTShirtTable`: Renders the T-shirt management table, with controls for preferences and issuance.
- `TShirtTable`: Main entry point, determines volunteers to display and passes data to the unified table.
- `useUnifiedTShirtData`: Hook for fetching, updating, and validating T-shirt data, including allocation and inventory.
- `createUnifiedTShirtService`: Service for all CRUD operations and business logic.

## UI/UX Details

- **Table**: Rows = volunteers, columns = sizes. Each cell shows preference/issuance count and controls (add/remove/set quantity).
- **Inventory Badges**: Show current stock for each size (admin only).
- **Dialogs**: Admin override confirmation for allocation limits, error toasts for validation failures.
- **Loading/Error States**: Skeletons and alerts for loading and error handling.
- **Accessibility**: Keyboard navigation, ARIA attributes, and color contrast considered.

## Business Rules

- Allocation limits enforced for volunteers; admins can override.
- Inventory cannot go negative; issuance fails if insufficient stock.
- Preferences and issuances are mutually exclusive per volunteer/size.
- Undo/return operations update inventory and records.
- QR code operations validate volunteer and status.

## Extensibility

- Designed for multi-event support, family member management, and future inventory features.
- Hooks and services are reusable and testable.

---
