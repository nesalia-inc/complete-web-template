import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestContext, createAuthenticatedContext } from "./helpers";

describe("Middleware", () => {
  it("should work with authenticated context", async () => {
    const { caller, pg } = await createAuthenticatedContext("Bearer test-token");

    const result = await caller.post.list();
    expect(result).toBeDefined();

    await pg.close();
  });

  it("should accept any auth header format", async () => {
    const { caller, pg } = await createAuthenticatedContext("any-format-works");

    const result = await caller.post.list();
    expect(result).toBeDefined();

    await pg.close();
  });
});

describe("Auth Header Context", () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx.pg.close();
  });

  it("should handle null authHeader", async () => {
    const result = await ctx.caller.post.list();
    expect(result).toBeDefined();
  });
});