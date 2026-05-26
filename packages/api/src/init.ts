import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';

const t = initTRPC.context<Context>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  async function isAuthed(opts) {
    if (!opts.ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
      });
    }
    return opts.next({
      ctx: {
        user: opts.ctx.user,
      },
    });
  }
);

export function adminProcedure() {
  return protectedProcedure.use(async (opts) => {
    const role = opts.ctx.user?.role;
    if (role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }
    return opts.next({ ctx: opts.ctx });
  });
}