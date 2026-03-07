# AI Developer Instructions (GEMINI.md)

This file contains repository-specific instructions for the Antigravity AI assistant. These rules must be followed across all sessions and tasks.

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

## 3. Database Design Rules

- Follow the "Unified Ledger Pattern" for finances (use the `transactions` table).
- Enforce strict uniqueness (e.g., `civil_id_no`) at the database level.
- Do not store computed statuses (e.g., Active/Expired). Derive them dynamically (e.g., `expiry > CURRENT_DATE`).
- Use strict financial precision (`numeric(10,2)`) for all money values.

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

- Server Actions must return `{ success: boolean; error?: string; data?: T }`.
- Never throw from Server Actions; always return structured responses.
- Use try/catch with Drizzle for database-level constraint violations (e.g., unique `civil_id_no`).
- Log errors server-side with `console.error()` before returning the user-friendly message.

## 7. Next.js Patterns

- **Server Components are the default.** Never add `'use client'` unless the component needs interactivity (forms, click handlers, dropdowns, modals).
- **Data fetching happens in Server Components** — use Drizzle queries directly. Never use `useEffect` + `fetch` for data that can be loaded server-side.
- **Mutations use Server Actions** — defined in `src/lib/actions/` with `'use server'` directive. Call `revalidatePath()` after every mutation.
- **Client Components should be small** — extract only the interactive part into a Client Component in `src/components/`, pass server-fetched data as props.
- **Metadata exports** — every page must export a `metadata` object with `title` and `description` for SEO.

## 8. UI & Design Rules

- **CRITICAL:** Before building ANY UI component, you MUST read `docs/DESIGN.md`. This file contains the color palette, typography, component patterns, and anti-patterns.
- Use semantic color tokens (e.g., `--color-accent`, `--color-danger`) — never raw Tailwind colors.
- Use `Inter` font via `next/font/google` — not the default Geist fonts.
- Use `lucide-react` for icons — no other icon library.
