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
