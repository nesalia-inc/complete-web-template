---
name: project-nature
description: Template monorepo for full-stack web apps, not production
type: project
---

## Project Nature: Template/Reference Monorepo

This is NOT a production application. It's a **template project** meant to be cloned/copied as a starting point for full-stack web applications.

**Why it matters:** Some decisions that look odd (e.g., incomplete CLI, basic SDK) are likely "starter code" that gets extended per-project, not a feature gap.

---

## Project Identity

**Name:** `complete-web-template`
**Type:** Monorepo template for building full-stack web apps
**Language:** English (code), French (owner)

### Packages

| Package | Purpose | Status |
|---------|---------|--------|
| `packages/db` | Drizzle ORM + schema | **Complete** - source of truth for DB |
| `packages/api` | tRPC server | **Complete** - routers for posts, auth |
| `packages/sdk` | Custom API client | **Stub** - basic, needs expansion |
| `apps/web` | Next.js frontend | **Complete** - full shadcn/ui setup |
| `apps/cli` | Dev CLI tools | **Stub** - basic auth commands only |

---

## Stack Summary

**Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, TanStack Query, Recharts
**Backend:** tRPC v11, Zod v4, Better Auth 1.6.11
**Database:** PostgreSQL + Drizzle ORM (lazy singleton connection)
**DevOps:** Turborepo, pnpm

**Key Patterns:**
- Soft-delete on all application tables (with `deletedAt` + index)
- Role-based access: `guest`, `user`, `admin`
- Better Auth for sessions; `users` table for app-level roles
- Indexes on all FK and filtered columns

---

## What's Missing/Incomplete

1. **SDK** - only has `test()` method, needs full API coverage
2. **CLI** - only has `auth login/status/logout`, no scaffolding or migration tools
3. **Web app** - minimal pages (device auth, login, signup, home)
4. **No tests** - test deps installed but no actual tests
5. **Docs** - `docs/learnings/claude-code/` exists but empty

---

## How to Apply

- If asked to "add a feature to the SDK", extend the client pattern already in place
- If asked to "add CLI commands", follow the existing auth commands pattern
- Don't assume this is a real production app — it's a template