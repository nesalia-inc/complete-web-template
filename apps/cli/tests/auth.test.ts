import { describe, it, expect, vi, beforeEach } from "vitest";
import { status, logout } from "../src/commands/auth";
import { loadCredentials, clearCredentials, saveCredentials } from "../src/lib/auth/storage";
import { testServer } from "./setup";

// Mock open before importing device-flow
vi.mock("../src/lib/auth/device-flow", async () => {
  const actual = await vi.importActual("../src/lib/auth/device-flow");
  return {
    ...actual,
    startDeviceFlow: vi.fn().mockImplementation(async () => ({
      accessToken: "test-access-token",
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
      },
    })),
  };
});

// Import login AFTER mocking
const { login } = await import("../src/commands/auth");

describe("CLI Auth Commands", () => {
  describe("login", () => {
    it("should login successfully with device flow", async () => {
      // Mock open to prevent browser from actually opening
      const openMock = vi.fn();
      vi.stubGlobal("open", Object.assign(openMock, { default: openMock }));

      // Start login - it uses mocked startDeviceFlow internally
      await login();

      // Verify credentials were stored
      const creds = loadCredentials();
      expect(creds).toBeDefined();
      expect(creds?.accessToken).toBe("test-access-token");
      expect(creds?.user).toBeDefined();
      expect(creds?.user.email).toBe("test@example.com");

      vi.unstubAllGlobals();
    });
  });

  describe("status", () => {
    it("should show not logged in message when no credentials", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      clearCredentials();

      await status();

      expect(consoleSpy).toHaveBeenCalledWith(
        "  Not logged in. Run 'auth login' to authenticate."
      );
      consoleSpy.mockRestore();
    });

    it("should show logged in message when credentials exist", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      // Simulate logged in state
      saveCredentials({
        accessToken: "test-token",
        user: { id: "1", name: "Test User", email: "test@example.com" },
        expiresAt: Date.now() + 86400000, // 1 day from now
      });

      // Mock the fetch call for session verification
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ user: { name: "Test User", email: "test@example.com" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
      vi.stubGlobal("fetch", fetchMock);

      await status();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test User")
      );
      consoleSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });

  describe("logout", () => {
    it("should show not logged in when no credentials", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      clearCredentials();

      await logout();

      expect(consoleSpy).toHaveBeenCalledWith("  Not logged in.");
      consoleSpy.mockRestore();
    });

    it("should clear credentials and confirm logout", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      // Set up credentials
      saveCredentials({
        accessToken: "test-token",
        user: { id: "1", name: "Test User", email: "test@example.com" },
        expiresAt: Date.now() + 86400000,
      });

      await logout();

      expect(consoleSpy).toHaveBeenCalledWith("  Successfully logged out.");
      expect(loadCredentials() ?? null).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});