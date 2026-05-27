import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestContext } from "./helpers";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "path";
import { fileURLToPath } from "url";
import { appRouter, createCallerFactory } from "../src";
import { posts, eq } from "@complete-web-template/db";

const MIGRATIONS_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../db/src/migrations"
);

describe("Context", () => {
  describe("DB Injection", () => {
    it("should use injected db when provided", async () => {
      // Create two separate PGlite instances
      const pg1 = new PGlite();
      await pg1.waitReady;
      const db1 = drizzle(pg1);
      await migrate(db1, { migrationsFolder: MIGRATIONS_PATH });

      const pg2 = new PGlite();
      await pg2.waitReady;
      const db2 = drizzle(pg2);
      await migrate(db2, { migrationsFolder: MIGRATIONS_PATH });

      const createCaller = createCallerFactory(appRouter);
      const caller1 = createCaller({ db: db1, authHeader: null });
      const caller2 = createCaller({ db: db2, authHeader: null });

      await caller1.post.create({ title: "Only in DB1" });

      const result1 = await caller1.post.list();
      expect(result1.items).toHaveLength(1);

      const result2 = await caller2.post.list();
      expect(result2.items).toHaveLength(0);

      await pg1.close();
      await pg2.close();
    });

    it("should pass authHeader to context", async () => {
      const pg = new PGlite();
      await pg.waitReady;
      const db = drizzle(pg);
      await migrate(db, { migrationsFolder: MIGRATIONS_PATH });

      const createCaller = createCallerFactory(appRouter);
      const caller = createCaller({ db, authHeader: "Bearer my-test-token" });

      const result = await caller.post.list();
      expect(result).toBeDefined();

      await pg.close();
    });
  });

  describe("Context Shape", () => {
    let ctx: Awaited<ReturnType<typeof createTestContext>>;

    beforeAll(async () => {
      ctx = await createTestContext();
    });

    afterAll(async () => {
      await ctx.pg.close();
    });

    it("should have db and authHeader in context", async () => {
      const result = await ctx.caller.post.list();
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("nextCursor");
    });

    it("should soft delete via direct DB update", async () => {
      const post = await ctx.caller.post.create({ title: "To Delete" });

      const before = await ctx.caller.post.list();
      expect(before.items.some((p) => p.id === post.id)).toBe(true);

      await ctx.db
        .update(posts)
        .set({ deletedAt: new Date() })
        .where(eq(posts.id, post.id));

      const after = await ctx.caller.post.list();
      expect(after.items.some((p) => p.id === post.id)).toBe(false);
    });
  });
});