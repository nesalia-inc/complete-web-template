import { saveCredentials, loadCredentials, clearCredentials, isExpired, type StoredCredentials } from "../lib/auth/storage.js";
import { startDeviceFlow } from "../lib/auth/device-flow.js";

const DEFAULT_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

export async function login(): Promise<void> {
  console.log("  Starting device authorization flow...\n");

  try {
    const result = await startDeviceFlow(`${DEFAULT_AUTH_URL}/api/auth`);

    const credentials: StoredCredentials = {
      accessToken: result.accessToken,
      user: result.user,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    saveCredentials(credentials);
    console.log("  Successfully logged in!");
  } catch (error) {
    console.error(`  Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    process.exit(1);
  }
}

export async function status(): Promise<void> {
  const credentials = loadCredentials();

  if (!credentials) {
    console.log("  Not logged in. Run 'auth login' to authenticate.");
    return;
  }

  if (isExpired(credentials)) {
    console.log("  Session expired. Run 'auth login' to authenticate again.");
    clearCredentials();
    return;
  }

  // Verify the session with the server
  try {
    const sessionRes = await fetch(`${DEFAULT_AUTH_URL}/api/auth/get-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${credentials.accessToken}`,
      },
      body: JSON.stringify({}),
    });

    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();
      if (sessionData?.user) {
        console.log(`  Logged in as ${sessionData.user.name} (${sessionData.user.email})`);
        return;
      }
    }
  } catch {
    // Fall back to local credentials on error
  }

  console.log(`  Logged in as ${credentials.user.name} (${credentials.user.email})`);
}

export async function logout(): Promise<void> {
  const credentials = loadCredentials();

  if (!credentials) {
    console.log("  Not logged in.");
    return;
  }

  clearCredentials();
  console.log("  Successfully logged out.");
}