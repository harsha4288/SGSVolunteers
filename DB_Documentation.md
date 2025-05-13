# Volunteer Management Application: Database Design & Authentication Plan

**Date:** May 11, 2025
**Version:** 1.1 (Includes Roles & Auditing)

## 1. Introduction

This document outlines the database schema and authentication/authorization flow for the Volunteer Management application. The backend uses a Supabase PostgreSQL database. This information is intended for UI developers to understand data structures, relationships, and how user authentication integrates with the data model.

## 2. Authentication Flow

The application uses Supabase Authentication.

1.  **User Sign-Up/Login (App Interaction):**
    *   Users interact with the app's frontend and use Supabase client libraries (e.g., `supabase.auth.signUp()`, `supabase.auth.signInWithPassword()`, OAuth providers) to create an account or log in.
    *   Upon successful authentication, Supabase Auth creates an entry in its internal `auth.users` table (managed by Supabase) and returns an authenticated user object to the client. This object contains the user's `id (UUID)` from `auth.users` and their `email`.

2.  **Linking `public.profiles` to `auth.users` (App Backend/Function Logic):**
    *   When a user signs up or logs in for the first time successfully:
        *   The application (client-side or via a backend function/Supabase Edge Function) should take the `id (UUID)` and `email` of the authenticated user from Supabase Auth.
        *   It then checks if a row exists in `public.profiles` where `email` matches the authenticated user's email.
            *   **If a `public.profiles` row exists:** Update its `user_id` column with the `id (UUID)` from `auth.users`.
            *   **If no `public.profiles` row exists (should be rare if data was imported):** Create a new row in `public.profiles`, populating `id` (new UUID), `user_id` (from `auth.users`), and `email`.
    *   This step ensures that the `public.profiles` table, which represents the app user account, is directly linked to an authenticated Supabase user.

3.  **Data Access Post-Login:**
    *   Once a user is logged in, the UI has access to their `auth.users.id` (often available as `supabase.auth.currentUser.id`).
    *   The UI can then query `public.profiles` using this `auth.users.id` (via the `profiles.user_id` column) to fetch the app-specific `profiles.id (UUID)`.
    *   With `profiles.id`, the UI can fetch associated `volunteers` records and subsequently their `volunteer_commitments`. It can also determine user roles by querying `profile_roles`.

## 3. Database Schema

All custom tables are in the `public` schema.

### 3.1. `public.events`
Stores details about distinct events.

| Column       | Type          | Constraints                               | Description                                     |
|--------------|---------------|-------------------------------------------|-------------------------------------------------|
| `id`         | BIGINT        | PK, Generated Always as Identity          | Unique identifier for the event.                |
| `event_name` | TEXT          | NOT NULL, UNIQUE                          | Name of the event (e.g., "Gita Mahayajna 2025"). |
| `start_date` | DATE          |                                           | Event start date.                               |
| `end_date`   | DATE          |                                           | Event end date.                                 |
| `created_at` | TIMESTAMPTZ   | DEFAULT NOW()                             | Timestamp of creation.                          |
| `updated_at` | TIMESTAMPTZ   | DEFAULT NOW()                             | Timestamp of last update.                       |

*Comment: Stores event details.*

### 3.2. `public.roles`
Defines user roles within the application.

| Column       | Type        | Constraints                               | Description                                  |
|--------------|-------------|-------------------------------------------|----------------------------------------------|
| `id`         | BIGINT      | PK, Generated Always as Identity          | Unique identifier for the role.              |
| `role_name`  | TEXT        | NOT NULL, UNIQUE                          | Name of the role (e.g., 'Admin', 'Team Lead'). |
| `description`| TEXT        |                                           | Optional description of the role.            |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW()                             | Timestamp of creation.                       |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW()                             | Timestamp of last update.                    |

*Comment: Defines user roles within the application. Seeded with 'Admin', 'Team Lead', 'Volunteer'.*

### 3.3. `public.profiles`
Represents app user accounts, linked to Supabase authentication.

| Column         | Type        | Constraints                                       | Description                                                                 |
|----------------|-------------|---------------------------------------------------|-----------------------------------------------------------------------------|
| `id`           | UUID        | PK, DEFAULT gen_random_uuid()                     | Unique identifier for the profile entry.                                    |
| `user_id`      | UUID        | UNIQUE, FK to `auth.users(id)` ON DELETE CASCADE  | Links to Supabase `auth.users.id`. Can be `NULL` until user logs in/verified. |
| `email`        | TEXT        | NOT NULL, UNIQUE                                  | Login email for the app account.                                            |
| `display_name` | TEXT        |                                                   | Optional: Account holder's preferred display name.                          |
| `bio`          | TEXT        |                                                   | Optional: User's bio.                                                       |
| `created_at`   | TIMESTAMPTZ | DEFAULT NOW()                                     | Timestamp of creation.                                                      |
| `updated_at`   | TIMESTAMPTZ | DEFAULT NOW()                                     | Timestamp of last update.                                                   |

*Comment: Stores app user account information, linked to Supabase auth.*
*Indexes: `idx_profiles_user_id_on_profiles(user_id)`, `idx_profiles_email_on_profiles(email)`.*

### 3.4. `public.profile_roles`
Assigns roles to user profiles (junction table).

| Column      | Type        | Constraints                                     | Description                                      |
|-------------|-------------|-------------------------------------------------|--------------------------------------------------|
| `profile_id`| UUID        | NOT NULL, FK to `public.profiles(id)` ON DELETE CASCADE | FK to the profile.                               |
| `role_id`   | BIGINT      | NOT NULL, FK to `public.roles(id)` ON DELETE CASCADE    | FK to the role.                                  |
| `assigned_at`| TIMESTAMPTZ | DEFAULT NOW()                                   | Timestamp when the role was assigned.            |
| *Primary Key*|             | (`profile_id`, `role_id`)                       | Ensures a profile has a role only once.          |

*Comment: Assigns roles to user profiles.*
*Indexes: `idx_profile_roles_profile_id(profile_id)`, `idx_profile_roles_role_id(role_id)`.*

### 3.5. `public.volunteers`
Stores details of individual volunteers, typically from Google Form registrations.

| Column                             | Type        | Constraints                                     | Description                                                                 |
|------------------------------------|-------------|-------------------------------------------------|-----------------------------------------------------------------------------|
| `id`                               | UUID        | PK, DEFAULT gen_random_uuid()                   | Unique ID for this volunteer person. **Used as FK in `volunteer_commitments`**. |
| `profile_id`                       | UUID        | FK to `public.profiles(id)` ON DELETE SET NULL  | Links this volunteer to an app account (`profiles` table).                  |
| `email`                            | TEXT        | NOT NULL                                        | Email used in Google Form for this volunteer.                               |
| `first_name`                       | TEXT        | NOT NULL                                        | Volunteer's first name.                                                     |
| `last_name`                        | TEXT        | NOT NULL                                        | Volunteer's last name.                                                      |
| `phone`                            | TEXT        |                                                 | Phone number.                                                               |
| `gender`                           | TEXT        |                                                 | Gender.                                                                     |
| `gm_family`                        | BOOLEAN     |                                                 | Part of Gita Mahayajna family?                                              |
| `association_with_mahayajna`       | TEXT        |                                                 | Association with the program.                                               |
| `mahayajna_student_name`           | TEXT        |                                                 | Student's name if applicable.                                               |
| `student_batch`                    | TEXT        |                                                 | Student's batch if applicable.                                              |
| `hospitality_needed`               | BOOLEAN     |                                                 | Hospitality needed?                                                         |
| `location`                         | TEXT        |                                                 | Preferred location.                                                         |
| `other_location`                   | TEXT        |                                                 | Other location preference.                                                  |
| `additional_info`                  | TEXT        |                                                 | Additional information.                                                     |
| `google_form_submission_timestamp` | TIMESTAMPTZ |                                                 | Timestamp from Google Form submission.                                      |
| `requested_tshirt_quantity`        | INTEGER     |                                                 | Number of T-shirts requested/allocated per Google Form.                     |
| `created_at`                       | TIMESTAMPTZ | DEFAULT NOW()                                   | Timestamp of creation.                                                      |
| `updated_at`                       | TIMESTAMPTZ | DEFAULT NOW()                                   | Timestamp of last update.                                                   |

*Constraint: `unique_volunteer_person UNIQUE (email, first_name, last_name)`.*
*Comment: Stores details for each individual volunteer from Google Form.*
*Indexes: `idx_volunteers_email_on_volunteers(email)`, `idx_volunteers_profile_id_on_volunteers(profile_id)`.*

### 3.6. `public.time_slots`
Defines specific time slots for volunteer activities within an event.

| Column         | Type        | Constraints                               | Description                                                              |
|----------------|-------------|-------------------------------------------|--------------------------------------------------------------------------|
| `id`           | BIGINT      | PK, Generated Always as Identity          | Unique identifier for the time slot.                                     |
| `event_id`     | BIGINT      | NOT NULL, FK to `public.events(id)` ON DELETE CASCADE | Links to the event this time slot belongs to.                          |
| `slot_name`    | TEXT        | NOT NULL, UNIQUE                          | Descriptive name of the slot (e.g., "9th AM", "All Event Days...").      |
| `start_time`   | TIMESTAMPTZ | NOT NULL                                  | Full start timestamp (UTC).                                              |
| `end_time`     | TIMESTAMPTZ | NOT NULL                                  | Full end timestamp (UTC).                                                |
| `created_at`   | TIMESTAMPTZ | DEFAULT NOW()                             | Timestamp of creation.                                                   |
| `updated_at`   | TIMESTAMPTZ | DEFAULT NOW()                             | Timestamp of last update.                                                |

*Comment: Defines specific time slots for volunteer activities.*
*Index: `idx_time_slots_slot_name(slot_name)`.*

### 3.7. `public.seva_categories`
Defines categories of seva (service) or tasks.

| Column          | Type        | Constraints                               | Description                                  |
|-----------------|-------------|-------------------------------------------|----------------------------------------------|
| `id`            | BIGINT      | PK, Generated Always as Identity          | Unique identifier for the seva category.     |
| `category_name` | TEXT        | NOT NULL, UNIQUE                          | Name of the seva category (e.g., "Registration"). |
| `description`   | TEXT        |                                           | Optional description of the category.        |
| `created_at`    | TIMESTAMPTZ | DEFAULT NOW()                             | Timestamp of creation.                       |
| `updated_at`    | TIMESTAMPTZ | DEFAULT NOW()                             | Timestamp of last update.                    |

*Comment: Defines categories of seva or tasks.*
*Index: `idx_seva_categories_category_name(category_name)`.*

### 3.8. `public.volunteer_commitments`
Links volunteers to time slots, indicating either promised availability or a specific task assignment.

| Column                  | Type        | Constraints                                                                 | Description                                                                                                |
|-------------------------|-------------|-----------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `id`                    | BIGINT      | PK, Generated Always as Identity                                            | Unique identifier for the commitment.                                                                      |
| `volunteer_id`          | UUID        | NOT NULL, FK to `public.volunteers(id)` ON DELETE CASCADE                   | Identifies the specific volunteer.                                                                         |
| `time_slot_id`          | BIGINT      | NOT NULL, FK to `public.time_slots(id)` ON DELETE CASCADE                   | Identifies the time slot.                                                                                  |
| `commitment_type`       | TEXT        | NOT NULL, CHECK (`commitment_type` IN ('PROMISED_AVAILABILITY', 'ASSIGNED_TASK')) | Type of commitment: 'PROMISED_AVAILABILITY' or 'ASSIGNED_TASK'.                                            |
| `seva_category_id`      | BIGINT      | FK to `public.seva_categories(id)` ON DELETE SET NULL                       | ID of the assigned task/seva category. `NULL` if `commitment_type` is 'PROMISED_AVAILABILITY'.             |
| `task_notes`            | TEXT        |                                                                             | Optional specific notes for an assignment.                                                                 |
| `source_reference`      | TEXT        |                                                                             | Information about data origin (e.g., "Google Form: 9th AM", "Excel Assignment: All Days").                 |
| `created_at`            | TIMESTAMPTZ | DEFAULT NOW()                                                               | Timestamp of creation.                                                                                     |
| `updated_at`            | TIMESTAMPTZ | DEFAULT NOW()                                                               | Timestamp of last update.                                                                                  |

*Constraint: `unique_volunteer_commitment_detail UNIQUE (volunteer_id, time_slot_id, commitment_type, seva_category_id)`.*
*Comment: Links volunteers to time slots for availability or assigned tasks.*
*Indexes: `idx_commitments_volunteer_id(volunteer_id)`, `idx_commitments_time_slot_id(time_slot_id)`, `idx_commitments_seva_category_id(seva_category_id)`.*

### 3.9. `public.volunteer_check_ins`
Tracks actual volunteer check-in and check-out times for events.

| Column                   | Type        | Constraints                                                     | Description                                                                 |
|--------------------------|-------------|-----------------------------------------------------------------|-----------------------------------------------------------------------------|
| `id`                     | BIGINT      | PK, Generated Always as Identity                                | Unique identifier for the check-in record.                                  |
| `volunteer_id`           | UUID        | NOT NULL, FK to `public.volunteers(id)` ON DELETE CASCADE       | FK to `public.volunteers.id`.                                               |
| `event_id`               | BIGINT      | NOT NULL, FK to `public.events(id)` ON DELETE CASCADE           | Links to the event for which the check-in occurred.                         |
| `recorded_by_profile_id` | UUID        | FK to `public.profiles(id)` ON DELETE SET NULL                  | Profile ID of the user (Admin/Team Lead) who recorded the check-in/out.     |
| `check_in_time`          | TIMESTAMPTZ | NOT NULL                                                        | Timestamp of when the volunteer checked in.                                 |
| `check_out_time`         | TIMESTAMPTZ |                                                                 | Timestamp of check-out. `NULL` if currently checked in.                     |
| `location`               | TEXT        |                                                                 | Optional: Specific location of check-in/out if applicable.                  |
| `created_at`             | TIMESTAMPTZ | DEFAULT NOW()                                                   | Timestamp of creation.                                                      |
| `updated_at`             | TIMESTAMPTZ | DEFAULT NOW()                                                   | Timestamp of last update.                                                   |

*Comment: Tracks actual volunteer check-in and check-out times for events.*
*Indexes: `idx_checkins_volunteer_id(volunteer_id)`, `idx_checkins_event_id(event_id)`, `idx_checkins_check_in_time(check_in_time)`, `idx_checkins_recorded_by_profile_id(recorded_by_profile_id)`.*

### 3.10. `public.tshirt_inventory`
Tracks T-shirt inventory by size for events.

| Column       | Type        | Constraints                                               | Description                                  |
|--------------|-------------|-----------------------------------------------------------|----------------------------------------------|
| `id`         | BIGINT      | PK, Generated Always as Identity                          | Unique identifier for the inventory item.    |
| `event_id`   | BIGINT      | NOT NULL, FK to `public.events(id)` ON DELETE CASCADE     | Links inventory to a specific event.         |
| `size`       | TEXT        | NOT NULL                                                  | T-shirt size (e.g., 'S', 'M', 'L', 'XL').    |
| `quantity`   | INTEGER     | NOT NULL, CHECK (`quantity` >= 0)                         | Number of T-shirts of this size in stock.    |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW()                                             | Timestamp of creation.                       |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW()                                             | Timestamp of last update.                    |

*Comment: Tracks T-shirt inventory by size for events.*
*Indexes: `idx_tshirt_inventory_event_id(event_id)`, `idx_tshirt_inventory_size(size)`.*

### 3.11. `public.tshirt_issuances`
Tracks T-shirts issued to volunteers.

| Column                  | Type        | Constraints                                                              | Description                                                                    |
|-------------------------|-------------|--------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| `id`                    | BIGINT      | PK, Generated Always as Identity                                         | Unique identifier for the issuance record.                                     |
| `volunteer_id`          | UUID        | NOT NULL, FK to `public.volunteers(id)` ON DELETE CASCADE                | Links to the individual volunteer who received the T-shirt.                    |
| `tshirt_inventory_id`   | BIGINT      | NOT NULL, FK to `public.tshirt_inventory(id)` ON DELETE RESTRICT         | FK to `public.tshirt_inventory.id`, indicating which stock item was issued.    |
| `issued_by_profile_id`  | UUID        | FK to `public.profiles(id)` ON DELETE SET NULL                           | Profile ID of the user (Admin/Team Lead) who recorded the T-shirt issuance.    |
| `issuance_date`         | TIMESTAMPTZ | DEFAULT NOW()                                                            | Timestamp of when the T-shirt was issued.                                      |
| `size`                  | TEXT        |                                                                          | Size of the T-shirt issued; potentially redundant if derived from `tshirt_inventory_id`. |
| `created_at`            | TIMESTAMPTZ | DEFAULT NOW()                                                            | Timestamp of creation.                                                         |
| `updated_at`            | TIMESTAMPTZ | DEFAULT NOW()                                                            | Timestamp of last update.                                                      |

*Comment: Tracks T-shirts issued to volunteers.*
*Indexes: `idx_tshirt_issuances_volunteer_id(volunteer_id)`, `idx_tshirt_issuances_tshirt_inventory_id(tshirt_inventory_id)`, `idx_tshirt_issuances_issued_by_profile_id(issued_by_profile_id)`.*

## 4. Key UI Interaction Patterns

*   **Displaying Volunteer's Own Schedule:**
    1.  User logs in (Supabase Auth). Get `auth.users.id`.
    2.  Query `public.profiles` WHERE `user_id = auth.users.id` to get `profiles.id`.
    3.  Query `public.volunteers` WHERE `profile_id = profiles.id` to list all volunteers managed by this app user.
    4.  For a selected `volunteers.id`, query `public.volunteer_commitments` (JOIN `time_slots`, `seva_categories`) to display their promised availability and assigned tasks.
        *   Use `commitment_type` to differentiate.
        *   Display `time_slots.slot_name`, `time_slots.start_time` (converted to local TZ), `time_slots.end_time` (converted to local TZ).
        *   If `ASSIGNED_TASK`, display `seva_categories.category_name`.

*   **Team Lead/Admin Actions:**
    *   **Recording Check-ins:** UI allows user with 'Team Lead' or 'Admin' role to select a volunteer and record `check_in_time` or `check_out_time` in `volunteer_check_ins`. The `recorded_by_profile_id` is set to the current user's `profiles.id`.
    *   **Issuing T-shirts:** UI allows user with 'Team Lead' or 'Admin' role to select a volunteer, select a T-shirt from `tshirt_inventory`, and record an issuance in `tshirt_issuances`. The `issued_by_profile_id` is set.
    *   **Managing Roles:** UI (likely Admin only) to assign/revoke roles in `profile_roles`.

*   **Admin Views (Illustrative - RLS dependent):**
    *   Listing all volunteers, searching/filtering.
    *   Viewing event schedules, assigning tasks (creating/updating `volunteer_commitments` with `commitment_type = 'ASSIGNED_TASK'`).
    *   Managing T-shirt inventory and recording issuances.
    *   Viewing check-in data.

## 5. Row Level Security (RLS)

All custom tables have RLS enabled. Policies must be implemented to ensure:
*   Users can only access/modify their own `profiles` data (e.g., `auth.uid() = user_id`).
*   Users can only access/modify `volunteers` data linked to their `profiles.id`.
*   Users can only see/manage commitments, check-ins, T-shirt issuances related to their managed volunteers.
*   'Team Lead' role might have broader access to volunteers/commitments within their assigned seva categories (requires additional linking table like `team_lead_seva_assignments (profile_id, seva_category_id)` if this granularity is needed).
*   'Admin' role has broader access as required.

This documentation should provide a solid foundation for UI development. Please refer to the Supabase documentation for details on querying, RLS policy creation, and using the Supabase client libraries.
