import { getRegisteredPassword, getRegisteredUsers } from '@/lib/users-store';
import type { SessionUser } from '@/lib/auth';

const DEMO_USERS: SessionUser[] = [
  { id: 'admin-1', name: 'Admin', email: 'admin@futurepath.pk', role: 'admin' },
  { id: 'student-1', name: 'Demo Student', email: 'student@futurepath.pk', role: 'student', city: 'Karachi' },
];

const DEMO_PASSWORDS: Record<string, string> = {
  'admin@futurepath.pk': 'admin123',
  'student@futurepath.pk': 'student123',
};

/** Server-only auth — checks demo accounts and users.json registrations. */
export function authenticateUser(email: string, password: string): SessionUser | null {
  const normalized = email.toLowerCase();
  const demoPassword = DEMO_PASSWORDS[normalized];
  if (demoPassword && demoPassword === password) {
    return DEMO_USERS.find((u) => u.email === normalized) ?? null;
  }

  const registeredPassword = getRegisteredPassword(normalized);
  if (!registeredPassword || registeredPassword !== password) return null;
  return getRegisteredUsers().find((u) => u.email.toLowerCase() === normalized) ?? null;
}
