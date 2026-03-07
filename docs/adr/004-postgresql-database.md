# ADR 004: PostgreSQL for Relational Data

## Status

Accepted

## Context

The project requires a robust, relational database for managing membership data, financial transactions (Unified Ledger Pattern), and audit trails. The legacy system used MongoDB, which made complex relational queries and financial reporting (e.g., chronological statement lists) difficult to maintain with strict consistency.

## Decision

We chose **PostgreSQL 16** as the primary database.

1.  **Strict Data Integrity**: PostgreSQL provides superior support for unique constraints (e.g., `civil_id_no`), foreign keys, and ACID compliance, which are critical for financial data.
2.  **Unified Ledger Pattern**: The requirement for a chronological statement list of all income and expenses is best served by a relational model with efficient indexing on date and amount.
3.  **Drizzle ORM Compatibility**: PostgreSQL has excellent support in Drizzle ORM, allowing for a SQL-first approach with full Type Safety.
4.  **Ecological support**: PostgreSQL is widely supported on platforms like Vercel (via Neon) and has a vast ecosystem of tools for migration and monitoring.

## Consequences

- **Positive**: Guaranteed data integrity, efficient reporting queries, better type safety in the application layer.
- **Negative**: Requires a migration from the legacy MongoDB database (documented in `docs/MIGRATION.md`).
- **Neutral**: Developers must write migrations (schema-as-code) using Drizzle Kit.
