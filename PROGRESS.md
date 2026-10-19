# Progress

Audit base: `dda178f` (`origin/main` HEAD). Branch: `claude/futurepath-evidence-overhaul`.

## Phase 2 — evidence system, homepage/trust, security

Done in the working tree, pending the phase commit:

- Derived badge (`deriveUniversityStatus`). Stored status columns are not used for display. Migration `005` comments them as deprecated and does not drop them.
- `verification_events` JSON plus additive SQL. `last_verified_at` is not defaulted to now. Hardcoded `checkedAt` removed from `research-meta.ts`.
- Ratings file for HEC ORIC FY2024-25 (category, not an overall ranking). Iqra campus conflicts recorded.
- Legacy fees, rankings, accreditations and facility flags are stripped at display time. Campus count is "Not available" when unsourced.
- Homepage copy, counts, footer, quiz/compare lengths, predictor (no house estimates), field salary removal, scholarship kind, Google button, counselor unavailable state, reviews off `data_v2.json`, admin bootstrap script (not run), database URL fallback removed.
- About, privacy, report, dashboard and profile pages.
- Tests: predictor math, evidence (Verified requires source and date), report API validation.

## Phase 3 — university research

Not started as new field checks beyond the ORIC report and the Iqra campus row already in the verification log. Official pages for FAST, NED, IBA, Habib, MAJU and Hamdard were opened on 2026-10-19 and still need to be written into the profile JSON with verification events.

## Phase 4 — product pages

Predictor, quiz explanations, compare rows, counselor/auth copy, dashboard/profile and filtered university links are in the Phase 2 tree. Scholarship first paint is still a client fetch. Keyboard/contrast pass is not done.

## Phase 5 — verify and write CHANGES.md

Typecheck passed. Unit tests passed after the alias loader. Lint: the repo had no ESLint config; a Next flat config was added. Pre-existing `no-explicit-any` errors remain in admin and query files. Build not run yet. CHANGES.md not written yet.
