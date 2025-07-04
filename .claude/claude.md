# Claude Code Context for VolunteerVerse Project

This document provides comprehensive context for Claude Code when working on the VolunteerVerse project.

## Build & Test Commands

### Essential Commands
- `npm run build` - Build the Next.js application
- `npm run lint` - Run ESLint for code linting
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run Vitest tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report

### Development Commands
- `npm run dev` - Start development server on port 9002
- `npm run dev:https` - Start development server with HTTPS

### AI-Specific Commands
- `npm run genkit:dev` - Start AI development server
- `npm run genkit:watch` - Start AI development server in watch mode

## Core Principles for AI Collaboration

1. **Understand Before Changing:** Always refer to the documentation in `ai-docs/` and relevant feature specifications in `specs/` before making code changes.
2. **Follow Documented Standards:** Adhere strictly to the guidelines outlined in `ai-docs/STYLE_GUIDE.md` and `ai-docs/ARCHITECTURE.md`.
3. **Use Provided Prompts:** Leverage the prompt templates in `ai_prompts/` for common development tasks to ensure consistency.
4. **Respect Guard Comments:** Pay close attention to `@ai-guard` comments in the code. These mark critical sections or provide specific instructions.
5. **Test Thoroughly:** Any new code or modification must be accompanied by appropriate tests. Ensure all tests pass before considering a task complete.
6. **Incremental Changes:** Make small, incremental changes that are easy to review and test.
7. **Ask When Unsure:** If requirements are unclear or there's a conflict in documentation, ask for clarification rather than making assumptions.

## Key Documentation & Resources

### Primary Documentation
- **Style Guide:** `ai-docs/STYLE_GUIDE.md` (Covers coding style, naming conventions, import boundaries, etc.)
- **Architecture Overview:** `ai-docs/ARCHITECTURE.md` (Explains the project structure, key patterns, and technologies.)
- **Reusable Components:** `ai-docs/REUSABLE_COMPONENTS.md` (Information on shared UI components and hooks.)
- **Data Models & Types:** `ai-docs/DATA_MODELS.md` (Guidance on finding data structures and types; links to DB documentation.)

### Feature Specifications
- **Feature Specifications:** `specs/` (Contains detailed specifications for ongoing and new features. Use `specs/TEMPLATE_FEATURE_SPEC.md` for new features.)
- **Responsive Design Guidelines:** `specs/responsive-design-guidelines.md` (Defines how layouts should adapt across screen sizes and best practices for ensuring responsiveness.)
- **Test Case Specifications:** `specs/TEST_CASES_COMPREHENSIVE.md` (Detailed test cases for modules.)

### Project Management
- **Project Backlog:** `specs/project-backlog/` (Contains `VolunteerVerse Pending Tasks.xml` and `tasks.csv` for high-level task tracking. Individual tasks should ideally be converted to feature specs in the main `specs/` directory.)
- **Prompt Templates:** `ai_prompts/` (Reusable prompts for common development tasks.)

### Database & Setup
- **Database Documentation:** `DB_Documentation.md` (Detailed information about the database schema.)
- **Supabase Guide:** `SUPABASE_CONNECTIVITY_GUIDE.md` (Connectivity and setup instructions.)

## Project Setup & Verification

### Initial Setup
1. Ensure Node.js and npm are installed
2. Run `npm ci` to install dependencies
3. Set up your Supabase environment variables (refer to `.env.example` if available, or Supabase project settings)
4. Run `npm run dev` to start the development server
5. Run `npm run test` to execute tests

### Verification Steps
- Ensure you have access to and have reviewed the Supabase project and its schema
- Familiarize yourself with the Next.js framework and the project's UI components in `src/components/ui/`
- Review the responsive design guidelines before making UI changes

## Development Workflow

1. **Understand Task:** Review the assigned task and any related feature specifications in `specs/`
2. **Plan Implementation:** Use `ai_prompts/PLAN_FEATURE_IMPLEMENTATION.md` if applicable
3. **Develop:** Write code according to `STYLE_GUIDE.md` and `ARCHITECTURE.md`. Use other `ai_prompts/` templates as needed
4. **Test:** Write and run tests using `npm run test`
5. **Quality Check:** Run `npm run lint` and `npm run typecheck` before completion
6. **Review:** Ensure changes align with all guidelines

## Responsive Design Requirements

**Critical Priority:** Ensuring all UI components and page layouts are fully responsive across desktop, tablet, and mobile screen sizes is a critical requirement for this project.

### Key Guidelines
- **Refer to Guidelines:** All development work must adhere to the responsive design principles in `specs/responsive-design-guidelines.md`
- **Test AI Outputs:** Rigorously test outputs on multiple screen sizes (desktop, tablet breakpoints, mobile widths)
- **Assignments Module as Model:** The Volunteer Assignments module (`src/app/app/assignments/`) serves as a good example of responsive data tables
- **Prevent Horizontal Scroll:** The main page content must NOT cause horizontal scrolling. Internal components (like data tables) can have their own scrollbars if necessary, but these must not break the overall page layout
- **Sidebar Interaction:** Content must adapt correctly when the main sidebar is expanded, collapsed, or in mobile (sheet) view

## Technology Stack

### Frontend
- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS with custom components
- **UI Components:** Radix UI primitives with shadcn/ui
- **State Management:** React Query (@tanstack/react-query)
- **Tables:** TanStack Table (@tanstack/react-table)

### Backend & Database
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime subscriptions

### Development Tools
- **Testing:** Vitest with React Testing Library
- **Type Checking:** TypeScript
- **Linting:** ESLint
- **AI Integration:** Google Genkit

## File Structure Highlights

- `src/app/app/` - Main application pages and features
- `src/components/ui/` - Reusable UI components
- `src/lib/` - Utility functions and configurations
- `datatable_solutions/` - DataTable implementation solutions
- `ai-docs/` - AI-specific documentation
- `specs/` - Feature specifications and guidelines
- `ai_prompts/` - Reusable prompt templates

## Critical Files & Directories

### Protected Areas (require careful consideration)
- `Data/` - Database migration scripts and SQL files
- `src/lib/supabase/` - Supabase configuration and utilities
- `src/middleware.ts` - Authentication middleware
- Database schema files in `Data/`

### Key Configuration Files
- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Test configuration

## Common Patterns & Best Practices

### Component Development
- Use TypeScript for all components
- Follow the component structure in `src/components/ui/`
- Implement proper error boundaries and loading states
- Ensure accessibility (ARIA labels, keyboard navigation)

### Data Management
- Use React Query for server state management
- Implement proper error handling for API calls
- Use Supabase RLS policies for security
- Follow database naming conventions

### Testing
- Write unit tests for components and utilities
- Use React Testing Library for component testing
- Implement integration tests for critical user flows
- Maintain test coverage above 80%

## Environment Variables

Ensure these are properly configured:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

## Troubleshooting

### Common Issues
- **Build failures:** Check TypeScript errors with `npm run typecheck`
- **Test failures:** Run `npm run test:run` to see detailed test output
- **Supabase connectivity:** Verify environment variables and network connectivity
- **Responsive issues:** Test on multiple device sizes and check CSS breakpoints

### Debug Tools
- Next.js development server provides detailed error messages
- React Query DevTools for state management debugging
- Supabase dashboard for database queries and logs
- Browser DevTools for responsive design testing