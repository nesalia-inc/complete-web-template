import os from "os";
import path from "path";
import fs from "fs";
import { vi } from "vitest";

/**
 * Creates a temporary directory for test config storage.
 * Returns the path and a cleanup function.
 *
 * @example
 * ```typescript
 * const { configPath, cleanup } = createTempDir();
 *
 * beforeEach(() => {
 *   process.env.CWT_CONFIG_PATH = configPath;
 * });
 *
 * afterEach(() => {
 *   cleanup();
 * });
 * ```
 */
export function createTempDir(): { configPath: string; cleanup: () => void } {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cwt-test-"));
  return {
    configPath: tempDir,
    cleanup: () => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

/**
 * Mocks the `open` package to prevent actual browser opening.
 * Returns a mock function that captures the opened URLs.
 *
 * @example
 * ```typescript
 * it("opens browser", async () => {
 *   const mockOpen = mockOpen();
 *
 *   await login();
 *
 *   expect(mockOpen).toHaveBeenCalledWith(
 *     expect.stringContaining("user_code")
 *   );
 * });
 * ```
 */
export function mockOpen(): ReturnType<typeof vi.fn> {
  const fn = vi.fn();
  vi.stubGlobal(
    "open",
    Object.assign(fn, {
      default: fn,
      __esModule: true,
    })
  );
  return fn;
}

/**
 * Restores the original `open` function if it was mocked.
 */
export function restoreOpen(): void {
  vi.unstubAllGlobals();
}