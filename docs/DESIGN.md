# Design System — SNDP Salalah Membership Portal

> This document is the single source of truth for visual design decisions. AI assistants and developers **must** follow these rules when building UI components.

---

## Design Philosophy

This is an **admin portal for organizational leadership**, not a consumer app. The design must feel:

- **Professional & Clean** — no gimmicks, no excessive decoration
- **Data-Dense** — admins need to see a lot of information at once
- **Fast & Scannable** — status should be visible at a glance via color-coding and badges
- **Brand-Aware** — the SNDP union follows a yellow/gold identity; the portal uses warm amber/gold as its accent color

### Legacy Context

The previous system used `#FFF176` (Material Yellow 300) for the sidebar, `#FDFFAB` (pastel yellow) for active states and the login page, and `#423F3F` (warm charcoal) for the header. The new design refines this into a **clean light theme with warm amber/gold accents** — keeping the union's identity while offering excellent readability for daily admin use.

---

## Color Palette

### Core Surfaces

| Token                    | Value     | Usage                              |
| ------------------------ | --------- | ---------------------------------- |
| `--color-bg`             | `#F8F8F8` | Page background (light warm gray)  |
| `--color-surface`        | `#FFFFFF` | Card/panel backgrounds             |
| `--color-surface-hover`  | `#F3F3F3` | Card/row hover states              |
| `--color-surface-raised` | `#FFFFFF` | Modals, dropdowns, popovers        |
| `--color-border`         | `#E5E5E5` | Borders, dividers                  |
| `--color-sidebar-bg`     | `#1C1C1C` | Sidebar background (dark contrast) |

### Text

| Token                            | Value     | Usage                           |
| -------------------------------- | --------- | ------------------------------- |
| `--color-text-primary`           | `#1A1A1A` | Main text                       |
| `--color-text-secondary`         | `#6B7280` | Labels, descriptions, metadata  |
| `--color-text-muted`             | `#9CA3AF` | Placeholders, disabled text     |
| `--color-text-on-dark`           | `#F5F5F5` | Text on sidebar / dark surfaces |
| `--color-text-on-dark-secondary` | `#A0A0A0` | Secondary text on sidebar       |

### Accent (Brand — Amber/Gold)

| Token                   | Value                      | Usage                                            |
| ----------------------- | -------------------------- | ------------------------------------------------ |
| `--color-accent`        | `#D4940A`                  | Primary buttons, active nav items, links         |
| `--color-accent-hover`  | `#B87D08`                  | Button hover, link hover                         |
| `--color-accent-light`  | `#FFF8E7`                  | Accent background tints (selected rows, banners) |
| `--color-accent-subtle` | `rgba(212, 148, 10, 0.10)` | Active sidebar item background                   |
| `--color-accent-border` | `rgba(212, 148, 10, 0.30)` | Active item borders, focus rings                 |

### Semantic Status

| Token                 | Value     | Usage                                         |
| --------------------- | --------- | --------------------------------------------- |
| `--color-success`     | `#16A34A` | Active member badges, income indicators       |
| `--color-success-bg`  | `#F0FDF4` | Success badge background                      |
| `--color-danger`      | `#DC2626` | Expired badges, expenses, destructive actions |
| `--color-danger-bg`   | `#FEF2F2` | Danger badge background                       |
| `--color-warning`     | `#CA8A04` | Near-expiry badges, validation warnings       |
| `--color-warning-bg`  | `#FEFCE8` | Warning badge background                      |
| `--color-lifetime`    | `#7C3AED` | Lifetime membership badge                     |
| `--color-lifetime-bg` | `#F5F3FF` | Lifetime badge background                     |
| `--color-info`        | `#2563EB` | Info badges, notice banners                   |
| `--color-info-bg`     | `#EFF6FF` | Info badge background                         |

> **Rule:** Never use raw Tailwind color classes (e.g., `bg-yellow-500`, `text-red-400`). Always use the semantic tokens above via CSS custom properties or Tailwind `@theme` configuration.

---

## Typography

| Element               | Font  | Size                  | Weight          |
| --------------------- | ----- | --------------------- | --------------- |
| Page title (`h1`)     | Inter | `text-2xl` (1.5rem)   | `font-bold`     |
| Section header (`h2`) | Inter | `text-lg` (1.125rem)  | `font-semibold` |
| Card title (`h3`)     | Inter | `text-base` (1rem)    | `font-semibold` |
| Body text             | Inter | `text-sm` (0.875rem)  | `font-normal`   |
| Table cell            | Inter | `text-sm`             | `font-normal`   |
| Badge/label           | Inter | `text-xs` (0.75rem)   | `font-medium`   |
| KPI number            | Inter | `text-3xl` (1.875rem) | `font-bold`     |

> **Font Loading:** Use `next/font/google` to load **Inter** with `subsets: ['latin']`. Replace the default Geist fonts from the boilerplate.

---

## Component Patterns

### Status Badges

Used for member status. Must be **consistent everywhere** they appear.

```
Active   → bg-success-bg text-success border border-success/20   (green pill)
Expired  → bg-danger-bg  text-danger  border border-danger/20    (red pill)
Lifetime → bg-lifetime-bg text-lifetime border border-lifetime/20 (purple pill)
```

- Shape: `rounded-full px-2.5 py-0.5 text-xs font-medium border`
- Never use square badges. Always pill-shaped.

### KPI Cards (Dashboard)

```
┌─────────────────────────────┐
│  ○ Total Members            │  ← text-secondary, text-xs, with lucide icon
│  1,247                      │  ← text-3xl font-bold text-primary
│  ↑ 12 this month            │  ← text-xs text-success (or text-danger for negative)
└─────────────────────────────┘
```

- Background: `--color-surface` (white)
- Border: `border border-border rounded-xl`
- Padding: `p-6`
- No heavy shadows. Use `shadow-sm` or subtle borders for depth.

### Data Tables

- Header row: `bg-[#FAFAFA] text-secondary text-xs font-medium uppercase tracking-wider border-b border-border`
- Body rows: `bg-surface border-b border-border hover:bg-surface-hover transition-colors`
- Row height: `py-3 px-4` (compact, dense)
- Always include a status badge column for members
- Actions column (right-aligned): icon buttons only (view, edit, delete)
- Support sorting arrows on column headers

### Forms

- Input styling: `bg-white border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted focus:ring-2 focus:ring-accent focus:border-accent outline-none`
- Labels: `text-sm font-medium text-secondary mb-1.5`
- Error messages: `text-xs text-danger mt-1`
- Group related fields with `<fieldset>` and a `text-sm font-semibold text-primary mb-3` legend
- Buttons:
  - Primary: `bg-accent hover:bg-accent-hover text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors`
  - Secondary: `bg-white border border-border hover:bg-surface-hover text-primary rounded-lg px-4 py-2 text-sm font-medium`
  - Danger: `bg-danger-bg hover:bg-danger/10 text-danger border border-danger/20 rounded-lg px-4 py-2 text-sm font-medium`

### Sidebar Navigation

- Width: `w-64` (fixed)
- Background: `--color-sidebar-bg` (dark — provides contrast with the light content area)
- Active link: `bg-accent-subtle text-accent font-medium border-l-2 border-accent`
- Inactive link: `text-on-dark-secondary hover:text-on-dark hover:bg-white/5`
- Section dividers: `border-t border-white/10 my-2`
- Icons: `lucide-react`, 18px, same color as link text
- The dark sidebar against a light content area creates a clear visual hierarchy

---

## Layout Rules

- **Max width:** Full-width sidebar layout (no `max-w-*` container on the main content area — admins need screen real estate)
- **Page structure:**
  ```
  ┌──────────┬──────────────────────────────────┐
  │  (dark)  │  Page Title          [Action Btn] │
  │  Sidebar │  ────────────────────────────────  │
  │  (fixed) │                                    │
  │          │  Page Content (light bg)            │
  │          │                                    │
  └──────────┴──────────────────────────────────┘
  ```
- **Spacing:** `gap-6` between major sections, `gap-4` between related items, `gap-2` for tight groupings
- **Responsive:** Sidebar collapses to a hamburger on `< md` breakpoints

---

## Anti-Patterns (What NOT to Do)

> [!CAUTION]
> Violating these rules produces "slop UI." The AI must avoid these patterns.

1. **No gradients on backgrounds** — Use flat, solid colors only
2. **No heavy box shadows** — Use `shadow-sm` or borders for depth
3. **No rounded-3xl or excessive rounding** — Max rounding: `rounded-xl` for cards, `rounded-lg` for inputs
4. **No animated gradients or glassmorphism** — This is an admin tool, not a landing page
5. **No placeholder/lorem ipsum** — Always use realistic data (e.g., "Mohammed Al-Rashidi", "Civil ID: 12345678")
6. **No hero sections or marketing layouts** — Every pixel serves a data purpose
7. **No generic icons** — Only `lucide-react`, and only where they add scannability
8. **No floating action buttons** — All actions are contextual (table row actions, page header buttons)
9. **No confirmation modals for non-destructive actions** — Only confirm deletes
10. **No pure yellow (`#FFFF00`) backgrounds** — Use the amber/gold accent subtly, not as a full-surface color
