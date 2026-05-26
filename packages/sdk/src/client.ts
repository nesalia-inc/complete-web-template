import { createTRPCClient, httpBatchLink, type TRPCClient } from "@trpc/client";
import type { AppRouter } from "@complete-web-template/api";

export interface SDKOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface SDKClient {
  // TODO: Add methods as API endpoints are implemented
}

export class SDKClientImpl implements SDKClient {
  private trpc: TRPCClient<AppRouter>;

  constructor(options: SDKOptions) {
    this.trpc = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${options.baseUrl ?? "http://localhost:3000"}/api/trpc`,
          headers: () => ({
            Authorization: `Bearer ${options.apiKey}`,
          }),
        }),
      ],
    });
  }
}
