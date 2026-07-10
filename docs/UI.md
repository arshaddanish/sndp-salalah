# Frontend Architecture & UI Screens

**Project:** SNDP Salalah Membership Management Portal
**Framework:** Next.js 16 (App Router) + TailwindCSS 4 + React 19

This document serves as a map for developers and AI to understand the required user interfaces and how they map to the Next.js routing structure based on the business requirements.

---

## Screen Routing Map

| Screen Name             | Route Path                 | Primary Purpose       | Key Features / KPIs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | -------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Login**               | `/login`                   | Authentication        | Secure entry via username/password                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Dashboard**           | `/`                        | High-level summary    | Total Members, Near Expiry Members, Cash in Bank, Cash in Hand, YTD total Income/Expense                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Members List**        | `/members`                 | View & Filter members | Visual Pending/Active/Expired/Lifetime tags, Shakha/Branch labels, activity-window filters (`Active From`, `Active Until`), One-Click Excel Export, Member Search (archived members are hidden from normal list views)                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Member Profile**      | `/members/[id]`            | Detailed view         | Full demographic info, inline-editable photo (camera badge on profile header — no navigation required), renewal-critical summary in header card, page-level action controls near breadcrumb, personal payment history, **Register/Renew Membership Form** (`Register Membership` when expiry is empty and member is not lifetime; otherwise `Renew Membership`), explicit **Set/Remove Lifetime Membership** action, **Export Member Card PDF** action for a single member, delete/archive action with confirmation (members with linked transactions are archived). Route segment uses numeric `member_code` in URLs; internal DB `id` is not exposed in browser URLs. |
| **New Member**          | `/members/new`             | Registration          | Full sectioned form, inline family repeater, mandatory photo, strict validation (Civil ID uniqueness), redirect to member profile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Branches (Shakhas)**  | `/shakhas`                 | Setup                 | CRUD management for branch locations; create Shakha from the page header dialog; view member count per Shakha; edit Shakha name with confirmation when members are assigned; delete Shakha with confirmation and member-assignment guard                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Finances / Ledger**   | `/transactions`            | Statement List        | Unified list of all transactions. Iteration A ships paginated list first; Iteration B adds custom search/filters and liquidity cards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Record Transaction**  | `/transactions` (dialog)   | Entry dialog          | **General Income/Expense only** (Membership fees are paid via Member Profile); triggered from the Transactions list page header                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Set Opening Balance** | `/transactions` (dialog)   | Setup dialog          | Separate dialog for `cash`/`bank` opening balances; not classified as income or expense                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Finance Categories**  | `/transactions/categories` | System config         | CRUD operations for Transaction Categories; includes read-only Transactions usage-count column per category                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Financial Reports**   | `/reports`                 | Filtered Insights     | Data-heavy date-range analytics: summary KPI strip, fund-account (cash vs bank) breakdown, monthly trend chart, top category breakdown                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

---

## Developer Utilities

- **Server Actions Playground (dev-only):** `/actions`
  - Purpose: Internal developer workbench to execute Server Actions quickly, inspect responses, and speed up backend iteration.
  - Availability: Hidden from navigation; available only when `NODE_ENV` is not `production`.
  - Visual mode: route-scoped dark/light themes with dark as the default, isolated to `/actions` only.
  - Theme behavior: manual toggle in the workbench header with local persistence so the selected mode survives reloads.
  - Visual direction: VS Code-style neutral surfaces with blue interaction accents and compact spacing.
  - Layout behavior: full-bleed presentation within the dev layout (no outer white frame around the workbench).
  - Layout and interaction model:
    - Left navigation rail for category switching, with quick access to recent and favorite actions.
    - Request editor panel for JSON payload editing, formatting, reset, copy, and run controls.
    - Response inspector panel with pretty-printed output, run status, copy support, and timestamp metadata.
    - Dense desktop-first layout that stacks predictably on mobile while preserving full keyboard access.
  - DX utility behaviors:
    - Session history tracks recent runs (action, time, success/failure, payload snapshot).
    - Favorites can be pinned for frequently used actions.
    - Keyboard shortcuts are provided for run, focus editor, and JSON formatting.
    - Parse and schema errors are shown inline using the shared field-error pattern.
    - Response updates announce through `aria-live` for accessibility.

---

## Transactions Statement List Notes

- Route: `/transactions`
- **Column order:** Code | Date | Category | Type | Fund Account | Amount | **Balance** | Remarks
- **Opening entries in list:** Opening balance rows are hidden from the visible statement list.
- **Amount emphasis:** Amount is shown as a signed value with semantic color. Income displays `+` (success color), expense displays `-` (danger color).
- **Balance column:** Shows consolidated liquidity at that point in time (`cash balance + bank balance`). The balances are computed in true ledger direction (oldest to newest), then displayed on a newest-first list.
- **Balance visibility rule:** Balance column is always visible, including filtered/search views.
- **Filtered-view interpretation:** Balance remains a global ledger balance; filters only narrow visible rows. Therefore balances can jump between adjacent filtered rows when hidden transactions exist between them.
- Search behavior: free-text search targets transaction code and remarks.
- Filter behavior: use structured filters for category, type, fund account, and transaction date range.
- Remarks preview behavior: show a single-line preview in the table and truncate values longer than 30 characters with ellipsis.
- Full remarks behavior: hovering a truncated remarks value must show the full remarks text in a tooltip.
- Long-token resilience: tooltip content must wrap long unbroken strings (for example IDs, URLs, or token-like values) without horizontal overflow.

## Transaction Detail Drawer Notes

## Record Transaction Form Notes

- Entry point: dialog triggered from the **New Transaction** button in the `/transactions` page header. There is no dedicated `/transactions/new` route.
- Scope: records only general income/expense transactions.
- Opening balances are entered from a separate **Set Opening Balance** dialog and are not part of this form.
- Membership fee handling: membership fee entries are created from the member profile flow and are not part of this form.
- Currency: all amounts use OMR formatting with up to 3 decimal places (`0.000`).
- Type toggle: form starts with `Income` selected and supports `Income`/`Expense` switching.
- Category behavior: category dropdown shows only categories matching the selected type and excludes system categories (including Membership Fee).
- Payment mode options: `Cash`, `Bank`, `Online Transaction`, and `Cheque`.
- Party fields: the dialog always shows both party fields: `Payee / Merchant` and `Paid / Receipt By`. Both fields are optional.
- Remarks: optional, max 500 characters, shown as a compact 2-row textarea without a live character counter.
- Reference File: optional file attachment (JPEG/PNG/PDF) for a receipt or bill. Uploaded directly to S3 using a pre-signed PUT URL, then stored as `attachmentKey` on the transaction record.
- Attachment size rule: default maximum 1 MB per file (`ATTACHMENT_MAX_BYTES`).
- Actions:
  - **Cancel**: closes the dialog without saving.
  - **Save Transaction**: saves and closes the dialog.
  - **Save and Add Another**: saves the current entry, resets all form fields, and keeps the dialog open for rapid sequential entry.

## Reports Screen Notes

- Route: `/reports`
- Layout: single-page, medium-heavy analytics density with clear sectioning.
- Section order:
  - Date-range filter and page heading.
  - Summary KPI strip (income, expense, period net, transaction counts, average values).
  - Fund-account analytics block for `Cash Fund` and `Bank Fund` showing period income, period expense, and period net.
  - Monthly income-vs-expense chart.
  - Category breakdowns (income and expense, full list).
- Non-duplication rule: reports remain period-analysis only and must not repeat dashboard-only snapshot widgets.
- Fund-account semantics: `Cash Fund`/`Bank Fund` values in reports are calculated for the selected date window, not current ledger snapshot balances.

## Core UI Components / Design System Requirements

_To fulfill the requirement for a "Premium, State-of-the-Art Design":_

1. **Dashboard KPI Cards:** Provide large, clear numbers for the required metrics (Total Members, Cash in Hand). Use color-coding (e.g., green for healthy income, orange for near-expiry warnings).
2. **Dynamic Data Grid (Table):** Used heavily in `/members` and `/shakhas`. Must support:
   - Client-side or fast server-side pagination.
   - Column sorting.
   - Filtering (by category, by date ranges).
   - Server-derived aggregates (e.g., member count per Shakha) rendered without client-side calculation.
   - Composition architecture: screens should render `DataTableBase` directly and attach `DataTablePagination` only when needed.
   - Shared state wiring: pagination-capable screens should use the `useDataTableInstance` hook to configure TanStack table state and actions.
3. **Edit Dialogs (Modal):** Used for inline CRUD. Example: Shakha name editing with an input field, warning message when members are assigned, and confirmation required before save.
4. **Create Dialogs (Modal):** Page-header create actions should open a lightweight modal form. For Shakhas, the dialog only requests the shakha name and must block trimmed case-insensitive duplicates.
5. **Delete Confirmation Dialogs:** Destructive actions must use a confirmation modal. For Shakha deletion, the modal blocks the delete action if assigned member count is greater than zero and instructs the admin to delete/reassign members first.
6. **Status Badges:** Tiny visual indicators used globally.
   - **Pending:** Info/blue.
   - **Active:** Green.
   - **Expired:** Red.
   - **Lifetime:** Purple or Gold.
7. **Forms:** Must include strict Zod-based validation before submission to ensure no duplicate Civil IDs or invalid financial math reaches the database. Support file dropzones for receipt/photo uploads.

### New Member Page (v1)

- Route: `/members/new`
- Container: full page Server Component with a dedicated interactive Client form component.
- Submission: one save action for all sections.
- Sections:
  - General details (does not display Member ID in the form and includes the `Family residing in Oman?` question in the same section layout).
  - Family Members as a separate standalone section with inline repeater rows (`name`, `relation`, `dob`) that supports zero or more entries and is not gated by the Oman-family flag.
  - SNDP India unit details, including a district dropdown populated with the fixed Kerala district list from the legacy workflow.
  - Office-use fields.
- Validation:
  - Mandatory photo in phase 1.
  - Duplicate `civil_id_no` blocked.
- Membership state:
  - Expiry is not captured in Add Member form.
  - New members are created as `Pending`.
- Success behavior: redirect to `/members/[member_code]`.

## Member Profile Delete Notes

- Route resolution: profile lookups accept numeric `member_code` in `/members/[id]`.
- URL policy: member-facing profile and edit routes must keep `member_code` in the URL.
- Archived guard: archived members remain inaccessible from profile route and resolve to not found.

- Delete button location: profile header actions section.
- Confirmation dialog: destructive confirmation before deleting a member.
- Linked-transactions guard: block deletion and show an inline error when transactions reference the member.
- Pending mutation lock: disable cancel, overlay close, and Escape while delete is in progress.
- Success behavior: close dialog and navigate to `/members`.

## Member Profile Payment History Notes

- The embedded payment history on `/members/[id]` displays all retrieved member renewal entries in a single table view.
- Loading failures must render an explicit error state distinct from an empty history.
- The profile header should surface renewal-critical context such as the current expiry value without requiring admins to scan the office-use section first.
- The primary payment action on `/members/[id]` is state-aware:
  - **Register Membership** appears when `expiry` is empty and lifetime is not enabled.
  - **Renew Membership** appears for registered members with an expiry date.
- Lifetime is an explicit member action on `/members/[id]` (`Set Lifetime Membership` / `Remove Lifetime Membership`) and is independent from membership payment history.

## Member Card Export Notes

- Entry point: action in the `/members/[id]` page-level actions cluster.
- Scope: single member only in this phase.
- Output: downloadable PDF only; browser print is not the primary user flow.
- File naming: the downloaded file name is the numeric member code (for example `1809.pdf`).
- PDF structure: front card on page 1 and back card on page 2.
- Rendering approach: a hidden off-screen card render target is acceptable when used only to generate the PDF.
- Layout target: follow the approved sample ratio and legacy front-card contract; avoid responsive reflow inside the exported card itself.
- Missing data behavior: export must still succeed for members with no photo, no family members, or pending/no-expiry membership.

---

## Opening Balance UI Logic

- Opening balance uses a dedicated dialog with fields: `fundAccount`, `amount`, `transactionDate`, and optional `remarks`.
- If an opening balance already exists for the selected fund account, the dialog pre-fills the existing values and allows updating them.
- Opening balance uses reserved fixed transaction codes internally (`cash` = `999`, `bank` = `1000`), while regular transaction codes begin from `1001`.
- It has no category, payment mode, or party (`Payee / Merchant` / `Paid / Receipt By`) fields.
- Opening balance rows affect running balances but are excluded from visible statement rows and standard income/expense analytics.
