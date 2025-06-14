# AI Context File for VolunteerVerse Project

This document provides a starting point for AI assistants working on the VolunteerVerse project.

## Core Principles for AI Collaboration:

1.  **Understand Before Changing:** Always refer to the documentation in `ai-docs/` and relevant feature specifications in `specs/` before making code changes.
2.  **Follow Documented Standards:** Adhere strictly to the guidelines outlined in `ai-docs/STYLE_GUIDE.md` and `ai-docs/ARCHITECTURE.md`.
3.  **Use Provided Prompts:** Leverage the prompt templates in `ai_prompts/` for common development tasks to ensure consistency.
4.  **Respect Guard Comments:** Pay close attention to `@ai-guard` comments in the code. These mark critical sections or provide specific instructions.
5.  **Test Thoroughly:** Any new code or modification must be accompanied by appropriate tests. Ensure all tests pass before considering a task complete.
6.  **Incremental Changes:** Make small, incremental changes that are easy to review and test.
7.  **Ask When Unsure:** If requirements are unclear or there's a conflict in documentation, ask for clarification rather than making assumptions.

## Key Documentation & Resources:

*   **Style Guide:** `ai-docs/STYLE_GUIDE.md` (Covers coding style, naming conventions, import boundaries, etc.)
*   **Architecture Overview:** `ai-docs/ARCHITECTURE.md` (Explains the project structure, key patterns, and technologies.)
*   **Reusable Components:** `ai-docs/REUSABLE_COMPONENTS.md` (Information on shared UI components and hooks.)
*   **Data Models & Types:** `ai-docs/DATA_MODELS.md` (Guidance on finding data structures and types; links to DB documentation.)
*   **Feature Specifications:** `specs/` (Contains detailed specifications for ongoing and new features. Use `specs/TEMPLATE_FEATURE_SPEC.md` for new features.)
*   **Prompt Templates:** `ai_prompts/` (Reusable prompts for common development tasks.)
*   **Database Documentation:** `DB_Documentation.md` (Detailed information about the database schema.)
*   **Pending Tasks:** `docs/VolunteerVerse Pending Taks.xml` (Overview of current project tasks.)

## Initial Setup & Verification:

- Ensure you have access to and have reviewed the Supabase project and its schema.
- Familiarize yourself with the Next.js framework and the project's UI components in `src/components/ui/`.
- To run the project locally:
    1. Ensure Node.js and npm are installed.
    2. Run `npm ci` to install dependencies.
    3. Set up your Supabase environment variables (refer to `.env.example` if available, or Supabase project settings).
    4. Run `npm run dev` to start the development server.
    5. Run `npm test` to execute tests.

## Workflow:

1.  **Understand Task:** Review the assigned task and any related feature specifications in `specs/`.
2.  **Plan Implementation:** Use `ai_prompts/PLAN_FEATURE_IMPLEMENTATION.md` if applicable.
3.  **Develop:** Write code according to `STYLE_GUIDE.md` and `ARCHITECTURE.md`. Use other `ai_prompts/` templates as needed.
4.  **Test:** Write and run tests.
5.  **Review:** Ensure changes align with all guidelines.
```
