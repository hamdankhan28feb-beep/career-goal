import { NextRequest, NextResponse } from 'next/server';

import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';
import { registerUser } from '@/lib/users-store';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
      city?: unknown;
    };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';

    if (!name || !email || !password || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: 'A valid name, email, and password are required.' }, { status: 400 });
    }

    if (name.length > 120 || email.length > 254 || city.length > 120 || password.length < 12 || password.length > 128) {
      return NextResponse.json(
        { error: 'Use a valid name, city, email, and a password between 12 and 128 characters.' },
        { status: 400 },
      );
    }

    // Public registration always creates a normal user. Never accept a client role.
    const user = await registerUser({ name, email, password, city });
    const token = await createSessionToken(user);
    const response = NextResponse.json({ user, redirect: '/' }, { status: 201 });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      priority: 'high',
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Signup failed.' }, { status: 500 });
  }
}
