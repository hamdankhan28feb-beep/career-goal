# FuturePath — Phase 1 Audit (read-only)

- **Repo / commit:** `main` @ `dda178f` (ahead 1 of origin/main). Audited 2026-10-19 (PKT, UTC+5).
- **Method:** I read the source, ran read-only DB queries (`SET default_transaction_read_only = on`), and ran `npm run dev` long enough to fetch every route over HTTP. The dev server was stopped afterwards. Nothing was built, edited or written to git, and `.env.local` was not modified. Env var **names** only; no secret values are printed here.
- **Phase 2 mapping caveat:** I never received the text of the user's Phase 2 items 1–13. The checklist (§6) groups the work by theme with placeholder tags `[P2-?]`. Assign the real item numbers once the list is shared.

---

## 1. Summary

The newest layer is mostly honest about where its data comes from: field-level profiles with S-numbered sources, per-field checked dates, scholarship statuses that never assume "active", and predictor copy that says "not an official cutoff". The older legacy layer is a different story. `data_v2.json` → DB tables, the hardcoded constants, and the field/career data still show **unsourced or hand-set facts** in places that break the user's rules:

1. **Overall badges are STORED, not derived.** `universities.verification_status` and `universities.profile_status` (plus `profile_status` and precomputed `field_counts` in the profile JSON) are hand-set values. Cards and compare render them directly.
2. **`last_verified_at` is seeded from hand-typed research JSON dates** by the seed scripts. No verification script or admin action writes it. One date (`checkedAt: '2026-10-11'`) is hardcoded in `research-meta.ts`.
3. **"W Category" is shown as an accreditation or HEC status with no authority, year or source.** It is stored as NBEAC/HEC/QEC "W Category" accreditations with empty `source_urls`. FAST's bundled ranking says "reportedly holds HEC W-Category (highest)". HEC ORIC W/X/Y is **never** described as a research-office category. Elsewhere it is treated as a ranking.
4. **Predictor benchmarks are FuturePath's own estimates** with no source and no year (18 hardcoded numbers). The copy says so, but the home page still shows an "illustrative" High/Medium/Low for FAST/NED/IBA.
5. **Field salary ranges are hardcoded placeholders** (a code comment says "illustrative placeholders… do not present as verified"). They are still rendered as "PKR xK–yK/month" on `/fields/[slug]` and `/compare/fields` with no label.
6. **Advertised counts don't match the code.** "8 dimensions" on compare: the code has **20 rows**. The quiz says "24 questions across 8 categories": 24 questions is correct, but there are **9** categories.
7. **Iqra campus data conflicts.** The DB shows 8 campuses (including Hyderabad, Islamabad, Chak Shahzad). The HEC-recognised Karachi list has 4 (Gulshan, North, Malir/Airport, M-9) and says Bahria Town closed 08-08-2024. The profile's "Main campus: Defence View" is not on the HEC list. The page shows only one of these, with no conflict note.
8. **Security:** no client-side secret exposure was found. `src/lib/db.ts` (tracked in git) does contain a **hardcoded fallback Postgres connection string with a password** (localhost:5434). Also: zero users in the DB, so `/admin` is unreachable, and there is no admin-bootstrap path.

**Finding counts:** P0 = 11, P1 = 9, P2 = 9 (total 29).

---

## 2. Codebase map

**Stack:** Next.js 15 App Router, React 19, Tailwind 3, Postgres via `pg`, `jose` JWT sessions, `bcryptjs`, Playwright QA scripts.

### Routes (src/app)
| Route | File | Render | Data |
|---|---|---|---|
| `/` | page.tsx | server | `getUniversities()` (DB→bundled fallback), `researchStats()` (JSON), `getFields()` (TS const), logo slider (TS const) |
| `/universities` | page.tsx + universities-client.tsx | server + client | DB (67 rows), load-more via `/api/universities` |
| `/universities/[slug]` | page.tsx (49 KB) | server | DB legacy tables + `profile_details` JSONB (bundled fallback) |
| `/universities/[slug]/reviews` | page.tsx | server | reviews table (0 rows) |
| `/scholarships` | page.tsx + scholarship-finder.tsx | client fetch | `/api/scholarships` → `research_scholarships` (38) |
| `/predictor` | predictor-client.tsx | client | `lib/predictor.ts` hardcoded benchmarks + university list |
| `/quiz` | quiz/page.tsx | client | hardcoded `QUIZ_QUESTIONS` (24) |
| `/compare` | compare-client.tsx | client | university list passed from server, 20 `COMPARISON_ROWS` |
| `/compare/fields` | compare/fields/page.tsx | client | `fields-data.ts` (13 fields), 15 rows |
| `/fields`, `/fields/[slug]` | fields pages | server | `fields-data.ts` hardcoded |
| `/counselor` | counselor/page.tsx | client | `/api/counselor` |
| `/auth/login`, `/auth/signup` | auth pages | client | `/api/auth/*` |
| `/admin`, `/admin/universities`, `/admin/reviews`, `/admin/scholarships` | admin pages | gated by middleware | DB / data_v2.json |
| `/dashboard`, `/profile` | — | **404 (do not exist)** | — |
| `sitemap.ts`, `robots.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx` | | | |

### API routes
| Route | Methods | Auth |
|---|---|---|
| `/api/universities` | GET public; POST/PUT/DELETE | admin JWT check (401 otherwise) |
| `/api/scholarships` | GET | public. Order: `research_scholarships` → legacy `scholarships` → research JSON/CSV |
| `/api/reviews` | GET admin, POST public (rate-limited, pending), PATCH admin | also `readFile`/`writeFile` on `data_v2.json` (legacy file mutation path) |
| `/api/counselor` | GET status, POST chat | public, needs OPENAI/GEMINI key |
| `/api/auth/signup`, `/login`, `/logout`, `/google`, `/google/callback` | POST/GET | rate-limited (`lib/rate-limit.ts`, in-memory) |

### Components (src/components)
site-header(-server), site-footer, university-card, university-profile-sections, verification-badge, freshness-label, live-stats, source-drawer, dialog, search-input, scholarship-finder, review-form, admin-reviews-client, admin-logout-button, featured-fields, google-sign-in-button, theme-*, university-logo-slider.

### Lib
data.ts (cache + DB/bundled fallback + predictor), university-query.ts (20 parallel queries), research-meta.ts (JSON stats, fuzzy name → status), university-profiles.ts, profile-utils.ts, display-utils.ts (`profileCompleteness`), predictor.ts, fields-data.ts (45 KB hardcoded), counselor-retrieve.ts (keyword RAG over research JSON), auth.ts / auth-server.ts / google-auth.ts / users-store.ts, reviews-store.ts, rate-limit.ts, db.ts, types.ts.

### DB schema
`schema_final.sql` (24 tables: users, sessions, universities, university_overview, campuses, accreditations, departments, programs, admissions, entry_tests, fees, scholarships, academic_policies, faculty_academics, student_life, campus_facilities, hostels, transport, placements, career_paths, rankings, reviews, faqs, important_links). Plus `migration_to_final.sql` and `db/migrations/001–004` (004 adds `profile_details JSONB`, `profile_status`, `profile_checked_at`; 003 adds `verification_status`, `last_verified_at`, `research_id`, `ownership_source`, `research_scholarships`, `research_learning_resources`).

**Live row counts (read-only):** universities 67 (all active); verification_status = verified 6 / partial 19 / unverified 40 / NULL 2 (COMSATS, PIEAS). profile_status = complete 5 / partial 13 / NULL 49. research_scholarships 38 (closed 8, unknown 30, **active 0**). Legacy scholarships 5, reviews 0, **users 0**, rankings 0, accreditations 6.

### Seed scripts & data files
- `db/seed.js` ← `data_v2.json` (18 legacy universities, all legacy tables)
- `db/seed-research.js`, `db/seed-research-universities.js` ← `data/research/universities_karachi.json` (65), `scholarships.json` (38), `learning_resources.json`
- `db/seed-university-profiles.js` ← `university_profiles_batch1/2/3.json` (6+6+6 = 18 profiles)
- Untracked clutter: `*.json.bak-20261015` (2), `.env.local.bak-before-port-fix`, many `qa-*-out.txt`, `build-log.txt`. Tracked but stray: `fast-nuces-info.md`, `schema_final.sql`, `migration_to_final.sql`, `data_v2.json`.

### Env vars (names only)
| Name | Set in .env.local | Referenced in | Client-exposed? |
|---|---|---|---|
| DATABASE_URL | yes | db.ts, data.ts, seeds | no |
| AUTH_JWT_SECRET | yes | auth.ts (middleware too) | no |
| OPENAI_API_KEY / OPENAI_MODEL | **no** | api/counselor | no |
| GEMINI_API_KEY / GEMINI_MODEL | **no** | api/counselor | no |
| COUNSELOR_PROVIDER | no | api/counselor | no |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI | **no** | google-auth.ts | no |
| NEXT_PUBLIC_BASE_URL | no | sitemap.ts | yes by design (not secret) |

Client-bundle scan: 45 `.next/static` files (from the routes visited in dev). **0** hits for any `.env.local` value and no DB URL. The strings `OPENAI_API_KEY` and `GOOGLE_CLIENT_SECRET` appear only as **names** inside user-facing error text. No `'use client'` file imports db, auth secrets or `process.env`.

### Auth
- Signup: `/api/auth/signup` validates fields, password 12–128, bcrypt cost 12, role is always `user`, and sets an httpOnly `fp_session` HS256 JWT (8 h, sameSite=lax, secure in prod). Login: `/api/auth/login`. Logout: `/api/auth/logout` deletes the cookie. Google OAuth needs the GOOGLE_* vars (unset), and login shows a "not configured" error.
- Protected routes: only `/admin/:path*` (middleware, role=admin). Admin API mutations check the role server-side.
- JWTs are stateless. The `sessions` table exists but is unused (0 rows), so logout cannot revoke a token server-side.
- `findOrCreateGoogleUser` upserts on email and overwrites `name` (existing role kept). Not checked: whether the callback enforces `email_verified`.
- **Marks & budget:** the predictor keeps Matric/Inter % and budget only in React state. They are not stored in the DB, localStorage or cookies, and nobody else can read them. They are sent to no API: the prediction is computed client-side. Quiz answers are state-only too. There is no user dashboard (`/dashboard` 404).

---

## 3. Per-route data-origin table

Legend: **DB** = Postgres row · **JSON** = bundled repo data file · **HC** = hardcoded in TSX/TS · **CR** = computed at render.

| Route | Displayed item | Origin | Notes / flag |
|---|---|---|---|
| Header | Nav labels/links | HC | All real routes. Streaming fallback "Loading…" appears in the SSR HTML of every page (app/loading.tsx) |
| Home | "Karachi unis (research) **65**", "6 verified / 19 partial" | JSON `universities_karachi.json` via `researchStats()` | Not DB (DB has 67). verified/partial are **stored** statuses |
| Home | "Detailed profiles **18**", "453 sourced fields · checked 2026-10-19" | DB `profile_details` (bundled fallback), CR sum of stored `field_counts` | field_counts are precomputed in JSON, not derived at render |
| Home | "Scholarships tracked **38** – 0 open / 8 closed / 30 unknown" | JSON `scholarships.json` (not the DB API) | Matches DB today but comes from a different source than /scholarships |
| Home | FreshnessLabel "Checked 2026-10-19" | CR max(HC `'2026-10-11'`, latest profile `last_checked`) | HC date in research-meta.ts |
| Home | Recently verified (3 unis + counts) | DB profile JSON | OK |
| Home | Feature cards "24-question", "8 dimensions", "available", "when AI keys are configured" | HC | 8 ≠ 20 rows; "available" wording; dev note visible to users |
| Home | Evidence Atlas legend ("Approximate = partial official data", "Unverified = HEC listing only") | HC | Differs from the rule definitions (Approximate = disclosed estimate basis) |
| Home | Counselor CTA "✅ Merit predictions", "Powered by AI + your database" | HC | AI is not configured; "merit predictions" overstates benchmark estimates |
| Home | Predictor CTA FAST=High, NED=Medium, IBA=Low | HC ("Illustrative example only") | Real university names next to invented chances |
| Home | Logo slider "18 universities · Karachi" | HC `src/data/university-logos.ts` | Count derived from array |
| Home | Featured universities (6) | DB, first 6 with city=Karachi | No ranking/ordering basis |
| /universities | "Showing **67** universities" | DB | vs 65 on home |
| /universities card | Verification badge | DB `verification_status` (stored) → fuzzy-name fallback `verificationForName` | Stored, not derived; fuzzy match can mislabel |
| /universities card | "Detailed profile · N sourced" | DB profile JSON | OK |
| /universities card | Campuses / Programs / Scholarships counts | DB legacy tables | Iqra shows 8 campuses (conflict, §4) |
| /universities card | "Profile completeness 0–94 %" | CR `profileCompleteness()` or legacy `data_completeness_pct` (data_v2) | Legacy % is a scraping metric, not evidence |
| /universities card | Chip "W Category" / "HEC Recognized" | DB `accreditations[0].accreditation_type` / `hec_status` | No authority/year/source |
| /universities/[slug] | Profile sections, per-field status, "checked YYYY-MM-DD", S# sources | DB `profile_details` JSON | Good. Dates are from research JSON |
| /universities/[slug] | Header "Partial/Detailed profile" badge | stored `profile_status` | Should be derived |
| /universities/[slug] | HEC Status pill, Accreditations, **Rankings** block | DB `hec_status`, accreditations; rankings from bundled data_v2 when DB empty | Rankings: FAST "reportedly W-Category", NED "95.33% score", PIEAS "Ranked #1", IU THE/GreenMetric with null values; no year |
| /universities/[slug] | Legacy fees, app fee, test fee, transport fee (PKR) | DB legacy tables (from data_v2.json) | `source_urls` all `[]`; no period |
| /universities/[slug] | "Available Yes/No" (hostel/transport) | DB legacy booleans | Unsourced |
| /universities/[slug] | "Detailed history not yet available…", "Answer not yet available." | HC placeholder | OK as empty state |
| /universities/[slug]/reviews | Reviews list | DB (0 rows) | Empty page in practice |
| /scholarships | List, counts, statuses, deadlines, source links | DB `research_scholarships` via API | SSR shows "Loading scholarships…" (client fetch). Type mapping `university → "Need-Based"` mislabels merit awards (e.g. Bahria BISE toppers) |
| /scholarships | "No scholarship is currently verified as open." | CR (0 active) | Correct, but conflicts with home "scholarships available" |
| /predictor | Aggregate formula "Inter 60% + Matric 40%" | HC | Same formula for every university; not sourced |
| /predictor | Benchmarks (18 unis, 55–92) | HC `BENCHMARK_AGGREGATES` | **No source, no year**. Keyed by shortName, so 49 DB unis get "no benchmark" |
| /predictor | Budget filter (semester_fee×2 or total/4) | CR from legacy fees | Derived annual fee; unsourced inputs |
| /quiz | 24 questions; "8 categories" | HC | 24 ✓; categories are actually **9** (incl. Security, Infrastructure) |
| /quiz | Result bands | CR | Copy says "relative bands" ✓ |
| /compare | 20 rows | HC rows, DB values | "Campuses" uses `campuses.length \|\| 1` (**invents 1**); "Data Completeness" mixes metrics |
| /compare/fields | 15 rows incl. Min/Max Salary | HC `fields-data.ts` | Salaries are labelled placeholders in code but **not in the UI** |
| /fields, /fields/[slug] | Salary, demand, difficulty, job lists, roadmap | HC | Unsourced. "Find universities for X" → generic `/universities` |
| /counselor | Status banner, disabled composer | `/api/counselor` GET → `mode: unconfigured`, `dataCheckedAt 2026-10-11` (HC) | Works safely without keys (see §4) |
| /auth/login, /auth/signup | Forms | API | Work against DB. Google button → "not configured" |
| /admin/* | Admin dashboards | DB | **Not checked interactively**: no admin user exists (users = 0) and I'm not allowed to create one |
| Footer | Brand blurb "Pakistan's most comprehensive…" | HC | Unsubstantiated claim |
| Footer | contact@futurepath.pk, "Karachi, Sindh" | HC | Not checked whether the mailbox exists |
| Footer | Twitter / LinkedIn / Facebook | HC `href="#"` | **Placeholder social links (3 on every page)** |
| Footer | "Explore top Karachi universities" 6 chips | HC | **All link to generic `/universities`** |
| Footer | "Data sourced from official university websites and admissions portals only." | HC | Contradicts methodology (HEC, prospectus, etc.) and the legacy unsourced data |
| Footer | © year | CR `new Date().getFullYear()` | Fine |

---

## 4. Specific checks

| Check | Result |
|---|---|
| University count from DB? | **Partly.** /universities = DB (67). Home "65" = research JSON. Home "18 detailed" = DB profiles. Footer/slider = HC. Three different numbers for "universities". |
| Scholarship count from DB? | /scholarships = DB `research_scholarships` (38). Home = JSON (38). Same today, different sources. Legacy `scholarships` table (5) also feeds per-university counts. |
| Quiz length 24? | ✓ `QUIZ_QUESTIONS.length === 24`. "8 categories" ✗: code has 9. |
| Compare 8 dimensions? | ✗ `COMPARISON_ROWS` = 20. |
| "18 listed vs 15 detailed" | Current numbers: 18 detailed profiles (stored flags: 5 complete + 13 partial), 18 logos in the slider, 18 legacy data_v2 unis, 65 research, 67 DB. The legacy 18 (data_v2) and the 18 profiles are **different sets**: e.g. Iqra, DHA Suffa, KIET, SHU, SMIU have profiles but no data_v2 entry, while DSU, IoBM, COMSATS, PIEAS are in data_v2 without profiles. I saw no "15 detailed" anywhere in the current build. |
| Predictor benchmarks source/year | **None.** `src/lib/predictor.ts` comment: "FuturePath's own rough estimates… not verified". 18 values, no year, no URL. |
| AI counselor without credentials | GET returns `{mode:'unconfigured'}`. The page shows a "Counselor not configured on this server" banner and a disabled composer. POST returns 503 with "Set OPENAI_API_KEY or GEMINI_API_KEY in .env.local and restart the dev server" (dev instructions shown to end users). No fake answers. |
| Secrets client-side | None found (see §2). **db.ts fallback connection string contains a password** (server-side, but tracked in git). |
| W Category / ORIC | Sources: `data_v2.json` → DB `accreditations` (IBA: body **NBEAC** "W Category"; MAJU: HEC "W Category"; NED: **QEC** "W Category"), data_v2 rankings (NED "QEC Category: W", FAST "HEC W-Category (Computer Science)… reportedly… highest"). `hec_status` for NED = "W Category" in data_v2. **No year, no source URL (`source_urls = []`), wrong authority labels** (NBEAC/QEC/"Computer Science"). The word "ORIC" appears nowhere in the code. |
| How 'checked'/last_verified dates are produced | Profile fields: `last_checked` / per-source `checked` strings typed into research JSON. DB `last_verified_at`: copied from research JSON by `seed-research*.js` (2026-10-10 / 10-11). DB `profile_checked_at`: copied by seed-university-profiles.js. `research-meta.ts` hardcodes `checkedAt: '2026-10-11'`. No render-time `new Date()` is used for a checked date ✓. No `DEFAULT now()` on any verified/checked column ✓ (`updated_at` defaults only). No verification script or admin "mark verified" action exists, so every date comes from hand-entered research files. |
| Overall badge stored or derived | **Stored**: `universities.verification_status` (CHECK verified/partial/unverified), `profile_status` (complete/partial), JSON `profile_status`, and JSON `field_counts`. The card falls back to a fuzzy name match. Violates the "derived" rule. |
| Iqra campus count & conflicts | DB campuses (from data_v2): **8** = Main, Gulshan, North, Airport, M9, Hyderabad, Islamabad, Chak Shahzad. Research JSON (HEC Recognized Campuses): Karachi Gulshan, North (CS & Mgmt only), Malir/Airport Rd, M-9 Scheme 33 (subject to council permission); Bahria Town **closed 08-08-2024**. Profile: "Main campus: Defence View" (status partial, S1) is absent from the HEC list. The research row notes iqra.edu.pk timed out and values came from search snippets ("re-fetch to confirm"). The page doesn't show both sides of the conflict. |
| Footer sourcing vs methodology | Footer: "official university websites and admissions portals only". Home methodology: "We prefer HEC and official university pages". Rules: HEC, university sites, prospectus, fee schedules, merit lists. Legacy data has no sources at all. **Inconsistent.** |
| Scholarship "available" copy | Home feature: "Discover … scholarships **available**". Data: 0 active, 8 closed, 30 unknown. /scholarships itself is honest ("No scholarship is currently verified as open"). |
| Dev notes in UI | Home: "answers grounded in our database **when AI keys are configured**". Counselor 503: "Set OPENAI_API_KEY or GEMINI_API_KEY in .env.local and restart the dev server". Login: "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local…". Counselor page: "ask the site owner to add an API key". |
| Provenance columns per table | `source_urls jsonb DEFAULT '[]'` on: university_overview, campuses, accreditations, departments, programs, admissions, entry_tests, fees, scholarships, academic_policies, faculty_academics, student_life, campus_facilities, hostels, transport, placements, career_paths, rankings (+`ranking_year`, `ranking_url`, `ranking_organization`), faqs, important_links. `research_scholarships`: `source_url`, `application_url`, `last_verified_at`. `research_learning_resources`: `url`, `last_verified_at`. `universities`: `source_note`, `ownership_source`, `last_verified_at`, `profile_checked_at`, `profile_details` (field-level `source`). **No table has per-field status/period columns, and none has a conflict table.** Accreditations sampled: `source_urls` empty in all 6 rows. Not checked: whether any legacy table has a non-empty `source_urls` (all except accreditations hold 0 rows per pg_stat, but that estimate is stale, so I didn't fully count). `users`, `reviews`, `sessions` have none (n/a). |

---

## 5. Findings by severity

### P0 — accuracy / security
1. **Stored overall badges** (`verification_status`, `profile_status`, JSON `profile_status`/`field_counts`) are rendered as verdicts. Must be derived from field statuses. (`university-card.tsx:20-25`, `compare-client.tsx:29`, slug header)
2. **`last_verified_at` has no real verification writer.** Seeds copy hand-typed dates, and `research-meta.ts` hardcodes `checkedAt: '2026-10-11'` (also returned by `/api/counselor`).
3. **W Category shown as accreditation/HEC status/ranking** with wrong authorities (NBEAC, QEC, "Computer Science"), no year and no source. HEC ORIC W/X/Y is never explained as a research-office category, and FAST's text says "reportedly".
4. **Legacy rankings** ("95.33% score", "Ranked #1", THE/GreenMetric with null values) are rendered without authority + year + source. PIEAS `hec_status` = "Ranked #1 Engineering & Technology".
5. **Predictor benchmarks** are unsourced, undated house estimates (18 values) and one formula (60/40) is applied to every university. The home page pairs real names with invented High/Medium/Low.
6. **Field salary ranges and demand/difficulty** are hardcoded placeholders shown as facts on /fields/[slug] and /compare/fields (the code comment admits they're placeholders).
7. **Iqra campus conflict**: 8 DB campuses vs 4 HEC-recognised Karachi campuses (+1 closed) vs "Defence View" main campus. No conflict recording or display.
8. **Legacy data_v2 facts** (fees, hostel/transport "Available Yes/No", PhD faculty, placement %, accreditations) are rendered with empty `source_urls` and no period.
9. **Compare "Campuses" invents 1** when unknown (`campuses.length || 1`).
10. **Hardcoded fallback DB URL with a password** in tracked `src/lib/db.ts:10`. Even if it's only a local dev credential, rotate it and remove it.
11. **Scholarship type mislabel:** every `provider_type=university` scholarship becomes "Need-Based" (e.g. the Bahria BISE board-toppers award, which is merit).

### P1 — broken / misleading UX
1. "Compare on **8** dimensions": the code has 20.
2. Quiz "24 questions across **8** categories": the code has 9.
3. Home "scholarships **available**" while 0 are verified active.
4. Footer social links `href="#"` ×3 (every page).
5. Footer "Explore top Karachi universities" chips all go to generic `/universities`. `/fields/[slug]` "Find universities for X" does the same, with no filter.
6. Three conflicting university counts (65 home / 67 list / 18 detailed / 18 slider) without explanation. Home scholarship stats read JSON while the page reads DB.
7. Dev/config instructions shown to end users (counselor, login, home "when AI keys are configured", "Powered by AI + your database", "✅ Merit predictions").
8. Admin is unreachable: 0 users and no admin seed/bootstrap. The `sessions` table is unused (no server-side logout/revocation). `/api/reviews` still writes to `data_v2.json` on disk (legacy path; fails on read-only hosts).
9. Predictor covers only 18 hardcoded short names. The other 49 DB universities silently return "no benchmark". The budget filter derives annual fees from unsourced legacy numbers.

### P2 — polish
1. Footer claim "Pakistan's most comprehensive…" is unsubstantiated.
2. Footer sourcing sentence doesn't match the methodology section, and the home legend definitions don't match the rule definitions (Approximate = disclosed estimate basis).
3. The SSR HTML of every page contains the streaming "Loading…" fallback. /scholarships, /compare/fields and /counselor render client-side only (empty for no-JS/SEO).
4. Reviews pages are empty (0 reviews). Consider an empty-state message or hiding the tab.
5. `/dashboard` and `/profile` are 404, so logged-in users get no account page.
6. Card "Profile completeness" mixes the sourced-field % with the legacy scraping `data_completeness_pct`.
7. Repo clutter: tracked `fast-nuces-info.md`, `schema_final.sql`, `migration_to_final.sql`. Untracked `.bak` JSONs, `.env.local.bak-before-port-fix`, `qa-*-out.txt`.
8. Home page colours in the "Recently verified" list still use raw emerald/amber, not the tokens.
9. `contact@futurepath.pk` is unverified (not checked whether the domain/mailbox exists).

---

## 6. Prioritized implementation checklist (map to user's Phase 2 items 1–13)
> Tags below are the owner's Phase 2 item numbers. `origin/main` is `dda178f`, the commit this audit used.

Mapped to the owner's Phase 2 decisions. Audit base is `dda178f`, which is origin/main HEAD.

1. `[P2-1]` **Unsupported "W Category" badges** — year-specific sourced category, or remove. Owner item 1. (was: ratings model)
2. `[P2-3]` **Verification provenance.** Stored events only. Remove hardcoded `checkedAt`. Owner item 3. (was: derive badge + provenance)
3. `[P2-9]` **Copy and counts.** Catalogue rows, loaded records and profile files stay separate. Headline, quiz length and compare rows come from code. Owner items 2, 7, 8 and 12.
4. `[P2-13]` **Footer, About, privacy, report.** Sourcing text is official university pages and HEC listings. Owner items 4 and 13.
5. `[P2-6]` **Predictor limits.** No illustrative FAST/NED/IBA chances. Owner item 5.
6. `[P2-5]` **Iqra campuses.** HEC Karachi list primary; other sources in `field_conflicts`. Owner item 6.
7. `[P2-8]` **Scholarships.** No "available" copy while none are verified open. Provider type is not need/merit. Owner item 9.
8. `[P2-11]` **Dev copy.** No "when AI keys are configured". Owner item 10.
9. `[P2-10]` **Links and empty states.** No `#` links, chips to `/universities/[slug]`, no "Loading…" fallback. Owner item 11.
10. `[P2-4]` **Legacy quarantine.** Unsourced figures stay in the file and display with no number. Campus count is never a fabricated 1.
11. `[P2-7]` **Field salaries.** Unsourced salary, demand and difficulty show as Not available.
12. `[P2-12]` **Security.** No fallback database URL. Admin bootstrap from env. Reviews leave `data_v2.json`. Google button only when configured; callback requires `email_verified === true`.
13. `[P2-2]` **Derived badge.** `deriveUniversityStatus` is the only overall badge. Stored status columns are not read for display and are not dropped.

The original audit wording, kept for traceability:

1. `[P2-2]` **Derive the overall badge.** Write a pure `deriveUniversityStatus(fields)`. Stop reading `verification_status`/`profile_status`/`field_counts` for display; deprecate or drop those columns. (P0-1)
2. `[P2-3]` **Verification provenance.** Add a `verification_events` table (who/what/when/source_url). Write `last_verified_at` only from a verify script or admin action. Remove the HC `checkedAt`. (P0-2)
3. `[P2-1]` **Ratings model.** Every rating/category needs `authority, year, source_url, kind` (ranking vs category). Re-label HEC ORIC W/X/Y as a research-office category. Purge the "reportedly" and NBEAC/QEC W rows unless sourced. (P0-3, P0-4)
4. `[P2-4]` **Retire or quarantine legacy data_v2 facts** that have no `source_urls`: hide them or show them as Unverified with no figure. Fix Compare `||1`. (P0-8, P0-9)
5. `[P2-5]` **Conflict recording.** Add a `field_conflicts` structure that shows both values. Seed Iqra campuses (HEC list vs site vs DB) first. (P0-7)
6. `[P2-6]` **Predictor.** Replace benchmarks with sourced merit-list closing aggregates (university + programme + year + URL), or remove the chance labels. Drop the home illustrative names. (P0-5, P1-9)
7. `[P2-7]` **Fields data.** Remove salary/demand numbers or source them (authority + year). Label everything else Unverified. (P0-6)
8. `[P2-8]` **Scholarships.** Fix the type mapping (provider ≠ need/merit) and change the home "available" copy. Use one source (DB) for home stats. (P0-11, P1-3, P1-6)
9. `[P2-9]` **Copy/count accuracy.** Derive the compare dimension and quiz category counts from code. Unify the university counts with explicit labels. (P1-1, P1-2, P1-6)
10. `[P2-10]` **Links.** Remove or replace the `#` social links. Make chips deep-link to `/universities/[slug]` and fields to a filtered list. (P1-4, P1-5)
11. `[P2-11]` **Counselor/auth copy.** Replace dev instructions with neutral user copy and log config hints server-side. (P1-7)
12. `[P2-12]` **Security/auth.** Remove the db.ts fallback credential and rotate it. Add an admin bootstrap script. Decide on stateless JWT vs `sessions`. Move reviews off the `data_v2.json` file writes. Verify `email_verified` in the Google callback. (P0-10, P1-8)
13. `[P2-13]` **Footer & polish.** Align the sourcing sentence with the methodology, remove the "most comprehensive" claim, and clean up the P2 list. (P2-*)

---

## 7. Needs your decision / credentials
1. **Phase 2 item list (1–13):** please share it so §6 can be renumbered.
2. **AI counselor:** provide OPENAI_API_KEY or GEMINI_API_KEY (+ model), or decide to hide /counselor until then.
3. **Google sign-in:** provide GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI, or remove the button.
4. **Admin account:** OK to add a one-off admin bootstrap script and create your admin user? Needed before /admin can be audited.
5. **Predictor:** keep it with sourced merit lists (needs research per uni + programme + year), or remove the High/Medium/Low chances?
6. **Field salaries/demand:** remove, or fund research with an official source (e.g. PBS/P@SHA reports, with year)?
7. **Legacy data_v2 data** (fees, facilities, rankings, campuses): delete, hide, or re-verify?
8. **W Category / ORIC:** keep a "HEC ORIC category" field (needs the HEC source + year per university) or drop it?
9. **Stored status columns:** OK to drop or deprecate `verification_status` / `profile_status` in a migration?
10. **Social links / contact email:** real handles and a working mailbox, or remove them?
11. **db.ts fallback credential:** confirm it is a local dev password, then rotate it.
12. **Iqra campuses:** confirm which source wins for display (HEC list) with the others recorded as conflicts.

## 8. Not checked (with reason)
- **/admin pages interactively:** no admin user exists and I'm not allowed to create users or write to the DB.
- **Google OAuth callback `email_verified` handling:** not read in detail. Credentials are unset, so it can't be exercised.
- **Counselor live answers/citations:** no API keys.
- **Full client-bundle secret scan of a production build:** builds were out of scope. I only scanned the dev chunks for the visited routes.
- **Legacy table row-by-row `source_urls` population** (beyond the accreditations sample).
- **Whether contact@futurepath.pk / the social accounts exist:** external, not verified.
- **Field-by-field re-verification of profile values against live official pages:** that's Phase 2 research, not an audit task.
