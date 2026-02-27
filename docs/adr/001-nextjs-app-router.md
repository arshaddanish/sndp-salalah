# ADR 001: Next.js App Router as Application Framework

## Status

Accepted

## Context

We are revamping the membership management portal, previously built with React (frontend) and Express (backend) as separate applications. We need a framework that:

- Reduces operational complexity (single deployment vs two services)
- Provides SSR for fast initial page loads
- Has built-in API route support
- Supports TypeScript natively

## Decision

Use **Next.js 16 with the App Router** as the sole application framework, replacing both the React frontend and Express backend.

## Consequences

**Positive:**

- Single deployment unit — one repo, one build, one container
- Server Components reduce client JavaScript bundle
- Server Actions replace most REST API endpoints
- Built-in middleware for auth guards
- File-based routing eliminates manual route configuration

**Negative:**

- Vendor coupling to Vercel's framework
- Learning curve for Server/Client Component boundaries
- Server Actions are Next.js-specific (not transferable to other React frameworks directly)

## Alternatives Considered

| Alternative                    | Why Not                              |
| ------------------------------ | ------------------------------------ |
| React + Express (keep current) | Two deployments, more infrastructure |
