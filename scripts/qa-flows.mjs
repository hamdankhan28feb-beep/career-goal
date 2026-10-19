// Responsive key-flow checks (menu lock, search clear, compare bar, counselor composer, tables). Usage: node scripts/qa-flows.mjs
import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:3000';
const b = await chromium.launch({ channel: 'chrome' });
let pass = 0, fail = 0;
const ok = (c, m, d = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${m}${d ? ' :: ' + d : ''}`); };
for (const [w, h] of [[375, 667], [768, 1024]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const pg = await ctx.newPage();
  // menu
  await pg.goto(BASE + '/', { waitUntil: 'networkidle' });
  await pg.click('button[aria-label="Toggle menu"]');
  const m = await pg.evaluate(() => { const el = document.querySelector('[data-testid=mobile-menu]'); const r = el.getBoundingClientRect(); return { lock: document.body.style.overflow, bottom: r.bottom, vh: innerHeight, oy: getComputedStyle(el).overflowY, exp: document.querySelector('button[aria-label="Toggle menu"]').getAttribute('aria-expanded') }; });
  ok(m.lock === 'hidden', `${w} menu locks body scroll`, m.lock);
  ok(m.bottom <= m.vh + 1 && m.oy === 'auto', `${w} menu fits viewport & scrolls`, JSON.stringify(m));
  ok(m.exp === 'true', `${w} menu aria-expanded`);
  await pg.keyboard.press('Escape');
  ok(await pg.evaluate(() => !document.querySelector('[data-testid=mobile-menu]') && document.body.style.overflow === ''), `${w} Escape closes menu & unlocks`);
  await pg.click('button[aria-label="Toggle menu"]');
  await Promise.all([pg.waitForURL('**/scholarships'), pg.click('[data-testid=mobile-menu] a[href="/scholarships"]')]);
  ok(await pg.evaluate(() => !document.querySelector('[data-testid=mobile-menu]') && document.body.style.overflow === ''), `${w} nav closes menu`);
  // search + clear
  await pg.goto(BASE + '/universities', { waitUntil: 'networkidle' });
  await pg.fill('input[aria-label="Search universities"]', 'zzzz-no-match');
  await pg.click('button[aria-label="Clear search"]');
  ok(await pg.inputValue('input[aria-label="Search universities"]') === '', `${w} search clear button`);
  // compare select + bar does not cover results
  await pg.goto(BASE + '/compare', { waitUntil: 'networkidle' });
  await pg.fill('#compare-search', 'Karachi');
  const cards = pg.locator('#compare-results button[aria-pressed]');
  await cards.nth(0).click(); await cards.nth(1).click();
  await pg.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await pg.waitForTimeout(300);
  const ov = await pg.evaluate(() => { const bar = document.querySelector('[data-testid=compare-bar]').getBoundingClientRect(); const items = [...document.querySelectorAll('#compare-results button[aria-pressed]')]; const last = items[items.length - 1].getBoundingClientRect(); return { barTop: bar.top, lastBottom: last.bottom }; });
  ok(ov.lastBottom <= ov.barTop + 1, `${w} compare bar not covering last result at page end`, JSON.stringify(ov));
  await pg.click('text=Compare Now');
  const t = await pg.evaluate(() => { const wrap = document.querySelector('[data-testid=compare-table-wrap]'); const c = wrap.querySelector('td'); return { ox: getComputedStyle(wrap).overflowX, bg: getComputedStyle(c).backgroundColor, pos: getComputedStyle(c).position }; });
  ok(t.pos === 'sticky' && !/rgba\(.*, 0\.[0-9]+\)/.test(t.bg), `${w} compare sticky column opaque`, JSON.stringify(t));
  // compare/fields parity
  await pg.goto(BASE + '/compare/fields', { waitUntil: 'networkidle' });
  const fb = pg.locator('main button').filter({ hasText: /Computer Science|Software/ });
  if (await fb.count() >= 2) { await fb.nth(0).click(); await fb.nth(1).click(); }
  const go = pg.locator('button', { hasText: /^Compare/ }).last();
  if (await go.isEnabled().catch(() => false)) await go.click();
  const f = await pg.evaluate(() => { const wrap = document.querySelector('[data-testid=compare-fields-table-wrap]'); if (!wrap) return null; const c = wrap.querySelector('td'), th = wrap.querySelector('th'); return { bg: getComputedStyle(c).backgroundColor, thPos: getComputedStyle(th).position, w: th.getBoundingClientRect().width }; });
  ok(f && f.thPos === 'sticky' && !/rgba\(.*, 0\.[0-9]+\)/.test(f.bg) && (w > 640 || f.w <= 120), `${w} compare/fields table sticky+opaque+narrow col`, JSON.stringify(f));
  // counselor composer
  await pg.goto(BASE + '/counselor', { waitUntil: 'networkidle' });
  const c = await pg.evaluate(() => { const f = document.querySelector('[data-testid=counselor-composer]'); const r = f.getBoundingClientRect(); const conv = document.querySelector('[data-testid=counselor-conversation]'); return { top: r.top, bottom: r.bottom, vh: innerHeight, pos: getComputedStyle(f).position, convMax: getComputedStyle(conv).maxHeight, wrap: getComputedStyle(conv).overflowWrap, hasInput: !!f.querySelector('input,textarea') }; });
  ok(c.hasInput && c.bottom <= c.vh + 1, `${w} counselor composer visible in viewport`, JSON.stringify(c));
  ok(c.wrap === 'anywhere' && c.convMax !== 'none', `${w} counselor long-URL wrapping + bounded chat`);
  // profile table scrolls instead of clipping
  await pg.goto(BASE + '/universities/fast-nuces-karachi', { waitUntil: 'networkidle' });
  const pt = await pg.evaluate(() => { const w = document.querySelector('[data-testid=programs-table-wrap],[data-testid=legacy-fee-table]'); return w ? getComputedStyle(w).overflowX : 'n/a'; });
  ok(pt === 'auto' || pt === 'n/a', `${w} profile table wrapper scrolls`, pt);
  // source drawer via shared Dialog
  const chip = pg.locator('button[aria-label*="ource"], button[title*="hecked"]').first();
  if (await chip.count()) {
    await chip.click();
    const d = await pg.evaluate(() => ({ open: !!document.querySelector('[role=dialog]'), lock: document.body.style.overflow }));
    ok(d.open && d.lock === 'hidden', `${w} source drawer opens + locks scroll`, JSON.stringify(d));
    await pg.keyboard.press('Escape');
    ok(await pg.evaluate(() => !document.querySelector('[role=dialog]') && document.body.style.overflow === ''), `${w} source drawer Escape closes`);
  } else ok(false, `${w} source chip found`);
  await ctx.close();
}
// desktop: Tools dropdown anchored within viewport at 1024
const ctx = await b.newContext({ viewport: { width: 1024, height: 800 }, colorScheme: 'dark' });
const pg = await ctx.newPage();
await pg.goto(BASE + '/', { waitUntil: 'networkidle' });
await pg.click('header nav button:has-text("Tools")');
const r = await pg.evaluate(() => { const a = document.querySelector('header nav a[href="/predictor"]').getBoundingClientRect(); const n = document.querySelector('header nav').getBoundingClientRect(); return { l: a.left, r: a.right, W: innerWidth, navRight: n.right, navH: n.height }; });
ok(r.l >= 0 && r.r <= r.W && r.navH < 60, '1024 Tools dropdown in viewport & nav on one line', JSON.stringify(r));
await b.close();
console.log(`SUMMARY ${pass} pass, ${fail} fail`);
