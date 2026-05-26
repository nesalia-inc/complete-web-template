import { protectedProcedure, publicProcedure, createTRPCRouter } from '../init';
import { z } from 'zod';

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  getSecret: protectedProcedure.query(({ ctx }) => {
    return { secret: 'sauce', user: ctx.user };
  }),
});