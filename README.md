# Complete Web Template

A production-ready monorepo template for building full-stack web applications with end-to-end type safety.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| **API** | tRPC v11, Zod v4 |
| **Database** | PostgreSQL, Drizzle ORM |
| **Authentication** | Better Auth |
| **State** | TanStack Query |
| **Monorepo** | Turborepo, pnpm |

## Architecture

```
apps/
├── web/           # Next.js frontend application
└── cli/           # Developer CLI tools

packages/
├── db/            # Drizzle ORM schema & database client (single source of truth)
├── api/           # tRPC server with typed procedures
└── sdk/           # Isomorphic API client for web & CLI
```

### Key Design Decisions

- **Single Source of Truth**: Database schema in `packages/db` drives everything — migrations, tRPC inputs, SDK types
- **Type-Safe APIs**: tRPC procedures with Zod validation, full type inference from DB to client
- **Lazy DB Connections**: Pool created on first use, safe for serverless environments
- **Soft-Delete Pattern**: All application tables use `deletedAt` with proper indexes
- **Role-Based Access**: Three-tier procedures — `publicProcedure`, `protectedProcedure`, `adminProcedure`

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and auth secrets

# Push schema to database
pnpm drizzle-kit push

# Build all packages
pnpm build

# Start development
pnpm dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-min-32-chars

# Optional: GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Package Overview

### `packages/db`

Database layer with Drizzle ORM.

```typescript
import { db, posts, users, eq, isNull } from '@complete-web-template/db';

// Lazy singleton — safe for serverless
await db.select().from(posts).where(isNull(posts.deletedAt));
```

### `packages/api`

tRPC server with typed procedures.

```typescript
import { publicProcedure, protectedProcedure, adminProcedure } from '@complete-web-template/api';

// Procedures enforce auth at the router level
protectedProcedure.input(schema).mutation(({ ctx, input }) => {
  // ctx.user is guaranteed here
});
```

### `packages/sdk`

Isomorphic API client for web and CLI.

```typescript
import { createClient } from '@complete-web-template/sdk';

const client = createClient({ apiKey: 'your-key', baseUrl: 'https://api.example.com' });
const result = await client.test();
```

### `apps/web`

Next.js frontend with:
- App Router (React Server Components)
- TanStack Query for data fetching
- shadcn/ui component library
- Dark mode support

### `apps/cli`

Developer CLI for local workflows.

```bash
cli auth login      # Device authorization login
cli auth status     # Check authentication status
cli auth logout     # Clear credentials
```

## Database Schema

### Application Tables

| Table | Description |
|-------|-------------|
| `users` | Application users with roles (`guest`, `user`, `admin`) |
| `posts` | Blog posts with soft-delete |

### Better Auth Tables

| Table | Description |
|-------|-------------|
| `user` | Auth users (email, OAuth accounts) |
| `session` | Active sessions |
| `account` | OAuth provider links |
| `verification` | Email verification tokens |
| `apikey` | API keys for external access |
| `device_code` | Device authorization flow |

## Available Scripts

```bash
pnpm build          # Build all packages
pnpm dev            # Start development servers
pnpm lint           # Lint all packages
pnpm typecheck      # Type-check all packages
pnpm clean          # Clear build artifacts

# Database
pnpm drizzle-kit generate  # Generate migrations
pnpm drizzle-kit push     # Push schema to database
pnpm drizzle-kit studio   # Open Drizzle Studio
```

## Project Structure

```
.
├── packages/
│   ├── db/
│   │   └── src/db/
│   │       ├── index.ts       # DB client + re-exports
│   │       └── schema/
│   │           └── index.ts   # All table definitions
│   │
│   ├── api/
│   │   └── src/
│   │       ├── context.ts     # tRPC context (session + role lookup)
│   │       ├── init.ts        # Procedure definitions
│   │       ├── index.ts       # Public exports
│   │       ├── routers/       # Route handlers
│   │       └── auth/          # Better Auth config
│   │
│   └── sdk/
│       └── src/
│           ├── client.ts      # API client implementation
│           └── index.ts       # Public exports
│
├── apps/
│   ├── web/
│   │   ├── app/               # Next.js App Router
│   │   ├── components/        # React components
│   │   └── package.json
│   │
│   └── cli/
│       └── src/
│           ├── commands/      # CLI commands
│           └── index.ts       # Entry point
│
├── turbo.json                 # Turborepo config
├── pnpm-workspace.yaml        # pnpm workspaces
└── drizzle.config.ts         # Drizzle Kit config
```

## Development

### Adding a New Table

1. Define the table in `packages/db/src/db/schema/index.ts`
2. Add relations and indexes
3. Build the db package: `pnpm --filter @complete-web-template/db build`
4. Generate migration: `pnpm drizzle-kit generate`

### Adding a New API Route

1. Create router in `packages/api/src/routers/`
2. Import tables from `@complete-web-template/db` (never directly from drizzle-orm)
3. Add to root router in `packages/api/src/routers/_app.ts`
4. Build: `pnpm --filter @complete-web-template/api build`

### Adding SDK Methods

Extend `packages/sdk/src/client.ts` following the existing pattern with tRPC client.

## License

ISC
