import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export async function createContext(opts: FetchCreateContextFnOptions) {
  const authHeader = opts.req.headers.get('authorization');

  return {
    authHeader,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
