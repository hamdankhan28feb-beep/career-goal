import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { SessionUser } from '@/lib/auth';

type UsersFile = {
  users: SessionUser[];
  passwords: Record<string, string>;
};

const USERS_PATH = path.join(process.cwd(), 'users.json');

function readUsersFile(): UsersFile {
  if (!existsSync(USERS_PATH)) {
    return { users: [], passwords: {} };
  }
  try {
    const parsed = JSON.parse(readFileSync(USERS_PATH, 'utf8')) as Partial<UsersFile>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      passwords: parsed.passwords ?? {},
    };
  } catch {
    return { users: [], passwords: {} };
  }
}

function writeUsersFile(data: UsersFile): void {
  writeFileSync(USERS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function getRegisteredUsers(): SessionUser[] {
  return readUsersFile().users;
}

export function getRegisteredPassword(email: string): string | null {
  const { passwords } = readUsersFile();
  return passwords[email.toLowerCase()] ?? null;
}

export function registerUser(user: SessionUser, password: string): { ok: true; user: SessionUser } | { ok: false; error: string } {
  const data = readUsersFile();
  const email = user.email.toLowerCase();

  if (data.users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const saved = { ...user, email };
  data.users.push(saved);
  data.passwords[email] = password;
  writeUsersFile(data);
  return { ok: true, user: saved };
}
