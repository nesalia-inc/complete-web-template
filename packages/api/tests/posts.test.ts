import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestContext } from "./helpers";

describe("post.list", () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx.pg.close();
  });

  it("should return empty list initially", async () => {
    const result = await ctx.caller.post.list();
    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeUndefined();
  });

  it("should return posts with proper shape", async () => {
    const created = await ctx.caller.post.create({
      title: "Test Post",
    });

    const result = await ctx.caller.post.list();

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: created.id,
      title: "Test Post",
      slug: expect.stringContaining("test-post"),
    });
    expect(result.items[0]).toHaveProperty("createdAt");
    expect(result.items[0]).toHaveProperty("updatedAt");
    expect(result.items[0]).toHaveProperty("deletedAt");
  });

  it("should respect limit parameter", async () => {
    await Promise.all([
      ctx.caller.post.create({ title: "Post 1" }),
      ctx.caller.post.create({ title: "Post 2" }),
      ctx.caller.post.create({ title: "Post 3" }),
      ctx.caller.post.create({ title: "Post 4" }),
      ctx.caller.post.create({ title: "Post 5" }),
    ]);

    const result = await ctx.caller.post.list({ limit: 3 });

    expect(result.items).toHaveLength(3);
    expect(result.nextCursor).toBeDefined();
  });

  it("should handle cursor for pagination", async () => {
    // Create 5 posts
    await Promise.all([
      ctx.caller.post.create({ title: "Cursor Test 1" }),
      ctx.caller.post.create({ title: "Cursor Test 2" }),
      ctx.caller.post.create({ title: "Cursor Test 3" }),
      ctx.caller.post.create({ title: "Cursor Test 4" }),
      ctx.caller.post.create({ title: "Cursor Test 5" }),
    ]);

    // First page
    const firstPage = await ctx.caller.post.list({ limit: 2 });
    expect(firstPage.items).toHaveLength(2);
    const firstCursor = firstPage.items[1].id;
    expect(firstPage.nextCursor).toBe(firstCursor);

    // Second page with cursor - should NOT include items from first page
    const secondPage = await ctx.caller.post.list({ limit: 2, cursor: firstCursor });
    expect(secondPage.items).toHaveLength(2);
    const secondCursor = secondPage.items[1].id;

    // The key fix: verify no overlap between pages
    const firstIds = firstPage.items.map(p => p.id);
    const secondIds = secondPage.items.map(p => p.id);

    // No ID should appear in both pages
    for (const id of firstIds) {
      expect(secondIds).not.toContain(id);
    }

    // Third page
    const thirdPage = await ctx.caller.post.list({ limit: 2, cursor: secondCursor });
    const thirdIds = thirdPage.items.map(p => p.id);

    // No overlap with previous pages
    for (const id of [...firstIds, ...secondIds]) {
      expect(thirdIds).not.toContain(id);
    }

    // Total across pages: 2 + 2 + remaining
    const totalUnique = new Set([...firstIds, ...secondIds, ...thirdIds]).size;
    expect(totalUnique).toBe(firstIds.length + secondIds.length + thirdIds.length); // No duplicates
  });

  it("should filter out soft-deleted posts", async () => {
    const post = await ctx.caller.post.create({ title: "To Be Deleted" });

    const beforeDelete = await ctx.caller.post.list();
    expect(beforeDelete.items.some((p) => p.id === post.id)).toBe(true);

    await ctx.pg.query(
      `UPDATE posts SET deleted_at = NOW() WHERE id = $1`,
      [post.id]
    );

    const afterDelete = await ctx.caller.post.list();
    expect(afterDelete.items.some((p) => p.id === post.id)).toBe(false);
  });
});

describe("post.byId", () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx.pg.close();
  });

  it("should return post when found", async () => {
    const created = await ctx.caller.post.create({
      title: "Find Me",
    });

    const result = await ctx.caller.post.byId({ id: created.id });

    expect(result).not.toBeNull();
    expect(result?.title).toBe("Find Me");
  });

  it("should return null for non-existent post", async () => {
    const result = await ctx.caller.post.byId({ id: 99999 });
    expect(result).toBeNull();
  });

  it("should return null for soft-deleted post", async () => {
    const created = await ctx.caller.post.create({ title: "Deleted Post" });

    await ctx.pg.query(
      `UPDATE posts SET deleted_at = NOW() WHERE id = $1`,
      [created.id]
    );

    const result = await ctx.caller.post.byId({ id: created.id });
    expect(result).toBeNull();
  });
});

describe("post.create", () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx.pg.close();
  });

  it("should create post with minimal input", async () => {
    const result = await ctx.caller.post.create({
      title: "Minimal Post",
    });

    expect(result).not.toBeNull();
    expect(result.id).toBeDefined();
    expect(result.title).toBe("Minimal Post");
    expect(result.slug).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  it("should generate slug if not provided", async () => {
    const result = await ctx.caller.post.create({
      title: "My Awesome Post Title",
    });

    expect(result.slug).toContain("my-awesome-post");
  });

  it("should use provided slug", async () => {
    const result = await ctx.caller.post.create({
      title: "Any Title",
      slug: "my-custom-slug",
    });

    expect(result.slug).toBe("my-custom-slug");
  });

  it("should reject duplicate slug", async () => {
    // First create succeeds
    await ctx.caller.post.create({
      title: "First Post",
      slug: "unique-slug-test",
    });

    // Second create with same slug should fail
    await expect(
      ctx.caller.post.create({
        title: "Second Post",
        slug: "unique-slug-test",
      })
    ).rejects.toThrow();
  });

  it("should reject empty title", async () => {
    await expect(
      ctx.caller.post.create({ title: "" })
    ).rejects.toThrow();
  });

  it("should reject title too long", async () => {
    const longTitle = "a".repeat(257);
    await expect(
      ctx.caller.post.create({ title: longTitle })
    ).rejects.toThrow();
  });

  it("should accept valid title with special chars", async () => {
    const result = await ctx.caller.post.create({
      title: "Post with **markdown** and \"quotes\"",
    });

    expect(result).not.toBeNull();
    expect(result.title).toBe("Post with **markdown** and \"quotes\"");
  });
});