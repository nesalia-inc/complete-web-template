---
name: architecture-patterns
description: Key architectural decisions and patterns in the monorepo
type: reference
---

## Architecture Patterns (Single Source of Truth)

### 1. Database Layer (`packages/db`)

**The schema file IS the source of truth for:**
- Drizzle table definitions
- Relations
- Query helpers (re-exported from drizzle-orm)
- Type exports

**Key pattern - Lazy singleton for serverless:**

```typescript
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof typeof drizzleInstance];
  },
});
```

**Why:** Pool created on first use, not at module import. Prevents connection leaks in serverless.

---

### 2. Auth Architecture (Two User Tables)

| Table | Purpose | PK | Auth library |
|-------|---------|-----|--------------|
| `user` | Auth/sessions | text | Better Auth |
| `users` | App data/roles | integer | Application |

**Context bridges them:**
```typescript
// packages/api/src/context.ts
if (session?.user?.email) {
  const [appUser] = await db.select({ role: users.role })
    .from(users).where(eq(users.email, session.user.email));
  ctx.user.role = appUser?.role ?? null;
}
```

**Why:** Keep auth concerns separated from app data.

---

### 3. tRPC Procedure Pattern

Three tiers of access:
- `publicProcedure` — no auth
- `protectedProcedure` — requires session
- `adminProcedure()` — requires `role === 'admin'`

All use custom error handling with `TRPCError`.

---

### 4. Soft-Delete Pattern

Every application table has:
```typescript
deletedAt: timestamp("deleted_at"),
// ...with index
index("table_deleted_at_idx").on(table.deletedAt)
```

Queries MUST filter:
```typescript
.where(isNull(posts.deletedAt))  // Uses B-tree index
// NOT: .where(eq(posts.deletedAt, null)) // Full scan
```

---

## Where to Find Things

- **Schema:** `packages/db/src/db/schema/index.ts`
- **DB exports:** `packages/db/src/db/index.ts`
- **API procedures:** `packages/api/src/init.ts`
- **Context:** `packages/api/src/context.ts`
- **Routers:** `packages/api/src/routers/*.ts`
- **SDK client:** `packages/sdk/src/client.ts`
- **CLI entry:** `apps/cli/src/index.ts`