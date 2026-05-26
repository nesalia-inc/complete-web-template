import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@complete-web-template/api";
import { createAuthClient } from "better-auth/client";

const trpcUrl = "/api/trpc";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcUrl,
    }),
  ],
});

export const authClient = createAuthClient({
  baseURL: "/api/auth",
});