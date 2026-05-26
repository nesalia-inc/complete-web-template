import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@complete-web-template/api';
import { createContext } from '@complete-web-template/api/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: (opts) => createContext(opts),
  });

export { handler as GET, handler as POST };