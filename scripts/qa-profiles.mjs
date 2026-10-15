// Batch 1+2 profile page QA: desktop + iPhone 12, system Chrome. Usage: node scripts/qa-profiles.mjs
// Needs a running server (QA_BASE, default http://127.0.0.1:3000). Screenshots -> qa-profile-shots/ (gitignored).
import { chromium, devices } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.QA_BASE || 'http://127.0.0.1:3000';
const OUT = 'qa-profile-shots';
const SLUGS = ['fast-nuces-karachi', 'neduet-karachi', 'iba-karachi', 'habib-university', 'dha-suffa-university', 'iqra-university',
  'szabist-karachi', 'bahria-karachi', 'uok-karachi', 'ssuet-karachi', 'maju-karachi', 'duet-karachi'];
const SECTIONS = ['profile-overview', 'profile-programs', 'profile-admissions', 'profile-fees', 'profile-scholarships', 'profile-facilities', 'profile-sources'];
fs.mkdirSync(OUT, { recursive: true });

const results = [];
let fail = 0;
const check = (name, ok, detail = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' - ' + detail : ''}`);
  if (!ok) fail += 1;
};

const browser = await chromium.launch({ channel: process.env.QA_CHANNEL || 'chrome' });
try {
  // API: profiles present for all batch 1+2 universities
  const ctxApi = await browser.newContext();
  const api = await (await ctxApi.request.get(`${BASE}/api/universities`)).json();
  for (const slug of SLUGS) {
    const u = api.universities.find((x) => x.slug === slug);
    check(`api profile ${slug}`, !!u?.profile?.sections, u?.profile ? `${u.profile.profile_status}, ${u.profile.field_counts.sourced} sourced` : 'missing');
  }
  await ctxApi.close();

  for (const [label, opts] of [
    ['desktop', { viewport: { width: 1366, height: 900 } }],
    ['iphone12', { ...devices['iPhone 12'] }],
  ]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    for (const slug of SLUGS) {
      const resp = await page.goto(`${BASE}/universities/${slug}`, { waitUntil: 'networkidle', timeout: 120000 });
      check(`${label} ${slug} status`, resp?.status() === 200, String(resp?.status()));
      await page.waitForSelector('[data-testid="university-profile"]', { timeout: 30000 });
      const missing = [];
      for (const id of SECTIONS) if (!(await page.locator(`#${id}`).count())) missing.push(id);
      check(`${label} ${slug} sections`, missing.length === 0, missing.join(',') || '7/7');
      const badges = await page.locator('[data-testid="profile-field-status"]').count();
      check(`${label} ${slug} field badges`, badges > 10, String(badges));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`${label} ${slug} no horizontal overflow`, overflow <= 1, `${overflow}px`);
      const chip = page.locator('#profile-fees button[title]').first();
      if (await chip.count()) {
        await chip.scrollIntoViewIfNeeded();
        await chip.click();
        const dlg = page.getByRole('dialog');
        const opened = await dlg.isVisible();
        const href = opened ? await dlg.locator('a').first().getAttribute('href') : null;
        check(`${label} ${slug} source drawer`, opened && !!href, href || '');
        await page.keyboard.press('Escape');
      }
      const shot = `${OUT}/${slug}-${label}.png`;
      await page.screenshot({ path: shot, fullPage: true });
      results.push(`     screenshot ${shot}`);
    }
    // search uses profile data: "Telecommunication" only appears in Iqra profile programmes
    await page.goto(`${BASE}/universities`, { waitUntil: 'networkidle' });
    await page.getByPlaceholder(/search/i).first().fill('Telecommunication');
    await page.waitForTimeout(500);
    const iqraHit = await page.locator('a[href="/universities/iqra-university"]').count();
    check(`${label} search by profile programme (Telecommunication -> Iqra)`, iqraHit > 0, String(iqraHit));
    // batch 2 search: 'Autonomous Systems' only appears in SZABIST profile programmes
    await page.getByPlaceholder(/search/i).first().fill('Autonomous Systems');
    await page.waitForTimeout(500);
    const szHit = await page.locator('a[href="/universities/szabist-karachi"]').count();
    check(`${label} search by profile programme (Autonomous Systems -> SZABIST)`, szHit > 0, String(szHit));
    await ctx.close();
  }

  // compare shows profile rows
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/compare`, { waitUntil: 'networkidle' });
  for (const name of ['FAST-NUCES Karachi', 'IBA', 'Habib']) {
    // compare is search-first: type to reveal matching universities
    await page.getByPlaceholder('Search universities...').fill(name);
    await page.waitForTimeout(400);
    const btn = page.locator('button', { hasText: name }).first();
    if (await btn.count()) await btn.click();
  }
  const cmp = page.getByRole('button', { name: /compare now/i }).first();
  if (await cmp.count()) await cmp.click();
  await page.waitForTimeout(1000);
  const body = await page.locator('body').innerText();
  check('compare shows Detailed Profile row', body.includes('Detailed Profile'));
  check('compare shows sourced tuition', /12,000 per credit hour|31,500 per credit hour|780,000/.test(body));
  await page.screenshot({ path: `${OUT}/compare-desktop.png`, fullPage: true });
  results.push(`     screenshot ${OUT}/compare-desktop.png`);
  await ctx.close();
} finally {
  await browser.close();
}
console.log(results.join('\n'));
console.log(`\n${fail ? 'FAILED' : 'ALL PASS'} (${results.filter((r) => r.startsWith('PASS')).length} pass, ${fail} fail)`);
process.exit(fail ? 1 : 0);
