import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestContext } from "./helpers";

describe("Slug Generation", () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx.pg.close();
  });

  it("should handle non-ASCII characters", async () => {
    const result = await ctx.caller.post.create({
      title: "Café Réunion 2024!",
    });

    expect(result.slug).toMatch(/^[a-z0-9-]+$/);
    expect(result.slug).toMatch(/^caf-r-union-2024[a-z0-9]+$/);
  });

  it("should handle spaces in title", async () => {
    const result = await ctx.caller.post.create({
      title: "This Has   Lots   Of Spaces",
    });

    expect(result.slug).not.toContain(" ");
    expect(result.slug).not.toContain("---");
  });

  it("should handle title with special chars that become empty", async () => {
    const result = await ctx.caller.post.create({
      title: "---",
    });

    expect(result.slug).toBeDefined();
    expect(result.slug.length).toBeGreaterThan(0);
  });

  it("should truncate to reasonable length", async () => {
    const result = await ctx.caller.post.create({
      title: "A".repeat(100),
    });

    expect(result.slug).toBeDefined();
    expect(result.slug.length).toBeLessThanOrEqual(45); // 37 base + 8 suffix max
  });

  it("should add random suffix for collision safety", async () => {
    const results = await Promise.all([
      ctx.caller.post.create({ title: "Unique Test" }),
      ctx.caller.post.create({ title: "Unique Test" }),
      ctx.caller.post.create({ title: "Unique Test" }),
    ]);

    const slugs = results.map((r) => r.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(3);

    slugs.forEach((slug) => {
      expect(slug).toMatch(/^unique-test[a-z0-9]+$/);
    });
  });

  it("should strip leading/trailing dashes", async () => {
    const result = await ctx.caller.post.create({
      title: "... Leading and Trailing ...",
    });

    expect(result.slug).not.toMatch(/^-|-$/);
  });
});

describe("Zod Input Validation", () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx.pg.close();
  });

  describe("post.list", () => {
    it("should accept valid pagination input", async () => {
      const result = await ctx.caller.post.list({
        limit: 10,
        cursor: 5,
      });

      expect(result.items).toEqual([]);
    });

    it("should reject limit exceeding 100", async () => {
      await expect(
        ctx.caller.post.list({ limit: 101 })
      ).rejects.toThrow();
    });

    it("should reject limit of 0", async () => {
      await expect(
        ctx.caller.post.list({ limit: 0 })
      ).rejects.toThrow();
    });

    it("should reject negative limit", async () => {
      await expect(
        ctx.caller.post.list({ limit: -1 })
      ).rejects.toThrow();
    });

    it("should use default limit: 20", async () => {
      // Create 25 posts with unique slugs
      const uniqueTitles = Array.from({ length: 25 }, (_, i) => `Default Limit ${i}-${Date.now()}`);
      await Promise.all(
        uniqueTitles.map((title) => ctx.caller.post.create({ title }))
      );

      const result = await ctx.caller.post.list();
      expect(result.items).toHaveLength(20);
    });

    it("should handle negative cursor", async () => {
      // Offset with negative value returns all rows from start
      const result = await ctx.caller.post.list({ cursor: -1 });
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe("post.byId", () => {
    it("should accept valid numeric id", async () => {
      // There are posts from previous tests, so id=1 might exist
      const result = await ctx.caller.post.byId({ id: 99999 });
      expect(result).toBeNull(); // Non-existent ID should return null
    });
  });

  describe("post.create", () => {
    it("should reject empty title", async () => {
      await expect(
        ctx.caller.post.create({ title: "" })
      ).rejects.toThrow();
    });

    it("should reject missing title", async () => {
      await expect(
        // @ts-expect-error Testing runtime validation
        ctx.caller.post.create({})
      ).rejects.toThrow();
    });

    it("should reject title exceeding 256 chars", async () => {
      const longTitle = "a".repeat(257);
      await expect(
        ctx.caller.post.create({ title: longTitle })
      ).rejects.toThrow();
    });

    it("should accept title exactly 256 chars", async () => {
      const exactTitle = "a".repeat(256);
      const result = await ctx.caller.post.create({ title: exactTitle });
      expect(result).not.toBeNull();
    });

    it("should reject slug exceeding 64 chars", async () => {
      const longSlug = "a".repeat(65);
      await expect(
        ctx.caller.post.create({ title: "Valid", slug: longSlug })
      ).rejects.toThrow();
    });

    it("should accept slug exactly 64 chars", async () => {
      const exactSlug = "a".repeat(64);
      const result = await ctx.caller.post.create({
        title: "Valid",
        slug: exactSlug,
      });
      expect(result.slug).toBe(exactSlug);
    });

    it("should reject empty slug string", async () => {
      await expect(
        ctx.caller.post.create({ title: "Valid", slug: "" })
      ).rejects.toThrow();
    });
  });
});