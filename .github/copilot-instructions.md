# AI Developer Instructions (COPILOT.md)

This file contains repository-specific instructions for the GitHub Copilot assistant. These rules must be followed across all sessions and tasks.

## 1. Documentation-First Approach (Proactive Updates)

- The `/docs` directory is the single source of truth for the project.
- **CRITICAL:** Whenever the user requests a new feature, a change in business logic, or an architectural shift, you MUST proactively update the relevant Markdown files in `/docs` **BEFORE** writing any code.
- Always check and sync the following files if applicable to the request:
  - `docs/REQUIREMENTS.md` (If business logic/user stories change)
  - `docs/DATABASE.md` (If schema changes)
  - `docs/UI.md` (If standard routes or UI components change)
  - `docs/ARCHITECTURE.md` (If core data flow or tech stack changes)

## 2. Technology Stack Enforcement

- **Framework:** Next.js App Router (React Server Components by default).
- **Styling:** TailwindCSS 4 (Utility-first, no external UI libraries unless requested).
- **Database ORM:** Drizzle ORM (PostgreSQL).
- **Authentication:** Auth.js v5 (Credentials Provider).
- **Validation:** Zod (always validate env vars and form inputs).
  > **Note:** Some of these dependencies are planned and will be installed progressively as features are built out.

## 3. Database Design Rules

- Follow the "Unified Ledger Pattern" for finances (use the `transactions` table).
- Enforce strict uniqueness (e.g., `civil_id_no`) at the database level.
- Do not store computed statuses (e.g., Active/Expired). Derive them dynamically (e.g., `expiry > CURRENT_DATE`).
- Use strict ISO precision (`numeric(10,3)`) for all OMR monetary values. Display with 0 decimals on Dashboard/Summaries for visual clarity, but maintain 3 decimals in detailed transaction lists.

## 4. Code Quality & Formatting

- Always use `camelCase` for variables/functions and `PascalCase` for React components.
- Database columns/tables should be strictly `snake_case`.
- Prefer Server Actions over API Routes (`/api`) unless building a public webhook.

## 5. File & Folder Conventions

- **Pages**: `app/(portal)/[feature]/page.tsx` (Server Components)
- **Components**: `src/components/ui/` (reusable) and `src/components/features/` (domain-specific)
- **Server Actions**: `src/lib/actions/[feature].ts`
- **DB Schema**: `src/lib/db/schema.ts`
- **DB Connection**: `src/lib/db/index.ts`
- **Validations**: `src/lib/validations/[feature].ts`
- **Auth Config**: `src/lib/auth/index.ts`
- **Types**: `src/types/[feature].ts`

## 6. Error Handling Pattern

- For expected business failures, Server Actions should return `{ success: boolean; error?: string; data?: T }`.
- Allow framework control-flow throws such as `redirect()` / `notFound()`, and let unexpected failures surface to the route's error handling.
- Use try/catch with Drizzle for database-level constraint violations (e.g., unique `civil_id_no`).
- Log errors server-side with `console.error()` before returning the user-friendly message.

## 7. Next.js Patterns

- **Server Components are the default.** Never add `'use client'` unless the component needs interactivity (forms, click handlers, dropdowns, modals).
- **Data fetching happens in Server Components** — use Drizzle queries directly. Never use `useEffect` + `fetch` for data that can be loaded server-side.
- **Mutations use Server Actions** — defined in `src/lib/actions/` with `'use server'` directive. Call `revalidatePath()` after every mutation.
- **Client Components should be small** — extract only the interactive part into a Client Component in `src/components/`, pass server-fetched data as props.
- **Metadata exports** — every page must export a `metadata` object with `title` and `description` for SEO.

## 8. UI & Design Rules

- **CRITICAL:** Before building ANY UI component, read `docs/DESIGN.md`. This file contains the color palette, typography, component patterns, and anti-patterns.
- Use semantic color tokens (e.g., `--color-accent`, `--color-danger`) — never raw Tailwind colors.
- Use `Inter` font via `next/font/google` — not the default Geist fonts.
- Use `lucide-react` for icons — no other icon library.

## 9. Testing & Validation

- Add TODO comments for unimplemented features or scaffolding code.
- Always validate form inputs using Zod schemas **before** making API calls.
- Use FormData API with `name` attributes for form input handling (not controlled components for simple forms).
- Handle loading and error states gracefully with user-friendly messages.

## 10. Code Review Standards

- Follow ESLint and Prettier rules (configured in project).
- Use semantic HTML and ensure accessibility compliance.
- Avoid duplication — extract reusable utilities and components.
- Add comments only for non-obvious logic.
- Use meaningful variable and function names that self-document the code.

## 11. Collaboration Workflow

- Track multi-step tasks explicitly.
- Confirm file edits and implementation details before proceeding.
- Batch independent reads/operations when tooling supports it.
- Provide brief, fact-based updates on completed work.
- Stop implementation only when the task is fully complete.
