# Prompt: Create New Custom React Hook

## Goal:
Create a new custom React hook using TypeScript for managing specific logic or state.

## Context & Constraints:
- Adhere to the project's coding standards outlined in `ai-docs/STYLE_GUIDE.md` (e.g., naming `usePascalCase`).
- Follow the architectural patterns described in `ai-docs/ARCHITECTURE.md`.
- The hook should be placed in the appropriate module's `hooks/` directory: `src/app/app/[module_name]/hooks/`.
- Ensure all parameters and return values are typed and well-documented with JSDoc.
- If the hook fetches data, it should typically use a service function.

## Hook Details:
- **Hook Name (usePascalCase):** `[HookName]` (e.g., `useVolunteerPreferences`)
- **Module Name (kebab-case):** `[module_name]`
- **Parameters (provide name, type, isOptional, and description for each, if any):**
    - Param 1:
        - Name: `[param1Name]`
        - Type: `[param1Type]`
        - Optional: `[true/false]`
        - Description: `[param1Description]`
    - ... (add more params as needed)
- **Core Functionality:**
    `[Describe what the hook is responsible for. What state does it manage? What logic does it encapsulate? What side effects does it handle (e.g., data fetching)?]`
- **Return Values (describe the structure of the returned object/array):**
    - Value 1:
        - Name: `[returnValue1Name]`
        - Type: `[returnValue1Type]`
        - Description: `[returnValue1Description]`
    - Value 2 (if any):
        - Name: `[returnValue2Name]`
        - Type: `[returnValue2Type]`
        - Description: `[returnValue2Description]`
    - ... (add more return values as needed)
- **Data Interaction (if any):**
    - Calls Service Function(s): `[Yes/No - If yes, specify service module and function name(s) from <module>/services/ ]`
- **Associated Files to Create:**
    - `src/app/app/[module_name]/hooks/[HookName].ts`
    - Optional: `src/app/app/[module_name]/hooks/__tests__/[HookName].test.ts` (outline basic test cases)

## Expected Output:
1.  The code for `[HookName].ts`.
2.  If requested, an outline or basic code for `[HookName].test.ts` covering:
    - Initial state.
    - State changes after invoking functions returned by the hook.
    - Mocking service calls if data fetching is involved.

## Example Invocation (for human use):
- Hook Name: `useTaskAssignments`
- Module Name: `assignments`
- Parameters:
    - `volunteerId` (Type: `string`, Optional: `false`, Description: "ID of the volunteer whose tasks to fetch")
- Core Functionality: "Fetches and manages a list of tasks assigned to a specific volunteer. Provides loading and error states."
- Return Values: `{ tasks: Task[], isLoading: boolean, error: Error | null }`
- Calls Service Function(s): Yes, `assignments-service.ts`, `fetchTasksByVolunteer(volunteerId)`

---
*AI Assistant: Please generate the requested files based on the details provided above, ensuring adherence to all project guidelines.*
