import { z } from 'zod';
import { posts, eq, and, isNull } from '@complete-web-template/db';
import { publicProcedure, createTRPCRouter } from '../init';

function generateSlug(title: string): string {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const base36Chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 32);
  if (!slug) slug = 'post';
  for (let i = 0; i < 8; i++) {
    slug += base36Chars[randomBytes[i] % base36Chars.length];
  }
  return slug;
}

const paginatedInput = z.object({
  cursor: z.number().optional(),
  limit: z.number().min(1).max(100).default(20),
});

export const postRouter = createTRPCRouter({
  list: publicProcedure
    .input(paginatedInput.optional())
    .query(async ({ input, ctx }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const results = await ctx.db
        .select()
        .from(posts)
        .where(isNull(posts.deletedAt))
        .orderBy(posts.id)
        .limit(limit + 1)
        .offset(cursor ? 1 : 0);

      const hasMore = results.length > limit;
      const items = hasMore ? results.slice(0, -1) : results;
      const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

      return { items, nextCursor };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const [result] = await ctx.db
          .select()
          .from(posts)
          .where(and(eq(posts.id, input.id), isNull(posts.deletedAt)));
        return result ?? null;
      } catch {
        throw new Error('Failed to fetch post');
      }
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(256),
        content: z.string().optional(),
        slug: z.string().min(1).max(64).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const slug = input.slug ?? generateSlug(input.title);
        const [result] = await ctx.db
          .insert(posts)
          .values({
            title: input.title,
            slug,
          })
          .returning();
        return result ?? null;
      } catch (err) {
        if (err instanceof Error && err.message.includes('unique')) {
          throw new Error('Slug already exists, please choose another');
        }
        throw new Error('Failed to create post');
      }
    }),
});
