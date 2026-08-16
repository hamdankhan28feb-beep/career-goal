import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number): string {
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L PKR`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K PKR`;
  return `${amount} PKR`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Validates a post-login redirect target. Only accepts local, same-origin
 * paths (single leading slash) to prevent open redirects.
 */
export function sanitizeRedirectPath(path: string | null | undefined): string | null {
  if (!path || path.length > 2048) return null;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (/[\\:]/.test(path)) return null;
  return path;
}