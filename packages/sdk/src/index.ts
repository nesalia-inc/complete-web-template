import { SDKClientImpl, type SDKOptions, type SDKClient } from "./client";

export type { SDKOptions, SDKClient };

export function createClient(options: SDKOptions): SDKClient {
  return new SDKClientImpl(options);
}