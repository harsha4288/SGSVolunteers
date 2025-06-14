# Prompt: Create New React Component

## Goal:
Create a new React functional component using TypeScript.

## Context & Constraints:
- Adhere to the project's coding standards outlined in `ai-docs/STYLE_GUIDE.md`.
- Follow the architectural patterns described in `ai-docs/ARCHITECTURE.md`.
- Utilize existing reusable components from `src/components/ui/` or `src/components/shared/` where appropriate (see `ai-docs/REUSABLE_COMPONENTS.md`).
- Ensure all props are typed and well-documented with JSDoc.
- Include basic error handling and loading states if the component involves asynchronous operations.
- The component should be placed in the appropriate module's `components/` directory: `src/app/app/[module_name]/components/`.

## Component Details:
- **Component Name (PascalCase):** `[ComponentName]`
- **Module Name (kebab-case):** `[module_name]`
- **Props (provide name, type, isOptional, and description for each):**
    - Prop 1:
        - Name: `[prop1Name]`
        - Type: `[prop1Type]`
        - Optional: `[true/false]`
        - Description: `[prop1Description]`
    - Prop 2 (if any):
        - Name: `[prop2Name]`
        - Type: `[prop2Type]`
        - Optional: `[true/false]`
        - Description: `[prop2Description]`
    - ... (add more props as needed)
- **Core Functionality:**
    `[Describe what the component should do and display. Be specific about its behavior and appearance. Mention any state it needs to manage locally.]`
- **Data Interaction (if any):**
    - Does it call any hooks for data? `[Yes/No - If yes, specify hook name and how it's used]`
    - Does it call any service functions directly? (Generally discouraged, prefer hooks) `[Yes/No]`
- **Associated Files to Create:**
    - `src/app/app/[module_name]/components/[ComponentName].tsx`
    - Optional: `src/app/app/[module_name]/components/[ComponentName].types.ts` (if types are complex or shared)
    - Optional: `src/app/app/[module_name]/components/__tests__/[ComponentName].test.tsx` (outline basic test cases)

## Expected Output:
1.  The code for `[ComponentName].tsx`.
2.  If applicable, the code for `[ComponentName].types.ts`.
3.  If requested, an outline or basic code for `[ComponentName].test.tsx` covering:
    - Rendering without crashing.
    - Displaying key elements based on props.
    - User interactions (if any).

## Example Invocation (for human use):
Fill in the placeholders above. For example:
- Component Name: `VolunteerCard`
- Module Name: `assignments`
- Props:
    - `volunteer` (Type: `Volunteer` from `../types`, Optional: `false`, Description: "The volunteer data to display")
- Core Functionality: "Displays volunteer's name, email, and status. Includes a button to view details."
- ...

---
*AI Assistant: Please generate the requested files based on the details provided above, ensuring adherence to all project guidelines.*
