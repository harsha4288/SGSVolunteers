# Data Models & Types - VolunteerVerse

This document provides guidance on understanding and working with data models and TypeScript types within the VolunteerVerse project.

## 1. Primary Source of Truth for Database Schema

The definitive source for the database schema (tables, columns, relationships, RLS policies) is:

*   **`DB_Documentation.md`**: Located in the root of the repository. This markdown file details each table, its columns, and relationships.
*   **`Data/SGSVolunteer_Supabase.sql`**: The SQL script used to set up the Supabase database schema. This provides the most precise definitions.
*   **Supabase Dashboard:** The Supabase project dashboard itself (Table Editor, Auth, Storage sections).

**AI Assistants should refer to `DB_Documentation.md` first for an overview and then consult the SQL file or be prepared to query Supabase metadata if specific details are needed.**

## 2. TypeScript Type Definitions

TypeScript is used throughout the project to ensure type safety.

### 2.1. Global Supabase Types
*   **`src/lib/types/supabase.ts`**: This file should contain types generated from your Supabase schema.
    *   It typically exports a `Database` interface which then defines `Tables<T>`, `Views<T>`, and `Functions<T>` for each table, view, and RPC function in your `public` schema.
    *   **Generation:** These types are usually generated using the Supabase CLI: `supabase gen types typescript --project-id <your-project-id> --schema public > src/lib/types/supabase.ts`.
    *   **Usage:** When interacting with the Supabase client, these types provide autocompletion and type checking.
        ```typescript
        import { createClient } from '@/lib/supabase/client';
        import type { Database } from '@/lib/types/supabase';

        const supabase = createClient<Database>();

        async function getVolunteers() {
          // 'data' will be typed as an array of 'volunteers' table rows
          const { data, error } = await supabase.from('volunteers').select('*');
          return data;
        }
        ```

### 2.2. Module-Specific Types
*   Each feature module (e.g., `src/app/app/tshirts/`, `src/app/app/assignments/`) typically has its own `types.ts` file (e.g., `src/app/app/tshirts/types.ts`).
*   These files define interfaces and types relevant to the data structures and component props used *within that module*.
*   They might re-export or extend types from `supabase.ts` or define new shapes for UI state or API responses.
*   **Example (`src/app/app/tshirts/types.ts`):**
    ```typescript
    export interface Volunteer { // Might be a subset or augmented version of the DB volunteer type
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      requested_tshirt_quantity?: number;
    }

    export interface TShirtSize { // Specific to UI or form needs
      size_cd: string;
      size_name: string;
      sort_order: number;
      quantity_on_hand?: number;
    }
    ```

### 2.3. Component Prop Types
*   Types or interfaces for React component props are usually defined in the component file itself or in an associated `*.types.ts` file.

## 3. Working with Data and Types - Guidance for AI

*   **Infer from Usage:** If types are missing, try to infer them from how data is fetched and used.
*   **Start with Services and Hooks:** When trying to understand data flow, look at the `services/*.ts` files first to see how data is fetched from Supabase, then look at the `hooks/*.ts` files to see how that data is processed and managed for the UI.
*   **Check `types.ts`:** Always check the module's `types.ts` and the global `src/lib/types/supabase.ts` for existing definitions.
*   **Backend Functions (RPC):** Pay attention to the arguments and return types of Supabase RPC calls defined in SQL (see `Data/SGSVolunteer_Supabase.sql` for T-shirt functions, for example) and their corresponding TypeScript function signatures in services.
*   **Consistency:** When adding new features or modifying existing ones, ensure that new types are consistent with existing data models. If the database schema needs to change, this is a significant step that should be planned and discussed (refer to `DB_Documentation.md` and potentially update it).
*   **Avoid `any`:** Do not use `any` unless absolutely necessary and unavoidable. Define specific types.

Understanding the data models and their TypeScript representations is key to correctly implementing features and avoiding runtime errors.
