import { setBaseUrl } from "./helpers/client";
import { createTestServer } from "@complete-web-template/test-utils";
import type { TestServer } from "@complete-web-template/test-utils";
import { createClient, type SDKClient } from "../src";

// This will be set by setup.ts
export let baseUrl: string = "http://localhost:3000";

export function setBaseUrl(url: string) {
  baseUrl = url;
}

export const TEST_API_KEY = "sk_test_12345";

// Test server instance (managed by setup.ts)
export let testServer: TestServer;

// Create test client factory - must be called AFTER beforeAll runs
let clientInstance: SDKClient | null = null;

export function createTestClient(): SDKClient {
  if (!clientInstance) {
    clientInstance = createClient({
      apiKey: TEST_API_KEY,
      baseUrl,
    });
  }
  return clientInstance;
}

beforeAll(async () => {
  // Start the test server
  testServer = await createTestServer();
  setBaseUrl(testServer.baseUrl);

  // Pre-create the client so it's ready for tests
  clientInstance = createClient({
    apiKey: TEST_API_KEY,
    baseUrl: testServer.baseUrl,
  });
});

afterAll(async () => {
  if (testServer) {
    await testServer.close();
  }
});