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
  research_id?: string;
  provider_type?: string;
  deadline?: string;
  eligible_levels?: string;
  documents_required?: string;
};

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

function mapProviderType(t: string): string {
  if (t === 'federal' || t === 'provincial') return 'HEC';
  if (t === 'private_foundation') return 'External';
  if (t === 'university') return 'Need-Based';
  return 'General';
}

function normStatus(s?: string): string {
  const v = (s || '').toLowerCase();
  return v === 'active' || v === 'closed' ? v : 'unknown';
}

async function loadResearchRaw(): Promise<{ rows: Record<string, string>[]; source: string }> {
  const dir = path.join(process.cwd(), 'data', 'research');
  try {
    const parsed = JSON.parse(await readFile(path.join(dir, 'scholarships.json'), 'utf8'));
    const rows = Array.isArray(parsed) ? parsed : parsed.records;
    if (Array.isArray(rows) && rows.length) return { rows, source: 'research_json' };
  } catch {
    /* fall through to CSV */
  }
  const text = await readFile(path.join(dir, 'scholarships.csv'), 'utf8');
  return { rows: parseCsv(text), source: 'research_csv' };
}

async function loadResearchScholarships(): Promise<{ rows: ScholarshipRow[]; source: string }> {
  const { rows, source } = await loadResearchRaw();
  return {
    source,
    rows: rows.map((r, idx) => ({
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
      status: normStatus(r.status),
      source_url: r.source_url || '',
      last_verified_at: r.last_verified_at || '',
      notes: r.notes || '',
      research_id: r.id || '',
      provider_type: r.provider_type || 'unknown',
      deadline: r.deadline || '',
      eligible_levels: r.eligible_levels || '',
      documents_required: r.documents_required || '',
    })),
  };
}

export async function GET(req: NextRequest) {
  const { cursor, limit } = parsePagination(req);
  const start = Number(cursor) || 0;

  // Prefer seeded research_scholarships table
  try {
    const dbSql =
      'SELECT id, name, provider, provider_type, status, ' +
      'academic_eligibility, financial_eligibility, award_coverage, deadline, ' +
      'application_url, source_url, eligible_levels, eligible_locations, ' +
      'eligible_universities, renewal_notes, documents_required, notes, last_verified_at ' +
      'FROM research_scholarships ORDER BY name ASC';
    const dbRes = await query(dbSql);
    if (dbRes.rows.length > 0) {
      const all: ScholarshipRow[] = dbRes.rows.map((row, idx) => {
        const academic = row.academic_eligibility ?? '';
        const financial = row.financial_eligibility ?? '';
        const eligibility = [academic, financial].filter(Boolean).join(' | ') || 'See official source.';
        return {
          scholarship_id: idx + 1,
          scholarship_name: row.name ?? 'Unnamed Scholarship',
          scholarship_type: mapProviderType(row.provider_type ?? ''),
          eligibility,
          coverage_percentage: null,
          coverage_type: row.award_coverage ?? 'See official source',
          annual_value_pkr: null,
          renewable: /renew|continu/i.test(row.renewal_notes ?? ''),
          renewable_conditions: row.renewal_notes ?? '',
          seats_available: null,
          external_body: row.provider ?? '',
          application_url: row.application_url ?? '',
          universityName: row.eligible_universities || row.provider || 'Multiple / see notes',
          universityShortName: row.provider_type || 'Research',
          universitySlug: 'research',
          universityCity: row.eligible_locations || 'Pakistan',
          status: normStatus(row.status),
          source_url: row.source_url ?? '',
          last_verified_at: row.last_verified_at ? String(row.last_verified_at).slice(0, 10) : '',
          notes: row.notes ?? '',
          research_id: row.id,
          provider_type: row.provider_type ?? '',
          deadline: row.deadline ?? '',
          eligible_levels: row.eligible_levels ?? '',
          documents_required: row.documents_required ?? '',
        };
      });
      const page = all.slice(start, start + limit);
      const nextCursor = start + limit < all.length ? String(start + limit) : null;
      const stats = {
        total: all.length,
        active: all.filter((s) => s.status === 'active').length,
        closed: all.filter((s) => s.status === 'closed').length,
        unknown: all.filter((s) => (s.status || 'unknown') === 'unknown').length,
      };
      return NextResponse.json({
        scholarships: page,
        nextCursor,
        total: all.length,
        limit,
        source: 'research_db',
        stats,
        disclaimer:
          'Statuses are from official pages. None were confirmed currently open unless status is Active.',
      });
    }
  } catch (error) {
    console.error('research_scholarships unavailable, trying files:', error);
  }


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
        // legacy DB table has no verified status column -> honest "unknown"
        status: 'unknown',
      }));
      const nextCursor = hasMore && data.length > 0 ? String(data[data.length - 1].scholarship_id) : null;
      return NextResponse.json({ scholarships: data, nextCursor, total: data.length, limit, source: 'database' });
    }
  } catch (error) {
    console.error('DB scholarships unavailable, using research data:', error);
  }

  try {
    const { rows: all, source } = await loadResearchScholarships();
    const page = all.slice(start, start + limit);
    const nextCursor = start + limit < all.length ? String(start + limit) : null;
    const stats = {
      total: all.length,
      active: all.filter((s) => s.status === 'active').length,
      closed: all.filter((s) => s.status === 'closed').length,
      unknown: all.filter((s) => s.status === 'unknown').length,
    };
    const checked = all.map((s) => s.last_verified_at).filter(Boolean).sort().pop() || 'unknown date';
    return NextResponse.json({
      scholarships: page,
      nextCursor,
      total: all.length,
      limit,
      source,
      stats,
      disclaimer: `Statuses come from official pages last checked ${checked}. ${
        stats.active === 0 ? 'None were confirmed currently open. ' : ''
      }"Unknown" means no current dated window was published.`,
    });
  } catch (error) {
    console.error('Failed to load research scholarships:', error);
    return NextResponse.json({ error: 'Failed to fetch scholarships.' }, { status: 500 });
  }
}
