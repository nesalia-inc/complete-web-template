import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { appRouter } from "@complete-web-template/api";
import { setBaseUrl } from "./helpers/client";

import path from "path";
import { fileURLToPath } from "url";

const TEST_API_KEY = "Bearer sk_test_12345";

let cleanupFn: (() => Promise<void>) | null = null;

beforeAll(async () => {
  // 1. Start PGlite in-memory database
  const pg = new PGlite();
  await pg.waitReady;

  // 2. Create drizzle instance
  const db = drizzle(pg);

  // 3. Run migrations - resolve path relative to test file
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsPath = path.resolve(__dirname, "../../db/src/migrations");
  await migrate(db, { migrationsFolder: migrationsPath });

  // 4. Create context factory with auth validation
  const createTestContext = async (
    opts: FetchCreateContextFnOptions
  ): Promise<{ db: typeof db; authHeader: string | null }> => {
    const authHeader = opts.req.headers.get("authorization");

    // Validate API key
    if (authHeader !== TEST_API_KEY) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing API key',
      });
    }

    return {
      db,
      authHeader,
    };
  };

  // 5. Create tRPC handler
  const trpcHandler = (req: Request) =>
    fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createContext: createTestContext as any,
    });

  // 6. Create Hono app
  const app = new Hono();
  app.all("/api/trpc/*", (c) => trpcHandler(c.req.raw));

  // 7. Start server on random port
  const server = serve({
    fetch: app.fetch,
    port: 0, // Auto-select available port
  });

  // Get assigned port
  const addr = server.address();
  const port = (addr as { port: number }).port;
  const url = `http://localhost:${port}`;

  // Set baseUrl for tests
  setBaseUrl(url);

  // Store cleanup
  cleanupFn = async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pg.close();
  };
});

afterAll(async () => {
  if (cleanupFn) {
    await cleanupFn();
  }
});
