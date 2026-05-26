import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { appRouter } from "@complete-web-template/api";
import path from "path";
import { fileURLToPath } from "url";

export interface TestServer {
  /** The Hono app instance */
  app: Hono;
  /** The PGlite database instance */
  pg: PGlite;
  /** The Drizzle database instance */
  db: ReturnType<typeof drizzle>;
  /** Base URL of the test server */
  baseUrl: string;
  /** Close the server and database */
  close: () => Promise<void>;
}

const MIGRATIONS_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../db/src/migrations"
);

/**
 * Creates a test server with PGlite and tRPC.
 * Better Auth can be added via onBeforeStart callback.
 *
 * @example
 * ```typescript
 * let server: TestServer;
 *
 * beforeAll(async () => {
 *   server = await createTestServer();
 * });
 *
 * afterAll(() => server.close());
 * ```
 */
export async function createTestServer(): Promise<TestServer> {
  // 1. Start PGlite in-memory database
  const pg = new PGlite();
  await pg.waitReady;

  // 2. Create drizzle instance
  const db = drizzle(pg);

  // 3. Run migrations
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });

  // 4. Create tRPC context factory
  const createTestContext = async (
    opts: FetchCreateContextFnOptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> => {
    const authHeader = opts.req.headers.get("authorization");
    return { db, authHeader };
  };

  // 5. Create tRPC handler
  const trpcHandler = (req: Request) =>
    fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: createTestContext,
    });

  // 6. Create Hono app with tRPC routes
  const app = new Hono();
  app.all("/api/trpc/*", (c) => trpcHandler(c.req.raw));

  // 7. Start server on random port
  const server = serve({
    fetch: app.fetch,
    port: 0,
  });

  const addr = server.address();
  const port = (addr as { port: number }).port;
  const baseUrl = `http://localhost:${port}`;

  // 8. Cleanup function
  const close = async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pg.close();
  };

  return {
    app,
    pg,
    db,
    baseUrl,
    close,
  };
}

/**
 * Creates a test server with PGlite, Better Auth, and tRPC.
 *
 * @deprecated Use createTestServer() directly and add Better Auth via app.all() handler
 */
export async function createTestServerWithAuth(): Promise<TestServer & {
  approveDeviceCode: (userCode: string, userId?: string) => Promise<void>;
  createUser: (data: { id?: string; email: string; name: string; emailVerified?: boolean }) => Promise<void>;
}> {
  const base = await createTestServer();

  // Dynamically import Better Auth to avoid type issues
  const { betterAuth } = await import("better-auth");
  const { drizzleAdapter } = await import("@better-auth/drizzle-adapter");
  const { apiKey } = await import("@better-auth/api-key");
  const { bearer } = await import("better-auth/plugins/bearer");
  const { deviceAuthorization } = await import("better-auth/plugins/device-authorization");
  const dbSchemas = await import("@complete-web-template/db");

  const TEST_AUTH_URL = "http://localhost:3000";

  const auth = betterAuth({
    baseURL: TEST_AUTH_URL,
    database: drizzleAdapter(base.db as any, {
      provider: "pg",
      schema: {
        user: dbSchemas.user,
        session: dbSchemas.session,
        account: dbSchemas.account,
        verification: dbSchemas.verification,
        apikey: dbSchemas.apikey,
        deviceCode: dbSchemas.deviceCode,
      },
    }),
    emailAndPassword: { enabled: true },
    plugins: [
      apiKey({ enableSessionForAPIKeys: true }),
      bearer(),
      deviceAuthorization({
        expiresIn: "5m",
        interval: "1s",
        verificationUri: `${TEST_AUTH_URL}/device`,
        schema: {},
      }),
    ],
  });

  // Add auth routes
  base.app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

  // Helper to approve device codes
  const approveDeviceCode = async (
    userCode: string,
    userId: string = "test-user-id"
  ) => {
    await base.pg.query(
      `INSERT INTO "user" (id, email, name, email_verified)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [userId, `test-${userId}@example.com`, "Test User", true]
    );
    await base.pg.query(
      `UPDATE "device_code" SET user_id = $1, status = 'approved' WHERE user_code = $2`,
      [userId, userCode]
    );
  };

  // Helper to create test users
  const createUser = async (data: {
    id?: string;
    email: string;
    name: string;
    emailVerified?: boolean;
  }) => {
    const id = data.id ?? `user-${Date.now()}`;
    await base.pg.query(
      `INSERT INTO "user" (id, email, name, email_verified) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [id, data.email, data.name, data.emailVerified ?? true]
    );
  };

  return {
    ...base,
    approveDeviceCode,
    createUser,
  };
}