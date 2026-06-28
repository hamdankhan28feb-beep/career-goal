import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';
import { authenticateUser } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; password?: string; role?: string };
    const { email = '', password = '', role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    if (role === 'admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const token = createSessionToken(user);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ user, redirect: user.role === 'admin' ? '/admin' : '/' });
  } catch {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
