# Finance Implementation Plan

Date: 2026-03-21

This plan is a persistent implementation map for the Finance and Transaction Management module.

## Scope

In scope:

- Transaction Categories CRUD
- Transactions Statement List
- Record Transaction form (general income/expense)

Out of scope for this plan:

- Membership fee flow from member profile (separate plan)
- Reports page implementation
- Real DB/Drizzle integration and S3 upload wiring (phase 2)

## Route Base

- Use `/transactions` as the module base route.
- Categories: `/transactions/categories`
- Statement list: `/transactions`
- Create transaction: dialog on `/transactions` (no dedicated sub-route)

## Phased Delivery

### Phase 1: Categories CRUD

- Types, mock data, and Zod schemas
- Server actions for fetch/create/update/delete
- Seed system category: `Membership Fee`
- System category server guards (cannot delete/rename)
- Table + create/edit/delete dialogs

Expected UX rules:

- System categories show a lock indicator in Actions
- Edit Save/Update stays disabled until form is dirty
- While mutation is pending, dialogs block all close paths

### Phase 2: Statement List

Iteration A (current batch):

- Transaction types and mock dataset
- Server action for paginated listing
- Statement table at `/transactions`
- URL-synced pagination

Iteration B (next batch):

- ✅ Search: free-text query over transaction code and remarks
- ✅ Filters backend: category, type, fund account, date range (all URL-synced, code ready)
- ✅ Search/filter behavior: changing any search/filter value resets pagination to page 1
- ✅ Remarks preview cap: 30 characters with full-text tooltip
- ✅ Liquidity summary: Cash in Hand, Cash in Bank
- ✅ URL-synced filters
- ✅ Filter UI: Category, type, fund account, and date-range controls are visible and URL-synced on `/transactions`.
- ✅ Transaction Detail Drawer: clicking a table row opens a read-only side drawer showing all transaction fields.
- ✅ Balance presentation: statement list balance column shows consolidated liquidity (`cash + bank`) per row, and the detail drawer shows both cash and bank running balances with impacted fund emphasis.

### Phase 3: Record Transaction

- Zod schema for transaction payload
- Create action and list revalidation
- Form for category, type, amount, mode, date, remarks
- Edit/delete integration from list
- Form scope and UX rules:
  - General income/expense only (membership fee flow is handled from member profile scope)
  - OMR amount input with up to 3 decimal precision and an inline `OMR` prefix treatment
  - Type toggle (income/expense) with category dropdown filtered by selected type
  - Exclude system categories from selectable options in this form
  - Party details use two separate text fields: `Payee / Merchant` and `Paid / Receipt By`; both are always visible and optional
  - Reference File input: optional file attachment (image or PDF) for a receipt or bill; stored as `attachmentKey` on the transaction record
  - Entry point: dialog on `/transactions` header (no dedicated `/transactions/new` route)
  - **Cancel**: closes the dialog
  - **Save Transaction**: saves and closes the dialog
  - **Save and Add Another**: saves, resets all form fields, and keeps the dialog open for rapid sequential entry
  - Pending close lock: Cancel, X icon, overlay click, and Escape all blocked while mutation is in flight

## Cross-Cutting Rules

- Keep server-side guards for protected operations even when UI hides actions.
- Use metadata on all new/updated pages.
- Follow dialog consistency from CRUD patterns:
  - Dirty-state submit disable for edit flows
  - Pending-state close lock (cancel, close icon, overlay, Escape)
  - Enter key submits edit forms via `<form onSubmit>`
- Validate all user input with Zod before mutation.

## Verification Checklist

- Lint/type checks for touched files
- Manual checks for action visibility by role/type
- Manual checks for dirty-state submit gating
- Manual checks for pending-state close blocking
- Manual checks for pagination/filter URL sync
