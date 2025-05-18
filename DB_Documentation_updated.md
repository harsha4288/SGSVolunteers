# Volunteer Management Application: Database Design & Authentication Plan

**Date:** May 11, 2025 (Updated: May 25, 2025)
**Version:** 1.4 (Includes Enhanced T-Shirt Management)

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

## 7. T-Shirt Management

### 7.1. T-Shirt Tables

#### 7.1.1. `tshirt_sizes`

This table stores the available T-shirt sizes for each event.

| Column     | Type        | Description                            |
| ---------- | ----------- | -------------------------------------- |
| id         | BIGINT      | Primary key                            |
| event_id   | BIGINT      | Reference to events table              |
| size_name  | TEXT        | Name of the size (e.g., "S", "M", "L") |
| sort_order | INTEGER     | Order for display purposes             |
| created_at | TIMESTAMPTZ | Creation timestamp                     |
| updated_at | TIMESTAMPTZ | Last update timestamp                  |

#### 7.1.2. `tshirt_inventory`

This table tracks the inventory of T-shirts by size.

| Column           | Type        | Description                              |
| ---------------- | ----------- | ---------------------------------------- |
| id               | BIGINT      | Primary key                              |
| event_id         | BIGINT      | Reference to events table                |
| tshirt_size_id   | BIGINT      | Reference to tshirt_sizes table          |
| size             | TEXT        | Size name (denormalized for convenience) |
| quantity_initial | INTEGER     | Initial quantity received                |
| quantity         | INTEGER     | Current total quantity                   |
| quantity_on_hand | INTEGER     | Current on-hand quantity                 |
| created_at       | TIMESTAMPTZ | Creation timestamp                       |
| updated_at       | TIMESTAMPTZ | Last update timestamp                    |

#### 7.1.3. `tshirt_issuances`

This table records when T-shirts are issued to volunteers.

| Column               | Type        | Description                                |
| -------------------- | ----------- | ------------------------------------------ |
| id                   | BIGINT      | Primary key                                |
| volunteer_id         | UUID        | Reference to volunteers table              |
| event_id             | BIGINT      | Reference to events table                  |
| tshirt_inventory_id  | BIGINT      | Reference to tshirt_inventory table        |
| size                 | TEXT        | Size issued (denormalized for convenience) |
| issued_at            | TIMESTAMPTZ | When the T-shirt was issued                |
| issued_by_profile_id | UUID        | Reference to profiles table                |

#### 7.1.4. `volunteer_tshirt_preferences`

This table stores volunteer preferences for T-shirt sizes.

| Column                   | Type        | Description                                |
| ------------------------ | ----------- | ------------------------------------------ |
| id                       | BIGINT      | Primary key                                |
| volunteer_id             | UUID        | Reference to volunteers table              |
| event_id                 | BIGINT      | Reference to events table                  |
| tshirt_size_id           | BIGINT      | Reference to tshirt_sizes table            |
| preference_order         | INTEGER     | Order of preference                        |
| is_fulfilled             | BOOLEAN     | Whether this preference has been fulfilled |
| fulfilled_by_issuance_id | BIGINT      | Reference to tshirt_issuances table        |
| created_at               | TIMESTAMPTZ | Creation timestamp                         |
| updated_at               | TIMESTAMPTZ | Last update timestamp                      |

#### 7.1.5. Volunteer T-Shirt Fields

The `volunteers` table includes the following T-shirt related fields:

| Column                    | Type    | Description                                             |
| ------------------------- | ------- | ------------------------------------------------------- |
| requested_tshirt_quantity | INTEGER | Number of T-shirts the volunteer is eligible to receive |
| tshirt_size_preference    | TEXT    | Legacy field for single size preference                 |

### 7.2. T-Shirt Management Functions

The following database functions are available for T-shirt management:

#### 7.2.1. `issue_tshirt`

```sql
CREATE OR REPLACE FUNCTION public.issue_tshirt(
  p_volunteer_id TEXT,
  p_event_id INTEGER,
  p_size TEXT,
  p_issued_by_profile_id TEXT
) RETURNS VOID
```

Legacy function that issues a T-shirt to a volunteer and updates the inventory.

#### 7.2.2. `issue_tshirt_v2`

```sql
CREATE OR REPLACE FUNCTION public.issue_tshirt_v2(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_size TEXT,
  p_issued_by_profile_id UUID
) RETURNS VOID
```

Enhanced function that issues a T-shirt to a volunteer with allocation tracking. It:

- Checks the volunteer's remaining allocation
- Verifies that inventory exists for the requested size
- Decreases the inventory quantity
- Records the issuance in the `tshirt_issuances` table
- Updates any matching preferences to mark them as fulfilled

#### 7.2.3. `get_volunteer_tshirt_allocation`

```sql
CREATE OR REPLACE FUNCTION public.get_volunteer_tshirt_allocation(
  p_volunteer_id UUID,
  p_event_id BIGINT
) RETURNS INTEGER
```

This function calculates a volunteer's remaining T-shirt allocation by:

- Getting the total allocation from the `requested_tshirt_quantity` field
- Counting the number of T-shirts already issued
- Returning the difference

#### 7.2.4. `set_volunteer_tshirt_preferences`

```sql
CREATE OR REPLACE FUNCTION public.set_volunteer_tshirt_preferences(
  p_volunteer_id UUID,
  p_event_id BIGINT,
  p_preferences JSONB
) RETURNS VOID
```

This function sets a volunteer's T-shirt size preferences:

- Validates that the number of preferences doesn't exceed allocation
- Deletes existing unfulfilled preferences
- Inserts new preferences with the specified order

#### 7.2.5. `get_tshirt_issuance_report`

```sql
CREATE OR REPLACE FUNCTION public.get_tshirt_issuance_report(
  p_event_id INTEGER
) RETURNS TABLE (
  id INTEGER,
  volunteer_id TEXT,
  volunteer_name TEXT,
  volunteer_email TEXT,
  size TEXT,
  issued_at TIMESTAMP WITH TIME ZONE,
  issued_by TEXT
)
```

This function returns a detailed report of all T-shirts issued for a specific event.

#### 7.2.6. `get_tshirt_preference_summary`

```sql
CREATE OR REPLACE FUNCTION public.get_tshirt_preference_summary()
RETURNS TABLE (
  size TEXT,
  count BIGINT
)
```

This function returns a summary of T-shirt size preferences across all volunteers.
