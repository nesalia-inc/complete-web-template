# CLAUDE.md — @complete-web-template/auth

This package is the **single source of truth** for Better Auth configuration.

## Structure

```
src/
├── index.ts     # Public exports
└── config.ts    # Better Auth instance
```

## Usage

```typescript
import { auth } from '@complete-web-template/auth';

// In Next.js route handler
import { toNextJsHandler } from 'better-auth/next-js';
export const { GET, POST } = toNextJsHandler(auth);
```

## Environment Variables

- `BETTER_AUTH_URL` — Base URL (default: http://localhost:3000)
- `BETTER_AUTH_SECRET` — Required, min 32 chars
- `GITHUB_CLIENT_ID` — Optional, for GitHub OAuth
- `GITHUB_CLIENT_SECRET` — Optional, for GitHub OAuth

## Dependencies

- `better-auth` — Auth framework
- `@better-auth/drizzle-adapter` — Database adapter
- `@complete-web-template/db` — Database schema and client

## Build

```bash
pnpm --filter @complete-web-template/auth build
```
