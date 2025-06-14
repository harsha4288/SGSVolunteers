# Prompt: Plan Feature Implementation

## Goal:
Generate a detailed, step-by-step implementation plan for a new feature, based on its specification.

## Context & Constraints:
- The feature specification is located at: `specs/[feature_spec_filename].md`.
- The plan should break down the work into actionable tasks for a developer (human or AI).
- Each task should be specific enough to be implemented and tested.
- Refer to project documentation for context:
    - `ai-docs/STYLE_GUIDE.md`
    - `ai-docs/ARCHITECTURE.md`
    - `ai-docs/REUSABLE_COMPONENTS.md`
    - `ai-docs/DATA_MODELS.md`
    - `DB_Documentation.md`
- Identify which files need to be created or modified for each task.
- Consider the order of tasks (e.g., database changes first, then service layer, then UI).

## Input:
- **Feature Specification File Path:** `specs/[feature_spec_filename].md`

## Instructions for AI Assistant:
1.  **Read and Understand:** Thoroughly read the provided feature specification file.
2.  **Identify Key Components:** Note the UI components, data model changes, API/service functions, and hooks mentioned in the spec.
3.  **Break Down into Tasks:** Decompose the feature implementation into a sequence of logical tasks. For each task:
    - Provide a clear description of what needs to be done.
    - List the primary file(s) to be created or modified.
    - Mention any key functions, types, or components involved.
    - If a task involves creating a new component, hook, or service function, suggest using the respective templates from `ai_prompts/` (e.g., `CREATE_COMPONENT.md`).
4.  **Order Tasks Logically:** Arrange tasks in a sensible order (e.g., backend/data changes before frontend, foundational UI before complex interactions).
5.  **Include Testing:** Add tasks for writing unit and integration tests for new or modified code.
6.  **Estimate Complexity (Optional):** For each task, provide a rough estimate of complexity (e.g., Small, Medium, Large) or effort if comfortable.
7.  **Output Format:** Present the plan as a numbered list of tasks, suitable for inclusion in the "Implementation Tasks" section of the feature specification or as a separate task list.

## Example Output Structure for a Task:

    1.  **Task:** Create the `NewUserProfileCard` component.
        - **Description:** Develop the UI component to display user profile information as per the spec.
        - **Files:** `src/app/app/profile/components/NewUserProfileCard.tsx`
        - **Key Elements:** Use `@/components/ui/Card`, `@/components/ui/Avatar`. Props: `user: UserProfile`.
        - **Prompt Template:** Consider using `ai_prompts/CREATE_COMPONENT.md`.
        - **Complexity:** Medium
    2.  **Task:** Add `updateUserProfile` function to `profile.service.ts`.
        - **Description:** Implement the service function to call the Supabase RPC for updating user profile data.
        - **Files:** `src/app/app/profile/services/profile.service.ts`
        - **Key Elements:** Supabase RPC: `update_user_profile_rpc`.
        - **Prompt Template:** Consider using `ai_prompts/CREATE_SERVICE_FUNCTION.md`.
        - **Complexity:** Small
    3.  ... (and so on)
    4.  **Task:** Write unit tests for `NewUserProfileCard`.
        - **Description:** Test rendering and basic prop display.
        - **Files:** `src/app/app/profile/components/__tests__/NewUserProfileCard.test.tsx`
        - **Complexity:** Small

---
*AI Assistant: Please generate the implementation plan based on the feature specification found at the provided path.*
