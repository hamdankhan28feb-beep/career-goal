import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

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
  status?: string;
  source_url?: string;
  last_verified_at?: string;
  notes?: string;
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function mapProviderType(t: string): string {
  if (t === 'federal' || t === 'provincial') return 'HEC';
  if (t === 'private_foundation') return 'External';
  if (t === 'university') return 'Need-Based';
  return 'General';
}

async function loadResearchScholarships(): Promise<ScholarshipRow[]> {
  const csvPath = path.join(process.cwd(), 'data', 'research', 'scholarships.csv');
  const text = await readFile(csvPath, 'utf8');
  const rows = parseCsv(text);
  return rows.map((r, idx) => ({
    scholarship_id: idx + 1,
    scholarship_name: r.name || 'Unnamed Scholarship',
    scholarship_type: mapProviderType(r.provider_type || ''),
    eligibility: [r.academic_eligibility, r.financial_eligibility].filter(Boolean).join(' | ') || 'See official source.',
    coverage_percentage: null,
    coverage_type: r.award_coverage || 'See official source',
    annual_value_pkr: null,
    renewable: /renew|continu/i.test(r.renewal_notes || ''),
    renewable_conditions: r.renewal_notes || '',
    seats_available: null,
    external_body: r.provider || '',
    application_url: r.application_url || '',
    universityName: r.eligible_universities || r.provider || 'Multiple / see notes',
    universityShortName: r.provider_type || 'Research',
    universitySlug: 'research',
    universityCity: r.eligible_locations || 'Pakistan',
    status: r.status || 'unknown',
    source_url: r.source_url || '',
    last_verified_at: r.last_verified_at || '',
    notes: r.notes || '',
  }));
}

export async function GET(req: NextRequest) {
  const { cursor, limit } = parsePagination(req);
  const start = Number(cursor) || 0;

  try {
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
      [start, limit + 1]
    );

    const rows = res.rows;
    if (rows.length > 0) {
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
        status: 'unknown',
      }));
      const nextCursor = hasMore && data.length > 0 ? String(data[data.length - 1].scholarship_id) : null;
      return NextResponse.json({ scholarships: data, nextCursor, total: data.length, limit, source: 'database' });
    }
  } catch (error) {
    console.error('DB scholarships unavailable, using research CSV:', error);
  }

  try {
    const all = await loadResearchScholarships();
    const page = all.slice(start, start + limit);
    const nextCursor = start + limit < all.length ? String(start + limit) : null;
    return NextResponse.json({
      scholarships: page,
      nextCursor,
      total: all.length,
      limit,
      source: 'research_csv',
      disclaimer:
        'Statuses are from official pages checked 2026-10-10. None were confirmed currently open; unknown means no dated window was published.',
    });
  } catch (error) {
    console.error('Failed to load research scholarships:', error);
    return NextResponse.json({ error: 'Failed to fetch scholarships.' }, { status: 500 });
  }
}
