# CLAUDE.md — @complete-web-template/db

This package is the **single source of truth** for all database concerns. Nothing database-related should live outside this package.

## Structure

```
src/db/
├── index.ts    # Drizzle client (lazy singleton) + re-exports
└── schema/
    └── index.ts  # ALL table definitions, relations, and enums
```

## Schema Rules

### Required columns on every application table

```typescript
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at"),
deletedAt: timestamp("deleted_at"),  // soft-delete
```

### Indexes — add on every foreign key and filtered column

```typescript
pgTable("my_table", { ... }, (table) => [
  index("my_table_owner_id_idx").on(table.ownerId),
  index("my_table_deleted_at_idx").on(table.deletedAt),
]);
```

If you query with `isNull(col)` — the column **needs an index**, otherwise you get full sequential scans at scale.

### Relations — define for every table that has relationships

```typescript
export const myTableRelations = relations(myTable, ({ one, many }) => ({
  owner: one(users, { fields: [myTable.ownerId], references: [users.id] }),
  posts: many(posts),
}));
```

## Exports

All of the following are re-exported from `./index.ts` and available via `@complete-web-template/db`:

- `db` — Drizzle instance (lazy singleton, safe for serverless)
- `eq`, `and`, `or`, `isNull`, `asc`, `desc`, etc. — query builders
- `user`, `session`, `account`, `verification`, `apikey`, `deviceCode` — Better Auth tables
- `users`, `posts` — application tables
- `rolesEnum` — user roles enum (`guest`, `user`, `admin`)
- `usersRelations`, `postsRelations`, `userRelations`, etc.

## Connection Management

The pool uses lazy initialization. It is **not** created at module import time. This prevents connection leaks in serverless environments (Vercel, AWS Lambda, etc.).

```typescript
// Pool created on first db call, not on import
export const db = new Proxy({ ... }, { get() { return getDb()[prop] } });
```

If you need to access the raw Pool (e.g., for transactions), use `db.client`.

## Adding a New Table

1. Add the table definition to `src/db/schema/index.ts`
2. Add relations if needed
3. Add indexes for all FK columns and columns used in `where` clauses
4. Add `createdAt`, `updatedAt`, `deletedAt` columns
5. Run `pnpm build` to update the dist output
6. Generate a migration: `pnpm drizzle-kit generate`

## Build

```bash
pnpm build  # Compiles TypeScript to dist/
```

The `exports` field in `package.json` maps `.` to `./dist/db/index.js` — consumers import from `@complete-web-template/db`, not from the schema file directly.