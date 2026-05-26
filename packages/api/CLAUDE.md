# CLAUDE.md — @complete-web-template/api

This package is the tRPC API server. It depends on `@complete-web-template/db` for all database access.

## Structure

```
src/
├── context.ts     # Creates tRPC context (session + user + role lookup)
├── init.ts        # Procedure definitions (public, protected, admin)
├── index.ts       # Public exports (appRouter, procedures, Context type)
├── auth/
│   └── config.ts  # Better Auth configuration
└── routers/
    ├── _app.ts    # Root router (merges sub-routers)
    ├── post.ts    # Post CRUD operations
    └── auth.ts    # Auth-related procedures
```

## Procedures

| Procedure | Auth | Use case |
|-----------|------|----------|
| `publicProcedure` | None | Public read-only endpoints |
| `protectedProcedure` | Auth required | Any authenticated action |
| `adminProcedure` | `role === 'admin'` | Admin-only operations |

## Context

The context (`ctx`) provides:

```typescript
ctx.user    // Sanitized better-auth user + role from users table
ctx.session // Full session object with sanitized user
```

## Schema Imports

**Never import `drizzle-orm` directly.** Use re-exports from `@complete-web-template/db`:

```typescript
// GOOD
import { db, posts, eq, isNull } from '@complete-web-template/db';

// BAD — creates type conflicts with duplicate drizzle-orm module
import { eq } from 'drizzle-orm';
```

## Rules for Routers

### Always handle errors around DB calls

```typescript
.query(async ({ input }) => {
  try {
    return await db.select().from(posts).where(...);
  } catch {
    throw new Error('Failed to fetch posts');
  }
})
```

### Always filter soft-deleted records

```typescript
.where(isNull(posts.deletedAt))
```

### Always add pagination to list endpoints

```typescript
.input(z.object({
  cursor: z.number().optional(),
  limit: z.number().min(1).max(100).default(20),
}))
```

### Mutations must use `protectedProcedure` or `adminProcedure`

```typescript
.mutation(protectedProcedure.input(...).mutation(async ({ ctx, input }) => {
  // ctx.user is guaranteed here
}))
```

## Role-based Access

Roles (`guest`, `user`, `admin`) are stored in the `users` table, not in Better Auth's user object. The context looks up the role at request time. Do not cast or assume `ctx.user.role` exists — if the user has no entry in the `users` table, `role` will be `null`.

## Build

```bash
pnpm build           # Compile to dist/
pnpm exec tsc --noEmit  # Type-check only
```