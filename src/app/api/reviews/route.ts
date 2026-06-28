import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { decodeSessionToken, isAdmin, SESSION_COOKIE } from '@/lib/auth';
import { getUniversityBySlug, loadRawUniversitiesV2, saveRawUniversitiesV2 } from '@/lib/data';
import { addPendingReview, getAllStoredReviews, updateReviewStatus } from '@/lib/reviews-store';
import type { ReviewInput } from '@/lib/types';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = token ? decodeSessionToken(token) : null;
  if (!isAdmin(user)) return null;
  return user;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ reviews: getAllStoredReviews() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<ReviewInput & { universityName?: string }>;

    if (!body.universitySlug || !body.ratingOverall) {
      return NextResponse.json({ error: 'University and overall rating are required.' }, { status: 400 });
    }

    const university = getUniversityBySlug(body.universitySlug);
    if (!university) {
      return NextResponse.json({ error: 'University not found.' }, { status: 404 });
    }

    const review = addPendingReview({
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

    const updated = updateReviewStatus(body.id, body.status);
    if (!updated) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    // Publish to data_v2.json if approved
    if (body.status === 'approved') {
      const rawUnis = loadRawUniversitiesV2();
      const uniIndex = rawUnis.findIndex(
        (u) =>
          u.basic_information.slug === updated.universitySlug ||
          (u.basic_information.short_name || u.basic_information.name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') === updated.universitySlug
      );

      if (uniIndex !== -1) {
        if (!rawUnis[uniIndex].reviews) {
          rawUnis[uniIndex].reviews = [];
        }
        rawUnis[uniIndex].reviews!.push({
          reviewer_type: updated.reviewerType,
          rating_overall: updated.ratingOverall,
          rating_faculty: updated.ratingFaculty,
          rating_facilities: updated.ratingFacilities,
          rating_value_for_money: updated.ratingValueForMoney,
          positive_experiences: updated.positiveExperiences,
          common_complaints: updated.commonComplaints,
          pros: updated.pros,
          cons: updated.cons,
        });
        saveRawUniversitiesV2(rawUnis);
      }
    }

    return NextResponse.json({ review: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update review.' }, { status: 500 });
  }
}

