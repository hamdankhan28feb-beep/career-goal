import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type { ReviewInput } from '@/lib/types';

export type PendingReview = ReviewInput & {
  id: string;
  universityName: string;
  status: 'pending' | 'approved' | 'removed';
  createdAt: string;
};

type ReviewsFile = {
  reviews: PendingReview[];
};

const REVIEWS_PATH = path.join(process.cwd(), 'reviews-pending.json');

function readReviewsFile(): ReviewsFile {
  if (!existsSync(REVIEWS_PATH)) {
    return { reviews: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(REVIEWS_PATH, 'utf8')) as Partial<ReviewsFile>;
    return { reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [] };
  } catch {
    return { reviews: [] };
  }
}

function writeReviewsFile(data: ReviewsFile): void {
  writeFileSync(REVIEWS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function getPendingReviews(): PendingReview[] {
  return readReviewsFile().reviews.filter((r) => r.status === 'pending');
}

export function getAllStoredReviews(): PendingReview[] {
  return readReviewsFile().reviews;
}

export function addPendingReview(
  review: ReviewInput & { universityName: string }
): PendingReview {
  const data = readReviewsFile();
  const entry: PendingReview = {
    ...review,
    id: randomUUID(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  data.reviews.unshift(entry);
  writeReviewsFile(data);
  return entry;
}

export function updateReviewStatus(id: string, status: 'approved' | 'removed'): PendingReview | null {
  const data = readReviewsFile();
  const index = data.reviews.findIndex((r) => r.id === id);
  if (index === -1) return null;
  data.reviews[index] = { ...data.reviews[index], status };
  writeReviewsFile(data);
  return data.reviews[index];
}
