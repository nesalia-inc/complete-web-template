import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { apiKey } from "@better-auth/api-key";
import { bearer } from "better-auth/plugins/bearer";
import { deviceAuthorization } from "better-auth/plugins/device-authorization";
import { db, user, session, account, verification, apikey, deviceCode } from "@complete-web-template/db";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;
if (!BETTER_AUTH_URL) {
  console.warn('BETTER_AUTH_URL not set - device authorization verification URI will use default');
}

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
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
      clientId: GITHUB_CLIENT_ID ?? '',
      clientSecret: GITHUB_CLIENT_SECRET ?? '',
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
      verificationUri: (BETTER_AUTH_URL || "http://localhost:3000") + "/device",
    }),
  ],
});

export type Auth = typeof auth;