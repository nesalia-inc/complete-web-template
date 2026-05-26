# CLAUDE.md

Always speak in English.

## Project Overview

This is a monorepo with two main packages:
- `packages/db` — Drizzle ORM schema and database client (PostgreSQL)
- `packages/api` — tRPC server built on top of the db package

## Architecture

```
packages/
├── db/               # Schema + Drizzle client (single source of truth for DB)
│   └── src/db/
│       ├── index.ts  # Drizzle instance + re-exports (lazy singleton for serverless)
│       └── schema/
│           └── index.ts  # ALL table definitions + relations
└── api/              # tRPC router
    └── src/
        ├── context.ts    # Creates tRPC context (session + user lookup)
        ├── init.ts       # Procedure definitions (public, protected, admin)
        ├── routers/      # Route handlers
        └── auth/         # Better Auth configuration
```

## Adding a New Table

### 1. Define the table in `packages/db/src/db/schema/index.ts`

```typescript
export const myTable = pgTable("my_table", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 256 }).notNull(),
  // ... columns
}, (table) => [
  // Indexes on nullable/filtered columns — critical for performance
  index("my_table_name_idx").on(table.name),
]);
```

**Rules:**
- Always add an index on columns used in `where` clauses (especially nullable filtered ones like `deletedAt`)
- Add a `unique()` constraint on columns that must be unique
- If the table has a foreign key, add an index on it (e.g., `ownerId`)
- Always include `deletedAt: timestamp("deleted_at")` for soft-delete support
- Always include `createdAt` and `updatedAt` timestamps

### 2. Define relations (if the table has relationships)

```typescript
export const myTableRelations = relations(myTable, ({ one, many }) => ({
  owner: one(users, { fields: [myTable.ownerId], references: [users.id] }),
  // ... other relations
}));
```

### 3. Rebuild the db package

```bash
pnpm --filter @complete-web-template/db build
```

### 4. Use the table in the API

```typescript
// In any router
import { db, myTable, eq } from '@complete-web-template/db';
```

## Key Conventions

### Soft-delete Pattern
Every application table must have a `deletedAt` timestamp column. Queries **must** filter out deleted rows:

```typescript
// GOOD — uses B-tree index on deletedAt
.where(isNull(myTable.deletedAt))

// BAD — full table scan at scale
.where(eq(myTable.deletedAt, null))
```

### Schema exports
All schema symbols (`tables`, `relations`, `enums`) are re-exported from `@complete-web-template/db` via `packages/db/src/db/index.ts`. Only import schema symbols from this package — never directly from `drizzle-orm` in the api package.

### Connection management
The `db` export in `@complete-web-template/db` is a lazy singleton. The Pool is created on first use, not at module import. This is safe for serverless environments.

### Type safety
- Never cast context user to add fields — extend `createContext` to look up additional data from the `users` table
- Never import `drizzle-orm` directly in the api package — use re-exports from `@complete-web-template/db`

## Database Migrations

Migrations are managed with Drizzle Kit at the repo root (`drizzle.config.ts`).

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Push schema to database (dev)
pnpm drizzle-kit push

# Open studio to inspect
pnpm drizzle-kit studio
```

## Better Auth Integration

Better Auth manages the `user` table (text PK, for auth/sessions). The application-level `users` table (integer PK, for roles/app data) is separate. The context (`packages/api/src/context.ts`) bridges them by looking up the `users.role` from the `users` table using the better-auth user's email.

If you need to extend the better-auth user (e.g., add custom fields), extend the `user` table in the schema — but do not confuse it with the `users` table which is for application-level data.

## Running

```bash
# Install deps
pnpm install

# Build all
pnpm build

# Type-check
pnpm --filter @complete-web-template/api exec tsc --noEmit
pnpm --filter @complete-web-template/db build
```