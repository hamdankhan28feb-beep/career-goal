import { query } from '@/lib/db';
import { clearUniversitiesCache } from '@/lib/data';
import type { ReviewInput } from '@/lib/types';

export type PendingReview = ReviewInput & {
  id: string;
  universityName: string;
  status: 'pending' | 'approved' | 'removed';
  createdAt: string;
};

// Map database row to PendingReview
function mapRowToPendingReview(row: any): PendingReview {
  let status: 'pending' | 'approved' | 'removed' = 'pending';
  if (row.verified) {
    status = 'approved';
  } else if (!row.is_active) {
    status = 'removed';
  }

  return {
    id: String(row.review_id),
    universitySlug: row.slug || '',
    universityName: row.name || '',
    reviewerType: row.reviewer_type || 'Other',
    ratingOverall: Number(row.rating_overall),
    ratingFaculty: Number(row.rating_faculty),
    ratingFacilities: Number(row.rating_facilities),
    ratingValueForMoney: Number(row.rating_value_for_money),
    positiveExperiences: row.positive_experiences || '',
    commonComplaints: row.common_complaints || '',
    pros: row.pros || [],
    cons: row.cons || [],
    status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export async function getPendingReviews(): Promise<PendingReview[]> {
  try {
    const res = await query(
      `SELECT r.*, u.name, u.slug 
       FROM reviews r 
       JOIN universities u ON r.university_id = u.university_id 
       WHERE r.verified = false AND r.is_active = true 
       ORDER BY r.created_at DESC`
    );
    return res.rows.map(mapRowToPendingReview);
  } catch (err) {
    console.error('Failed to get pending reviews:', err);
    return [];
  }
}

export async function getAllStoredReviews(): Promise<PendingReview[]> {
  try {
    const res = await query(
      `SELECT r.*, u.name, u.slug 
       FROM reviews r 
       JOIN universities u ON r.university_id = u.university_id 
       ORDER BY r.created_at DESC`
    );
    return res.rows.map(mapRowToPendingReview);
  } catch (err) {
    console.error('Failed to get all reviews:', err);
    return [];
  }
}

export async function addPendingReview(
  review: ReviewInput & { universityName: string }
): Promise<PendingReview | null> {
  try {
    // Resolve university_id from slug
    const uniRes = await query('SELECT university_id, name FROM universities WHERE slug = $1', [review.universitySlug]);
    if (uniRes.rows.length === 0) {
      throw new Error(`University not found for slug: ${review.universitySlug}`);
    }
    const universityId = uniRes.rows[0].university_id;
    const universityName = uniRes.rows[0].name;

    // Validate and map reviewer type enum
    const validReviewerTypes = ['Current Student', 'Alumni', 'Faculty', 'Employer', 'Parent', 'Other'];
    const reviewerType = validReviewerTypes.includes(review.reviewerType) ? review.reviewerType : 'Other';

    const insertRes = await query(
      `INSERT INTO reviews (
        university_id, reviewer_type, review_date, rating_overall, 
        rating_faculty, rating_facilities, rating_value_for_money, 
        positive_experiences, common_complaints, pros, cons, verified, is_active
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, false, true)
      RETURNING *`,
      [
        universityId,
        reviewerType,
        review.ratingOverall,
        review.ratingFaculty,
        review.ratingFacilities,
        review.ratingValueForMoney,
        review.positiveExperiences,
        review.commonComplaints,
        review.pros,
        review.cons,
      ]
    );

    if (insertRes.rows.length === 0) return null;

    // Clear caches
    clearUniversitiesCache();

    const row = insertRes.rows[0];
    return mapRowToPendingReview({
      ...row,
      name: universityName,
      slug: review.universitySlug
    });
  } catch (err) {
    console.error('Failed to add pending review:', err);
    return null;
  }
}

export async function updateReviewStatus(id: string, status: 'approved' | 'removed'): Promise<PendingReview | null> {
  try {
    const verified = status === 'approved';
    const isActive = status !== 'removed';

    const res = await query(
      `UPDATE reviews 
       SET verified = $1, is_active = $2, updated_at = NOW() 
       WHERE review_id = $3 
       RETURNING *`,
      [verified, isActive, id]
    );

    if (res.rows.length === 0) return null;

    // Get university details to map
    const row = res.rows[0];
    const uniRes = await query('SELECT name, slug FROM universities WHERE university_id = $1', [row.university_id]);
    const name = uniRes.rows[0]?.name || '';
    const slug = uniRes.rows[0]?.slug || '';

    // Clear caches since reviews list changed
    clearUniversitiesCache();

    return mapRowToPendingReview({
      ...row,
      name,
      slug
    });
  } catch (err) {
    console.error('Failed to update review status:', err);
    return null;
  }
}
