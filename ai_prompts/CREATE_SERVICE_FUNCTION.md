# Prompt: Create New Service Function

## Goal:
Create a new function within a service module for interacting with the Supabase backend.

## Context & Constraints:
- Adhere to the project's coding standards outlined in `ai-docs/STYLE_GUIDE.md`.
- Follow the architectural patterns described in `ai-docs/ARCHITECTURE.md`. Service functions are typically part of a service module in `src/app/app/[module_name]/services/`.
- The function should interact with Supabase (direct table query or RPC call).
- Ensure all parameters and return values are typed using project types (from `<module>/types.ts` or `lib/types/supabase.ts`) and well-documented with JSDoc.
- Include error handling for Supabase calls.

## Service Function Details:
- **Function Name (camelCase):** `[functionName]`
- **Service Module File:** `[service_module_name].service.ts` (e.g., `tshirt-service.ts`)
- **Module Name (kebab-case):** `[module_name]`
- **Parameters (provide name, type, isOptional, and description for each):**
    - Param 1:
        - Name: `[param1Name]`
        - Type: `[param1Type]` (e.g., `string`, `number`, specific interface from `types.ts`)
        - Optional: `[true/false]`
        - Description: `[param1Description]`
    - `supabase` client instance is usually passed to the factory function that creates the service, not to each individual function.
    - ... (add more params as needed)
- **Core Functionality:**
    `[Describe what data the function should fetch, create, update, or delete. Specify Supabase tables or RPC functions involved.]`
    - Supabase Table/View: `[table_or_view_name (if direct query)]`
    - Supabase RPC Function: `[rpc_function_name (if RPC call)]`
- **Return Value:**
    - Type: `[returnType]` (e.g., `Promise<MyDataType[] | null>`, `Promise<boolean>`)
    - Description: `[returnDescription]`
- **Error Handling:**
    `[Describe how errors from Supabase should be handled (e.g., logged, re-thrown, returned as part of an object).]`

## Expected Output:
1.  The TypeScript code for the new function, to be added to `src/app/app/[module_name]/services/[service_module_name].service.ts`. If the service file uses a factory pattern (like `createUnifiedTShirtService`), provide the function to be added within that factory's returned object.
2.  If applicable, any new types needed for parameters or return values (though these should ideally exist in `types.ts`).

## Example Invocation (for human use):
- Function Name: `fetchVolunteerDetails`
- Service Module File: `volunteer-data.service.ts`
- Module Name: `volunteers`
- Parameters:
    - `volunteerId` (Type: `string`, Optional: `false`, Description: "The ID of the volunteer to fetch.")
- Core Functionality: "Fetches detailed information for a single volunteer from the 'volunteers' table."
- Supabase Table/View: `volunteers`
- Return Value:
    - Type: `Promise<Volunteer | null>` (assuming `Volunteer` type exists)
    - Description: "A promise that resolves to the volunteer object or null if not found."

---
*AI Assistant: Please generate the requested function code based on the details provided above, ensuring adherence to all project guidelines.*
