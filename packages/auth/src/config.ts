import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { apiKey } from "@better-auth/api-key";
import { bearer } from "better-auth/plugins/bearer";
import { deviceAuthorization } from "better-auth/plugins/device-authorization";
import { db, user, session, account, verification, apikey, deviceCode } from "@complete-web-template/db";

// Lazy singleton - auth is only created when first accessed
let authInstance: ReturnType<typeof createAuth> | null = null;

function createAuth() {
  const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user,
        session,
        account,
        verification,
        apikey,
        deviceCode,
      },
    }),
    emailAndPassword: { enabled: true },
    socialProviders: {
      github: {
        clientId: GITHUB_CLIENT_ID ?? "",
        clientSecret: GITHUB_CLIENT_SECRET ?? "",
      },
    },
    plugins: [
      apiKey({
        enableSessionForAPIKeys: true,
      }),
      bearer(),
      deviceAuthorization({
        expiresIn: "30m",
        interval: "5s",
        verificationUri:
          (BETTER_AUTH_URL || "http://localhost:3000") + "/device",
      }),
    ],
  });
}

export function getAuth() {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}

// For backward compatibility - use getAuth() instead
export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, prop) {
    return getAuth()[prop as keyof ReturnType<typeof createAuth>];
  },
});

export type Auth = ReturnType<typeof createAuth>;
