---
description: Scaffolds a new Next.js App Router page with proper structure and design system compliance.
---

1. Ask the user for the route path (e.g., `/members/[id]`) and the page purpose.
2. Read `docs/UI.md` to check if this route is already documented. If not, update it with the new route.
3. Read `docs/DESIGN.md` to understand the visual rules before creating any components.
4. Create the page file at the correct location under `app/(portal)/` as a Server Component.
5. Add proper `metadata` export for the page title.
6. If the page needs data, add Drizzle queries directly in the Server Component.
7. If the page needs interactive elements (forms, dropdowns, modals), create separate Client Components in `src/components/features/[feature]/`.
8. Follow the layout structure from `DESIGN.md`: page title with optional action button, then content area.
9. Run `/verify-build` to confirm no errors.
   // turbo
10. `pnpm run type-check`
