import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import open from "open";

export type AuthFlowResult = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
};

// Create client with proper typing
function createCLIAuthClient(baseURL: string) {
  return createAuthClient({
    baseURL,
    plugins: [deviceAuthorizationClient()],
  });
}

export async function startDeviceFlow(baseUrl: string): Promise<AuthFlowResult> {
  const authClient = createCLIAuthClient(baseUrl);

  console.log("\n  Requesting device authorization...\n");

  const { data, error } = await authClient.device.code({
    client_id: "cli",
  });

  if (error || !data) {
    throw new Error(error?.error_description || "Failed to get device code");
  }

  const { user_code, verification_uri_complete, interval = 5 } = data;

  console.log(`  Open this URL in your browser:`);
  console.log(`  ${verification_uri_complete}\n`);
  console.log(`  Or enter the code: ${user_code}\n`);

  await open(verification_uri_complete);

  console.log(`  Waiting for authorization... (polling every ${interval}s)\n`);

  return pollForToken(authClient, data.device_code, interval);
}

async function pollForToken(
  authClient: ReturnType<typeof createCLIAuthClient>,
  deviceCode: string,
  interval: number
): Promise<AuthFlowResult> {
  let pollingInterval = interval * 1000;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      const { data, error } = await authClient.device.token({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: deviceCode,
        client_id: "cli",
      });

      if (data?.access_token) {
        console.log("  Authorization successful!\n");

        // Get session with the access token
        const sessionResponse = await authClient.getSession({
          fetchOptions: {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          },
        });

        // Extract user from session data
        const sessionData = (sessionResponse as { data?: { user?: { id: string; name: string; email: string; image?: string } } })?.data;
        const user = sessionData?.user ?? {
          id: "",
          name: "Unknown",
          email: "",
        };

        console.log(`  Connected as ${user.name || user.email || "user"}\n`);

        resolve({
          accessToken: data.access_token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        });
      } else if (error) {
        switch (error.error) {
          case "authorization_pending":
            // Continue polling silently
            break;
          case "slow_down":
            pollingInterval += 5000;
            console.log(`  Slowing down polling to ${pollingInterval / 1000}s\n`);
            break;
          case "access_denied":
            reject(new Error("Authorization was denied."));
            return;
          case "expired_token":
            reject(new Error("The code expired. Please try again."));
            return;
          default:
            reject(new Error(error.error_description || `Unexpected error: ${error.error}`));
            return;
        }
      }

      setTimeout(poll, pollingInterval);
    };

    setTimeout(poll, pollingInterval);
  });
}
