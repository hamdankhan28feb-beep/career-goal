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

### Notes

- `important_links` supports student-built tools: `description` + `is_unofficial` columns (migration `001`). Links with `is_unofficial = TRUE` render in the "Student Tools" subsection with an "Unofficial — Made by FAST Students" badge.
- NEVER edit `data_v2.json` by hand for cosmetic reasons and keep the seed in sync with it — it is the canonical source for the database.
