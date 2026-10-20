import scholarships from '../../data/research/scholarships.json' with { type: 'json' };
import { deriveScholarshipKind, normalizeScholarshipWindow } from '@/lib/evidence';

export type CatalogueScholarship = {
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
  status: string;
  source_url: string;
  last_verified_at: string;
  notes: string;
  research_id: string;
  provider_type: string;
  deadline: string;
  eligible_levels: string;
  documents_required: string;
};

/** Bundled catalogue. Check dates in the JSON are not verification events, so last_verified_at is blank. */
export function catalogueScholarships(): CatalogueScholarship[] {
  const rows = scholarships as Array<Record<string, string>>;
  return rows.map((r, idx) => ({
    scholarship_id: idx + 1,
    scholarship_name: r.name || 'Unnamed Scholarship',
    scholarship_type: deriveScholarshipKind({
      name: r.name,
      eligibility: [r.academic_eligibility, r.financial_eligibility].filter(Boolean).join(' '),
      notes: r.notes,
    }),
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
    status: normalizeScholarshipWindow(r.status),
    source_url: r.source_url || '',
    last_verified_at: '',
    notes: r.notes || '',
    research_id: r.id || '',
    provider_type: r.provider_type || 'unknown',
    deadline: r.deadline || '',
    eligible_levels: r.eligible_levels || '',
    documents_required: r.documents_required || '',
  }));
}
