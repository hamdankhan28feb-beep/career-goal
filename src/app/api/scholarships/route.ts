import { NextRequest, NextResponse } from 'next/server';

import { query } from '@/lib/db';
import { parsePagination } from '@/lib/pagination';

type ScholarshipRow = {
  scholarship_id: number;
  scholarship_name: string;
  scholarship_type: string;
  eligibility: string;
  coverage_percentage: number | null;
  coverage_type: string;
  annual_value_pkr: number | null;
  renewable: boolean;
  renewable_conditions: string;
  seats_available: number | null;
  external_body: string;
  application_url: string;
  universityName: string;
  universityShortName: string;
  universitySlug: string;
  universityCity: string;
};

export async function GET(req: NextRequest) {
  try {
    const { cursor, limit } = parsePagination(req);

    const res = await query(
      `SELECT
        s.scholarship_id,
        s.scholarship_name,
        s.scholarship_type,
        s.eligibility,
        s.coverage_percentage,
        s.coverage_type,
        s.annual_value_pkr,
        s.renewable,
        s.renewable_conditions,
        s.seats_available,
        s.external_body,
        s.application_url,
        u.name          AS "universityName",
        u.short_name    AS "universityShortName",
        u.slug          AS "universitySlug",
        u.city          AS "universityCity"
       FROM scholarships s
       JOIN universities u ON s.university_id = u.university_id
       WHERE s.is_active = true AND s.scholarship_id > $1
       ORDER BY s.scholarship_id ASC
       LIMIT $2`,
      [cursor, limit + 1]
    );

    const rows = res.rows;
    const hasMore = rows.length > limit;
    const data: ScholarshipRow[] = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
      scholarship_id: Number(r.scholarship_id),
      scholarship_name: r.scholarship_name ?? 'Unnamed Scholarship',
      scholarship_type: r.scholarship_type ?? 'General',
      eligibility: r.eligibility ?? 'Contact admissions for details.',
      coverage_percentage: r.coverage_percentage ? Number(r.coverage_percentage) : null,
      coverage_type: r.coverage_type ?? 'Tuition Fee Waiver',
      annual_value_pkr: r.annual_value_pkr ? Number(r.annual_value_pkr) : null,
      renewable: !!r.renewable,
      renewable_conditions: r.renewable_conditions ?? '',
      seats_available: r.seats_available ?? null,
      external_body: r.external_body ?? '',
      application_url: r.application_url ?? '',
      universityName: r.universityName,
      universityShortName: r.universityShortName,
      universitySlug: r.universitySlug,
      universityCity: r.universityCity,
    }));

    const nextCursor = hasMore && data.length > 0
      ? String(rows[limit - 1].scholarship_id)
      : null;

    const countRes = await query(
      'SELECT COUNT(*) FROM scholarships WHERE is_active = true AND scholarship_id > $1',
      [cursor]
    );
    const total = Number(countRes.rows[0].count);

    return NextResponse.json({
      scholarships: data,
      nextCursor,
      total,
      limit,
    });
  } catch (error: any) {
    console.error('Failed to fetch scholarships:', error);
    return NextResponse.json({ error: 'Failed to fetch scholarships.' }, { status: 500 });
  }
}
