import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { db as defaultDb } from '@complete-web-template/db';

export interface Context {
  db: typeof defaultDb;
  authHeader: string | null;
}

export interface CreateContextOptions {
  injectedDb?: typeof defaultDb;
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
  options?: CreateContextOptions
): Promise<Context> {
  const authHeader = opts.req.headers.get('authorization');

  // Use injected db if provided (for tests), otherwise use default
  const db = options?.injectedDb ?? defaultDb;

  return {
    db,
    authHeader,
  };
}
