import Link from 'next/link';
import { cookies } from 'next/headers';

import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;
  if (!user) {
    return (
      <div className="container-page py-16">
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="mt-3 text-sm text-muted-foreground">Sign in to see your profile.</p>
        <Link href="/auth/login?redirect=/profile" className="btn-primary mt-6 inline-flex">Sign in</Link>
      </div>
    );
  }
  return (
    <div className="container-page py-16">
      <h1 className="text-3xl font-semibold">Profile</h1>
      <dl className="mt-6 max-w-md space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-border/50 py-2"><dt className="text-muted-foreground">Name</dt><dd>{user.name}</dd></div>
        <div className="flex justify-between gap-4 border-b border-border/50 py-2"><dt className="text-muted-foreground">Email</dt><dd>{user.email}</dd></div>
        <div className="flex justify-between gap-4 border-b border-border/50 py-2"><dt className="text-muted-foreground">City</dt><dd>{user.city || 'Not available'}</dd></div>
        <div className="flex justify-between gap-4 border-b border-border/50 py-2"><dt className="text-muted-foreground">Role</dt><dd>{user.role}</dd></div>
      </dl>
      <p className="mt-6 max-w-xl text-sm text-muted-foreground">
        Predictor marks and budget are not stored on this profile. See the <Link href="/privacy" className="text-primary hover:underline">privacy policy</Link>.
      </p>
    </div>
  );
}
