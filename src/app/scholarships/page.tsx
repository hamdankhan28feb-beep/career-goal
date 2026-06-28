'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Search, HelpCircle, ArrowRight, ShieldCheck, Flame, BookOpen, GraduationCap } from 'lucide-react';
import type { University } from '@/lib/types';

type EnrichedScholarship = {
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

export default function ScholarshipFinderPage() {
  const [scholarships, setScholarships] = useState<EnrichedScholarship[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [coverage, setCoverage] = useState('All');
  const [renewable, setRenewable] = useState('All');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/universities');
        if (res.ok) {
          const data = await res.json() as { universities: University[] };
          
          // Flatten scholarships
          const list: EnrichedScholarship[] = [];
          data.universities.forEach((u) => {
            if (u.scholarships && Array.isArray(u.scholarships)) {
              u.scholarships.forEach((s) => {
                list.push({
                  scholarship_name: s.scholarship_name ?? 'Unnamed Scholarship',
                  scholarship_type: s.scholarship_type ?? 'General',
                  eligibility: s.eligibility ?? 'Contact admissions for details.',
                  coverage_percentage: s.coverage_percentage ?? null,
                  coverage_type: s.coverage_type ?? 'Tuition Fee Waiver',
                  annual_value_pkr: s.annual_value_pkr ?? null,
                  renewable: !!s.renewable,
                  renewable_conditions: s.renewable_conditions ?? '',
                  seats_available: s.seats_available ?? null,
                  external_body: s.external_body ?? '',
                  application_url: s.application_url ?? '',
                  universityName: u.name,
                  universityShortName: u.shortName,
                  universitySlug: u.slug,
                  universityCity: u.city,
                });
              });
            }
          });
          setScholarships(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter logic
  const filtered = scholarships.filter((s) => {
    const matchesSearch = 
      s.scholarship_name.toLowerCase().includes(search.toLowerCase()) ||
      s.eligibility.toLowerCase().includes(search.toLowerCase()) ||
      s.universityName.toLowerCase().includes(search.toLowerCase()) ||
      s.universityShortName.toLowerCase().includes(search.toLowerCase()) ||
      s.universityCity.toLowerCase().includes(search.toLowerCase());

    const matchesType = type === 'All' || s.scholarship_type.toLowerCase() === type.toLowerCase();
    
    let matchesCoverage = true;
    if (coverage === '100') {
      matchesCoverage = s.coverage_percentage === 100 || s.coverage_type.toLowerCase().includes('100') || s.coverage_type.toLowerCase().includes('full');
    } else if (coverage === '50') {
      matchesCoverage = (s.coverage_percentage !== null && s.coverage_percentage >= 50) || s.coverage_type.toLowerCase().includes('full') || s.coverage_type.toLowerCase().includes('100');
    } else if (coverage === '25') {
      matchesCoverage = (s.coverage_percentage !== null && s.coverage_percentage >= 25) || s.coverage_percentage === null;
    }

    const matchesRenewable = 
      renewable === 'All' || 
      (renewable === 'Yes' && s.renewable) || 
      (renewable === 'No' && !s.renewable);

    return matchesSearch && matchesType && matchesCoverage && matchesRenewable;
  });

  const types = ['All', 'Merit', 'Need-Based', 'Sports', 'HEC', 'External'];

  const typeColor: Record<string, string> = {
    Merit: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    'Need-Based': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Sports: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    HEC: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    External: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    General: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 mb-4 animate-fade-in">
          <Award className="h-4 w-4" /> Find funding for your higher education
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-sky-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
          Scholarship Finder
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
          Explore and filter merit-based, need-based, and external HEC scholarships offered by top Pakistani universities.
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Total Scholarships', value: scholarships.length, icon: BookOpen, color: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Fully Funded (100%)', value: scholarships.filter((s) => s.coverage_percentage === 100 || s.coverage_type.toLowerCase().includes('100') || s.coverage_type.toLowerCase().includes('full')).length, icon: Flame, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Need-Based Options', value: scholarships.filter((s) => s.scholarship_type === 'Need-Based').length, icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Renewable Programs', value: scholarships.filter((s) => s.renewable).length, icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{loading ? '...' : value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters and search */}
      <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by scholarship name, university name, or requirements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 shrink-0">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input-field py-2 text-xs">
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Min Coverage</label>
              <select value={coverage} onChange={(e) => setCoverage(e.target.value)} className="input-field py-2 text-xs">
                <option value="All">All Coverages</option>
                <option value="100">100% Fully Funded</option>
                <option value="50">50% or Higher</option>
                <option value="25">25% or Higher</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Renewable</label>
              <select value={renewable} onChange={(e) => setRenewable(e.target.value)} className="input-field py-2 text-xs">
                <option value="All">Any Status</option>
                <option value="Yes">Yes (Condition-based)</option>
                <option value="No">One-time / No</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((s, idx) => (
            <div key={idx} className="group relative rounded-3xl border border-border/70 bg-card/85 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColor[s.scholarship_type] ?? typeColor.General}`}>
                    {s.scholarship_type}
                  </span>
                  {s.coverage_percentage && (
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-bold border border-emerald-500/20">
                      {s.coverage_percentage}% Coverage
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {s.scholarship_name}
                </h3>
                <div className="text-xs text-muted-foreground mb-4">
                  Offered by <Link href={`/universities/${s.universitySlug}`} className="text-primary hover:underline font-medium">{s.universityShortName}</Link> ({s.universityCity})
                </div>
                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Eligibility Criteria</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.eligibility}</p>
                </div>
                {s.renewable_conditions && (
                  <div className="mb-4 rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/30">
                    🔄 <strong>Renewable Condition:</strong> {s.renewable_conditions}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Seats: <span className="font-semibold text-foreground">{s.seats_available ?? 'Unspecified'}</span>
                </div>
                {s.application_url ? (
                  <a href={s.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    Apply Now <ArrowRight className="h-3 w-3" />
                  </a>
                ) : (
                  <Link href={`/universities/${s.universitySlug}#admissions`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    Admissions info <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-border/70 bg-card p-16 text-center shadow-sm">
          <HelpCircle className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-6 text-xl font-semibold">No scholarships found</h3>
          <p className="mt-3 text-muted-foreground">Try adjusting your filters or search query to find matching options.</p>
        </div>
      )}
    </div>
  );
}
