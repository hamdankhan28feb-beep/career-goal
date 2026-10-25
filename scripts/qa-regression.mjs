// FuturePath browser regression suite.
//
// Usage (dev server or `next start` must already be running):
//   node scripts/qa-regression.mjs            # all suites
//   node scripts/qa-regression.mjs nav quiz   # selected suites
// Env: QA_BASE (default http://127.0.0.1:3000), QA_HEADED=1 to watch.
// Requires the `playwright` package and a system Chrome (channel: 'chrome').
// Exits non-zero if any check FAILs.

import { chromium, devices } from 'playwright';

const BASE = process.env.QA_BASE || 'http://127.0.0.1:3000';
const NAV_TIMEOUT = 60000; // dev server compiles routes on first visit
const results = [];
const record = (status, name, detail = '') => {
  results.push({ status, name, detail });
  console.log(`${status.padEnd(5)} ${name}${detail ? ' :: ' + detail : ''}`);
};
const pass = (n, d) => record('PASS', n, d);
const fail = (n, d) => record('FAIL', n, d);
const check = (cond, n, d) => (cond ? pass(n, d) : fail(n, d));

async function expectEventually(fn, timeout = 10000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await fn().catch(() => false)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function gotoReady(page, path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 180000 });
}

// ── Homepage → Scholarship Finder ───────────────────────────────────────────
async function suiteNav(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await gotoReady(page, '/');
    const byRole = page.getByRole('link', { name: /Scholarship Finder/i });
    check((await byRole.count()) === 1, 'nav: exactly one "Scholarship Finder" link', `count=${await byRole.count()}`);
    const card = page.getByTestId('home-feature-scholarships');
    check((await card.getAttribute('href')) === '/scholarships', 'nav: feature card href is /scholarships');
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    const topHref = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return el && el.closest('a') ? el.closest('a').getAttribute('href') : null;
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    check(topHref === '/scholarships', 'nav: no overlay intercepts card centre', `topmost link href=${topHref}`);
    const t0 = Date.now();
    await card.click();
    let ok = true;
    try {
      await page.waitForURL((u) => new URL(u).pathname === '/scholarships', { timeout: NAV_TIMEOUT });
    } catch {
      ok = false;
    }
    check(ok, 'nav: clicking Scholarship Finder card navigates to /scholarships', `${page.url()} after ${Date.now() - t0}ms`);
    if (ok) {
      await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: NAV_TIMEOUT });
      check(/scholarship/i.test(await page.getByRole('heading', { level: 1 }).first().innerText()), 'nav: scholarships page heading rendered');
    }
  } finally {
    await page.close();
  }
}

// ── Career quiz ─────────────────────────────────────────────────────────────
const OPTION_LABELS = ['Not at all', 'A little', 'Somewhat', 'Quite a bit', 'Very much'];

async function runQuiz(page, pickIndex) {
  await gotoReady(page, '/quiz');
  const start = page.getByRole('button', { name: /Start Quiz/i });
  // Retry until hydrated: a click before hydration is silently ignored.
  for (let i = 0; i < 20; i++) {
    await start.click();
    if (await page.getByText(/Question 1 of 24/).isVisible().catch(() => false)) break;
    await page.waitForTimeout(500);
  }
  await page.getByText(/Question 1 of 24/).waitFor({ timeout: 15000 });
  for (let i = 0; i < 24; i++) {
    await page.getByText(new RegExp(`Question ${i + 1} of 24`)).waitFor({ timeout: 15000 });
    const label = OPTION_LABELS[pickIndex(i)];
    const opt = page.getByRole('button', { name: label, exact: true });
    await opt.click();
    await page.waitForFunction(
      (l) => document.querySelector(`button[aria-label="${l}"]`)?.getAttribute('aria-pressed') === 'true',
      label,
      { timeout: 5000 },
    );
    const next = page.getByRole('button', { name: i === 23 ? /See Results/ : /^Next/ });
    await next.click();
  }
  await page.getByRole('heading', { name: /Your Career Match Results/ }).waitFor({ timeout: 15000 });
  return page.locator('main').innerText();
}

async function suiteQuiz(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    for (const [name, pick] of [['flat-high (24x Very much)', () => 4], ['flat-low (24x Not at all)', () => 0]]) {
      try {
        const text = await runQuiz(page, pick);
        check(await page.getByTestId('quiz-flat-warning').isVisible(), `quiz ${name}: flat warning shown`);
        check((await page.getByTestId('quiz-result').count()) === 0, `quiz ${name}: no ranked fields shown`);
        check(!/%\s*match/i.test(text) && !/100\s*%/.test(text), `quiz ${name}: no "% match" / 100% claims`);
      } catch (e) {
        fail(`quiz ${name}`, e.message.split('\n')[0]);
      }
    }
    try {
      const text = await runQuiz(page, (i) => i % 5);
      const cards = page.getByTestId('quiz-result');
      const n = await cards.count();
      const bands = [];
      const names = [];
      for (let i = 0; i < n; i++) {
        bands.push(await cards.nth(i).getAttribute('data-band'));
        names.push((await cards.nth(i).locator('h2').innerText()).trim());
      }
      check(!(await page.getByTestId('quiz-flat-warning').count()), 'quiz varied: no flat warning');
      check(n === 5, 'quiz varied: 5 ranked fields', `n=${n}`);
      check(new Set(names).size === n, 'quiz varied: fields are distinct', names.join(', '));
      check(bands.every((b) => ['Strong', 'Good', 'Possible'].includes(b)), 'quiz varied: bands are Strong/Good/Possible', bands.join(', '));
      check(new Set(bands).size >= 2, 'quiz varied: results are differentiated (not all one band)', bands.join(', '));
      check(!/%\s*match/i.test(text) && !/100\s*%/.test(text), 'quiz varied: no "% match" / 100% claims');
    } catch (e) {
      fail('quiz varied', e.message.split('\n')[0]);
    }
  } finally {
    await page.close();
  }
}

// ── Admission predictor ─────────────────────────────────────────────────────
async function predictorCase(page, { matric, inter, budget = '' }) {
  await gotoReady(page, '/predictor');
  await page.getByLabel(/matric percentage/i).fill(matric);
  await page.getByLabel(/intermediate percentage/i).fill(inter);
  await page.getByLabel(/annual budget/i).fill(budget);
  await page.getByRole('button', { name: /Check sourced aggregates/i }).click();
  await page.waitForTimeout(300);
  const rows = page.getByTestId('predictor-row');
  const count = async (badge) => rows.filter({ hasText: badge }).count();
  return {
    resultsVisible: await page.getByTestId('predictor-results').isVisible().catch(() => false),
    emptyVisible: await page.getByTestId('predictor-empty').isVisible().catch(() => false),
    aggregate: (await page.getByTestId('predictor-aggregate').innerText().catch(() => '')).match(/Aggregate:\s*([\d.]+)%/)?.[1] ?? null,
    alerts: (await page.getByRole('alert').allInnerTexts()).filter((t) => t.trim()),
    rows: await rows.count(),
    high: await count('High Chance'),
    medium: await count('Medium Chance'),
    low: await count('Low Chance'),
    none: await count('No benchmark'),
    text: await page.locator('main').innerText(),
  };
}

async function suitePredictor(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    let r = await predictorCase(page, { matric: '85', inter: '80' });
    check(r.resultsVisible && r.rows > 0, 'predictor valid 85/80: results rendered', `rows=${r.rows}`);
    check(r.alerts.length === 0, 'predictor valid: no validation errors', r.alerts.join(' | '));
    check(/insufficient verified data/i.test(r.text), 'predictor valid: no sourced aggregate, so insufficient verified data');
    check(/not an official cutoff/i.test(r.text), 'predictor copy: disclaims official cutoffs');
    check(!/guaranteed admission|100% chance|AI-powered merit/i.test(r.text), 'predictor copy: no guaranteed/AI-merit claims');
    check(r.high === 0 && r.medium === 0 && r.low === 0, 'predictor valid: no High/Medium/Low without a sourced aggregate');

    r = await predictorCase(page, { matric: '0', inter: '0' });
    check(r.resultsVisible && r.rows > 0, 'predictor boundary 0/0: accepted', `rows=${r.rows}`);
    check(r.high === 0 && r.medium === 0 && r.low === 0, 'predictor boundary 0/0: no chance labels');

    r = await predictorCase(page, { matric: '100', inter: '100' });
    check(r.resultsVisible && r.rows > 0, 'predictor boundary 100/100: accepted', `rows=${r.rows}`);
    check(r.low === 0 && r.high === 0, 'predictor boundary 100/100: no Low or High without a sourced aggregate');

    r = await predictorCase(page, { matric: '99.9', inter: '0.1' });
    check(r.resultsVisible && r.alerts.length === 0, 'predictor decimals 99.9/0.1: accepted', r.alerts.join(' | '));

    r = await predictorCase(page, { matric: '85', inter: '' });
    check(!r.resultsVisible && r.alerts.some((a) => /Intermediate percentage is required/.test(a)), 'predictor missing inter: blocked with message', r.alerts.join(' | '));
    r = await predictorCase(page, { matric: '', inter: '' });
    check(!r.resultsVisible && r.alerts.length === 2, 'predictor missing both: two required messages', r.alerts.join(' | '));

    for (const [label, matric, re] of [
      ['letters', 'abc', /must be a number/],
      ['negative', '-5', /cannot be negative/],
      ['over 100', '101', /cannot be more than 100/],
      ['way over 100', '150', /cannot be more than 100/],
    ]) {
      r = await predictorCase(page, { matric, inter: '80' });
      check(!r.resultsVisible && r.alerts.some((a) => re.test(a)), `predictor invalid ${label} (${matric}): blocked with message`, r.alerts.join(' | ') || `results=${r.resultsVisible}`);
    }
    r = await predictorCase(page, { matric: '85', inter: '80', budget: 'abc' });
    check(!r.resultsVisible && r.alerts.some((a) => /Budget/.test(a)), 'predictor invalid budget: blocked with message', r.alerts.join(' | '));
  } finally {
    await page.close();
  }
}

// ── Universities search, compare, scholarship filters ───────────────────────
async function suitePages(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await gotoReady(page, '/universities');
    const showing = async () => Number((await page.getByText(/^Showing \d+ universities/).first().innerText()).match(/\d+/)[0]);
    const before = await showing();
    await page.getByPlaceholder('Search universities...').fill('FAST');
    await expectEventually(async () => (await showing()) < before);
    const after = await showing();
    const cardsText = await page.locator('main').innerText();
    check(after > 0 && after < before && /FAST/.test(cardsText), 'universities: search FAST filters to FAST', `showing before=${before} after=${after}`);

    await gotoReady(page, '/compare');
    check(await page.getByRole('heading', { name: 'Compare Universities' }).isVisible(), 'compare: page heading');
    const search = page.getByPlaceholder('Search universities...');
    const uniButtons = page.locator('main button').filter({ has: page.locator('div.truncate') });
    await search.fill('FAST');
    await page.waitForTimeout(500);
    await uniButtons.first().click();
    await search.fill('NED');
    await page.waitForTimeout(500);
    await uniButtons.first().click();
    await page.getByRole('button', { name: /Compare Now/ }).click();
    await page.getByRole('heading', { name: 'Side-by-Side Comparison' }).waitFor({ timeout: 10000 });
    const cols = await page.locator('table thead th').count();
    check(cols === 3, 'compare: FAST vs NED table renders', `header cells=${cols}`);

    await gotoReady(page, '/scholarships');
    const select = page.locator('select').filter({ has: page.locator('option[value="closed"]') });
    await page.waitForFunction(() => {
      const s = [...document.querySelectorAll('select')].find((x) => x.querySelector('option[value="closed"]'));
      if (!s) return false;
      return [...s.options].some((o) => /\((?:[1-9]\d*)\)/.test(o.text));
    }, null, { timeout: 30000 }).catch(() => {});
    const opts = await select.locator('option').allInnerTexts();
    const n = (re) => Number((opts.find((o) => re.test(o)) || '').match(/\((\d+)\)/)?.[1] ?? NaN);
    const counts = { open: n(/^Open/), upcoming: n(/^Upcoming/), unknown: n(/^Unknown/), closed: n(/^Closed/) };
    check(counts.open === 0 && counts.upcoming === 0, 'scholarships: Open and Upcoming counts are 0', opts.join(' | '));
    check(counts.unknown + counts.closed > 0, 'scholarships: Unknown/Closed counts populated', JSON.stringify(counts));
    const badgeCounts = () => page.evaluate(() => {
      const c = { Open: 0, Upcoming: 0, Unknown: 0, Closed: 0 };
      // StatusBadge renders <span title="...">{icon}{label}</span>
      document.querySelectorAll('main span[title]').forEach((el) => {
        const t = el.textContent.trim();
        if (t in c) c[t]++;
      });
      return c;
    });
    for (const status of ['open', 'upcoming', 'unknown', 'closed']) {
      await select.selectOption(status);
      await page.waitForTimeout(400);
      const b = await badgeCounts();
      const label = status[0].toUpperCase() + status.slice(1);
      const others = Object.entries(b).filter(([k]) => k !== label).reduce((a, [, v]) => a + v, 0);
      check(others === 0 && b[label] === counts[status], `scholarships: filter ${label} shows only ${label} badges`, JSON.stringify(b));
    }
  } finally {
    await page.close();
  }
}

// ── Mobile (iPhone 12) ──────────────────────────────────────────────────────
async function suiteMobile(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'] });
  const page = await ctx.newPage();
  try {
    for (const path of ['/', '/scholarships', '/universities', '/quiz', '/predictor', '/compare']) {
      await gotoReady(page, path);
      // innerWidth itself grows when content overflows on mobile, so compare to the device width.
      const dw = page.viewportSize().width;
      const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      check(sw <= dw + 1 && iw <= dw + 1, `mobile ${path}: no horizontal overflow`, `scrollWidth=${sw} innerWidth=${iw} device=${dw}`);
    }
    await gotoReady(page, '/');
    const card = page.getByTestId('home-feature-scholarships');
    await card.scrollIntoViewIfNeeded();
    await card.tap();
    let ok = true;
    try { await page.waitForURL((u) => new URL(u).pathname === '/scholarships', { timeout: NAV_TIMEOUT }); } catch { ok = false; }
    check(ok, 'mobile: tapping Scholarship Finder card navigates', page.url());
    await gotoReady(page, '/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.getByTestId('mobile-menu').getByRole('link', { name: 'Scholarships', exact: true }).click();
    ok = true;
    try { await page.waitForURL((u) => new URL(u).pathname === '/scholarships', { timeout: NAV_TIMEOUT }); } catch { ok = false; }
    check(ok, 'mobile: menu → Scholarships navigates', page.url());
  } finally {
    await ctx.close();
  }
}

// ── HTTP status: unknown routes are real 404s, known slugs stay 200 ────────
const KNOWN_UNIVERSITY_SLUGS = [
  'fast-nuces-karachi',
  'karachi-institute-of-economics-technology',
  'shu',
  'sindh-madresatul-islam-university',
  'iobm-karachi',
];

async function httpStatus(path) {
  const res = await fetch(BASE + path, { redirect: 'manual' });
  return res.status;
}

async function suiteStatus() {
  const missing = [
    ['/universities/this-does-not-exist', 'unknown university slug'],
    ['/universities/this-does-not-exist/reviews', 'unknown university reviews'],
    ['/fields/this-field-does-not-exist', 'unknown field slug'],
    ['/this-route-does-not-exist', 'unknown route'],
  ];
  for (const [path, label] of missing) {
    const status = await httpStatus(path);
    check(status === 404, `status ${label} is 404`, `${path} -> ${status}`);
  }
  for (const slug of KNOWN_UNIVERSITY_SLUGS) {
    const status = await httpStatus(`/universities/${slug}`);
    check(status === 200, `status known university ${slug} is 200`, String(status));
  }
  const home = await httpStatus('/');
  check(home === 200, 'status home is 200', String(home));
}

const SUITES = { nav: suiteNav, quiz: suiteQuiz, predictor: suitePredictor, pages: suitePages, mobile: suiteMobile, status: suiteStatus };
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SUITES);

const browser = await chromium.launch({ headless: !process.env.QA_HEADED, channel: process.env.QA_CHANNEL || 'chrome' });
try {
  for (const name of wanted) {
    if (!SUITES[name]) { fail(`unknown suite ${name}`); continue; }
    console.log(`\n== ${name} ==`);
    try { await SUITES[name](browser); } catch (e) { fail(`suite ${name} crashed`, e.message.split('\n')[0]); }
  }
} finally {
  await browser.close();
}
const summary = results.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
console.log('\nSUMMARY', JSON.stringify(summary));
process.exit(results.some((r) => r.status === 'FAIL') ? 1 : 0);
