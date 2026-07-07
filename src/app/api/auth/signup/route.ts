import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';

import { createSessionToken, SESSION_COOKIE, type UserRole } from '@/lib/auth';
import { registerUser } from '@/lib/users-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      city?: string;
    };

    const { name = '', email = '', password = '', role = 'student', city = 'Karachi' } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const result = await registerUser(
      {
        id: randomUUID(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        city,
      },
      password
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const token = createSessionToken(result.user);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ user: result.user, redirect: '/' });
  } catch {
    return NextResponse.json({ error: 'Signup failed.' }, { status: 500 });
  }
}
