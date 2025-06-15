# Reusable Components & Hooks - VolunteerVerse

This document highlights key reusable UI components and custom hooks available in the VolunteerVerse project. AI assistants should prioritize using these existing building blocks to ensure consistency and speed up development.

## 1. Core UI Components (`src/components/ui/`)

The project utilizes Shadcn UI, and its components are located in `src/components/ui/`. These are highly reusable and form the base of the application's UI. Examples include:

*   **`Accordion.tsx`**
*   **`Alert.tsx`, `AlertDialog.tsx`**
*   **`Avatar.tsx`**
*   **`Badge.tsx`**
*   **`Button.tsx`** (various styles and sizes)
*   **`Calendar.tsx`**
*   **`Card.tsx`** (and its sub-components like `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`, `CardFooter`)
*   **`Checkbox.tsx`**
*   **`Command.tsx`** (for command palettes)
*   **`DataTable.tsx`** (and its sub-components like `DataTableHeader`, `DataTableRow`, `DataTableCell`, etc. Used extensively for tables)
*   **`Dialog.tsx`** (for modals)
*   **`DropdownMenu.tsx`**
*   **`Form.tsx`** (integrates with `react-hook-form`)
*   **`Input.tsx`**
*   **`Label.tsx`**
*   **`Popover.tsx`**
*   **`RadioGroup.tsx`**
*   **`Select.tsx`**
*   **`Skeleton.tsx`** (for loading states)
*   **`Switch.tsx`**
*   **`Table.tsx`** (basic HTML table wrappers, `DataTable.tsx` is more advanced)
*   **`Tabs.tsx`**
*   **`Textarea.tsx`**
*   **`Toast.tsx`, `Toaster.tsx`** (for notifications, used via `useToast` hook)
*   **`Tooltip.tsx`**

**Usage:**
Always import these from `@/components/ui/<component_name>`. Refer to the Shadcn UI documentation for props and usage examples if unsure.

## 2. Shared Custom Components (`src/components/shared/` or `src/components/layout/`)

These are custom components built for the VolunteerVerse application, intended for use across multiple modules.

*   **`src/components/layout/AdminNav.tsx`**: Navigation for admin sections.
*   **`src/components/layout/EventSelector.tsx`**: Component to select an event.
*   **`src/components/layout/MainNav.tsx`**: Main application navigation.
*   **`src/components/layout/SiteHeader.tsx`**: Header for the site.
*   **`src/components/layout/UserNav.tsx`**: User-specific navigation (profile, logout).
*   **`src/components/providers/DateOverrideProvider.tsx`**: Context provider for date overrides (useful for testing time-sensitive features).
*   **`src/components/providers/ThemeProvider.tsx`**: Manages light/dark themes.
*   **`src/components/shared/SevaCategoryIcon.tsx`**: Displays icons for seva categories.

## 3. Key Reusable Custom Hooks

### 3.1. Global Hooks (`src/hooks/`)
*   **`useToast()`**: (`src/hooks/use-toast.ts`)
    - **Purpose:** Provides a function to display toast notifications.
    - **Usage:** `const { toast } = useToast(); toast({ title: "Success", description: "Action completed." });`
*   **`useUserRole()`**: (`src/hooks/use-user-role.ts`)
    - **Purpose:** Fetches and provides the current user's roles (e.g., Admin, Team Lead, Volunteer).
    - **Key Return Values:** `roles`, `isAdmin`, `isTeamLead`, `isVolunteer`, `loading`.
*   **`useMobile()`**: (`src/hooks/use-mobile.tsx`)
    - **Purpose:** Detects if the application is being viewed on a mobile device.

### 3.2. Module-Specific Reusable Hooks (Examples)

While many hooks are specific to their module's `page.tsx`, some are designed for broader reuse within their module or encapsulate significant reusable logic. The pattern of using a primary hook to manage data and actions for a module's main view is common.

*   **`useUnifiedTShirtData()`** (`src/app/app/tshirts/hooks/use-unified-tshirt-data.ts`)
    - **Purpose:** Manages all T-shirt related data (preferences, issuances, inventory checks, allocations) for the T-shirt table. Handles interactions with `UnifiedTShirtService`.
    - **Key Features:** Fetches data, provides functions to add/remove preferences/issuances, handles saving states, validation (e.g., allocation limits), and interacts with toast notifications.
    - **When to Use:** Core logic for any UI displaying or interacting with T-shirt preferences and issuances.

*   **`useAssignments()`** (`src/app/app/assignments/hooks/use-assignments.ts`)
    - **Purpose:** Likely manages fetching and displaying volunteer assignments, handling filters, and interactions.
    - **Note:** The exact functionality would need to be confirmed by reading its implementation, but it follows the established pattern.

*   **`useRequirementsData()` / `useUnifiedRequirements()`** (`src/app/app/requirements/hooks/`)
    - **Purpose:** Manages fetching, displaying, and potentially editing volunteer requirements for tasks/seva categories and time slots.
    - **Note:** The "unified" version suggests a refactoring or more comprehensive approach similar to the T-shirt module.

## 4. General Guidance for AI Assistants

*   **Check for Existing Components/Hooks First:** Before creating new UI elements or logic, always check if a suitable reusable component or hook already exists in `src/components/ui/`, `src/components/shared/`, `src/hooks/`, or within the target module's `hooks/` directory.
*   **Follow Patterns:** When creating new module-specific hooks or services, follow the patterns established in modules like "tshirts" (separation of concerns, clear API, interaction with Supabase services).
*   **Props and Types:** Ensure any new reusable components or hooks have clear TypeScript props/argument types and return types. Document them with JSDoc.
*   **Extending vs. Creating:** If a reusable component almost fits the need, consider if it can be extended or composed before creating a new one from scratch. Discuss with a human developer if unsure.

By leveraging these reusable assets, development can be faster, more consistent, and less error-prone.
