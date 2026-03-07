# ADR 003: Auth.js v5 with Credentials Provider

## Status

Accepted

## Context

The portal is used by a single super admin. Authentication must be:

- Secure (session-based, CSRF protection)
- Lightweight (no paid services for one user)
- Integrated with Next.js middleware

## Decision

Use **Auth.js v5** (formerly NextAuth.js) with the **Credentials provider**, storing a bcrypt-hashed password in PostgreSQL.

## Consequences

**Positive:**

- Free and open source
- Built-in session management, CSRF protection, secure cookies
- Middleware integration for route protection

**Negative:**

- Credentials provider requires manual password hashing
- No built-in password reset flow (acceptable for single admin)
- Auth.js v5 API is still evolving

## Alternatives Considered

| Alternative | Why Not                                    |
| ----------- | ------------------------------------------ |
| Clerk       | Paid, overkill for single user             |
| Custom JWT  | Must build CSRF, session rotation manually |
