import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, isNull, asc, gt } from "drizzle-orm";

let pool: Pool | null = null;
let drizzleInstance: ReturnType<typeof drizzle> | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    pool.on('error', (err) => {
      console.error('Unexpected error on idle pg client', err);
    });
  }
  return pool;
}

function getDb() {
  if (!drizzleInstance) {
    drizzleInstance = drizzle({ client: getPool() });
  }
  return drizzleInstance;
}

// Lazy singleton — pool created on first use, not at module import
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof typeof drizzleInstance];
  },
});

// Re-export helpers from same drizzle instance for type compatibility
export { eq, and, isNull, asc, gt };

export * from "./schema";