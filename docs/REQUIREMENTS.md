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
- **As an admin**, I want to create, edit, and delete Branches (Shakhas), so I can properly assign members to their respective local units.
- **As an admin**, I want to see a visual indicator (Active/Expired) next to each member's name, so I can instantly know their status without calculating dates in my head.
- **As an admin**, I want to grant a "Lifetime Membership" to a member, so that their status never expires.
- **As an admin**, I want to filter the member list by date ranges (e.g., "Expiring before Dec 2026"), so I can target them for renewal reminders.
- **As an admin**, I want to click a "One-Click Export" button to download my currently filtered list as an Excel spreadsheet, so I can share it with event organizers.

### Key Rules

- **Duplicate Prevention:** Enforced strictly via unique `civil_id_no`.
- **Status Calculation:** "Active" if `expiry` > today OR `expiry` is null (Lifetime). "Expired" if `expiry` < today.
- **Pagination/Performance:** Member lists must be fetched in batches (pagination/infinite scroll) to keep loading times instant.

---

## 2. Finance & Transaction Management

### User Stories

- **As an admin**, I want to record a membership fee payment directly from the Member's Profile, so I don't have to navigate to a separate finance page to renew someone.
- **As an admin**, I want to manually set the new expiry date when entering a membership fee payment, giving me final control over the membership period.
- **As an admin**, I want to record general income (e.g., Donations) and expenses (e.g., Event Costs, Rent) from the Finance module, so all cash flow is tracked in one system.
- **As an admin**, I want to attach a bill, receipt, or screenshot directly to a transaction, so we have audit proof of the payment.
- **As an admin**, I want to view a chronological "Statement List" of all transactions (fees, income, expenses), so I can review the organization's financial health.
- **As an admin**, I want to create, edit, and delete custom Transaction Categories, so I can label cash flow according to our changing organizational needs.
- **As an admin**, I want the system to automatically track "Cash in Hand" and "Cash in Bank" totals, so I always know our current liquidity.
- **As an admin**, I want to generate predefined one-click reports (e.g., Daily Collection Report, Monthly Income/Expense Summary, Category-wise Breakdown), so I don't have to manually apply filters for my most common accounting tasks.
- **As an admin**, I want to search transactions by name, remarks, or amount, and filter by date range or category, so I can generate quick custom financial reports.

### Key Rules

- **Unified Ledger:** All money movement (membership fees, donations, expenses) lives in a single timeline to provide an accurate chronological statement.
- **Liquidity Math:** Transactions must enforce a payment mode (`cash` or `bank`) to accurately calculate the totals. Income adds to the pool, expenses subtract from the pool.
- **Data Integrity:** Transactions must be recorded using standard relational database practices (SQL) to prevent calculation errors.

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
