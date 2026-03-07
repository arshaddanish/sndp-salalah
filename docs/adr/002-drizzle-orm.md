# ADR 002: Drizzle ORM for Database Access

## Status

Accepted

## Context

Migrating from MongoDB to PostgreSQL. Need a TypeScript ORM that is:

- Lightweight with minimal bundle size
- Type-safe with strong TypeScript integration
- SQL-aligned (teaches real SQL patterns)
- Well-suited for serverless/edge deployment

## Decision

Use **Drizzle ORM** over Prisma.

## Consequences

**Positive:**

- ~45KB bundle vs Prisma's ~8MB (no Rust query engine)
- Type inference from schema — no codegen step needed
- SQL-first API teaches transferable SQL skills
- Fast cold starts (<500ms) ideal for serverless
- Migration files are readable SQL

**Negative:**

- Requires SQL knowledge (trade-off: this is also a learning benefit)
- Smaller ecosystem than Prisma
- Less mature migration rollback system

## Alternatives Considered

| Alternative | Why Not                                          |
| ----------- | ------------------------------------------------ |
| Prisma      | Large bundle, Rust engine cold starts, hides SQL |
