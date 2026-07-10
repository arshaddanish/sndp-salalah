# Migration Strategy — MongoDB to PostgreSQL

> Migrating existing data from the legacy MongoDB database to the new PostgreSQL database.

---

## Overview

| Aspect       | Legacy                   | New                      |
| ------------ | ------------------------ | ------------------------ |
| **Database** | MongoDB                  | PostgreSQL 16            |
| **ORM**      | Mongoose                 | Drizzle ORM              |
| **Backend**  | Express.js               | Next.js Server Actions   |
| **Frontend** | React (CRA)              | Next.js App Router       |
| **Images**   | AWS S3 (public-read ACL) | AWS S3 (pre-signed URLs) |

---

## Collection → Table Mapping

| MongoDB Collection    | PostgreSQL Table | Notes                                                    |
| --------------------- | ---------------- | -------------------------------------------------------- |
| `membermodels`        | `members`        | See field mapping below                                  |
| `family_membermodels` | `family_members` | Add `member_id` FK (was ObjectId array in member doc)    |
| `shakhamodels`        | `shakhas`        | `shakha_name` → `name`                                   |
| `adminmodels`         | `users`          | `username` → `email`; `hashedPassword` → `password_hash` |
| `member_codemodels`   | _(removed)_      | Replaced by PG sequence on `members.member_code`         |
| `usermodels`          | _(removed)_      | Empty/unused collection                                  |
| _(new)_               | `payments`       | New table for membership fee tracking                    |
| _(new)_               | `transactions`   | New table for income/expense bookkeeping                 |

### Member Field Mapping

| MongoDB Field                | PostgreSQL Column   | Transform                                                                 |
| ---------------------------- | ------------------- | ------------------------------------------------------------------------- |
| `_id`                        | `id`                | Generate new `cuid()`, keep mapping                                       |
| `member_code`                | `member_code`       | Preserve existing codes                                                   |
| `name`                       | `name`              | Direct                                                                    |
| `DOB`                        | `dob`               | Date conversion                                                           |
| `profession`                 | `profession`        | Direct                                                                    |
| `email_id`                   | `email`             | Direct                                                                    |
| `photo`                      | `photo_key`         | **Extract S3 key from full URL**                                          |
| `GSM_no`                     | `gsm_no`            | Direct                                                                    |
| `WhatsApp_no`                | `whatsapp_no`       | Direct                                                                    |
| `blood_group`                | `blood_group`       | Direct                                                                    |
| `family_status`              | `family_status`     | Direct                                                                    |
| `residential_area`           | `residential_area`  | Direct                                                                    |
| `passport_no`                | `passport_no`       | Direct                                                                    |
| `civil_id_no`                | `civil_id_no`       | Direct                                                                    |
| `address_in_India`           | `address_india`     | Direct                                                                    |
| `tel_no`                     | `tel_no_india`      | Direct                                                                    |
| `is_family_residing_in_Oman` | `is_family_in_oman` | Direct                                                                    |
| `application_no`             | `application_no`    | Direct                                                                    |
| `received_on`                | `received_on`       | Date conversion                                                           |
| `submitted_by`               | `submitted_by`      | Direct                                                                    |
| `shakha_india`               | `shakha_india`      | Direct                                                                    |
| `checked_by`                 | `checked_by`        | Direct                                                                    |
| `approved_by`                | `approved_by`       | Direct                                                                    |
| `president`                  | `president`         | Direct                                                                    |
| `secretary`                  | `secretary`         | Direct                                                                    |
| `union`                      | `union_name`        | Direct                                                                    |
| `district`                   | `district`          | Direct                                                                    |
| `shakha`                     | `shakha_id`         | **Resolve string → shakha FK**                                            |
| _(new)_                      | `is_archived`       | Default `false` for legacy imports                                        |
| _(new)_                      | `archived_at`       | Default `NULL` for legacy imports                                         |
| _(new)_                      | `is_lifetime`       | Default `false`; later membership flow may update                         |
| _(new)_                      | `active_from`       | Infer from legacy data if a reliable membership start exists; else `NULL` |
| `expiry`                     | `expiry`            | Date conversion                                                           |
| `family_members`             | _(separate table)_  | **Resolve ObjectId array → family_members rows**                          |
| `creation_date`              | `created_at`        | Direct                                                                    |

---

## Migration Steps

### Step 1: Export MongoDB Data

```bash
mongoexport --uri="mongodb://..." --collection=membermodels --out=members.json
mongoexport --uri="mongodb://..." --collection=family_membermodels --out=family_members.json
mongoexport --uri="mongodb://..." --collection=shakhamodels --out=shakhas.json
mongoexport --uri="mongodb://..." --collection=adminmodels --out=admins.json
```

### Step 2: Set Up PostgreSQL Schema

```bash
pnpm db:generate   # Generate migration files (dev branch DATABASE_URL)
pnpm db:migrate    # Apply migrations to the target DATABASE_URL
```

Minimum schema required before import:

- `shakhas`
- `members`
- `family_members`

Recommended family member audit columns before import:

- `family_members.created_at`
- `family_members.updated_at`

Recommended member constraints/indexes before import:

- Unique `members.civil_id_no`
- Unique `members.member_code`
- FK `members.shakha_id -> shakhas.id`
- FK `family_members.member_id -> members.id`
- Indexes on `members.shakha_id`, `members.active_from`, `members.expiry`

> **Note:** Apply migrations separately for dev and prod by switching `DATABASE_URL`
> (e.g., `.env.development` vs `.env.production`, or Vercel prod env vars).

---

## CI/CD: Production Migrations (GitHub Actions + Vercel)

**Goal:** run migrations against the production Neon branch before triggering a production deploy.

**Secrets required (GitHub repo settings):**

- `PROD_DATABASE_URL` — production branch connection string
- `VERCEL_DEPLOY_HOOK_URL` — Vercel Deploy Hook for the production environment

**Workflow:**

1. On push to `master`, GitHub Actions runs `pnpm db:migrate` with `PROD_DATABASE_URL`.
2. If migrations succeed, it triggers the Vercel production deploy via the Deploy Hook URL.

**Why:** ensures production schema is always up to date before the new build is live.

**Guard:** the workflow only runs migrations when `drizzle/` or `src/lib/db/schema.ts` changes,
and always triggers deploy afterward.

### Step 3: Transform & Import

The migration script (`scripts/migrate-from-mongo.ts`) should:

1. **Import shakhas first** (no foreign dependencies)
2. **Import members** — resolve `shakha` string → `shakha_id` FK
3. **Import family_members** — resolve ObjectId → `member_id` FK
4. **Import admin → users** — re-hash password if needed, or preserve bcrypt hash
5. **Skip member_codemodels** — seed PG sequence with max existing `member_code + 1`

**Key transformations:**

- `photo` URL → `photo_key`: Extract key after `amazonaws.com/` (legacy uses timestamp-based keys like `1706123456-photo.jpg`)
- `family_members` ObjectId array → proper rows in `family_members` table with `member_id` FK
- `shakha` string name → look up `shakha_id` from `shakhas` table

#### Import Commands (local backup)

```bash
# 1) Dry run (read + transform + counters, no writes)
pnpm migrate:mongo:dry

# 2) Import with writes
pnpm migrate:mongo

# 3) Dev-only clean rerun
pnpm migrate:mongo:truncate
```

Importer policies implemented:

- Duplicate `civil_id_no`: keep first imported row, skip the rest, and log skips.
- Unresolved shakha names: skip member and log skip reason.
- Unparseable photo URLs: store `photo_key = NULL` and log parse failures.
- Lifecycle inference: set `active_from` from source `creation_date` when available; otherwise keep pending-compatible nulls.
- Member-code sequence sync: after member import, reseed `members_member_code_seq` to current `MAX(member_code)` so new inserts never collide with migrated values.

### Migration Reports Generated

Every run of `pnpm migrate:mongo` or `pnpm migrate:mongo:dry` writes timestamped reports to `scripts/reports/`:

- `mongo-migration-summary-<timestamp>.json`: run totals and skip breakdown.
- `mongo-migration-skips-<timestamp>.csv`: technical skip-level report.
- `mongo-migration-duplicates-<timestamp>.csv`: detailed duplicate-member report with duplicate counterpart mapping (source/target).
- `mongo-client-duplicate-members-<timestamp>.csv`: non-technical client handover report focused only on duplicate member records.

Client handover report guidelines:

- Includes one row per duplicated civil ID.
- Uses readable columns (civil ID, names, shakhas, records found, suggested action).
- Excludes low-level migration internals like source ObjectId mapping unless needed for internal troubleshooting.

### Step 4: Validate

- Compare record counts between MongoDB and PostgreSQL
- Verify all family_member → member FK relationships
- Verify all member → shakha FK relationships
- Spot-check 10-20 member photos resolve via `photo_key`
- Verify max `member_code` matches PG sequence

Sequence check SQL:

```sql
SELECT COALESCE(MAX(member_code), 1000) AS max_member_code FROM members;
SELECT last_value FROM members_member_code_seq;
```

If sequence is behind, reseed manually:

```sql
SELECT setval(
	'members_member_code_seq',
	GREATEST((SELECT COALESCE(MAX(member_code), 1000) FROM members), 1000),
	true
);
```

Validation command:

```bash
pnpm verify:mongo-import
```

---

## S3 Image Strategy

Images stay in S3. Only the reference format changes:

```
# Before (stored in MongoDB)
"https://sndp-bucket.s3.amazonaws.com/1706123456-photo.jpg"

# After (stored in PostgreSQL)
"1706123456-photo.jpg"
```

> **Note:** Legacy used `public-read` ACL and stored the full URL. New system stores only the key and can construct URLs at read-time, or use pre-signed URLs for better security.

---

## Rollback Plan

- Keep MongoDB running (read-only) during migration
- Migration script is idempotent — can be re-run safely
- Do not decommission MongoDB until new portal is fully validated

---

## TODO

- [ ] User to share new requirements/proposals doc
- [x] Create `scripts/migrate-from-mongo.mjs`
- [ ] Run test migration on local PostgreSQL
- [ ] Validate data integrity
- [ ] Switch production to new portal
