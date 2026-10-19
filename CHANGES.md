# Changes

Audit base: `dda178f` (`origin/main` HEAD, not older). Branch: `claude/futurepath-evidence-overhaul`. Live site was not redeployed.

## Pages and features audited

Home, university list and profile, compare, compare fields, quiz, predictor, scholarships, counselor, login/signup, footer, fields, admin universities/reviews (code only), Google callback, reviews API, database connection helper. The Phase 1 audit is now `AUDIT.md`. Section 6 `[P2-?]` tags are mapped to the owner's items 1–13.

## Factual corrections

- HEC ORIC FY2024-25 is stored as a **research-office category**, with authority, year, source URL and kind `category`. It is not an overall ranking. W: NED (86), Ziauddin (80.5). X: FAST-NUCES (60.5, institutional, not Karachi-only), Iqra (64), SZABIST (66), Bahria (67; the report names Bahria University, Islamabad), IoBM (60), COMSATS (60.5), PIEAS (69.5). Y: IBA (42), MAJU (49.5), Hamdard (50.5), DHA Suffa (49), University of Karachi (54), SSUET (42.5), KIET (46.5), SMIU (54.5). IBA and MAJU are not W. Habib, Indus, DUET and SHU were not in that report and were left blank.
- NED's homepage line "QEC W category (95.33%)" is kept only as a conflict next to the ORIC score of 86. Neither number is shown as the only score.
- MAJU's homepage "w 4 Category" mark is a conflict. The displayed category is ORIC Y.
- FAST computing test pattern was corrected from the test-pattern page opened 2026-10-19: BS (CS/Engg.) is Advanced Maths 50%, Basic Math 20%, Analytical/IQ 20%, English 10%. Essay is not in that column.
- NED AI, Data Science and Cyber Security are listed on the academic programmes page as 4-year bachelor programmes. Older "50 seats / second-year track" wording was not re-opened and is no longer shown.
- MAJU BS Software Engineering is on the Fall 2026 eligibility table. The older "spring only" line is not shown.
- FAST Karachi undergraduate list on the homepage is Electrical Engineering, Business Analytics and Financial Technologies. BBA is not claimed as a Karachi listing.
- Iqra's primary campus list is the four HEC-recognised Karachi campuses that are not marked closed. Islamabad, Chak Shahzad, Hyderabad, Quetta (operations stopped) and Bahria Town (closed 08-08-2024) are conflicts. The HEC university page still says "Islamabad; Karachi; Quetta" and a Defence View address. Those are shown as conflicts, not as the count.
- Unsourced fees, merit, deadlines, rankings, accreditation labels and facility yes/no flags from `data_v2.json` stay in the file and are removed from the display copy. Missing campus counts say "Not available".
- Field salary, demand and difficulty numbers were removed. Those rows say "Not available".
- Scholarship provider type is not treated as need or merit. Kind comes from the name and eligibility text, or "Unknown".

## Per-university verification status

A field is shown as verified only when a verification event dated 2026-10-19 records a source URL. Everything else in the old profile JSON stays in the file and displays as needs review, with the figure withheld.

| University | What was opened on 2026-10-19 | Still withheld |
| --- | --- | --- |
| FAST-NUCES Karachi | Homepage, eligibility, 2026 schedule, fee structure, scholarships, FAQ, test pattern | HEC profile page, ownership wording, Fall 2027 dates (page still shows 2026) |
| NED | Homepage, admissions index, academic programmes | Prospectus fees, scholarship handbook, HEC profile, full subject eligibility |
| IBA Karachi | Homepage and programmes-offered page | Fee page, schedule page, expanded legal name, HEC profile, credit-hour figure (table columns did not separate cleanly) |
| Habib | Admissions page (programmes, address, phone, scholarship percentages, Fall 2027 eligibility sentence) | Tuition page, HU TOPS date page, international-board page |
| SZABIST | Nothing. `www.szabist.edu.pk` returned 404. `szabist.edu.pk` timed out twice | All profile figures |
| MAJU | Homepage and Fall 2026 eligibility | Fees, scholarship tables, admission-test composition, HEC profile |
| Iqra | HEC recognised-campuses row and HEC university page (earlier in this effort). Site root timed out on the later pass | Programmes, fees, deadlines, contacts |
| Hamdard | Homepage and FEST programmes page | Fee page, admissions portal, founding-year claim |
| DHA Suffa, Bahria, UoK, SSUET, DUET, KIET, Indus, Ziauddin, SHU, SMIU, COMSATS, PIEAS | ORIC category only, where the FY2024-25 report names them | All other profile figures |

Direct HTTP to `hec.gov.pk` timed out from this environment. The ORIC PDF text and the Iqra campus row were taken from a search fetch of those same official URLs. That limit is in the verification-event notes. Press sites and aggregators were not used as proof.

## Scholarships and admission data

- No new scholarship was marked open. The bundled catalogue has closed and unknown rows only. The scholarships page says none are verified as open.
- Coverage sentences in the catalogue still quote the seed text and link the recorded source URL. They do not get a verification date, because those dates in the JSON were not written by the verification log.
- FAST fee and scholarship text that was on pages opened 2026-10-19 is in the profile and the verification log. NED, IBA, Habib, MAJU and Hamdard fee pages were not re-opened, so those amounts are withheld.
- `data/research/merit_aggregates.json` is empty on purpose. The predictor has no High/Medium/Low for any university.

## Implemented vs unavailable

Implemented: derived badges, verification log, ratings, field conflicts, display quarantine, homepage/footer/quiz/compare copy, report form, about, privacy, dashboard, profile, scholarship filters with an honest empty state, predictor that refuses unsourced chances, counselor route that stays in the app.

Unavailable until you configure them:

- AI Counselor answers. The page says Unavailable / Beta. If a key is set later, the prompt says answers are not official advice and must not invent citations. Keys are not sent to the client.
- Google sign-in. The button is hidden when the server has no credentials. The callback requires `email_verified === true`.
- Saving a report, writing verification events, and creating the admin user. Those need `DATABASE_URL`. The report API returns 503 with that explanation. `scripts/bootstrap-admin.mjs` was not run.
- Official admission chances. There is no sourced closing aggregate on file.

## UI and accessibility

- Headline: "A growing university and career guide for Pakistan, starting with Karachi."
- Quiz copy is 24 questions and 9 categories, taken from the question list. Compare copy uses the 20-row list.
- Footer chips go to university profile URLs. "#" social links are gone. A contact email appears only when `NEXT_PUBLIC_CONTACT_EMAIL` is set.
- The SSR fallback no longer says "Loading…". The scholarship list is in the first HTML from the bundled catalogue.
- Global `:focus-visible` outline was already present and was left in place.
- Logged-in users have `/dashboard` and `/profile`, including in the mobile menu.
- A full keyboard and contrast click-through in a browser was not done. Homepage, NED profile, scholarships and login HTML were fetched from the local production server.

## Database and security

Run these yourself, in order. They are additive. This session did not apply them and did not start a local Postgres.

1. `db/migrations/001_important_links_student_tools.sql` (already in the repo)
2. `db/migrations/002_reviews_add_experience_columns.sql`
3. `db/migrations/003_research_verification.sql`
4. `db/migrations/004_university_profiles.sql`
5. `db/migrations/005_evidence_provenance.sql` — comments that `verification_status`, `profile_status`, `last_verified_at` and `profile_checked_at` are deprecated for display. Creates `verification_events`, `university_ratings`, `field_conflicts`, `content_reports`. No DROP and no DELETE.

Then, if you want the JSON log in the database: `node scripts/record-verification.mjs --check` (safe, no database) and `node scripts/record-verification.mjs --apply-db` only after `DATABASE_URL` is set. `--apply-db` was not run.

Security:

- `src/lib/db.ts` no longer has a fallback connection string. If `DATABASE_URL` is unset, `query()` throws and tells you to set it. **Rotate the database password that used to be in that file.** It is not reprinted here.
- Reviews no longer write `data_v2.json`.
- Admin bootstrap reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment. It was not executed.
- Seed scripts no longer copy hand-typed verification status or dates into those columns.
- Sessions stay stateless JWTs. The `sessions` table is still unused. Logout clears the cookie; it does not revoke a token server-side.

## Commands and results

| Command | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Passed (384 packages) |
| `npx tsc` before install | Failed. That invoked the unrelated `tsc` npm package, not the project compiler |
| `./node_modules/.bin/tsc --noEmit` | Passed |
| `node scripts/predictor-unit.mjs` | Passed, 7 checks, after JSON import attributes were added |
| `node --import ./scripts/register-test-hooks.mjs scripts/evidence-unit.mjs` | Passed, 6 checks |
| `node --import ./scripts/register-test-hooks.mjs scripts/api-validation.mjs` | Passed, 4 checks |
| `next lint` | Not completed. The repo had no ESLint config, so the command opened an interactive prompt |
| `eslint` on `src` with the new flat config | First run: 11 errors and 38 warnings, mostly pre-existing `any`. After the fixes in this branch, `eslint --quiet` passed |
| `next build` | First run failed on those lint errors. The last run passed. While generating pages it logged that admin reviews could not load because `DATABASE_URL` is unset. That is expected |
| `curl` of `/`, `/universities/neduet-karachi`, `/scholarships`, `/auth/login` on `next start` | Passed for the copy checks above. Login HTML does not include a Google button |
| `scripts/bootstrap-admin.mjs` | Not run |
| `scripts/record-verification.mjs --apply-db` | Not run |
| Database migrate or seed | Not run |
| Throwaway Postgres | Not started |

## Still unverified / credentials you need

- `OPENAI_API_KEY` or `GEMINI_API_KEY` for counselor answers.
- Google OAuth client id, secret and redirect URI.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` when you run the bootstrap script.
- `NEXT_PUBLIC_CONTACT_EMAIL` if you want a public mailbox. Otherwise the report form is the contact path.
- A new database password. The old one was in `src/lib/db.ts` and must be rotated.
- SZABIST pages, the Iqra site root, HEC profile pages, fee schedules and merit lists that timed out or were not opened.
- Every profile field that has no row in `data/research/verification_events.json`.

## Judgment calls

- A stored "verified" or "partial" profile value is hidden until a verification event exists for that field. That makes most older profiles look sparse. The figures are still in the JSON.
- The 60/40 weighted aggregate remains in the predictor code for tests. It is not described as an official formula, and it produces no chance label without a sourced closing aggregate.
- `university-query.ts` still uses `any` for the database row mapper. The ESLint rule is off for that file only, so the build can pass without rewriting the mapper.
- No browser click-through was done. HTML checks were `curl` against the local production server.

## Files changed

See `git diff --name-only origin/main` on this branch. New surfaces include `AUDIT.md`, `PROGRESS.md`, `CHANGES.md`, `src/lib/evidence.ts`, `data/research/verification_events.json`, `data/research/ratings.json`, `data/research/field_conflicts.json`, `data/research/merit_aggregates.json`, `db/migrations/005_evidence_provenance.sql`, `scripts/bootstrap-admin.mjs`, `scripts/record-verification.mjs`, and the about, privacy, report, dashboard and profile pages.
