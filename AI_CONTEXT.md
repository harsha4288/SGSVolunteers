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
*   **Responsive Design Guidelines:** `/specs/responsive-design-guidelines.md` (Defines how layouts should adapt across screen sizes and best practices for ensuring responsiveness.)
*   **Test Case Specifications:** `specs/TEST_CASES_COMPREHENSIVE.md` (Detailed test cases for modules.)
*   **Project Backlog:** `specs/project-backlog/` (Contains `VolunteerVerse Pending Tasks.xml` and `tasks.csv` for high-level task tracking. Individual tasks should ideally be converted to feature specs in the main `specs/` directory.)
*   **Prompt Templates:** `ai_prompts/` (Reusable prompts for common development tasks.)
*   **Database Documentation:** `DB_Documentation.md` (Detailed information about the database schema.)

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

## Responsive Design (New Section)

**Critical Priority:** Ensuring all UI components and page layouts are fully responsive across desktop, tablet, and mobile screen sizes is a critical requirement for this project.

*   **Refer to Guidelines:** All development work, whether manual or AI-assisted, must adhere to the responsive design principles and examples outlined in `/specs/responsive-design-guidelines.md`.
*   **Test AI Outputs:** If using AI to generate UI components or layouts, rigorously test the outputs on multiple screen sizes (desktop, common tablet breakpoints, and mobile phone widths).
*   **Assignments Module as Model:** The Volunteer Assignments module (`src/app/app/assignments/`) serves as a good example of handling complex data tables responsively.
*   **Prevent Horizontal Scroll:** The main page content must NOT cause horizontal scrolling. Internal components (like data tables) can have their own scrollbars if necessary, but these must not break the overall page layout.
*   **Sidebar Interaction:** Content must adapt correctly when the main sidebar is expanded, collapsed, or in its mobile (sheet) view.
```
