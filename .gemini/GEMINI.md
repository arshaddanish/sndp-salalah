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
