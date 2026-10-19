import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { isAdmin, SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { getUniversityBySlug } from '@/lib/data';
import { checkRateLimit } from '@/lib/rate-limit';
import { parsePagination } from '@/lib/pagination';
import { addPendingReview, getAllStoredReviews, getStoredReviewsPage, updateReviewStatus } from '@/lib/reviews-store';
import type { ReviewInput } from '@/lib/types';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;
  if (!isAdmin(user)) return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { cursor, limit } = parsePagination(req);

  // Backward compatible: no cursor = return all
  if (cursor === 0 && !new URL(req.url).searchParams.has('cursor')) {
    return NextResponse.json({ reviews: await getAllStoredReviews() });
  }

  const page = await getStoredReviewsPage(cursor, limit);
  return NextResponse.json({
    reviews: page.data,
    nextCursor: page.nextCursor,
    total: page.total,
    limit: page.limit
  });
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'review');
  if (limited) return limited;

  try {
    const body = await req.json() as Partial<ReviewInput & { universityName?: string }>;

    if (!body.universitySlug || !body.ratingOverall) {
      return NextResponse.json({ error: 'University and overall rating are required.' }, { status: 400 });
    }

    const university = await getUniversityBySlug(body.universitySlug);
    if (!university) {
      return NextResponse.json({ error: 'University not found.' }, { status: 404 });
    }

    const review = await addPendingReview({
      universitySlug: body.universitySlug,
      universityName: body.universityName ?? university.name,
      reviewerType: body.reviewerType ?? 'Current Student',
      ratingOverall: body.ratingOverall,
      ratingFaculty: body.ratingFaculty ?? body.ratingOverall,
      ratingFacilities: body.ratingFacilities ?? body.ratingOverall,
      ratingValueForMoney: body.ratingValueForMoney ?? body.ratingOverall,
      positiveExperiences: body.positiveExperiences ?? '',
      commonComplaints: body.commonComplaints ?? '',
      pros: body.pros ?? [],
      cons: body.cons ?? [],
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { id?: string; status?: 'approved' | 'removed' };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: 'Review id and status are required.' }, { status: 400 });
    }

    const updated = await updateReviewStatus(body.id, body.status);
    if (!updated) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    return NextResponse.json({ review: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update review.' }, { status: 500 });
  }
}

