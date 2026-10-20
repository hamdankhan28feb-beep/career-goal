import { headers } from 'next/headers';

import { isGoogleOAuthConfigured } from '@/lib/google-auth';

import { LoginForm } from './login-form';

export default async function LoginPage() {
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  const origin = host ? `${proto}://${host}` : undefined;
  return <LoginForm googleEnabled={isGoogleOAuthConfigured(origin)} />;
}
