# Requirements & User Stories

**Project:** SNDP Salalah Membership Management Portal
**Target Users:** Super Admins (Board Members / Organization Administrators)

---

## 1. Membership Management

### User Stories

- **As an admin**, I want to register a new member with their personal details, civil ID, passport, and family information, so the organization has an accurate directory.
- **As an admin**, I want the system to block registrations if a Civil ID is already in use, so that duplicate member records are prevented.
- **As an admin**, I want to view a list of all members, so I can see the total membership base.
- **As an admin**, I want to search for specific members by name, phone, civil ID, or email, so I can quickly pull up an individual's profile.
- **As an admin**, I want to remove incorrect member records safely with confirmation, so I can either delete records that have no linked transactions or archive records that already have transaction history.
- **As an admin**, I want to create, edit, and delete Branches (Shakhas), so I can properly assign members to their respective local units.
- **As an admin**, I want to see a count of members assigned to each Shakha in the list, so I can understand the size of each branch at a glance.
- **As an admin**, I want to edit a Shakha's name, and if the Shakha already has members assigned, I want to be warned that the change will affect their branch labels throughout the system.
- **As an admin**, I want deletion of a Shakha to be blocked when members are assigned to it, so I do not accidentally orphan member assignments.
- **As an admin**, I want to see a visual indicator (Pending/Active/Expired/Lifetime) next to each member's name, so I can instantly know a member's lifecycle state without manual checks.
- **As an admin**, I want to grant a "Lifetime Membership" to a member, so that their status never expires.
- **As an admin**, I want to filter the member list by date ranges (e.g., "Expiring before Dec 2026"), so I can target them for renewal reminders.
- **As an admin**, I want to click a "One-Click Export" button to download my currently filtered list as an Excel spreadsheet, so I can share it with event organizers.
- **As an admin**, I want to export a member card PDF directly from the member profile, so I can print the same front and back card for a single member when needed.

### Key Rules

- **Duplicate Prevention:** Enforced strictly via unique `civil_id_no`.
- **Status Calculation:**
  - `Pending` if `expiry` is null and lifetime is not enabled.
  - `Active` if `expiry` > today and lifetime is not enabled.
  - `Near Expiry` if `expiry` is within the next 30 days and lifetime is not enabled.
  - `Expired` if `expiry` < today and lifetime is not enabled.
  - `Lifetime` if lifetime is explicitly enabled for the member.
- **Members Activity Window Filter:** Members list date filtering is based on membership activity window bounds, not member creation date. The filter UI uses `Active From` and `Active Until`.
- **Activity Window Matching Rule:** A member matches only when they are active for the full selected window. This means membership period start is on or before the selected start date, and membership expiry is on or after the selected end date.
- **Activity Window Eligibility Rule:** When either activity-window bound is set, only members with non-null activity period fields (`active_from`, `expiry`) and non-lifetime status participate in date matching. `Pending` and `Lifetime` members are excluded from the date-filtered result set.
- **Pagination/Performance:** Member lists must be fetched in batches (pagination/infinite scroll) to keep loading times instant.
- **Member Archival Rule:** If a member has linked transactions, the system must offer archive instead of hard delete to preserve ledger integrity.
- **Archived Visibility Rule:** Archived members are hidden from normal member list/profile UI flows.
- **Shakha Deletion Guard:** A Shakha can be deleted only when it has zero assigned members. Members must be deleted or reassigned before deleting the Shakha.
- **Shakha Name Uniqueness:** Shakha names must be unique after trimming whitespace and applying case-insensitive comparison.

### Add Member (v1) Scope

- **Entry Point:** Full page route `/members/new` (not a modal).
- **Submission Model:** Single submit for all sections (personal, family, India unit, office-use).
- **Success Navigation:** Redirect to `/members/[member_code]` after successful creation.
- **Member ID Assignment:** Internal database `id` is assigned server-side and used only for backend relations; profile URLs must use `member_code`.
- **Member Profile Route Resolution:** Member profile URLs resolve using numeric `member_code` only.
- **Member Profile URL Policy:** Internal database `id` must not appear in member-facing profile/edit URLs.
- **Photo Requirement:** Member photo is mandatory in phase 1.
- **India Unit District Field:** District is selected from a fixed Kerala district list in the form, not free text.
- **Family Oman Flag Placement:** `Family residing in Oman?` appears inside the General Details section (not as a separate subsection).
- **Family Entry UI:** Family Members is a separate standalone section and is independent from the Oman-family flag. The section supports zero or more rows using an inline repeater with fields:
  - `name` (required)
  - `relation` (dropdown)
  - `dob` (date)
- **Expiry Handling on Create:** Add Member does not set expiry. New members start as `Pending` until membership is registered from profile actions.
- **Member Card Entry Point:** Member card export starts from the member profile action area only. Batch member-card export is out of scope for this phase.
- **Member Card Output Rule:** Member card export produces a downloadable PDF containing the front and back card as separate pages.
- **Member Card Filename Rule:** The downloaded PDF filename must be the member's `member_code`.
- **Member Card Reference Rule:** The current implementation must follow the legacy member-card print flow for the front side and the approved sample card for front/back visual parity.

---

## 2. Finance & Transaction Management

### User Stories

- **As an admin**, I want to record a membership fee payment directly from the Member's Profile, so I don't have to navigate to a separate transactions page to register a first-time membership or renew an existing one.
- **As an admin**, I want to manually set the new expiry date when entering a membership fee payment, giving me final control over the membership period.
- **As an admin**, I want to set or remove Lifetime membership from the member profile, so lifetime state is explicit and does not rely on an empty expiry value.
- **As an admin**, I want to record general income (e.g., Donations) and expenses (e.g., Event Costs, Rent) from the Transactions module, so all cash flow is tracked in one system.
- **As an admin**, I want to set opening balances for Cash and Bank separately, so the ledger starts from the organization's real starting position without classifying it as income or expense.
- **As an admin**, I want to attach a bill, receipt, or screenshot directly to a transaction, so we have audit proof of the payment.
- **As an admin**, I want to view a chronological "Statement List" of all transactions (fees, income, expenses), so I can review the organization's financial health.
- **As an admin**, I want to create, edit, and delete custom Transaction Categories, so I can label cash flow according to our changing organizational needs.
- **As an admin**, I want the system to automatically track "Cash in Hand" and "Cash in Bank" totals, so I always know our current liquidity.
- **As an admin**, I want to generate predefined one-click reports (e.g., Daily Collection Report, Monthly Income/Expense Summary, Category-wise Breakdown), so I don't have to manually apply filters for my most common accounting tasks.
- **As an admin**, I want a data-heavy Reports page with a date-range income/expense view and fund-account (cash vs bank) split, so I can analyze performance deeply without duplicating dashboard widgets.
- **As an admin**, I want to search transactions by transaction code or remarks, and filter by category, type, payment mode, and date range, so I can generate quick custom financial reports.

### Key Rules

- **Unified Ledger:** All money movement (membership fees, donations, expenses) lives in a single timeline to provide an accurate chronological statement.
- **Membership Registration Rule:** The first membership action on profile is `Register Membership`, which sets initial expiry. Subsequent actions are `Renew Membership` and update expiry.
- **Liquidity Math:** Each transaction captures two independent fields: `payment_mode` (how the payment was made: cash, bank, online_transaction, or cheque) and `fund_account` (which organisational account the money belongs to: cash or bank). These fields are independent — a bank cheque can be recorded against the cash fund, for example. Running balances are tracked separately per fund account; income adds to its fund pool and expenses subtract from it.
- **Opening Balance Rule:** Opening balance is a dedicated ledger entry kind and must not be classified under `income` or `expense`. It affects running balances but is excluded from income/expense totals and hidden from the statement list rows.
- **Opening Balance Code Rule:** Opening balances use reserved fixed codes (`cash` = `999`, `bank` = `1000`) and do not consume regular transaction codes.
- **Opening Balance Edit Rule:** Cash and Bank opening balances are editable. If an opening balance already exists for a fund account, saving from the opening balance dialog updates that entry instead of blocking the user.
- **Party Field Rule:** Transaction records keep both party fields (`payee_merchant` and `paid_receipt_by`) visible in the form for consistent data entry. Both fields are optional for general transactions.
- **Data Integrity:** Transactions must be recorded using standard relational database practices (SQL) to prevent calculation errors.
- **Transaction Attachment Rule:** Attachments are optional, private by default, and accessed only using short-lived pre-signed URLs.
- **Transaction Attachment Validation Rule:** Allowed attachment types are `application/pdf`, `image/jpeg`, and `image/png`. Default max file size is 1 MB and is configurable via `ATTACHMENT_MAX_BYTES`.
- **Reports Iteration Rule:** The current `/reports` iteration includes date-range summary metrics, period net amount, transaction-count context, fund-account (cash vs bank) income/expense/net breakdown, a monthly income-vs-expense chart, and full category breakdowns for both income and expense.
- **Reports Non-Duplication Rule:** Reports must not duplicate dashboard-only widgets (member KPIs, cash-in-hand, cash-in-bank, average/savings summary blocks).
- **Reports Period Semantics Rule:** Fund-account analytics in reports are period-based over the selected date window and must not be presented as current liquidity snapshot balances.

---

## 3. Admin Dashboard & Reporting

### User Stories

- **As an admin**, I want to see a Dashboard overview when I log in, giving me instant insights into the organization's health.
- **As an admin**, I need the dashboard to show:
  - Total internal Member Count
  - Near Expiry Member Count (e.g., expiring within next 30 days)
  - Total Cash in Hand
  - Total Cash in Bank
  - Year-to-Date (YTD) Income vs Expenses

---

## 4. System Administration

### User Stories

- **As a super admin**, I want to log in using a secure username and password, so unauthorized persons cannot access member data.
- **As a super admin**, I want to manage custom Roles (e.g., 'Data Entry', 'Viewer') with specific permissions, so I can restrict what other admins can see or edit (Role-Based Access Control).
