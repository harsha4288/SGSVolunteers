# Architecture Overview - VolunteerVerse

This document provides an overview of the VolunteerVerse project's architecture.

## 1. Core Technologies
    - **Frontend Framework:** Next.js (React)
    - **Programming Language:** TypeScript
    - **UI Components:** Shadcn UI (customizable components built with Radix UI and Tailwind CSS) - located in `src/components/ui/`.
    - **Backend:** Supabase (PostgreSQL database, Authentication, Storage, Edge Functions)
    - **Styling:** Tailwind CSS

## 2. Project Structure (Next.js App Router)

The project follows a structure typical for Next.js applications using the App Router.

    ```
    .
    ├── src/
    │   ├── app/                 # Next.js App Router directory
    │   │   ├── (auth)/          # Authentication related pages (login, callback) - example path
    │   │   ├── app/             # Main application authenticated routes
    │   │   │   ├── <module_name>/ # Feature modules (e.g., tshirts, assignments, requirements)
    │   │   │   │   ├── components/    # Module-specific React components
    │   │   │   │   ├── hooks/         # Module-specific React hooks
    │   │   │   │   ├── services/      # Module-specific services (e.g., for Supabase interaction)
    │   │   │   │   ├── __tests__/     # Module-specific tests
    │   │   │   │   ├── page.tsx       # Entry point for the module's main page
    │   │   │   │   └── types.ts       # Module-specific type definitions
    │   │   │   ├── layout.tsx     # Layout for the authenticated app section
    │   │   │   └── ...
    │   │   ├── layout.tsx         # Root layout
    │   │   └── page.tsx           # Root page (homepage)
    │   ├── components/          # Shared UI components
    │   │   └── ui/              # Shadcn UI components
    │   ├── lib/                 # Shared libraries and utilities
    │   │   ├── supabase/        # Supabase client, server, middleware configurations
    │   │   └── types/           # Global types (e.g., Supabase generated types)
    │   ├── hooks/               # Global custom hooks (e.g. useToast)
    │   └── ...
    ├── public/                # Static assets
    ├── ai-docs/               # Documentation for AI assistants (THIS DIRECTORY)
    ├── specs/                 # Feature specifications
    ├── ai_prompts/            # Reusable prompt templates for AI
    ├── DB_Documentation.md    # Database schema details
    ├── package.json
    ├── tsconfig.json
    └── next.config.ts
    ```

## 3. Primary Architectural Pattern: Vertical Slices with Layering

The VolunteerVerse project employs a blended architectural strategy that combines **Vertical Slices** for feature organization with **Layering** for separation of concerns both within slices and for shared, cross-cutting functionality.

### 3.1. Vertical Slice Architecture for Features

The primary method for organizing application features is Vertical Slice Architecture. This means that code related to a distinct business domain or feature set (e.g., "T-shirt Management," "Volunteer Assignments," "User Profile") is grouped into its own module directory, typically found under `src/app/app/`.

*   **Slice Contents:** Each feature module (or "slice") aims to be largely self-contained for that feature. It typically includes:
    *   **`page.tsx` / `layout.tsx`:** Next.js entry points, routing, and layout specific to the feature.
    *   **`components/`:** React components that are primarily or exclusively used within this feature slice.
    *   **`hooks/`:** Custom React hooks that manage state, side effects, and business logic pertinent to the feature slice.
    *   **`services/`:** Service files/functions that encapsulate data fetching logic and interactions with the backend (e.g., Supabase) specifically for this feature.
    *   **`types.ts`:** TypeScript definitions and interfaces relevant to the feature slice's data structures.
*   **Benefits for AI Collaboration:** This slicing approach helps in providing focused context to AI assistants, as most of the code relevant to a specific feature change will be located within that feature's slice.

### 3.2. Layering within Vertical Slices

Within each vertical feature slice, a clear separation of concerns is maintained through an internal, layered structure:

*   **Presentation Layer:** Consists of `page.tsx` and components in the slice's `components/` directory. These are responsible for UI rendering and user interaction.
*   **Application Logic / State Management Layer:** Primarily handled by custom hooks in the slice's `hooks/` directory. These hooks manage UI state, orchestrate calls to services, and contain presentation logic.
*   **Data Access Layer:** Implemented by services in the slice's `services/` directory, which abstract direct interactions with the backend (e.g., Supabase database queries, RPC calls).

### 3.3. Shared Horizontal Layers

To complement the vertical slices and promote reusability across the application, several shared horizontal layers are utilized:

*   **Shared UI Layer (`src/components/ui/`, `src/components/shared/`):**
    *   `src/components/ui/`: Contains the Shadcn UI component library, providing a foundational set of reusable, accessible UI primitives (buttons, forms, cards, etc.).
    *   `src/components/shared/`: Houses custom UI components designed for reuse across multiple feature slices.
    *   This layer aligns with principles of Atomic Design for UI reusability.
*   **Shared Libraries & Utilities Layer (`src/lib/`, global `src/hooks/`):**
    *   `src/lib/`: Contains common utilities (e.g., `utils.ts`), Supabase client configuration (`supabase/`), global type definitions (`types/`), and other foundational code shared by all features.
    *   Global `src/hooks/`: For custom React hooks that provide cross-cutting functionality applicable to multiple feature slices (e.g., `useToast`, `useUserRole`).
*   **API Layer (`src/app/api/`):**
    *   Next.js API routes reside here, handling server-side API logic. These form a distinct backend layer that feature slices can interact with for operations requiring server-side processing.

### 3.4. Achieving Reusability and Avoiding Duplication

This blended approach allows for feature-focused development (via Vertical Slices) while systematically promoting code reuse and separation of concerns:

*   **Prioritize Shared Layers:** Developers and AI assistants should first look to shared horizontal layers (UI, libraries, global hooks) for existing solutions before creating new code within a slice.
*   **Identify New Shared Code:** If functionality being developed within a slice is identified as being broadly applicable, it should be refactored into an appropriate shared layer.
*   **Slice-Specific Code:** Code that is truly unique to a feature's business logic or UI orchestration resides within that feature's slice.

By understanding this interplay between vertical feature organization and horizontal shared layers, development can remain focused and efficient, while the codebase remains maintainable and DRY. AI assistants should be guided to operate primarily within a single feature slice for specific tasks but should always leverage and contribute to the shared horizontal layers appropriately. Refer to `ai-docs/REUSABLE_COMPONENTS.MD` for discovering existing reusable assets.

## 4. UI Components
    - **Shadcn UI:** The project heavily relies on components from `src/components/ui/` which are based on Shadcn UI. These are pre-built, accessible, and customizable. Refer to `ai-docs/REUSABLE_COMPONENTS.md` for more details.
    - **Custom Shared Components:** Any custom components intended for use across multiple modules should reside in `src/components/` (outside `ui/`).
    - **Module-Specific Components:** Components used only within a single module are located in that module's `components/` directory.

## 5. State Management
    - **Local Component State:** `React.useState` for simple UI state.
    - **Module-Level State:** Custom React hooks (e.g., `useUnifiedTShirtData`) are the primary mechanism for managing complex state, data fetching, and business logic within a module. These hooks often provide both data and functions to manipulate that data to the components.
    - **Global State:** For genuinely global state (e.g., user authentication status, theme), React Context API is used (e.g., `ThemeProvider`, potentially an AuthProvider). The Supabase client handles auth state.

## 6. Data Fetching & Backend Interaction
    - **Supabase Client:** The Supabase JavaScript client (`@supabase/supabase-js`) is used for all interactions with the Supabase backend. Client instances are typically created via `createClient` from `@/lib/supabase/client.ts`.
    - **Services Layer:** Module-specific services in `<module>/services/` abstract the direct Supabase calls. This makes components and hooks easier to test and less coupled to the Supabase API.
    - **Database Functions (RPC):** The application utilizes PostgreSQL functions exposed via Supabase RPC (e.g., `get_tshirt_sizes`, `issue_tshirt`).
    - **Row Level Security (RLS):** RLS is enabled on Supabase tables to control data access. Policies are defined in the Supabase dashboard or SQL migrations.

## 7. Authentication
    - **Supabase Auth:** Used for user authentication.
    - **Impersonation:** The application has an impersonation feature, typically managed via `localStorage` (`impersonatedProfileId`, `impersonatedEmail`). The `TShirtsPage.tsx` shows an example of handling this.
    - **Role-Based Access Control (RBAC):** User roles (`Admin`, `Team Lead`, `Volunteer`) are stored in the database (`profile_roles` table) and used to control access to features and data. Logic for checking roles is implemented in components and hooks.

## 8. Import Boundaries & Code Organization
    - **Absolute Imports:** Preferred (e.g., `import { MyComponent } from '@/components/MyComponent';`).
    - **Module Encapsulation:** Aim to keep modules self-contained.
        - Direct imports between different feature modules in `src/app/app/` should be minimized or avoided. If data or functionality needs to be shared, consider lifting it to a shared service/hook in `src/lib/` or `src/hooks/`, or exposing it via a well-defined interface.
    - **Shared Code:**
        - UI: `src/components/ui/` and `src/components/shared/`.
        - Utilities: `src/lib/utils.ts` or module-specific `utils/` folders.
        - Hooks: `src/hooks/` for global hooks.
        - Types: `src/lib/types/` for global types (especially `supabase.ts`).

## 9. Testing Strategy
    - Unit tests for individual components, hooks, and utility functions.
    - Integration tests for services interacting with Supabase (can be mocked or tested against a test database).
    - End-to-end tests (e.g., using Playwright or Cypress) can be considered for critical user flows.
    - Tests are co-located in `__tests__` directories.

## 10. AI Collaboration Considerations
    - **Vertical Slices:** The current module structure aligns well with the concept of AI assistants focusing on one feature/module at a time.
    - **Clear Service Layer:** The service layer provides a clear boundary for AI to understand data interactions.
    - **Typed Code:** TypeScript helps AI understand data shapes and function signatures.
    - **`@ai-guard` Comments:** Use these to protect sensitive or complex logic from unintended AI modifications.

This architecture aims for maintainability, scalability, and clear separation of concerns, facilitating both human and AI-assisted development.

## 11. CI/CD and Linting Recommendations

To further enhance code quality, maintainability, and ensure adherence to project standards, the following CI/CD and linting practices are recommended:

### 11.1. Continuous Integration / Continuous Deployment (CI/CD)
    - **Automated Testing:**
        - Configure a CI pipeline (e.g., using GitHub Actions, GitLab CI, Jenkins) to automatically run all tests (unit, integration) on every push and pull request to main branches.
        - Report test coverage as part of the CI pipeline. Aim for a minimum coverage threshold (e.g., 80-90% for critical modules).
    - **Linting and Formatting Checks:**
        - Integrate ESLint and Prettier checks into the CI pipeline. Fail the build if linting errors or formatting issues are detected.
    - **Build Verification:** Ensure the project builds successfully in the CI environment.
    - **Deployment (Optional):** Automate deployment to staging and production environments upon successful builds/merges to respective branches.

### 11.2. ESLint Configuration
    - **Comprehensive Rules:** Utilize ESLint with plugins such as:
        - `eslint-plugin-react` (for React best practices)
        - `eslint-plugin-react-hooks` (for rules of hooks)
        - `@typescript-eslint/eslint-plugin` (for TypeScript-specific rules)
        - `eslint-plugin-jsx-a11y` (for accessibility)
        - `eslint-plugin-import` (to manage import order and boundaries)
    - **Import Boundaries:**
        - Configure `eslint-plugin-import` or a similar tool (like `eslint-plugin-boundaries`) to enforce rules about how modules can import from each other. For example:
            - Disallow direct imports between feature modules in `src/app/app/` except through well-defined shared services or contexts.
            - Ensure components in `src/components/ui/` or `src/components/shared/` do not import from specific feature modules.
    - **Naming Conventions:** Enforce naming conventions (PascalCase for components/types, camelCase for functions/variables) using `@typescript-eslint/naming-convention` rules.
    - **Custom Rules:** Consider adding custom ESLint rules if specific project patterns need to be enforced.

### 11.3. Prettier Configuration
    - **Consistent Formatting:** Ensure a `.prettierrc.js` or similar Prettier configuration file is present in the repository root and defines the project's formatting standards.
    - **Integration:**
        - Integrate Prettier with ESLint using `eslint-plugin-prettier` and `eslint-config-prettier` to avoid conflicts.
        - Encourage developers to use Prettier on save in their IDEs.
        - Enforce Prettier formatting in the CI pipeline.

### 11.4. Pre-commit Hooks
    - **Local Enforcement:** Use a tool like Husky with `lint-staged` to automatically run linters and formatters on staged files before they are committed. This helps catch issues early and reduces CI failures.
    - **Example `lint-staged` configuration:**
      ```json
      {
        "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
        "*.{json,md}": ["prettier --write"]
      }
      ```

By implementing these recommendations, the project can maintain a high level of code quality, consistency, and reduce the likelihood of introducing errors, making collaboration (including with AI assistants) smoother and more efficient.
