import Link from 'next/link';
import { cookies } from 'next/headers';

import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;
  if (!user) {
    return (
      <div className="container-page py-16">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-3 text-sm text-muted-foreground">Sign in to see your account.</p>
        <Link href="/auth/login?redirect=/dashboard" className="btn-primary mt-6 inline-flex">Sign in</Link>
      </div>
    );
  }
  return (
    <div className="container-page py-16">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-3 text-sm text-muted-foreground">Signed in as {user.name} ({user.email}).</p>
      <ul className="mt-6 space-y-2 text-sm">
        <li><Link className="text-primary hover:underline" href="/profile">Profile</Link></li>
        <li><Link className="text-primary hover:underline" href="/universities">Universities</Link></li>
        <li><Link className="text-primary hover:underline" href="/report">Report incorrect information</Link></li>
        {user.role === 'admin' && <li><Link className="text-primary hover:underline" href="/admin">Admin</Link></li>}
      </ul>
    </div>
  );
}
