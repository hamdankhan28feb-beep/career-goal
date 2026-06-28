import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Globe, ExternalLink, MapPin, Calendar, Award, ShieldCheck,
  GraduationCap, Building2, BookOpen, DollarSign, Users,
  Wifi, Bus, Home, Dumbbell, FlaskConical, Star, CheckCircle2,
  XCircle, ChevronDown, ArrowRight, Landmark, TrendingUp
} from 'lucide-react';

import { getUniversities, getUniversityBySlug } from '@/lib/data';
import { ReviewForm } from '@/components/review-form';

export async function generateStaticParams() {
  const universities = getUniversities();
  return universities.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const university = getUniversityBySlug(slug);
  if (!university) return { title: 'University Not Found' };
  return {
    title: university.name,
    description: `Explore ${university.name} — programs, admissions, fees, scholarships, and campus life. Source-verified data on FuturePath.`,
    openGraph: { title: `${university.name} | FuturePath`, description: `Complete profile of ${university.name}` },
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-3 border-b border-border/50 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-3 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function Tag({ text, color = 'default' }: { text: string; color?: 'default' | 'green' | 'blue' | 'amber' | 'red' }) {
  const cls = {
    default: 'bg-muted text-muted-foreground',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  }[color];
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${cls}`}>{text}</span>;
}

function FacilityIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="h-5 w-5" />;
  if (lower.includes('transport') || lower.includes('bus')) return <Bus className="h-5 w-5" />;
  if (lower.includes('hostel') || lower.includes('accommodation')) return <Home className="h-5 w-5" />;
  if (lower.includes('sport') || lower.includes('gym')) return <Dumbbell className="h-5 w-5" />;
  if (lower.includes('lab') || lower.includes('science')) return <FlaskConical className="h-5 w-5" />;
  if (lower.includes('library')) return <BookOpen className="h-5 w-5" />;
  return <Building2 className="h-5 w-5" />;
}

function StarRating({ value }: { value: number | null | undefined }) {
  if (!value) return <span className="text-xs text-muted-foreground">Not rated</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{value.toFixed(1)}</span>
    </div>
  );
}

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'campuses', label: 'Campuses' },
  { id: 'programs', label: 'Programs' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'entry-tests', label: 'Entry Tests' },
  { id: 'scholarships', label: 'Scholarships' },
  { id: 'fees', label: 'Fees' },
  { id: 'policies', label: 'Policies' },
  { id: 'student-life', label: 'Student Life' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'careers', label: 'Careers' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'faqs', label: 'FAQs' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UniversityProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = getUniversityBySlug(slug);
  if (!u) notFound();

  const avgRating = u.reviews.length > 0
    ? u.reviews.reduce((a, r) => a + (r.rating_overall ?? 0), 0) / u.reviews.length
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* ── Breadcrumb ── */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition">Home</Link>
        <span>/</span>
        <Link href="/universities" className="hover:text-foreground transition">Universities</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{u.shortName}</span>
      </nav>

      {/* ── Hero Banner ── */}
      <div className="overflow-hidden rounded-4xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white lg:p-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
                u.universityType === 'Public'
                  ? 'border-blue-400/30 bg-blue-400/10 text-blue-300'
                  : 'border-purple-400/30 bg-purple-400/10 text-purple-300'
              }`}>{u.universityType}</span>
              {u.hecStatus && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <ShieldCheck className="inline h-3 w-3 mr-1" />{u.hecStatus}
                </span>
              )}
              {avgRating && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
                  <Star className="inline h-3 w-3 mr-1 fill-current" />{avgRating.toFixed(1)} / 5
                </span>
              )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{u.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{u.city}, {u.province}</span>
              {u.yearEstablished && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Est. {u.yearEstablished}</span>}
              <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{u.campuses.length} Campus{u.campuses.length !== 1 ? 'es' : ''}</span>
            </div>
            {u.overview.majorStrengths.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {u.overview.majorStrengths.map((s) => (
                  <span key={s} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{s}</span>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {u.officialWebsite && (
                <a href={u.officialWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold hover:bg-white/90 transition">
                  <Globe className="h-4 w-4" /> Official Website
                </a>
              )}
              {u.admissionsPortal && u.admissionsPortal !== '' && (
                <a href={u.admissionsPortal} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5 transition">
                  <ExternalLink className="h-4 w-4" /> Admissions Portal
                </a>
              )}
            </div>
          </div>
          {/* Logo box */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-2xl font-black text-white border border-white/10 backdrop-blur">
            {u.shortName.slice(0, 4)}
          </div>
        </div>
      </div>

      {/* ── Sticky Section Nav ── */}
      <div className="sticky top-16 z-30 mt-6 overflow-x-auto rounded-2xl border border-border/50 bg-background/90 backdrop-blur shadow-sm">
        <div className="flex min-w-max gap-1 p-2">
          {NAV_SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-xl px-4 py-2 text-sm text-muted-foreground whitespace-nowrap transition hover:bg-muted hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mt-8 space-y-12">

        {/* 1. Overview */}
        <Section id="overview" title="University Overview" icon={Landmark}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {u.overview.history ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">History</h3>
                  <p className="prose-custom">{u.overview.history}</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground italic">
                  Detailed history not yet available from official sources.
                </div>
              )}
              {u.overview.mission && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Mission</h3>
                  <p className="prose-custom">{u.overview.mission}</p>
                </div>
              )}
              {u.overview.vision && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Vision</h3>
                  <p className="prose-custom">{u.overview.vision}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                <h3 className="mb-3 text-sm font-semibold">Quick Facts</h3>
                <InfoRow label="Established" value={u.yearEstablished ? String(u.yearEstablished) : null} />
                <InfoRow label="Type" value={u.universityType} />
                <InfoRow label="City" value={u.city} />
                <InfoRow label="Province" value={u.province} />
                <InfoRow label="Charter" value={u.charterAuthority} />
                <InfoRow label="HEC Status" value={u.hecStatus} />
                <InfoRow label="Phone" value={u.phone} />
                <InfoRow label="Email" value={u.email} />
              </div>
              {u.accreditations.length > 0 && (
                <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  <h3 className="mb-3 text-sm font-semibold">Accreditations</h3>
                  <div className="space-y-2">
                    {u.accreditations.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                        <Award className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <div className="text-sm font-medium">{a.body}</div>
                          {a.type && <div className="text-xs text-muted-foreground">{a.type}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {u.rankings.length > 0 && (
                <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  <h3 className="mb-3 text-sm font-semibold">Rankings</h3>
                  {u.rankings.map((r, i) => (
                    <div key={i} className="border-b border-border/40 py-2.5 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{r.ranking_name}</span>
                        {r.ranking_value && <Tag text={r.ranking_value} color="blue" />}
                      </div>
                      {r.ranking_note && <p className="mt-1 text-xs text-muted-foreground">{r.ranking_note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* 2. Campuses */}
        <Section id="campuses" title="Campuses" icon={Building2}>
          {u.campuses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {u.campuses.map((c, i) => (
                <div key={i} className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{c.campus_name}</div>
                      {c.campus_type && <div className="text-xs text-muted-foreground">{c.campus_type}</div>}
                    </div>
                  </div>
                  {(c.city || c.address) && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{[c.address, c.city, c.province].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {c.facilities && c.facilities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {c.facilities.slice(0, 4).map((f) => (
                        <span key={f} className="rounded-full bg-muted px-2 py-0.5 text-xs">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Campus details not yet verified from official sources.
            </div>
          )}
        </Section>

        {/* 3. Programs */}
        <Section id="programs" title="Programs" icon={GraduationCap}>
          {u.programs.length > 0 ? (
            <div className="overflow-hidden rounded-3xl border border-border/70">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Degree</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Seats</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">Merit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {u.programs.map((p, i) => (
                    <tr key={i} className="transition hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{p.program_name}</td>
                      <td className="px-4 py-3"><Tag text={p.degree_type ?? '—'} /></td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.duration_years ? `${p.duration_years} yr` : '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.total_seats ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{p.approx_merit_requirement ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-8 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">Program details not yet verified from official sources.</p>
              {u.officialWebsite && (
                <a href={u.officialWebsite} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  Check official website <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </Section>

        {/* 4. Admissions */}
        <Section id="admissions" title="Admission Information" icon={BookOpen}>
          {u.admissions ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                <h3 className="mb-3 text-sm font-semibold">Admission Details</h3>
                <InfoRow label="Admission Cycle" value={u.admissions.admission_cycle} />
                <InfoRow label="Admission Months" value={u.admissions.admission_months} />
                <InfoRow label="Application Deadline" value={u.admissions.application_deadline} />
                <InfoRow label="Result Date" value={u.admissions.result_date} />
                <InfoRow label="Entry Test Required" value={u.admissions.entry_test_required ? 'Yes' : 'No'} />
                <InfoRow label="Application Fee" value={u.admissions.application_fee_pkr ? `PKR ${u.admissions.application_fee_pkr.toLocaleString()}` : null} />
                <InfoRow label="Interview Required" value={u.admissions.interview_requirement} />
              </div>
              <div className="space-y-4">
                {u.admissions.eligibility_criteria && (
                  <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                    <h3 className="mb-2 text-sm font-semibold">Eligibility Criteria</h3>
                    <p className="prose-custom">{u.admissions.eligibility_criteria}</p>
                  </div>
                )}
                {u.admissions.merit_calculation_method && (
                  <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                    <h3 className="mb-2 text-sm font-semibold">Merit Calculation</h3>
                    <p className="prose-custom">{u.admissions.merit_calculation_method}</p>
                  </div>
                )}
                {u.admissions.required_documents && u.admissions.required_documents.length > 0 && (
                  <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                    <h3 className="mb-3 text-sm font-semibold">Required Documents</h3>
                    <ul className="space-y-1.5">
                      {u.admissions.required_documents.map((d, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-8 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">Admission details not yet verified. Check the official portal.</p>
              {u.admissionsPortal && (
                <a href={u.admissionsPortal} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  Open admissions portal <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </Section>

        {/* 5. Entry Tests */}
        <Section id="entry-tests" title="Entry Test Information" icon={BookOpen}>
          {u.entryTests.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {u.entryTests.map((t, i) => (
                <div key={i} className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{t.test_name ?? 'Entry Test'}</h3>
                    {t.test_type && <Tag text={t.test_type} color="blue" />}
                  </div>
                  <InfoRow label="Mode" value={t.test_mode} />
                  <InfoRow label="Total Marks" value={t.total_marks ? String(t.total_marks) : null} />
                  <InfoRow label="Duration" value={t.test_duration_min ? `${t.test_duration_min} minutes` : null} />
                  <InfoRow label="Test Fee" value={t.test_fee_pkr ? `PKR ${t.test_fee_pkr.toLocaleString()}` : null} />
                  <InfoRow label="Passing Criteria" value={t.passing_criteria} />
                  {t.subjects_included && t.subjects_included.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-2 text-xs text-muted-foreground">Subjects</div>
                      <div className="flex flex-wrap gap-1.5">
                        {t.subjects_included.map((s) => <Tag key={s} text={s} />)}
                      </div>
                    </div>
                  )}
                  {t.preparation_tips && (
                    <div className="mt-4 rounded-2xl bg-primary/5 p-3 text-xs text-muted-foreground">
                      <div className="mb-1 font-semibold text-primary">Preparation Tips</div>
                      {t.preparation_tips}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Entry test details not yet collected. Please verify on the official portal.
            </div>
          )}
        </Section>

        {/* 6. Scholarships */}
        <Section id="scholarships" title="Scholarships" icon={Award}>
          {u.scholarships.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {u.scholarships.map((s, i) => {
                const typeColor: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'default'> = {
                  Merit: 'green', 'Need-Based': 'blue', Sports: 'amber', HEC: 'default', External: 'red',
                };
                return (
                  <div key={i} className="rounded-3xl border border-border/70 bg-card/80 p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-snug">{s.scholarship_name ?? 'Scholarship'}</h3>
                      {s.scholarship_type && <Tag text={s.scholarship_type} color={typeColor[s.scholarship_type] ?? 'default'} />}
                    </div>
                    {s.coverage_percentage && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Coverage</span><span>{s.coverage_percentage}%</span>
                        </div>
                        <div className="progress-track"><div className="progress-fill" style={{ width: `${s.coverage_percentage}%` }} /></div>
                      </div>
                    )}
                    {s.eligibility && <p className="text-xs text-muted-foreground leading-5">{s.eligibility}</p>}
                    {s.coverage_type && <div className="mt-2 text-xs font-medium text-foreground">{s.coverage_type}</div>}
                    {s.renewable && <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">✓ Renewable</div>}
                    {s.application_url && (
                      <a href={s.application_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        Apply <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Scholarship details not yet verified from official sources. Check the official website for financial assistance.
            </div>
          )}
        </Section>

        {/* 7. Fees */}
        <Section id="fees" title="Fee Structure" icon={DollarSign}>
          {u.fees ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Admission Fee', value: u.fees.admission_fee, icon: '📝' },
                { label: 'Semester Fee', value: u.fees.semester_fee, icon: '📚' },
                { label: 'Hostel (Monthly)', value: u.fees.hostel_fee_monthly, icon: '🏠' },
                { label: 'Transport (Monthly)', value: u.fees.transport_fee_monthly, icon: '🚌' },
                { label: 'Security Deposit', value: u.fees.security_deposit, icon: '🔒' },
                { label: 'Credit Hour Fee', value: u.fees.credit_hour_fee, icon: '⏱️' },
                { label: 'Approx Degree Cost', value: u.fees.approx_total_degree_cost, icon: '🎓' },
              ].filter(f => f.value).map(({ label, value, icon }) => (
                <div key={label} className="rounded-3xl border border-border/70 bg-card/80 p-5 text-center">
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className="text-lg font-bold text-foreground">PKR {value!.toLocaleString()}</div>
                </div>
              ))}
              {u.fees.fee_notes && (
                <div className="sm:col-span-2 lg:col-span-4 rounded-2xl bg-amber-500/8 border border-amber-500/20 p-4 text-sm text-amber-700 dark:text-amber-300">
                  <strong>Note:</strong> {u.fees.fee_notes}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Fee structure not yet verified. Please check the official website.
            </div>
          )}
        </Section>

        {/* 8. Academic Policies */}
        <Section id="policies" title="Academic System & Policies" icon={BookOpen}>
          {u.academicPolicies.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {u.academicPolicies.map((p, i) => (
                <div key={i} className="rounded-3xl border border-border/70 bg-card/80 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">{p.policy_name}</h4>
                    {p.policy_category && <Tag text={p.policy_category} />}
                  </div>
                  {p.policy_value && <p className="text-sm text-muted-foreground">{p.policy_value}</p>}
                  {p.min_cgpa && <div className="mt-2 text-xs text-muted-foreground">Min CGPA: <strong>{p.min_cgpa}</strong></div>}
                  {p.min_attendance_pct && <div className="mt-1 text-xs text-muted-foreground">Min Attendance: <strong>{p.min_attendance_pct}%</strong></div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Academic policy details not yet collected from official sources.
            </div>
          )}
        </Section>

        {/* 9. Student Life */}
        <Section id="student-life" title="Student Life" icon={Users}>
          {u.studentLife ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {u.studentLife.clubs && u.studentLife.clubs.length > 0 && (
                <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  <h3 className="mb-3 text-sm font-semibold">Clubs & Societies</h3>
                  <div className="flex flex-wrap gap-2">
                    {u.studentLife.clubs.map((c) => <Tag key={c} text={c} color="blue" />)}
                  </div>
                </div>
              )}
              {u.studentLife.sports_available && u.studentLife.sports_available.length > 0 && (
                <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  <h3 className="mb-3 text-sm font-semibold">Sports</h3>
                  <div className="flex flex-wrap gap-2">
                    {u.studentLife.sports_available.map((s) => <Tag key={s} text={s} color="green" />)}
                  </div>
                </div>
              )}
              {u.studentLife.annual_events && u.studentLife.annual_events.length > 0 && (
                <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  <h3 className="mb-3 text-sm font-semibold">Annual Events</h3>
                  <div className="flex flex-wrap gap-2">
                    {u.studentLife.annual_events.map((e) => <Tag key={e} text={e} color="amber" />)}
                  </div>
                </div>
              )}
              {u.studentLife.student_council && (
                <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  <h3 className="mb-2 text-sm font-semibold">Student Council</h3>
                  <p className="prose-custom">{u.studentLife.student_council}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Student life details not yet collected. Data is being gathered from official sources.
            </div>
          )}
        </Section>

        {/* 10. Facilities */}
        <Section id="facilities" title="Facilities" icon={Building2}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              {u.facilities.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {u.facilities.map((f, i) => (
                    <div key={i} className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center text-sm ${f.is_available === false ? 'border-border/40 bg-muted/30 opacity-50' : 'border-border/70 bg-card/80'}`}>
                      <div className="text-primary"><FacilityIcon name={f.facility_name} /></div>
                      <div className="text-xs font-medium">{f.facility_name}</div>
                      {f.is_available === false && <div className="text-xs text-red-500">Not Available</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  Facility details not yet verified from official sources.
                </div>
              )}
            </div>
            <div className="space-y-3">
              {/* Hostel */}
              <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Home className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold">Hostel</h3>
                </div>
                {u.hostel ? (
                  <>
                    <InfoRow label="Available" value={u.hostel.hostel_availability ? 'Yes' : 'No'} />
                    <InfoRow label="Gender" value={u.hostel.gender} />
                    <InfoRow label="Monthly Fee" value={u.hostel.monthly_fee_pkr ? `PKR ${u.hostel.monthly_fee_pkr}` : null} />
                    <InfoRow label="Quality" value={u.hostel.hostel_quality} />
                  </>
                ) : <p className="text-sm text-muted-foreground">Not verified yet.</p>}
              </div>
              {/* Transport */}
              <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Bus className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold">Transport</h3>
                </div>
                {u.transport ? (
                  <>
                    <InfoRow label="Available" value={u.transport.transport_available ? 'Yes' : 'No'} />
                    <InfoRow label="Bus Count" value={u.transport.bus_count ? String(u.transport.bus_count) : null} />
                    <InfoRow label="Monthly Fee" value={u.transport.monthly_fee_pkr ? `PKR ${u.transport.monthly_fee_pkr.toLocaleString()}` : null} />
                    {u.transport.routes && u.transport.routes.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1.5">Routes</div>
                        <div className="flex flex-wrap gap-1.5">
                          {u.transport.routes.map((r) => <Tag key={r} text={r} />)}
                        </div>
                      </div>
                    )}
                  </>
                ) : <p className="text-sm text-muted-foreground">Not verified yet.</p>}
              </div>
            </div>
          </div>
        </Section>

        {/* 11. Faculty */}
        <Section id="faculty" title="Faculty & Academics" icon={Users}>
          {u.facultyAcademics ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                <h3 className="mb-3 text-sm font-semibold">Faculty Statistics</h3>
                <InfoRow label="Total Faculty" value={u.facultyAcademics.total_faculty_count ? String(u.facultyAcademics.total_faculty_count) : null} />
                <InfoRow label="PhD Faculty" value={u.facultyAcademics.phd_faculty_count ? String(u.facultyAcademics.phd_faculty_count) : null} />
                <InfoRow label="Student-Faculty Ratio" value={u.facultyAcademics.student_faculty_ratio} />
                <InfoRow label="Faculty Quality" value={u.facultyAcademics.faculty_quality} />
                <InfoRow label="Research Culture" value={u.facultyAcademics.research_culture} />
                <InfoRow label="Industry Exposure" value={u.facultyAcademics.industry_exposure} />
                <InfoRow label="Internship Support" value={u.facultyAcademics.internship_support} />
                <InfoRow label="FYP Culture" value={u.facultyAcademics.fyp_culture} />
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Faculty details not yet collected from official sources.
            </div>
          )}
        </Section>

        {/* 12. Career Outcomes */}
        <Section id="careers" title="Career Outcomes" icon={TrendingUp}>
          {u.placements || u.careerPaths.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {u.placements && (
                <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  <h3 className="mb-3 text-sm font-semibold">Placement Support</h3>
                  <InfoRow label="Career Services" value={u.placements.career_services_office} />
                  <InfoRow label="Placement Rate" value={u.placements.placement_rate_pct ? `${u.placements.placement_rate_pct}%` : null} />
                  <InfoRow label="Alumni Count" value={u.placements.alumni_count ? String(u.placements.alumni_count) : null} />
                  {u.placements.top_recruiters && u.placements.top_recruiters.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-2 text-xs text-muted-foreground">Top Recruiters</div>
                      <div className="flex flex-wrap gap-1.5">
                        {u.placements.top_recruiters.map((r) => <Tag key={r} text={r} color="blue" />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {u.careerPaths.map((cp, i) => (
                <div key={i} className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  {cp.career_paths && cp.career_paths.length > 0 && (
                    <div className="mb-3">
                      <div className="mb-2 text-xs font-semibold text-muted-foreground">Career Paths</div>
                      <div className="flex flex-wrap gap-1.5">
                        {cp.career_paths.map((c) => <Tag key={c} text={c} color="green" />)}
                      </div>
                    </div>
                  )}
                  {cp.expected_salary_range_pkr && (
                    <InfoRow label="Expected Salary" value={cp.expected_salary_range_pkr} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Career outcomes data not yet verified.
            </div>
          )}
        </Section>

        {/* 13. Reviews */}
        <Section id="reviews" title="Student Reviews" icon={Star}>
          {u.reviews.length > 0 ? (
            <div className="space-y-4">
              {u.reviews.map((r, i) => (
                <div key={i} className="rounded-3xl border border-border/70 bg-card/80 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-medium">{r.reviewer_type ?? 'Student'}</span>
                    </div>
                    <StarRating value={r.rating_overall} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 text-xs text-muted-foreground mb-3">
                    <div>Faculty: <StarRating value={r.rating_faculty} /></div>
                    <div>Facilities: <StarRating value={r.rating_facilities} /></div>
                    <div>Value: <StarRating value={r.rating_value_for_money} /></div>
                  </div>
                  {r.positive_experiences && (
                    <div className="mb-2 flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{r.positive_experiences}</p>
                    </div>
                  )}
                  {r.common_complaints && (
                    <div className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{r.common_complaints}</p>
                    </div>
                  )}
                  {(r.pros && r.pros.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.pros.map((p) => <Tag key={p} text={`✓ ${p}`} color="green" />)}
                    </div>
                  )}
                  {(r.cons && r.cons.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.cons.map((c) => <Tag key={c} text={`✗ ${c}`} color="red" />)}
                    </div>
                  )}
                </div>
              ))}
              <ReviewForm universitySlug={slug} universityName={u.shortName} />
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-8 text-center">
              <Star className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">No reviews yet. Be the first to review this university.</p>
              <ReviewForm universitySlug={slug} universityName={u.shortName} />
            </div>
          )}
        </Section>

        {/* 14. FAQs */}
        {u.faqs.length > 0 && (
          <Section id="faqs" title="Frequently Asked Questions" icon={ChevronDown}>
            <div className="divide-y divide-border/40 rounded-3xl border border-border/70 bg-card/80 overflow-hidden">
              {u.faqs.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/30 transition list-none">
                    {faq.question}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-border/40 bg-muted/20 px-5 py-4 text-sm text-muted-foreground leading-7">
                    {faq.answer ?? 'Answer not yet available.'}
                  </div>
                </details>
              ))}
            </div>
          </Section>
        )}

        {/* 15. Important Links */}
        {u.importantLinks.length > 0 && (
          <Section id="links" title="Important Links" icon={Globe}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {u.importantLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-foreground transition hover:border-primary/30 hover:text-primary"
                >
                  <span className="font-medium">{link.label}</span>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
