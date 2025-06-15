# Project Style Guide - VolunteerVerse

This document outlines the coding style, naming conventions, and other stylistic guidelines for the VolunteerVerse project. Adherence to this guide is crucial for maintaining code consistency and readability, especially when working with AI assistants.

## 1. Naming Conventions

### 1.1. Files and Directories
    - **Feature/Module Directories:** `kebab-case` (e.g., `tshirt-management`, `user-profile`). Based on current project structure like `src/app/app/tshirts/`.
    - **Component Files:** `PascalCase.tsx` (e.g., `UserProfileCard.tsx`, `AssignmentsTable.tsx`).
    - **Type Definition Files:** `PascalCase.types.ts` or simply `types.ts` within a module (e.g., `UserProfile.types.ts`, `src/app/app/tshirts/types.ts`).
    - **Hook Files:** `usePascalCase.ts` (e.g., `useUserDetails.ts`, `useUnifiedTShirtData.ts`).
    - **Service Files:** `pascal-case.service.ts` or `kebab-case-service.ts` (e.g., `tshirt-service.ts` or `TshirtService.ts`). Prefer `kebab-case-service.ts` for new modules, like `unified-tshirt-service.ts`.
    - **Test Files:** `ComponentName.test.tsx` or `hookName.test.ts`. Tests should be co-located with the code they are testing, typically in a `__tests__` subdirectory.

### 1.2. Variables and Functions
    - **Variables & Functions:** `camelCase` (e.g., `userName`, `fetchVolunteerData`).
    - **React Components (Functions/Classes):** `PascalCase` (e.g., `function UserProfilePage()`, `class TShirtTable extends React.Component`).
    - **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_VOLUNTEERS`, `DEFAULT_EVENT_ID`).
    - **Types and Interfaces:** `PascalCase` (e.g., `interface Volunteer`, `type TShirtSize`).

### 1.3. CSS
    - Follow existing conventions if using global CSS or CSS Modules. Tailwind CSS is primarily used, so utility classes are preferred.

## 2. Coding Style

### 2.1. TypeScript
    - **Type Safety:** Utilize TypeScript's features to ensure type safety. Define types for all props, state, and function signatures.
    - **Interfaces vs. Types:** Use interfaces for object shapes and types that might be extended. Use `type` for unions, intersections, or simple aliases. Consistency within a module is key.
    - **Explicit Return Types:** Preferred for functions, especially for services and hooks.
    - **`any` type:** Avoid using `any` where possible. Use `unknown` or more specific types.

### 2.2. React
    - **Functional Components & Hooks:** Preferred over class components.
    - **Props:** Destructure props. Define types/interfaces for props.
    - **State Management:** Use `React.useState` for simple component state. For more complex state management within a module, use custom hooks (e.g., `useUnifiedTShirtData`).
    - **JSX:**
        - Use parentheses for multi-line JSX.
        - Indent JSX consistently.
        - Use descriptive prop names.
        - Self-closing tags for components without children.

### 2.3. Imports
    - **Absolute Imports:** Use absolute imports from `src/` (e.g., `import { MyComponent } from '@/components/ui/MyComponent';`). Configure via `tsconfig.json` paths.
    - **Import Grouping & Ordering:**
        1. React and Next.js imports.
        2. External library imports.
        3. Internal absolute imports (e.g., `@/lib/`, `@/components/`).
        4. Relative imports from the same module.
        5. Style imports (if any).
    - Avoid default exports for components and hooks to maintain consistency, unless it's a page component in Next.js.

### 2.4. Comments
    - **JSDoc:** Use JSDoc for functions, components, hooks, and types to explain their purpose, parameters, and return values.
    - **Inline Comments:** Use for clarifying complex logic.
    - **`@ai-guard` Comments:**
        - Use `@ai-guard: <Reason for protection/Instruction>` to mark critical code sections or provide specific instructions for AI assistants.
        - Keep these comments concise (ideally one line).
        - Example: `// @ai-guard: This logic is critical for financial calculations. Do not modify without updating specs/feature-billing.md.`

## 3. Code Formatting
    - **Prettier:** The project should use Prettier for automatic code formatting. Ensure it's configured and run regularly (e.g., on save or as a pre-commit hook).
    - **Line Length:** Aim for a maximum line length of 100-120 characters for better readability.

## 4. Linting
    - **ESLint:** The project should use ESLint with appropriate plugins (e.g., for React, TypeScript, accessibility).
    - Address all linting errors and warnings.

## 5. Testing
    - **Co-location:** Test files should be located alongside the implementation files in a `__tests__` directory.
    - **Naming:** `*.test.ts` or `*.test.tsx`.
    - **Coverage:** Aim for high test coverage for critical logic. (The article mentions 90% per feature as a target).
    - **Types of Tests:** Include unit tests for components, hooks, and utility functions. Integration tests for services and more complex interactions.

## 6. General Principles
    - **Readability:** Write code that is easy to understand and maintain.
    - **Simplicity (KISS):** Keep It Simple, Stupid. Avoid over-engineering.
    - **Dryness (DRY):** Don't Repeat Yourself. Utilize functions, components, and hooks to avoid redundant code.
    - **SOLID Principles:** While not always fully applicable to frontend components, strive for Single Responsibility where possible (e.g., a component does one thing well, a hook manages a specific piece of state/logic).
    - **File Size:** As per `VolunteerVerse Pending Taks.xml`, aim to keep new code files from exceeding 500 lines; break down if necessary. This applies particularly to components and complex hooks/services.

This style guide is a living document and may be updated as the project evolves.
