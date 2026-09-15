import { cookies } from 'next/headers';

import { SESSION_COOKIE, verifySessionToken, type SessionUser } from '@/lib/auth';
import { HeaderNav } from '@/components/site-header';

/**
 * Server component wrapper that reads the session cookie and passes the
 * authenticated user (if any) to the client-side header.
 */
export async function SiteHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user: SessionUser | null = token ? await verifySessionToken(token) : null;

  return <HeaderNav user={user} />;
}
