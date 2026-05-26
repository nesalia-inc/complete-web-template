import { createClient } from "../../src";

// Test configuration
export const TEST_API_KEY = "sk_test_12345";

// This will be set by setup.ts
export let baseUrl: string = "http://localhost:3000";

export function setBaseUrl(url: string) {
  baseUrl = url;
}

export function createTestClient() {
  return createClient({
    apiKey: TEST_API_KEY,
    baseUrl,
  });
}
