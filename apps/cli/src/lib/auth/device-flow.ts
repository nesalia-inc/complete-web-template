import open from "open";

export type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
};

export type AuthFlowResult = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
};

export async function startDeviceFlow(baseUrl: string): Promise<AuthFlowResult> {
  const response = await fetch(`${baseUrl}/device/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: "cli" }),
  });

  if (!response.ok) {
    throw new Error("Failed to get device code");
  }

  const data = (await response.json()) as DeviceCodeResponse;
  const { user_code, verification_uri_complete, interval } = data;

  console.log(`\n  Open this URL in your browser:`);
  console.log(`  ${verification_uri_complete}\n`);
  console.log(`  Or enter the code: ${user_code}\n`);

  await open(verification_uri_complete);

  return pollForToken(data, baseUrl);
}

async function pollForToken(data: DeviceCodeResponse, baseUrl: string): Promise<AuthFlowResult> {
  const { device_code, interval } = data;
  let pollingIntervalMs = interval * 1000;

  while (true) {
    await sleep(pollingIntervalMs);

    const response = await fetch(`${baseUrl}/device/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code,
        client_id: "cli",
      }),
    });

    if (response.ok) {
      const d = (await response.json()) as TokenResponse
      console.log(`  Connected as ${d.user?.name || d.user?.email || "user"}\n`)

      let userInfo: { id: string; name: string; email: string; image?: string } = { id: "", name: "", email: "", image: undefined }
      if (d.user) {
        userInfo = d.user
      } else {
        // Use Bearer token Authorization header - the bearer plugin will convert
        // raw device tokens into a signed cookie format that /get-session can verify
        try {
          const sessionRes = await fetch(`${baseUrl}/get-session`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${d.access_token}` },
          })
          console.log(`  Session response status: ${sessionRes.status}`)
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json()
            console.log(`  Session data: ${JSON.stringify(sessionData)}`)
            // better-auth returns { session: {...}, user: {...} } directly
            if (sessionData?.user) {
              userInfo = sessionData.user
            }
          }
        } catch (e) {
          console.log(`  Session fetch error: ${e}`)
          // ignore
        }
      }

      return {
        accessToken: d.access_token,
        user: userInfo,
      }
    }

    const tokenData = (await response.json()) as { error?: string; error_description?: string }

    if (tokenData.error === "authorization_pending") {
      continue;
    }

    if (tokenData.error === "slow_down") {
      pollingIntervalMs += 5000;
      continue;
    }

    if (tokenData.error === "expired_token") {
      throw new Error("The code expired. Please try again.");
    }

    if (tokenData.error === "access_denied") {
      throw new Error("Authorization was denied.");
    }

    throw new Error(tokenData.error_description || `Unexpected error: ${tokenData.error}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}