import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: 'cause' in error ? (error.cause as { zodError?: unknown }).zodError : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const publicProcedure = t.procedure;

const isAuthedMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.authHeader) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }
  return next({
    ctx,
  });
});

// Cast to any to avoid TS2883 - inferred type references db package internals
// Runtime behavior is correct; this is a module resolution artifact
/* eslint-disable @typescript-eslint/no-explicit-any */
export const protectedProcedure = t.procedure.use(isAuthedMiddleware) as any;

export const adminProcedure = () => protectedProcedure;
