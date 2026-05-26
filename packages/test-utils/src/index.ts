/**
 * @complete-web-template/test-utils
 *
 * Shared test utilities for SDK and CLI integration tests.
 * Provides a test server with PGlite, Better Auth, and tRPC.
 */

export {
  createTestServer,
  createTestServerWithAuth,
  type TestServer,
} from "./test-server";
export {
  createTempDir,
  mockOpen,
  restoreOpen,
} from "./mocks";