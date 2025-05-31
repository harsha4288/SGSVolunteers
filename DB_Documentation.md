# Volunteer Management Application: Database Design & Authentication Plan

**Date:** May 11, 2025 (Updated: May 20, 2025)
**Version:** 1.3 (Includes Roles & Auditing, Default Role Assignment, Time Slot Description)

## 1. Introduction

This document outlines the database schema and authentication/authorization flow for the Volunteer Management application. The backend uses a Supabase PostgreSQL database. This information is intended for UI developers to understand data structures, relationships, and how user authentication integrates with the data model.

## 2. Authentication Flow

The application uses Supabase Authentication.

1.  **User Sign-Up/Login (App Interaction):**

    - Users interact with the app's frontend and use Supabase client libraries (e.g., `supabase.auth.signUp()`, `supabase.auth.signInWithPassword()`, OAuth providers) to create an account or log in.
    - Upon successful authentication, Supabase Auth creates an entry in its internal `auth.users` table (managed by Supabase) and returns an authenticated user object to the client. This object contains the user's `id (UUID)` from `auth.users` and their `email`.

2.  **Linking `public.profiles` to `auth.users` (App Backend/Function Logic):**

    - When a user signs up or logs in for the first time successfully:
      - The application (client-side or via a backend function/Supabase Edge Function) should take the `id (UUID)` and `email` of the authenticated user from Supabase Auth.
      - It then checks if a row exists in `public.profiles` where `email` matches the authenticated user's email.
        - **If a `public.profiles` row exists:** Update its `user_id` column with the `id (UUID)` from `auth.users`.
        - **If no `public.profiles` row exists (should be rare if data was imported):** Create a new row in `public.profiles`, populating `id` (new UUID), `user_id` (from `auth.users`), and `email`.
    - This step ensures that the `public.profiles` table, which represents the app user account, is directly linked to an authenticated Supabase user.

3.  **Data Access Post-Login:**
    - Once a user is logged in, the UI has access to their `auth.users.id` (often available as `supabase.auth.currentUser.id`).
    - The UI can then query `public.profiles` using this `auth.users.id` (via the `profiles.user_id` column) to fetch the app-specific `profiles.id (UUID)`.
    - With `profiles.id`, the UI can fetch associated `volunteers` records and subsequently their `volunteer_commitments`. It can also determine user roles by querying `profile_roles`.

## 3. Database Schema

All custom tables are in the `public` schema.

### 3.1. `public.events`

Stores details about distinct events.

| Column       | Type        | Constraints                      | Description                                      |
| ------------ | ----------- | -------------------------------- | ------------------------------------------------ |
| `id`         | BIGINT      | PK, Generated Always as Identity | Unique identifier for the event.                 |
| `event_name` | TEXT        | NOT NULL, UNIQUE                 | Name of the event (e.g., "Gita Mahayajna 2025"). |
| `start_date` | DATE        |                                  | Event start date.                                |
| `end_date`   | DATE        |                                  | Event end date.                                  |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW()                    | Timestamp of creation.                           |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW()                    | Timestamp of last update.                        |

_Comment: Stores event details._

### 3.2. `public.roles`

Defines user roles within the application.

| Column        | Type        | Constraints                      | Description                                    |
| ------------- | ----------- | -------------------------------- | ---------------------------------------------- |
| `id`          | BIGINT      | PK, Generated Always as Identity | Unique identifier for the role.                |
| `role_name`   | TEXT        | NOT NULL, UNIQUE                 | Name of the role (e.g., 'Admin', 'Team Lead'). |
| `description` | TEXT        |                                  | Optional description of the role.              |
| `created_at`  | TIMESTAMPTZ | DEFAULT NOW()                    | Timestamp of creation.                         |
| `updated_at`  | TIMESTAMPTZ | DEFAULT NOW()                    | Timestamp of last update.                      |

_Comment: Defines user roles within the application. Seeded with 'Admin', 'Team Lead', 'Volunteer'._

**Default Role Assignments:**

- User datta.rajesh@gmail.com is assigned the Admin role
- User harshayarlagadda2@gmail.com is assigned the Team Lead role
- All users are automatically assigned the Volunteer role by default (via database trigger)

### 3.3. `public.profiles`

Represents app user accounts, linked to Supabase authentication.

| Column         | Type        | Constraints                                      | Description                                                                   |
| -------------- | ----------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `id`           | UUID        | PK, DEFAULT gen_random_uuid()                    | Unique identifier for the profile entry.                                      |
| `user_id`      | UUID        | UNIQUE, FK to `auth.users(id)` ON DELETE CASCADE | Links to Supabase `auth.users.id`. Can be `NULL` until user logs in/verified. |
| `email`        | TEXT        | NOT NULL, UNIQUE                                 | Login email for the app account.                                              |
| `display_name` | TEXT        |                                                  | Optional: Account holder's preferred display name.                            |
| `bio`          | TEXT        |                                                  | Optional: User's bio.                                                         |
| `created_at`   | TIMESTAMPTZ | DEFAULT NOW()                                    | Timestamp of creation.                                                        |
| `updated_at`   | TIMESTAMPTZ | DEFAULT NOW()                                    | Timestamp of last update.                                                     |

_Comment: Stores app user account information, linked to Supabase auth._
_Indexes: `idx_profiles_user_id_on_profiles(user_id)`, `idx_profiles_email_on_profiles(email)`._

### 3.4. `public.profile_roles`

Assigns roles to user profiles (junction table).

| Column        | Type        | Constraints                                             | Description                             |
| ------------- | ----------- | ------------------------------------------------------- | --------------------------------------- |
| `profile_id`  | UUID        | NOT NULL, FK to `public.profiles(id)` ON DELETE CASCADE | FK to the profile.                      |
| `role_id`     | BIGINT      | NOT NULL, FK to `public.roles(id)` ON DELETE CASCADE    | FK to the role.                         |
| `assigned_at` | TIMESTAMPTZ | DEFAULT NOW()                                           | Timestamp when the role was assigned.   |
| _Primary Key_ |             | (`profile_id`, `role_id`)                               | Ensures a profile has a role only once. |

_Comment: Assigns roles to user profiles._
_Indexes: `idx_profile_roles_profile_id(profile_id)`, `idx_profile_roles_role_id(role_id)`._

**Automatic Role Assignment:**
A database trigger (`trg_assign_default_volunteer_role`) automatically assigns the Volunteer role (ID: 3) to every new profile created in the system. This ensures that all users have at least the basic Volunteer role by default.

### 3.5. `public.volunteers`

Stores details of individual volunteers, typically from Google Form registrations.

| Column                             | Type        | Constraints                                    | Description                                                                     |
| ---------------------------------- | ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `id`                               | UUID        | PK, DEFAULT gen_random_uuid()                  | Unique ID for this volunteer person. **Used as FK in `volunteer_commitments`**. |
| `profile_id`                       | UUID        | FK to `public.profiles(id)` ON DELETE SET NULL | Links this volunteer to an app account (`profiles` table).                      |
| `email`                            | TEXT        | NOT NULL                                       | Email used in Google Form for this volunteer.                                   |
| `first_name`                       | TEXT        | NOT NULL                                       | Volunteer's first name.                                                         |
| `last_name`                        | TEXT        | NOT NULL                                       | Volunteer's last name.                                                          |
| `phone`                            | TEXT        |                                                | Phone number.                                                                   |
| `gender`                           | TEXT        |                                                | Gender.                                                                         |
| `gm_family`                        | BOOLEAN     |                                                | Part of Gita Mahayajna family?                                                  |
| `association_with_mahayajna`       | TEXT        |                                                | Association with the program.                                                   |
| `mahayajna_student_name`           | TEXT        |                                                | Student's name if applicable.                                                   |
| `student_batch`                    | TEXT        |                                                | Student's batch if applicable.                                                  |
| `hospitality_needed`               | BOOLEAN     |                                                | Hospitality needed?                                                             |
| `location`                         | TEXT        |                                                | Preferred location.                                                             |
| `other_location`                   | TEXT        |                                                | Other location preference.                                                      |
| `additional_info`                  | TEXT        |                                                | Additional information.                                                         |
| `google_form_submission_timestamp` | TIMESTAMPTZ |                                                | Timestamp from Google Form submission.                                          |
| `requested_tshirt_quantity`        | INTEGER     |                                                | Number of T-shirts requested/allocated per Google Form.                         |
| `tshirt_size_preference`           | TEXT        |                                                | Preferred T-shirt size for the volunteer (e.g., S, M, L, XL, XXL).              |
| `created_at`                       | TIMESTAMPTZ | DEFAULT NOW()                                  | Timestamp of creation.                                                          |
| `updated_at`                       | TIMESTAMPTZ | DEFAULT NOW()                                  | Timestamp of last update.                                                       |

_Constraint: `unique_volunteer_person UNIQUE (email, first_name, last_name)`._
_Comment: Stores details for each individual volunteer from Google Form._
_Indexes: `idx_volunteers_email_on_volunteers(email)`, `idx_volunteers_profile_id_on_volunteers(profile_id)`._

### 3.6. `public.time_slots`

Defines specific time slots for volunteer activities within an event.

| Column        | Type        | Constraints                                           | Description                                                                    |
| ------------- | ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id`          | BIGINT      | PK, Generated Always as Identity                      | Unique identifier for the time slot.                                           |
| `event_id`    | BIGINT      | NOT NULL, FK to `public.events(id)` ON DELETE CASCADE | Links to the event this time slot belongs to.                                  |
| `slot_name`   | TEXT        | NOT NULL, UNIQUE                                      | Short name used for assignments (e.g., "8th PM", "9th AM").                    |
| `start_time`  | TIMESTAMPTZ | NOT NULL                                              | Full start timestamp (UTC).                                                    |
| `end_time`    | TIMESTAMPTZ | NOT NULL                                              | Full end timestamp (UTC).                                                      |
| `description` | TEXT        |                                                       | Full descriptive name of the time slot (e.g., "8th July (Tuesday) - Evening"). |
| `created_at`  | TIMESTAMPTZ | DEFAULT NOW()                                         | Timestamp of creation.                                                         |
| `updated_at`  | TIMESTAMPTZ | DEFAULT NOW()                                         | Timestamp of last update.                                                      |

_Comment: Defines specific time slots for volunteer activities._
_Index: `idx_time_slots_slot_name(slot_name)`._

### 3.7. `public.seva_categories`

Defines categories of seva (service) or tasks.

| Column          | Type        | Constraints                      | Description                                       |
| --------------- | ----------- | -------------------------------- | ------------------------------------------------- |
| `id`            | BIGINT      | PK, Generated Always as Identity | Unique identifier for the seva category.          |
| `category_name` | TEXT        | NOT NULL, UNIQUE                 | Name of the seva category (e.g., "Registration"). |
| `description`   | TEXT        |                                  | Optional description of the category.             |
| `created_at`    | TIMESTAMPTZ | DEFAULT NOW()                    | Timestamp of creation.                            |
| `updated_at`    | TIMESTAMPTZ | DEFAULT NOW()                    | Timestamp of last update.                         |

_Comment: Defines categories of seva or tasks._
_Index: `idx_seva_categories_category_name(category_name)`._

### 3.8. `public.volunteer_commitments`

Links volunteers to time slots, indicating either promised availability or a specific task assignment.

| Column             | Type        | Constraints                                                                       | Description                                                                                    |
| ------------------ | ----------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`               | BIGINT      | PK, Generated Always as Identity                                                  | Unique identifier for the commitment.                                                          |
| `volunteer_id`     | UUID        | NOT NULL, FK to `public.volunteers(id)` ON DELETE CASCADE                         | Identifies the specific volunteer.                                                             |
| `time_slot_id`     | BIGINT      | NOT NULL, FK to `public.time_slots(id)` ON DELETE CASCADE                         | Identifies the time slot.                                                                      |
| `commitment_type`  | TEXT        | NOT NULL, CHECK (`commitment_type` IN ('PROMISED_AVAILABILITY', 'ASSIGNED_TASK')) | Type of commitment: 'PROMISED_AVAILABILITY' or 'ASSIGNED_TASK'.                                |
| `seva_category_id` | BIGINT      | FK to `public.seva_categories(id)` ON DELETE SET NULL                             | ID of the assigned task/seva category. `NULL` if `commitment_type` is 'PROMISED_AVAILABILITY'. |
| `task_notes`       | TEXT        |                                                                                   | Optional specific notes for an assignment.                                                     |
| `source_reference` | TEXT        |                                                                                   | Information about data origin (e.g., "Google Form: 9th AM", "Excel Assignment: All Days").     |
| `created_at`       | TIMESTAMPTZ | DEFAULT NOW()                                                                     | Timestamp of creation.                                                                         |
| `updated_at`       | TIMESTAMPTZ | DEFAULT NOW()                                                                     | Timestamp of last update.                                                                      |

_Constraint: `unique_volunteer_commitment_detail UNIQUE (volunteer_id, time_slot_id, commitment_type, seva_category_id)`._
_Comment: Links volunteers to time slots for availability or assigned tasks._
_Indexes: `idx_commitments_volunteer_id(volunteer_id)`, `idx_commitments_time_slot_id(time_slot_id)`, `idx_commitments_seva_category_id(seva_category_id)`._

### 3.9. `public.volunteer_check_ins`

Tracks actual volunteer check-in and check-out times for specific time slots within events.

| Column                   | Type        | Constraints                                               | Description                                                                                   |
| ------------------------ | ----------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `id`                     | BIGINT      | PK, Generated Always as Identity                          | Unique identifier for the check-in record.                                                    |
| `volunteer_id`           | UUID        | NOT NULL, FK to `public.volunteers(id)` ON DELETE CASCADE | FK to `public.volunteers.id`.                                                                 |
| `event_id`               | BIGINT      | NOT NULL, FK to `public.events(id)` ON DELETE CASCADE     | Links to the event for which the check-in occurred.                                           |
| `time_slot_id`           | BIGINT      | FK to `public.time_slots(id)` ON DELETE SET NULL          | Links to the specific time slot for which attendance is being recorded. NULL for event-level. |
| `recorded_by_profile_id` | UUID        | FK to `public.profiles(id)` ON DELETE SET NULL            | Profile ID of the user (Admin/Team Lead) who recorded the check-in/out.                       |
| `check_in_time`          | TIMESTAMPTZ | NOT NULL                                                  | Timestamp of when the volunteer checked in.                                                   |
| `check_out_time`         | TIMESTAMPTZ |                                                           | Timestamp when marked as absent. NULL means checked in and present.                           |
| `location`               | TEXT        |                                                           | Location or task description for the check-in.                                                |
| `created_at`             | TIMESTAMPTZ | DEFAULT NOW()                                             | Timestamp of creation.                                                                        |
| `updated_at`             | TIMESTAMPTZ | DEFAULT NOW()                                             | Timestamp of last update.                                                                     |

_Comment: Tracks actual volunteer check-in and check-out times for specific time slots within events._
_Indexes: `idx_volunteer_check_ins_volunteer_id(volunteer_id)`, `idx_volunteer_check_ins_event_id(event_id)`, `idx_volunteer_check_ins_time_slot_id(time_slot_id)`, `idx_volunteer_check_ins_volunteer_timeslot(volunteer_id, time_slot_id)`, `idx_volunteer_check_ins_recorded_by(recorded_by_profile_id)`._

**Important Note**: The addition of `time_slot_id` field resolves the issue where attendance taken for one time slot was incorrectly showing for all time slots. Each check-in record is now linked to a specific time slot, ensuring accurate attendance tracking.

**Recent Updates (2024)**:

- Added `time_slot_id` field to fix attendance tracking bug
- Updated indexes for better performance with time slot queries
- Cleaned up existing check-in records without time_slot_id to prevent data inconsistency
- Updated application code to save and retrieve attendance per specific time slot

### 3.10. `public.tshirt_sizes`

Standardizes T-shirt sizes available for events.

| Column       | Type        | Constraints                                           | Description                                    |
| ------------ | ----------- | ----------------------------------------------------- | ---------------------------------------------- |
| `id`         | BIGINT      | PK, Generated Always as Identity                      | Unique identifier for the T-shirt size.        |
| `event_id`   | BIGINT      | NOT NULL, FK to `public.events(id)` ON DELETE CASCADE | Links size to a specific event.                |
| `size_name`  | TEXT        | NOT NULL                                              | T-shirt size name (e.g., 'S', 'M', 'L', 'XL'). |
| `sort_order` | INTEGER     |                                                       | Order for displaying sizes.                    |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW()                                         | Timestamp of creation.                         |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW()                                         | Timestamp of last update.                      |

_Comment: Standardizes T-shirt sizes available for events._
_Indexes: `idx_tshirt_sizes_event_id(event_id)`._

### 3.11. `public.tshirt_inventory`

Tracks T-shirt inventory by size for events.

| Column             | Type        | Constraints                                           | Description                               |
| ------------------ | ----------- | ----------------------------------------------------- | ----------------------------------------- |
| `id`               | BIGINT      | PK, Generated Always as Identity                      | Unique identifier for the inventory item. |
| `event_id`         | BIGINT      | NOT NULL, FK to `public.events(id)` ON DELETE CASCADE | Links inventory to a specific event.      |
| `size`             | TEXT        | NOT NULL                                              | T-shirt size (e.g., 'S', 'M', 'L', 'XL'). |
| `quantity`         | INTEGER     | NOT NULL, CHECK (`quantity` >= 0)                     | Number of T-shirts of this size in stock. |
| `tshirt_size_id`   | BIGINT      | FK to `public.tshirt_sizes(id)` ON DELETE RESTRICT    | References the standardized T-shirt size. |
| `quantity_initial` | INTEGER     | NOT NULL, DEFAULT 0                                   | Initial quantity of T-shirts.             |
| `quantity_on_hand` | INTEGER     | NOT NULL, DEFAULT 0                                   | Current quantity of T-shirts available.   |
| `created_at`       | TIMESTAMPTZ | DEFAULT NOW()                                         | Timestamp of creation.                    |
| `updated_at`       | TIMESTAMPTZ | DEFAULT NOW()                                         | Timestamp of last update.                 |

_Comment: Tracks T-shirt inventory by size for events._
_Indexes: `idx_tshirt_inventory_event_id(event_id)`, `idx_tshirt_inventory_size(size)`._

### 3.12. `public.volunteer_qr_codes`

Stores QR codes generated for volunteers for T-shirt issuance.

| Column         | Type        | Constraints                                               | Description                                        |
| -------------- | ----------- | --------------------------------------------------------- | -------------------------------------------------- |
| `id`           | BIGINT      | PK, Generated Always as Identity                          | Unique identifier for the QR code.                 |
| `volunteer_id` | UUID        | NOT NULL, FK to `public.volunteers(id)` ON DELETE CASCADE | Links to the volunteer who generated the QR code.  |
| `event_id`     | BIGINT      | NOT NULL, FK to `public.events(id)` ON DELETE CASCADE     | Links to the event for which the QR code is valid. |
| `qr_code_data` | TEXT        | NOT NULL                                                  | The data encoded in the QR code.                   |
| `generated_at` | TIMESTAMPTZ | DEFAULT NOW()                                             | Timestamp of when the QR code was generated.       |
| `expires_at`   | TIMESTAMPTZ |                                                           | Timestamp of when the QR code expires.             |
| `is_used`      | BOOLEAN     | DEFAULT FALSE                                             | Whether the QR code has been used.                 |
| `created_at`   | TIMESTAMPTZ | DEFAULT NOW()                                             | Timestamp of creation.                             |
| `updated_at`   | TIMESTAMPTZ | DEFAULT NOW()                                             | Timestamp of last update.                          |

_Comment: Stores QR codes generated for volunteers for T-shirt issuance._
_Indexes: `idx_volunteer_qr_codes_volunteer_id(volunteer_id)`, `idx_volunteer_qr_codes_event_id(event_id)`._

### 3.13. `public.tshirt_issuances`

Tracks T-shirts issued to volunteers.

| Column                 | Type        | Constraints                                                      | Description                                                                              |
| ---------------------- | ----------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `id`                   | BIGINT      | PK, Generated Always as Identity                                 | Unique identifier for the issuance record.                                               |
| `volunteer_id`         | UUID        | NOT NULL, FK to `public.volunteers(id)` ON DELETE CASCADE        | Links to the individual volunteer who received the T-shirt.                              |
| `tshirt_inventory_id`  | BIGINT      | NOT NULL, FK to `public.tshirt_inventory(id)` ON DELETE RESTRICT | FK to `public.tshirt_inventory.id`, indicating which stock item was issued.              |
| `issued_by_profile_id` | UUID        | FK to `public.profiles(id)` ON DELETE SET NULL                   | Profile ID of the user (Admin/Team Lead) who recorded the T-shirt issuance.              |
| `issuance_date`        | TIMESTAMPTZ | DEFAULT NOW()                                                    | Timestamp of when the T-shirt was issued.                                                |
| `size`                 | TEXT        |                                                                  | Size of the T-shirt issued; potentially redundant if derived from `tshirt_inventory_id`. |
| `created_at`           | TIMESTAMPTZ | DEFAULT NOW()                                                    | Timestamp of creation.                                                                   |
| `updated_at`           | TIMESTAMPTZ | DEFAULT NOW()                                                    | Timestamp of last update.                                                                |

_Comment: Tracks T-shirts issued to volunteers._
_Indexes: `idx_tshirt_issuances_volunteer_id(volunteer_id)`, `idx_tshirt_issuances_tshirt_inventory_id(tshirt_inventory_id)`, `idx_tshirt_issuances_issued_by_profile_id(issued_by_profile_id)`._

3.x. public.requirements
Stores required volunteer counts per seva category and timeslot.
Note: Requirements are now global per seva category and timeslot. Location is informational only (in notes).
| Column | Type | Constraints | Description |
| ---------------- | ----------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| id | BIGINT | PK, Generated Always as Identity | Unique identifier for the requirement. |
| seva_category_id | BIGINT | NOT NULL, FK to public.seva_categories(id) | Seva category for which volunteers are required. |
| timeslot_id | BIGINT | NOT NULL, FK to public.time_slots(id) | Time slot for which volunteers are required. |
| required_count | INTEGER | NOT NULL, CHECK (required_count >= 0) | Total number of volunteers required for this seva category and timeslot. |
| notes | TEXT | | Optional: breakdown by location or other info (e.g., '2 at entrance, 8 at hall'). |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Timestamp of creation. |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Timestamp of last update. |
Constraint: UNIQUE (seva_category_id, timeslot_id) ensures only one requirement per seva category and timeslot.
Comment: Stores required volunteer counts per seva category and timeslot. Location is informational only (in notes).


## 4. Key UI Interaction Patterns

- **Displaying Volunteer's Own Schedule:**

  1.  User logs in (Supabase Auth). Get `auth.users.id`.
  2.  Query `public.profiles` WHERE `user_id = auth.users.id` to get `profiles.id`.
  3.  Query `public.volunteers` WHERE `profile_id = profiles.id` to list all volunteers managed by this app user.
  4.  For a selected `volunteers.id`, query `public.volunteer_commitments` (JOIN `time_slots`, `seva_categories`) to display their promised availability and assigned tasks.
      - Use `commitment_type` to differentiate.
      - Display `time_slots.description` (or `time_slots.slot_name` if description is null), `time_slots.start_time` (converted to local TZ), `time_slots.end_time` (converted to local TZ).
      - If `ASSIGNED_TASK`, display `seva_categories.category_name`.

- **Team Lead/Admin Actions:**

  - **Recording Check-ins:** UI allows user with 'Team Lead' or 'Admin' role to select a volunteer and record attendance for specific time slots in `volunteer_check_ins`. The system records `check_in_time` for present volunteers or both `check_in_time` and `check_out_time` for absent volunteers. The `recorded_by_profile_id` is set to the current user's `profiles.id` and `time_slot_id` links the attendance to the specific time slot.
  - **Issuing T-shirts:** UI allows user with 'Team Lead' or 'Admin' role to select a volunteer, select a T-shirt from `tshirt_inventory`, and record an issuance in `tshirt_issuances`. The `issued_by_profile_id` is set.
  - **Managing Roles:** UI (likely Admin only) to assign/revoke roles in `profile_roles`.

- **Admin Views (Illustrative - RLS dependent):**
  - Listing all volunteers, searching/filtering.
  - Viewing event schedules, assigning tasks (creating/updating `volunteer_commitments` with `commitment_type = 'ASSIGNED_TASK'`).
  - Managing T-shirt inventory and recording issuances.
  - Viewing check-in data.

## 5. Row Level Security (RLS)

All custom tables have RLS enabled. Policies must be implemented to ensure:

- Users can only access/modify their own `profiles` data (e.g., `auth.uid() = user_id`).
- Users can only access/modify `volunteers` data linked to their `profiles.id`.
- Users can only see/manage commitments, check-ins, T-shirt issuances related to their managed volunteers.
- 'Team Lead' role might have broader access to volunteers/commitments within their assigned seva categories (requires additional linking table like `team_lead_seva_assignments (profile_id, seva_category_id)` if this granularity is needed).
- 'Admin' role has broader access as required.

## 6. Role Management

### 6.1. Default Role Assignment

All users are automatically assigned the Volunteer role (ID: 3) when their profile is created. This is implemented through a database trigger (`trg_assign_default_volunteer_role`) that executes after a new profile is inserted.

### 6.2. Specific Role Assignments

The following specific role assignments are made in the database:

- User with email `datta.rajesh@gmail.com` is assigned the Admin role (ID: 1)
- User with email `harshayarlagadda2@gmail.com` is assigned the Team Lead role (ID: 2)

### 6.3. Role Hierarchy

The roles follow this general hierarchy of permissions:

1. **Admin** - Full system access
2. **Team Lead** - Can manage volunteers, check-ins, and T-shirt issuances for their assigned areas
3. **Volunteer** - Basic access to view their own schedule and information

## 7. T-Shirt Management

### 7.1. T-Shirt Tables

#### 7.1.1. `tshirt_inventory` (Consolidated Table)

This table stores the available T-shirt sizes and inventory for each event.

| Column           | Type        | Description                                                                   |
| ---------------- | ----------- | ----------------------------------------------------------------------------- |
| event_id         | BIGINT      | Reference to events table (PK part 1)                                         |
| size_cd          | VARCHAR(5)  | T-shirt size code (e.g., 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL') (PK part 2) |
| quantity         | INTEGER     | Current total quantity                                                        |
| quantity_on_hand | INTEGER     | Current on-hand quantity                                                      |
| sort_order       | INTEGER     | Order for display purposes (1=XS, 2=S, 3=M, 4=L, 5=XL, 6=2XL, 7=3XL)          |
| created_at       | TIMESTAMPTZ | Creation timestamp                                                            |
| updated_at       | TIMESTAMPTZ | Last update timestamp                                                         |

Primary Key: `(event_id, size_cd)`

**Important:** Always use `ORDER BY sort_order` when querying T-shirt sizes to ensure proper display order (XS, S, M, L, XL, 2XL, 3XL) instead of alphabetical order.

#### 7.1.2. `volunteer_tshirts` (Consolidated Table)

This unified table stores both T-shirt preferences and issuances using a status field.

| Column               | Type        | Description                                 |
| -------------------- | ----------- | ------------------------------------------- |
| id                   | UUID        | Primary key                                 |
| volunteer_id         | UUID        | Reference to volunteers table               |
| event_id             | BIGINT      | Reference to events table                   |
| size                 | VARCHAR(10) | T-shirt size code (e.g., '2XL', '3XL')      |
| status               | TEXT        | 'preferred', 'issued', or 'returned'        |
| quantity             | INTEGER     | Number of T-shirts                          |
| issued_by_profile_id | UUID        | Reference to profiles table (for issuances) |
| issued_at            | TIMESTAMPTZ | When the T-shirt was issued                 |
| created_at           | TIMESTAMPTZ | Creation timestamp                          |
| updated_at           | TIMESTAMPTZ | Last update timestamp                       |

Foreign Key: `(event_id, size)` references `tshirt_inventory(event_id, size_cd)`

#### 7.1.3. Backward Compatibility Views

The following views provide backward compatibility for code that still expects the old schema structure:

##### `tshirt_sizes` View

Maps to the `tshirt_inventory` table.

| Column     | Type       | Description                                   |
| ---------- | ---------- | --------------------------------------------- |
| id         | BIGINT     | Generated ID based on event_id and sort_order |
| event_id   | BIGINT     | Reference to events table                     |
| size_name  | VARCHAR(5) | Name of the size (e.g., '2XL', '3XL')         |
| sort_order | INTEGER    | Order for display purposes                    |

##### `volunteer_tshirt_preferences` View

Maps to the `volunteer_tshirts` table with status = 'preferred'.

| Column         | Type        | Description                        |
| -------------- | ----------- | ---------------------------------- |
| id             | UUID        | Primary key from volunteer_tshirts |
| volunteer_id   | UUID        | Reference to volunteers table      |
| event_id       | BIGINT      | Reference to events table          |
| tshirt_size_id | BIGINT      | NULL for backward compatibility    |
| size           | VARCHAR(10) | Size code (e.g., 'XS', 'S', 'M')   |
| quantity       | INTEGER     | Number of T-shirts                 |
| is_fulfilled   | BOOLEAN     | Always FALSE for compatibility     |
| created_at     | TIMESTAMPTZ | Creation timestamp                 |
| updated_at     | TIMESTAMPTZ | Last update timestamp              |

##### `tshirt_issuances` View

Maps to the `volunteer_tshirts` table with status = 'issued'.

| Column               | Type        | Description                        |
| -------------------- | ----------- | ---------------------------------- |
| id                   | UUID        | Primary key from volunteer_tshirts |
| volunteer_id         | UUID        | Reference to volunteers table      |
| event_id             | BIGINT      | Reference to events table          |
| tshirt_inventory_id  | BIGINT      | NULL for backward compatibility    |
| size                 | VARCHAR(10) | Size code (e.g., 'XS', 'S', 'M')   |
| quantity             | INTEGER     | Number of T-shirts                 |
| issued_by_profile_id | UUID        | Reference to profiles table        |
| issued_at            | TIMESTAMPTZ | When the T-shirt was issued        |
| created_at           | TIMESTAMPTZ | Creation timestamp                 |
| updated_at           | TIMESTAMPTZ | Last update timestamp              |

#### 7.1.4. Volunteer T-Shirt Fields

The `volunteers` table includes the following T-shirt related fields:

| Column                    | Type       | Description                                             |
| ------------------------- | ---------- | ------------------------------------------------------- |
| requested_tshirt_quantity | INTEGER    | Number of T-shirts the volunteer is eligible to receive |
| tshirt_size_preference    | VARCHAR(5) | Legacy field for single size preference                 |

### 7.2. T-Shirt Management Functions

The following database functions are available for T-shirt management:

#### 7.2.1. `add_tshirt_preference`

```sql
CREATE OR REPLACE FUNCTION public.add_tshirt_preference(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size_cd VARCHAR,
  p_quantity INTEGER DEFAULT 1
) RETURNS BOOLEAN
```

This function adds a T-shirt preference for a volunteer:

- Inserts a record into the `volunteer_tshirts` table with status = 'preferred'
- Returns TRUE if successful, FALSE otherwise

#### 7.2.2. `issue_tshirt`

```sql
CREATE OR REPLACE FUNCTION public.issue_tshirt(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size_cd VARCHAR,
  p_issued_by_profile_id UUID,
  p_quantity INTEGER DEFAULT 1
) RETURNS BOOLEAN
```

This function issues a T-shirt to a volunteer:

- Checks inventory availability
- Decreases the inventory quantity
- Inserts a record into the `volunteer_tshirts` table with status = 'issued'
- Returns TRUE if successful, FALSE otherwise

#### 7.2.3. `return_tshirt`

```sql
CREATE OR REPLACE FUNCTION public.return_tshirt(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size_cd VARCHAR
) RETURNS BOOLEAN
```

This function records a T-shirt return:

- Updates the status of the issued T-shirt to 'returned'
- Increases the inventory quantity
- Returns TRUE if successful, FALSE otherwise

#### 7.2.4. `get_tshirt_counts_by_volunteer_and_size`

```sql
CREATE OR REPLACE FUNCTION public.get_tshirt_counts_by_volunteer_and_size(
  p_event_id BIGINT
) RETURNS TABLE (
  volunteer_id UUID,
  volunteer_name TEXT,
  allocation INTEGER,
  status TEXT,
  size_cd VARCHAR(5),
  quantity INTEGER
)
```

This function returns T-shirt counts by volunteer and size:

- Returns data in a flexible format that doesn't hardcode T-shirt sizes
- Includes volunteer information, allocation, status, size, and quantity
- Recommended for use from the frontend

#### 7.2.5. `get_tshirt_sizes`

```sql
CREATE OR REPLACE FUNCTION public.get_tshirt_sizes(
  p_event_id BIGINT
) RETURNS TABLE (
  size_cd VARCHAR(5),
  size_name VARCHAR(5),
  sort_order INTEGER,
  quantity INTEGER,
  quantity_on_hand INTEGER
)
```

This function returns all available T-shirt sizes for an event:

- Provides a clean way for the frontend to get size information without hardcoding
- Returns size code, name, sort order, and inventory quantities

#### 7.2.6. `get_tshirt_counts_by_volunteer`

```sql
CREATE OR REPLACE FUNCTION public.get_tshirt_counts_by_volunteer(
  p_event_id BIGINT,
  OUT volunteer_name TEXT,
  OUT allocation INTEGER,
  OUT status TEXT,
  OUT total_count INTEGER
) RETURNS SETOF RECORD
```

This function uses dynamic SQL to generate a report of T-shirt counts by volunteer:

- Dynamically adapts to whatever T-shirt sizes are available in the database
- No hardcoded sizes - queries the `tshirt_inventory` table to get current sizes
- Maintained for backward compatibility

This documentation should provide a solid foundation for UI development. Please refer to the Supabase documentation for details on querying, RLS policy creation, and using the Supabase client libraries.
