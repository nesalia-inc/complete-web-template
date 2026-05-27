---
name: better-auth-version-mismatch
description: Issue #1 root cause - @better-auth/client alpha conflicts with better-auth 1.6.11
type: project
---

## Bug: TypeError: e is not a function on /api/auth/get-session

**Why:** `apps/web/package.json` has `@better-auth/client@0.0.2-alpha.3` directly installed. This is an old standalone package unrelated to the main better-auth ecosystem.

**How to apply:** The code imports `createAuthClient from "better-auth/client"` which uses the correct bundled client from `better-auth@1.6.11`. However, the old alpha package creates bundling conflicts leading to the minified error.

**Fix:** Remove `@better-auth/client` from `apps/web/package.json` — it's unused and conflicts.