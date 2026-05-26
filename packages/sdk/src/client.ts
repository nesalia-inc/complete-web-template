import { createAuthClient } from "better-auth/client";
import { apiKeyClient } from "@better-auth/api-key/client";
import { createTRPCClient, httpBatchLink, type TRPCClient } from "@trpc/client";
import type { AppRouter } from "@complete-web-template/api";

export interface SDKOptions {
  /** API key for authentication */
  apiKey: string;
  /** Base URL of the API (default: http://localhost:3000) */
  baseUrl?: string;
}

// Define the API key client interface manually since plugin type inference is limited
export interface ApiKeyClient {
  create: (input: {
    configId?: string;
    name: string;
    expiresIn?: number;
    prefix?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<{ data?: { key: string; id: string }; error?: { message: string } }>;
  list: (input?: {
    query?: {
      configId?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortDirection?: "asc" | "desc";
    };
  }) => Promise<{ data?: { apiKeys: unknown[]; total: number }; error?: { message: string } }>;
  get: (input: {
    query: { configId?: string; id: string };
  }) => Promise<{ data?: unknown; error?: { message: string } }>;
  update: (input: {
    configId?: string;
    keyId: string;
    name?: string;
  }) => Promise<{ data?: unknown; error?: { message: string } }>;
  delete: (input: {
    configId?: string;
    keyId: string;
  }) => Promise<{ data?: { success: boolean }; error?: { message: string } }>;
}

export interface SDKClient {
  /** API key management via Better Auth */
  apiKey: ApiKeyClient;
  /** Post operations */
  posts: {
    list: (input?: { cursor?: number; limit?: number }) => Promise<unknown>;
    byId: (input: { id: number }) => Promise<unknown>;
    create: (input: { title: string; content?: string; slug?: string }) => Promise<unknown>;
  };
}

export function createClient(options: SDKOptions): SDKClient {
  const baseUrl = options.baseUrl ?? "http://localhost:3000";

  // Auth via Better Auth client (typed as any to bypass complex plugin inference)
  const authClient = createAuthClient({
    baseURL: baseUrl,
    plugins: [apiKeyClient()],
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
      },
    },
  }) as { apiKey: ApiKeyClient };

  // Data via tRPC client
  const trpc = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
        },
      }),
    ],
  });

  return {
    // Auth API key methods
    apiKey: authClient.apiKey,
    // App-specific methods
    posts: {
      list: (input) => trpc.post.list.query(input),
      byId: (input) => trpc.post.byId.query(input),
      create: (input) => trpc.post.create.mutate(input),
    },
  };
}
