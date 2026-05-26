import { createTestServerWithAuth } from "@complete-web-template/test-utils";
import { createTempDir, mockOpen, restoreOpen } from "@complete-web-template/test-utils";
import { clearCredentials } from "../src/lib/auth/storage";
import type { TestServer } from "@complete-web-template/test-utils";

// Test server instance
export let testServer: Awaited<ReturnType<typeof createTestServerWithAuth>> | null = null;

// Temp directory for config
export let tempDir: { configPath: string; cleanup: () => void };

// Set up test environment before all tests
beforeAll(async () => {
  // Create temp directory for config storage
  tempDir = createTempDir();
  process.env.CWT_CONFIG_PATH = tempDir.configPath;

  // Start test server with auth
  testServer = await createTestServerWithAuth();

  // Set API URL for CLI
  process.env.CWT_API_URL = testServer.baseUrl;

  // Mock open to prevent browser launching
  mockOpen();
});

// Clean up after all tests
afterAll(async () => {
  if (testServer) {
    await testServer.close();
  }
  restoreOpen();
  tempDir.cleanup();
  delete process.env.CWT_CONFIG_PATH;
  delete process.env.CWT_API_URL;
});

// Clean up before each test (reset credentials)
beforeEach(() => {
  // Reset the config storage between tests
  clearCredentials();
});