import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { decodeSessionToken, isAdmin, SESSION_COOKIE } from '@/lib/auth';
import { getUniversities, clearUniversitiesCache } from '@/lib/data';
import { query } from '@/lib/db';
import type { RawUniversityV2 } from '@/lib/types';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = token ? decodeSessionToken(token) : null;
  if (!isAdmin(user)) return null;
  return user;
}

export async function GET() {
  try {
    const list = await getUniversities();
    return NextResponse.json({ universities: list });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch universities.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as Partial<RawUniversityV2>;
    if (!body.basic_information?.name) {
      return NextResponse.json({ error: 'University name is required.' }, { status: 400 });
    }

    const bi = body.basic_information;
    const slug = bi.slug || 
      (bi.short_name || bi.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Insert into universities table
    const res = await query(
      `INSERT INTO universities (
        name, short_name, slug, logo_url, official_website, admissions_portal,
        phone, email, address, city, province, country, year_established,
        charter_authority, hec_status, university_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        bi.name,
        bi.short_name || bi.name,
        slug,
        bi.logo_url || null,
        bi.official_website || null,
        bi.admissions_portal || null,
        bi.phone || null,
        bi.email || null,
        bi.address || null,
        bi.city || 'Karachi',
        bi.province || 'Sindh',
        bi.country || 'Pakistan',
        bi.year_established || null,
        bi.charter_authority || null,
        bi.hec_status || null,
        bi.university_type || 'Private'
      ]
    );

    const newUniRow = res.rows[0];

    // If overview is provided, insert it
    if (body.university_overview) {
      const ov = body.university_overview;
      await query(
        `INSERT INTO university_overview (
          university_id, history, mission, vision, reputation, national_ranking,
          major_strengths, notable_alumni, key_achievements
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          newUniRow.university_id,
          ov.history || null,
          ov.mission || null,
          ov.vision || null,
          ov.reputation || null,
          ov.national_ranking || null,
          ov.major_strengths || [],
          ov.notable_alumni || [],
          ov.key_achievements || []
        ]
      );
    }

    clearUniversitiesCache();

    return NextResponse.json({ success: true, university: newUniRow }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create university.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as Partial<RawUniversityV2> & { targetSlug?: string };
    const slug = body.targetSlug || body.basic_information?.slug;

    if (!slug) {
      return NextResponse.json({ error: 'University slug is required for updates.' }, { status: 400 });
    }

    const bi = body.basic_information;
    if (!bi) {
      return NextResponse.json({ error: 'Basic information is required for updates.' }, { status: 400 });
    }

    const updateRes = await query(
      `UPDATE universities 
       SET name = COALESCE($1, name),
           short_name = COALESCE($2, short_name),
           logo_url = COALESCE($3, logo_url),
           official_website = COALESCE($4, official_website),
           admissions_portal = COALESCE($5, admissions_portal),
           phone = COALESCE($6, phone),
           email = COALESCE($7, email),
           address = COALESCE($8, address),
           city = COALESCE($9, city),
           province = COALESCE($10, province),
           country = COALESCE($11, country),
           year_established = COALESCE($12, year_established),
           charter_authority = COALESCE($13, charter_authority),
           hec_status = COALESCE($14, hec_status),
           university_type = COALESCE($15, university_type),
           updated_at = NOW()
       WHERE slug = $16
       RETURNING *`,
      [
        bi.name || null,
        bi.short_name || null,
        bi.logo_url || null,
        bi.official_website || null,
        bi.admissions_portal || null,
        bi.phone || null,
        bi.email || null,
        bi.address || null,
        bi.city || null,
        bi.province || null,
        bi.country || null,
        bi.year_established || null,
        bi.charter_authority || null,
        bi.hec_status || null,
        bi.university_type || null,
        slug
      ]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ error: 'University not found.' }, { status: 404 });
    }

    const updatedUniRow = updateRes.rows[0];

    // If overview is provided, update overview
    if (body.university_overview) {
      const ov = body.university_overview;
      await query(
        `INSERT INTO university_overview (
          university_id, history, mission, vision, reputation, national_ranking,
          major_strengths, notable_alumni, key_achievements
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (overview_id) DO UPDATE 
        SET history = EXCLUDED.history,
            mission = EXCLUDED.mission,
            vision = EXCLUDED.vision,
            reputation = EXCLUDED.reputation,
            national_ranking = EXCLUDED.national_ranking,
            major_strengths = EXCLUDED.major_strengths,
            notable_alumni = EXCLUDED.notable_alumni,
            key_achievements = EXCLUDED.key_achievements,
            updated_at = NOW()`,
        [
          updatedUniRow.university_id,
          ov.history || null,
          ov.mission || null,
          ov.vision || null,
          ov.reputation || null,
          ov.national_ranking || null,
          ov.major_strengths || [],
          ov.notable_alumni || [],
          ov.key_achievements || []
        ]
      );
    }

    clearUniversitiesCache();
    return NextResponse.json({ success: true, university: updatedUniRow });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update university.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required.' }, { status: 400 });
    }

    const res = await query('UPDATE universities SET is_active = false, updated_at = NOW() WHERE slug = $1 RETURNING *', [slug]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'University not found.' }, { status: 404 });
    }

    clearUniversitiesCache();
    return NextResponse.json({ success: true, message: 'University deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete university.' }, { status: 500 });
  }
}
