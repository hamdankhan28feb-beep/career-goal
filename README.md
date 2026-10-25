# FuturePath

University intelligence and career counseling platform for Pakistan — university profiles, field guides, comparisons, admission predictor, and more (Next.js App Router + PostgreSQL).

## Getting started

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL
npm run dev                  # http://localhost:3000
```

The app reads university data from the database when `DATABASE_URL` is set; otherwise it falls back to the bundled data in `data_v2.json` (which is also the **source of truth** the seed reads from).

## Database

### Schema

- `schema_final.sql` — fresh-install schema (run once on a new database).
- `migration_to_final.sql` — upgrade script for legacy databases.

### Migrations

Incremental migrations live in `db/migrations/` and are idempotent. Apply with psql:

```bash
psql "$DATABASE_URL" -f db/migrations/001_important_links_student_tools.sql
```

### Seeding

The database is not pre-populated — run the seed after applying the schema so the site shows universities.

```bash
npm run db:seed          # == node db/seed.js
```

- Reads every university from `data_v2.json` and writes it into the tables (universities, campuses, admissions, entry_tests, fees, scholarships, academic_policies, facilities, hostels, transport, important_links, etc.).
- **Idempotent / safe to re-run**: universities upsert by unique `slug`, and all child rows are delete-then-inserted per university inside a single transaction — re-running never creates duplicates.
- **Re-run whenever `data_v2.json` changes** to keep the database in sync.
- Deliberately leaves `reviews` (community content) and `departments` untouched, and skips `rankings` because the source has no `ranking_year` (the project never fabricates data).

### Production database

Create a Postgres database (Neon from the Vercel Marketplace works) and copy its connection string into the Vercel environment as `DATABASE_URL`. Before that deploy, the database has to contain the universities and profiles. An empty database replaces the bundled JSON fallback, so the site would show no universities.

From a checkout of this repo, with the production URL only in your shell (do not commit it):

```bash
DATABASE_URL='postgres://…' npm run db:setup
```

Then redeploy on Vercel so the build and the running server both see `DATABASE_URL`.

`npm run db:setup` is safe to run again. It applies `schema_final.sql` only when the `universities` table is missing, runs every file in `db/migrations/` (001 through 005, and any later file in that folder), then seeds universities, the Karachi research rows, scholarships, learning resources, all five profile batches, verification events, ratings and field conflicts. It does not drop the database and does not delete users, sessions or reviews. Catalogue rows that come from `data_v2.json` (fees, campuses and similar) are replaced on each run so they stay in sync.

### AI Counselor

The counselor stays off until a provider key is set. It does not invent an answer. Add one of these in Vercel, then redeploy:

- `GEMINI_API_KEY` — a free key from Google AI Studio. This is enough on its own. The default model is `gemini-3.5-flash-lite` (override with `GEMINI_MODEL`).
- `OPENAI_API_KEY` — optional. The default model is `gpt-4o-mini` (override with `OPENAI_MODEL`).

If both keys are set, OpenAI is used unless `COUNSELOR_PROVIDER` is `gemini`.

### Notes

- `important_links` supports student-built tools: `description` + `is_unofficial` columns (migration `001`). Links with `is_unofficial = TRUE` render in the "Student Tools" subsection with an "Unofficial — Made by FAST Students" badge.
- NEVER edit `data_v2.json` by hand for cosmetic reasons and keep the seed in sync with it — it is the canonical source for the database.
