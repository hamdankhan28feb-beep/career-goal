# FuturePath local development / build workflow

## Rule (learned in QA)
**Never run `npm run build` while `npm run dev` is running** in the same project folder. Both write `.next/`; concurrent use caused `/scholarships` 500s (`MODULE_NOT_FOUND`, missing `prerender-manifest.json`).

## Safe commands
```bash
# Dev only
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue   # only if .next is corrupted
npm run dev
# open http://localhost:3000

# Production build (stop dev first)
# Ctrl+C the dev server, then:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Database
- Postgres listens on **port 5434** on this machine (`DATABASE_URL` must use `:5434/career_goals`).
- Seeds:
  - `node db/seed.js` — bundled `data_v2.json` (original ~18 unis)
  - `node db/seed-research.js` — scholarships + learning resources
  - `node db/seed-research-universities.js` — strict research university sync (fixes false matches; inserts missing Karachi research rows)
- Dry-run: `node db/seed-research-universities.js --dry-run`

## Isolated fallback test (does not touch career_goals)
1. Create DB `career_goals_fallback_test`.
2. Point a **temporary** env var only in that shell (do not edit `.env.local` permanently):
   `$env:DATABASE_URL = "<same user/pass/host/port>/career_goals_fallback_test"`
3. Apply schema + migrations; do **not** seed.
4. `npm run dev` with that env → scholarships API should still return research JSON/CSV (`source=research_json` or `research_csv`) with 38 rows.
5. Drop `career_goals_fallback_test` when done.

## Secrets
Never commit `.env.local`. Backups like `.env.local.bak*` are gitignored.

## Regression checks

- `npm run test:predictor` - pure unit checks for `src/lib/predictor.ts` (aggregate formula, 0-100 validation, chance bands, no invented default cutoff). Needs Node >= 22.18 (native TypeScript type stripping).
- `npm run qa:regression` - Playwright browser suite against a running server (default `http://127.0.0.1:3000`, override with `QA_BASE`). Uses system Chrome (`channel: 'chrome'`, override with `QA_CHANNEL`). Run selected suites with `node scripts/qa-regression.mjs nav quiz predictor pages mobile`. Exits 1 on any FAIL.
  - `nav`: homepage "Scholarship Finder" card must navigate to `/scholarships` (waits for the URL; never a fixed sleep - the dev server compiles routes on demand and soft navigation can take several seconds).
  - `quiz`: 24x "Very much", 24x "Not at all" (flat warning, no ranking) and a varied 5-option cycle (Strong/Good/Possible bands, distinct fields, no "% match").
  - `predictor`: valid, boundary (0, 100, decimals), missing and invalid (letters, negative, >100, bad budget) inputs.
  - `pages` / `mobile`: university search, compare, scholarship status filters, iPhone 12 overflow and navigation.
- Stable selectors: `data-testid="home-feature-scholarships"` (feature cards use `home-feature-<route>`), quiz option buttons carry `aria-label`/`aria-pressed`, plus `quiz-start`, `quiz-next`, `quiz-flat-warning`, `quiz-result`, `predictor-*` test ids.

## Detailed university profiles
- Data: `data/research/university_profiles_batch1.json` (per-field value/status/source, sources with checked date).
- DB: migration `db/migrations/004_university_profiles.sql` adds `profile_details` JSONB, `profile_status`, `profile_checked_at`.
- Sync: `npm run db:seed:profiles` (applies 004 idempotently, upserts by research_id then slug; never changes verification_status). `--dry-run` rolls back the upsert.
- Bundled fallback: `src/lib/university-profiles.ts` (used when DB is down or the row has no profile_details).
- Screenshots: `node scripts/qa-profiles.mjs` -> `qa-profile-shots/` (gitignored).

