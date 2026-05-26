import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from './auth/config';
import { db, users, eq } from '@complete-web-template/db';

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  });

  let userRole: string | null = null;

  if (session?.user?.email) {
    const [appUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, session.user.email));
    userRole = appUser?.role ?? null;
  }

  const safeUser = session?.user ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    image: session.user.image,
    createdAt: session.user.createdAt,
    role: userRole,
  } : null;

  return {
    session: session ? { ...session, user: safeUser } : null,
    user: safeUser,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;