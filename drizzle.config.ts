import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/db/src/db/schema/index.ts",
  out: "./packages/db/src/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});