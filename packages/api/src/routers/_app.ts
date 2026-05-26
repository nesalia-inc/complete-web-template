import { publicProcedure, protectedProcedure, createTRPCRouter } from '../init';
import { postRouter } from './post';
import { authRouter } from './auth';

export const appRouter = createTRPCRouter({
  post: postRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;