# Frontend Architecture & UI Screens

**Project:** SNDP Salalah Membership Management Portal
**Framework:** Next.js 16 (App Router) + TailwindCSS 4 + React 19

This document serves as a map for developers and AI to understand the required user interfaces and how they map to the Next.js routing structure based on the business requirements.

---

## Screen Routing Map

| Screen Name            | Route Path            | Primary Purpose       | Key Features / KPIs                                                                        |
| ---------------------- | --------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| **Login**              | `/login`              | Authentication        | Secure entry via username/password                                                         |
| **Dashboard**          | `/`                   | High-level summary    | Total Members, Near Expiry Members, Cash in Bank, Cash in Hand, YTD total Income/Expense   |
| **Members List**       | `/members`            | View & Filter members | Visual Active/Expired tags, Date-range filters, **One-Click Excel Export**, Member Search  |
| **Member Profile**     | `/members/[id]`       | Detailed view         | Full demographic info, uploaded photo, personal payment history, **Renew Membership Form** |
| **New Member**         | `/members/new`        | Registration          | Forms with strict validation (Civil ID uniqueness)                                         |
| **Branches (Shakhas)** | `/members/shakhas`    | Setup                 | CRUD management for branch locations                                                       |
| **Finances / Ledger**  | `/finance`            | Statement List        | Unified list of all transactions, custom search & filters.                                 |
| **Record Transaction** | `/finance/new`        | Entry form            | **General Income/Expense only** (Membership fees are paid via Member Profile)              |
| **Finance Categories** | `/finance/categories` | System config         | CRUD operations for Transaction Categories                                                 |
| **Financial Reports**  | `/finance/reports`    | One-click Insights    | Daily Collection, Monthly Summary, Category-wise Breakdown                                 |

---

## Core UI Components / Design System Requirements

_To fulfill the requirement for a "Premium, State-of-the-Art Design":_

1. **Dashboard KPI Cards:** Provide large, clear numbers for the required metrics (Total Members, Cash in Hand). Use color-coding (e.g., green for healthy income, orange for near-expiry warnings).
2. **Dynamic Data Grid (Table):** Used heavily in `/members` and `/finance`. Must support:
   - Client-side or fast server-side pagination.
   - Column sorting.
   - Filtering (by category, by date ranges).
3. **Status Badges:** Tiny visual indicators used globally.
   - **Active:** Green.
   - **Expired:** Red.
   - **Lifetime:** Purple or Gold.
4. **Forms:** Must include strict Zod-based validation before submission to ensure no duplicate Civil IDs or invalid financial math reaches the database. Support file dropzones for receipt/photo uploads.

---

## Liquidity Tracking UI Logic

On the Dashboard and Finances view, the "Cash in Bank" and "Cash in Hand" numbers are derived on the fly:

- **Cash in Hand** = `Total Income (mode: cash) - Total Expense (mode: cash)`
- **Cash in Bank** = `Total Income (mode: bank) - Total Expense (mode: bank)`

_Note: The frontend should never calculate these manually from raw arrays to save memory; it should strictly render the aggregated results provided by the server database query._
