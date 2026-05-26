import { describe, it, expect, beforeAll } from "vitest";
import { createTestClient } from "./helpers/client";

describe("Posts API", () => {
  let client: ReturnType<typeof createTestClient>;

  beforeAll(() => {
    client = createTestClient();
  });

  it("should create a post", async () => {
    const result = await client.posts.create({
      title: "Test Post",
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("slug");
    expect(result.title).toBe("Test Post");
  });

  it("should get post by id", async () => {
    // Create first
    const created = await client.posts.create({ title: "Find Me" });

    // Then fetch
    const found = await client.posts.byId({ id: created.id });

    expect(found).toBeDefined();
    expect(found?.title).toBe("Find Me");
    expect(found?.slug).toBe(created.slug);
  });

  it("should list multiple posts", async () => {
    // Create multiple posts
    await client.posts.create({ title: "Post 1" });
    await client.posts.create({ title: "Post 2" });
    await client.posts.create({ title: "Post 3" });

    // List them
    const result = await client.posts.list();

    expect(result.items.length).toBeGreaterThanOrEqual(3);
  });

  it("should list posts with proper shape", async () => {
    const result = await client.posts.list();
    expect(result).toHaveProperty("items");
    // nextCursor may not be present when undefined (tRPC omits undefined in JSON)
    if ("nextCursor" in result) {
      expect(result.nextCursor).toBeUndefined();
    }
  });
});
