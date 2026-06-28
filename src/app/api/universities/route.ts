import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { decodeSessionToken, isAdmin, SESSION_COOKIE } from '@/lib/auth';
import { loadRawUniversitiesV2, saveRawUniversitiesV2, getUniversities } from '@/lib/data';
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
    return NextResponse.json({ universities: getUniversities() });
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

    const rawList = loadRawUniversitiesV2();
    const newId = rawList.reduce((max, u) => Math.max(max, u.university_id), 0) + 1;

    const slug = body.basic_information.slug || 
      (body.basic_information.short_name || body.basic_information.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const newUni: RawUniversityV2 = {
      university_id: newId,
      basic_information: {
        name: body.basic_information.name,
        short_name: body.basic_information.short_name || body.basic_information.name,
        slug,
        logo_url: body.basic_information.logo_url || null,
        official_website: body.basic_information.official_website || '',
        admissions_portal: body.basic_information.admissions_portal || '',
        phone: body.basic_information.phone || null,
        email: body.basic_information.email || null,
        address: body.basic_information.address || null,
        city: body.basic_information.city || 'Karachi',
        province: body.basic_information.province || 'Sindh',
        country: body.basic_information.country || 'Pakistan',
        year_established: body.basic_information.year_established || null,
        charter_authority: body.basic_information.charter_authority || null,
        hec_status: body.basic_information.hec_status || null,
        university_type: body.basic_information.university_type || 'Private',
        accreditations: body.basic_information.accreditations || [],
      },
      university_overview: {
        history: body.university_overview?.history || null,
        mission: body.university_overview?.mission || null,
        vision: body.university_overview?.vision || null,
        reputation: body.university_overview?.reputation || null,
        national_ranking: body.university_overview?.national_ranking || null,
        major_strengths: body.university_overview?.major_strengths || [],
        notable_alumni: body.university_overview?.notable_alumni || [],
        key_achievements: body.university_overview?.key_achievements || [],
      },
      campuses: body.campuses || [],
      programs: body.programs || [],
      admissions: body.admissions || null,
      entry_tests: body.entry_tests || [],
      fees: body.fees || null,
      scholarships: body.scholarships || [],
      academic_policies: body.academic_policies || [],
      faculty_academics: body.faculty_academics || null,
      student_life: body.student_life || null,
      facilities: body.facilities || [],
      hostel: body.hostel || null,
      transport: body.transport || null,
      placements: body.placements || null,
      career_paths: body.career_paths || [],
      rankings: body.rankings || [],
      reviews: body.reviews || [],
      faqs: body.faqs || [],
      important_links: body.important_links || [],
      data_collection: {
        data_completeness_pct: 50,
        scraping_priority_score: 5,
        missing_fields: [],
      },
    };

    rawList.push(newUni);
    saveRawUniversitiesV2(rawList);

    return NextResponse.json({ success: true, university: newUni }, { status: 201 });
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

    const rawList = loadRawUniversitiesV2();
    const index = rawList.findIndex((u) => u.basic_information.slug === slug);
    if (index === -1) {
      return NextResponse.json({ error: 'University not found.' }, { status: 404 });
    }

    const existing = rawList[index];

    // Merge updates
    rawList[index] = {
      ...existing,
      basic_information: {
        ...existing.basic_information,
        ...body.basic_information,
        name: body.basic_information?.name || existing.basic_information.name,
      },
      university_overview: body.university_overview !== undefined ? body.university_overview : existing.university_overview,
      campuses: body.campuses !== undefined ? body.campuses : existing.campuses,
      programs: body.programs !== undefined ? body.programs : existing.programs,
      admissions: body.admissions !== undefined ? body.admissions : existing.admissions,
      entry_tests: body.entry_tests !== undefined ? body.entry_tests : existing.entry_tests,
      fees: body.fees !== undefined ? body.fees : existing.fees,
      scholarships: body.scholarships !== undefined ? body.scholarships : existing.scholarships,
      academic_policies: body.academic_policies !== undefined ? body.academic_policies : existing.academic_policies,
      faculty_academics: body.faculty_academics !== undefined ? body.faculty_academics : existing.faculty_academics,
      student_life: body.student_life !== undefined ? body.student_life : existing.student_life,
      facilities: body.facilities !== undefined ? body.facilities : existing.facilities,
      hostel: body.hostel !== undefined ? body.hostel : existing.hostel,
      transport: body.transport !== undefined ? body.transport : existing.transport,
      placements: body.placements !== undefined ? body.placements : existing.placements,
      career_paths: body.career_paths !== undefined ? body.career_paths : existing.career_paths,
      rankings: body.rankings !== undefined ? body.rankings : existing.rankings,
      faqs: body.faqs !== undefined ? body.faqs : existing.faqs,
      important_links: body.important_links !== undefined ? body.important_links : existing.important_links,
    };

    saveRawUniversitiesV2(rawList);
    return NextResponse.json({ success: true, university: rawList[index] });
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

    const rawList = loadRawUniversitiesV2();
    const filtered = rawList.filter((u) => u.basic_information.slug !== slug);

    if (filtered.length === rawList.length) {
      return NextResponse.json({ error: 'University not found.' }, { status: 404 });
    }

    saveRawUniversitiesV2(filtered);
    return NextResponse.json({ success: true, message: 'University deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete university.' }, { status: 500 });
  }
}
