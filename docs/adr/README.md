# Architecture Decision Records (ADRs)

We document significant architectural decisions using ADRs. Each record captures the context, decision, and consequences.

## Index

| #                                   | Decision                             | Status   |
| ----------------------------------- | ------------------------------------ | -------- |
| [001](./001-nextjs-app-router.md)   | Next.js App Router as framework      | Accepted |
| [002](./002-drizzle-orm.md)         | Drizzle ORM for database access      | Accepted |
| [003](./003-auth-strategy.md)       | Auth.js v5 with Credentials provider | Accepted |
| [004](./004-postgresql-database.md) | PostgreSQL for relational data       | Accepted |

## Format

Each ADR follows this structure:

1. **Status** — Proposed, Accepted, Deprecated, Superseded
2. **Context** — What problem are we solving?
3. **Decision** — What did we choose?
4. **Consequences** — Positive and negative trade-offs
5. **Alternatives Considered** — What else we evaluated

## Creating a New ADR

Copy an existing ADR and increment the number. Keep the format consistent.
