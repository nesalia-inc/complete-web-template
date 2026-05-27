import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "path";
import { fileURLToPath } from "url";
import { appRouter, createCallerFactory } from "../src";

const MIGRATIONS_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../db/src/migrations"
);

export interface TestContext {
  pg: PGlite;
  db: ReturnType<typeof drizzle>;
  caller: ReturnType<ReturnType<typeof createCallerFactory>>;
}

/**
 * Creates a fresh test context with PGlite + tRPC caller.
 * Each call creates a new in-memory database.
 *
 * @example
 * ```typescript
 * const { caller, db, pg } = await createTestContext();
 *
 * // Use caller directly - no HTTP needed
 * const posts = await caller.post.list({ limit: 10 });
 *
 * // Clean up
 * await pg.close();
 * ```
 */
export async function createTestContext(): Promise<TestContext> {
  // 1. Start PGlite in-memory database
  const pg = new PGlite();
  await pg.waitReady;

  // 2. Create drizzle instance
  const db = drizzle(pg);

  // 3. Run migrations
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });

  // 4. Create tRPC caller with injected db
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ db, authHeader: null });

  return { pg, db, caller };
}

/**
 * Helper to create a test context with auth header.
 *
 * @example
 * ```typescript
 * const { caller } = await createAuthenticatedContext("Bearer test-token");
 * ```
 */
export async function createAuthenticatedContext(
  authHeader: string
): Promise<TestContext> {
  const pg = new PGlite();
  await pg.waitReady;

  const db = drizzle(pg);
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });

  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ db, authHeader });

  return { pg, db, caller };
}