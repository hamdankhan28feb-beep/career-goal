import { compare } from 'bcryptjs';

import type { SessionUser } from '@/lib/auth';
import { findUserByEmail } from '@/lib/users-store';

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const user = await findUserByEmail(email);
  if (
    !user ||
    !user.isActive ||
    user.passwordHash.startsWith('__GOOGLE_OAUTH__') ||
    user.passwordHash === '__RESET_REQUIRED__'
  ) {
    return null;
  }

  const passwordMatches = await compare(password, user.passwordHash);
  if (!passwordMatches) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    city: user.city,
  };
}
