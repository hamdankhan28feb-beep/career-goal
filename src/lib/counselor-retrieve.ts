/**
 * counselor-retrieve.ts — server-side keyword retrieval over FuturePath research data.
 *
 * Sources: data/research/{universities_karachi,scholarships,learning_resources}.json
 * (loaded via src/lib/research-meta.ts). No embeddings, no network: a transparent
 * keyword score so every snippet handed to the model is traceable to a row + URL.
 */
import {
  researchLearningResources,
  researchScholarships,
  researchUniversities,
  type ResearchScholarship,
  type ResearchUniversity,
} from '@/lib/research-meta';

export type CitationKind = 'university' | 'scholarship' | 'learning_resource';

export type Citation = {
  /** Marker the model must use, e.g. "S1" -> cited as [S1] */
  ref: string;
  kind: CitationKind;
  /** Stable research row id, e.g. "khi-iba", "sch-hec-nbs", "LR001" */
  sourceId: string;
  title: string;
  publisher: string;
  url: string;
  /** All URLs from the row (source_url may contain several separated by ';') */
  urls: string[];
  /** Date the row was last checked against its source (YYYY-MM-DD) or null */
  retrievedAt: string | null;
  /** Row-level status: verified/partial/unverified for unis, active/closed/unknown for scholarships */
  status: string | null;
  /** Text given to the model */
  snippet: string;
  score: number;
};

const STOPWORDS = new Set(
  (
    'a an and are as at be by can could do does for from have how i if in is it its me my of on or ' +
    'should so than that the their there these this to was what when where which who why will with ' +
    'you your about any best get tell want need please give list some kya hai mein ka ki ke ko se'
  ).split(' ')
);

/** Light query expansion for common Pakistani admissions shorthand. */
const SYNONYMS: Record<string, string[]> = {
  cs: ['computer', 'science', 'programs_cs'],
  bscs: ['computer', 'science', 'programs_cs'],
  se: ['software', 'engineering', 'programs_se'],
  ai: ['artificial', 'intelligence', 'programs_ai'],
  ds: ['data', 'science', 'programs_ds'],
  fee: ['fee', 'fees', 'tuition'],
  fees: ['fee', 'tuition'],
  scholarship: ['scholarship', 'financial', 'aid', 'need'],
  scholarships: ['scholarship', 'financial', 'aid'],
  need: ['need', 'financial'],
  merit: ['merit', 'academic'],
  test: ['test', 'entry', 'admission'],
  admission: ['admission', 'admissions', 'apply'],
  admissions: ['admission', 'apply'],
  course: ['course', 'learn', 'learning'],
  learn: ['learn', 'learning', 'course'],
  python: ['python'],
  web: ['web', 'html', 'css', 'javascript'],
  ku: ['karachi', 'uok'],
  ned: ['ned', 'neduet'],
  fast: ['fast', 'nuces'],
  nust: ['nust'],
  hec: ['hec', 'higher', 'education', 'commission'],
};

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function expandQuery(query: string): Map<string, number> {
  const weights = new Map<string, number>();
  for (const t of tokenize(query)) {
    weights.set(t, Math.max(weights.get(t) ?? 0, 1));
    for (const s of SYNONYMS[t] ?? []) {
      if (!weights.has(s)) weights.set(s, 0.6);
    }
  }
  return weights;
}

function splitUrls(v?: string): string[] {
  return (v || '')
    .split(/\s*;\s*|\s+/)
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u));
}

type Doc = {
  kind: CitationKind;
  sourceId: string;
  title: string;
  publisher: string;
  urls: string[];
  retrievedAt: string | null;
  status: string | null;
  /** Field weight boosts: title-ish text counts more than notes */
  strong: string;
  body: string;
  snippet: string;
};

function clip(s: string | undefined, n: number): string {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

function uniDoc(u: ResearchUniversity): Doc {
  const programs = [
    u.programs_cs === 'yes' ? 'BS Computer Science (programs_cs)' : null,
    u.programs_se === 'yes' ? 'BS Software Engineering (programs_se)' : null,
    u.programs_ai === 'yes' ? 'BS Artificial Intelligence (programs_ai)' : null,
    u.programs_ds === 'yes' ? 'BS Data Science (programs_ds)' : null,
  ].filter(Boolean);
  const name = u.common_name || u.hec_name || u.id || 'University';
  const lines = [
    `University: ${name}${u.hec_name && u.hec_name !== name ? ` (HEC name: ${u.hec_name})` : ''}`,
    `City: ${u.city || 'unknown'}; Ownership (per HEC): ${u.ownership || 'unknown'}; HEC recognised: ${u.hec_recognised || 'unknown'}`,
    `Catalogue row only. Do not treat fees, deadlines or merit as verified unless a URL in this snippet states them. Stored verification_status is not a badge.`,
    `Computing programmes found on official pages: ${programs.length ? programs.join(', ') : 'none recorded'}`,
    u.entry_test_notes ? `Entry test notes: ${clip(u.entry_test_notes, 300)}` : null,
    u.eligibility_notes ? `Eligibility notes: ${clip(u.eligibility_notes, 300)}` : null,
    `Fee notes: ${u.fee_notes ? clip(u.fee_notes, 300) : 'NOT AVAILABLE in dataset — do not state a fee'}`,
    u.admissions_url ? `Admissions page: ${u.admissions_url}` : null,
  ].filter(Boolean);
  return {
    kind: 'university',
    sourceId: u.id || name,
    title: name,
    publisher: u.hec_source_url ? 'Higher Education Commission (HEC) + university website' : 'University website',
    urls: [...splitUrls(u.admissions_url), ...splitUrls(u.hec_source_url)],
    retrievedAt: null,
    status: null,
    strong: [u.common_name, u.hec_name, u.id, u.city].join(' '),
    body: [
      u.ownership,
      u.campuses_note,
      u.entry_test_notes,
      u.eligibility_notes,
      u.fee_notes,
      programs.join(' '),
      'university admission programme',
    ].join(' '),
    snippet: lines.join('\n'),
  };
}

function scholarshipDoc(s: ResearchScholarship): Doc {
  const status = (s.status || 'unknown').toLowerCase();
  const lines = [
    `Scholarship: ${s.name || s.id}`,
    `Provider: ${s.provider || 'unknown'} (${s.provider_type || 'type unknown'})`,
    `Recorded status: ${status.toUpperCase()}${status === 'active' || status === 'open' ? '' : ' — do not say this scholarship is open'}.`,
    s.eligible_levels ? `Levels: ${clip(s.eligible_levels, 200)}` : null,
    s.eligible_locations ? `Locations: ${clip(s.eligible_locations, 200)}` : null,
    s.eligible_universities ? `Universities: ${clip(s.eligible_universities, 250)}` : null,
    s.academic_eligibility ? `Academic eligibility: ${clip(s.academic_eligibility, 250)}` : null,
    s.financial_eligibility ? `Financial eligibility: ${clip(s.financial_eligibility, 250)}` : null,
    s.award_coverage ? `Coverage (verbatim): ${clip(s.award_coverage, 250)}` : null,
    s.deadline ? `Deadline (verbatim): ${clip(s.deadline, 200)}` : 'Deadline: not published in dataset',
    s.application_url ? `Apply/info page: ${s.application_url}` : null,
  ].filter(Boolean);
  return {
    kind: 'scholarship',
    sourceId: s.id || s.name || 'scholarship',
    title: s.name || s.id || 'Scholarship',
    publisher: s.provider || 'Unknown provider',
    urls: [...splitUrls(s.source_url), ...splitUrls(s.application_url)],
    retrievedAt: null,
    status,
    strong: [s.name, s.provider, s.provider_type, 'scholarship'].join(' '),
    body: [
      s.eligible_levels,
      s.eligible_locations,
      s.eligible_universities,
      s.academic_eligibility,
      s.financial_eligibility,
      s.award_coverage,
      s.deadline,
      s.notes,
      'scholarship financial aid need merit',
    ].join(' '),
    snippet: lines.join('\n'),
  };
}

function learningDoc(r: Record<string, string>): Doc {
  const lines = [
    `Learning resource: ${r.title || r.id}`,
    `Provider: ${r.provider || 'unknown'}; Cost: ${r.cost || 'unknown'}; Certificate: ${r.certificate || 'unknown'}`,
    `Skills: ${(r.skills_covered || '').split(';').join(', ') || 'unknown'}`,
    `Difficulty: ${r.difficulty || 'unknown'}; Duration: ${r.duration_est || 'unknown'}`,
    r.prerequisites ? `Prerequisites: ${clip(r.prerequisites, 160)}` : null,
    `URL: ${r.url}`,
  ].filter(Boolean);
  return {
    kind: 'learning_resource',
    sourceId: r.id || r.url,
    title: r.title || r.id || 'Learning resource',
    publisher: r.provider || 'Unknown provider',
    urls: splitUrls(r.url),
    retrievedAt: null,
    status: null,
    strong: [r.title, r.provider, r.skills_covered].join(' '),
    body: [r.difficulty, r.cost, r.certificate, r.prerequisites, 'learn course tutorial skill'].join(' '),
    snippet: lines.join('\n'),
  };
}

const PROGRAMME_FIELDS: Array<{ key: string; label: string; words: string }> = [
  { key: 'programs_cs', label: 'BS Computer Science', words: 'computer science cs bscs' },
  { key: 'programs_se', label: 'BS Software Engineering', words: 'software engineering se' },
  { key: 'programs_ai', label: 'BS Artificial Intelligence', words: 'artificial intelligence ai' },
  { key: 'programs_ds', label: 'BS Data Science', words: 'data science ds' },
];

/** One summary doc per programme so "which universities offer X?" gets the full list in one snippet. */
function programmeSummaryDocs(): Doc[] {
  return PROGRAMME_FIELDS.map(({ key, label, words }) => {
    const hits = researchUniversities.filter((u) => u[key] === 'yes');
    const list = hits
      .map((u) => u.common_name || u.hec_name || u.id)
      .join('; ');
    return {
      kind: 'university' as const,
      sourceId: `summary-${key}`,
      title: `Karachi universities offering ${label} (FuturePath dataset summary)`,
      publisher: 'FuturePath research dataset (compiled from university websites + HEC)',
      urls: [],
      retrievedAt: null,
      status: null,
      strong: `${words} ${label}`,
      body: 'programme program offer offering universities which list karachi university admission bs degree',
      snippet:
        `Universities in the dataset whose official pages list ${label} (${hits.length}): ${list || 'none recorded'}.\n` +
        `Only rows we researched are included; absence from this list does not prove a university lacks the programme. ` +
        `Cite the individual university rows for details when available.`,
    };
  });
}

let DOCS: Array<Doc & { strongTokens: Set<string>; bodyTokens: Set<string> }> | null = null;

function docs() {
  if (DOCS) return DOCS;
  const all: Doc[] = [
    ...programmeSummaryDocs(),
    ...researchUniversities.map(uniDoc),
    ...researchScholarships.map(scholarshipDoc),
    ...researchLearningResources.map(learningDoc),
  ];
  DOCS = all.map((d) => ({
    ...d,
    strongTokens: new Set(tokenize(d.strong)),
    bodyTokens: new Set(tokenize(d.body)),
  }));
  return DOCS;
}

/** Document frequency for a crude IDF so generic words ("university") count less. */
let DF: Map<string, number> | null = null;
function df(): Map<string, number> {
  if (DF) return DF;
  DF = new Map();
  for (const d of docs()) {
    for (const t of new Set([...d.strongTokens, ...d.bodyTokens])) DF.set(t, (DF.get(t) ?? 0) + 1);
  }
  return DF;
}

export type RetrieveOptions = {
  limit?: number;
  /** Minimum score to include a snippet (default 1.0) */
  minScore?: number;
  kinds?: CitationKind[];
};

export function retrieveResearchSnippets(query: string, opts: RetrieveOptions = {}): Citation[] {
  const limit = opts.limit ?? 6;
  const minScore = opts.minScore ?? 1.0;
  const q = expandQuery(query);
  if (q.size === 0) return [];

  const N = docs().length;
  const freq = df();
  const lowerQuery = query.toLowerCase();

  const wantsScholarship = /scholar|financial aid|need[- ]based|stipend|wazifa/.test(lowerQuery);
  const wantsLearning = /learn|course|tutorial|resource|roadmap|practice|skill/.test(lowerQuery);

  const scored = docs()
    .filter((d) => d.urls.length > 0)
    .filter((d) => !opts.kinds || opts.kinds.includes(d.kind))
    .map((d) => {
      let score = 0;
      for (const [term, w] of q) {
        const idf = Math.log(1 + N / (1 + (freq.get(term) ?? 0)));
        if (d.strongTokens.has(term)) score += 3 * w * idf;
        else if (d.bodyTokens.has(term)) score += 1 * w * idf;
      }
      // exact-name bonus (e.g. "habib university")
      const t = d.title.toLowerCase();
      if (t.length > 3 && lowerQuery.includes(t.replace(/\s*\(.*\)\s*/g, '').trim())) score += 6;
      if (wantsScholarship && d.kind === 'scholarship') score *= 1.4;
      if (wantsLearning && d.kind === 'learning_resource') score *= 1.4;
      // prefer better-verified university rows on ties
      return { d, score };
    })
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ d, score }, i) => ({
    ref: `S${i + 1}`,
    kind: d.kind,
    sourceId: d.sourceId,
    title: d.title,
    publisher: d.publisher,
    url: d.urls[0] ?? '',
    urls: d.urls,
    retrievedAt: d.retrievedAt,
    status: d.status,
    snippet: d.snippet,
    score: Math.round(score * 100) / 100,
  }));
}

/** Text block injected into the system prompt. */
export function formatCitationsForPrompt(citations: Citation[]): string {
  if (!citations.length) {
    return 'NO MATCHING SOURCES were found in the FuturePath research dataset for this question.';
  }
  return citations
    .map(
      (c) =>
        `[${c.ref}] (${c.kind}; id=${c.sourceId}; publisher=${c.publisher}; checked=${c.retrievedAt ?? 'unknown'}; url=${c.url || 'none'})\n${c.snippet}`
    )
    .join('\n\n');
}

/** Strip the internal snippet text before sending citations to the browser (keeps payload small). */
export function publicCitations(citations: Citation[]) {
  return citations.map((c) => ({
    ref: c.ref,
    kind: c.kind,
    sourceId: c.sourceId,
    title: c.title,
    publisher: c.publisher,
    url: c.url,
    urls: c.urls,
    retrievedAt: c.retrievedAt,
    status: c.status,
    excerpt: clip(c.snippet, 400),
  }));
}

export type PublicCitation = ReturnType<typeof publicCitations>[number];
