import { describe, it, expect, vi } from "vitest";
import { login, status, logout } from "../src/commands/auth";
import { loadCredentials, clearCredentials } from "../src/lib/auth/storage";
import { testServerWithAuth } from "./setup";

describe("CLI Auth Commands", () => {
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
      const { saveCredentials } = await import("../src/lib/auth/storage");
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
      const { saveCredentials } = await import("../src/lib/auth/storage");
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