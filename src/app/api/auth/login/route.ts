import { NextRequest, NextResponse } from 'next/server';

import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';
import { authenticateUser } from '@/lib/auth-server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, 'auth');
  if (limited) return limited;

  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password || email.length > 254 || password.length > 128) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = await createSessionToken(user);
    const response = NextResponse.json({
      user,
      redirect: user.role === 'admin' ? '/admin' : '/dashboard',
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      priority: 'high',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
