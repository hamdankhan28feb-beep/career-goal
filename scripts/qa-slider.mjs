// University logo slider QA. Usage: node scripts/qa-slider.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = 'http://127.0.0.1:3000', OUT = 'qa-viewports/slider'; fs.mkdirSync(OUT, { recursive: true });
const src = fs.readFileSync('src/data/university-logos.ts', 'utf8');
const EXPECTED = (src.match(/slug: "/g) || []).length;
const b = await chromium.launch({ channel: 'chrome' });
let pass = 0, fail = 0;
const ok = (c, m, d = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${m}${d ? ' :: ' + d : ''}`); };
async function loadAll(pg) {
  await pg.locator('[data-testid=university-logo-slider]').scrollIntoViewIfNeeded();
  await pg.evaluate(() => document.querySelectorAll('[data-testid=university-logo-slider] img').forEach((i) => { i.loading = 'eager'; }));
  await pg.waitForFunction(() => [...document.querySelectorAll('[data-testid=university-logo-slider] img')].filter((i) => getComputedStyle(i).display !== 'none' && i.offsetParent).every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
}
for (const w of [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
  const mobile = w < 768;
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: mobile, hasTouch: mobile, colorScheme: 'dark' });
  const pg = await ctx.newPage();
  await pg.goto(BASE + '/', { waitUntil: 'networkidle' });
  await loadAll(pg);
  const r = await pg.evaluate(async (EXPECTED) => {
    const s = document.querySelector('[data-testid=university-logo-slider]');
    const rows = [...s.querySelectorAll('[data-logo-row]')];
    const primary = [...s.querySelectorAll('[data-logo-link]')];
    const dups = [...s.querySelectorAll('[data-logo-copy=duplicate]')];
    const tx = (el) => new DOMMatrix(getComputedStyle(el).transform).m41;
    const tracks = rows.map((r) => r.querySelector('[data-logo-track]'));
    const t0 = tracks.map(tx); await new Promise((r) => setTimeout(r, 700)); const t1 = tracks.map(tx);
    const imgs = [...s.querySelectorAll('[data-logo-copy=primary] img')];
    const ratios = imgs.map((i) => { const bw = i.clientWidth, bh = i.clientHeight, nat = i.naturalWidth / i.naturalHeight, box = bw / bh; const maxW = parseFloat(getComputedStyle(i).maxWidth); const clamped = Math.abs(bw - maxW) < 1; return { a: i.alt, nat, box, clamped, fit: getComputedStyle(i).objectFit, h: bh, okR: Math.abs(box / nat - 1) <= 0.02 || (clamped && getComputedStyle(i).objectFit === 'contain') }; });
    const tabbable = [...s.querySelectorAll('a')].filter((a) => a.tabIndex >= 0 && !a.closest('[aria-hidden=true]'));
    return {
      sw: document.documentElement.scrollWidth, W: innerWidth, rows: rows.length,
      perRow: rows.map((r) => r.querySelectorAll('[data-logo-copy=primary] li').length),
      primary: primary.length, dupHidden: dups.every((d) => d.getAttribute('aria-hidden') === 'true') && [...s.querySelectorAll('[data-logo-copy=duplicate] a')].every((a) => a.tabIndex === -1 && !a.getAttribute('aria-label')),
      dupImgAlt: [...s.querySelectorAll('[data-logo-copy=duplicate] img')].every((i) => i.alt === ''),
      anim: tracks.map((t) => getComputedStyle(t).animationName), d: tracks.map((t, i) => t1[i] - t0[i]),
      count: s.querySelector('[data-testid=logo-count]').textContent.trim(), heading: s.querySelector('h2').textContent.trim(),
      altsOk: imgs.every((i) => /\S+ logo$/.test(i.alt)), ratios, tabbable: tabbable.length,
      half: tracks.map((t) => { const u = t.querySelectorAll('ul'); return Math.abs(u[0].getBoundingClientRect().width - u[1].getBoundingClientRect().width) < 0.5; }),
      forbidden: /official|partner|endorsed by|needs.review/i.test(s.textContent),
      footer: !!document.querySelector('[data-testid=trademark-notice]'),
      afterHero: s.previousElementSibling?.querySelector('section') !== null && s.nextElementSibling?.querySelector('section')?.textContent.includes('What We Offer'),
    };
  }, EXPECTED);
  const expH = w <= 640 ? 36 : 48;
  ok(r.sw === r.W, `${w} no page overflow`, `${r.sw}/${r.W}`);
  ok(r.rows === 2 && r.primary === EXPECTED && r.perRow[0] + r.perRow[1] === EXPECTED, `${w} two rows, ${EXPECTED} logos`, JSON.stringify(r.perRow));
  ok(r.dupHidden && r.dupImgAlt && r.tabbable === EXPECTED + 1, `${w} duplicates aria-hidden/unfocusable; tab stops = logos + View all`, `tabbable=${r.tabbable}`);
  ok(r.anim[0] === 'marquee-left' && r.anim[1] === 'marquee-right' && r.d[0] < 0 && r.d[1] > 0, `${w} opposite directions (top R→L, bottom L→R)`, JSON.stringify({ anim: r.anim, d: r.d.map((x) => x.toFixed(1)) }));
  ok(r.half.every(Boolean), `${w} copies equal width (seamless -50% loop)`);
  ok(r.count === `${EXPECTED} universities · Karachi` && r.heading === 'Explore Universities on FuturePath', `${w} count label from data + heading`, r.count);
  ok(r.altsOk, `${w} all logo images have alt`);
  const bad = r.ratios.filter((x) => !x.okR), clamped = r.ratios.filter((x) => x.clamped).map((x) => x.a.replace(' logo', ''));
  ok(bad.length === 0, `${w} aspect ratios preserved (±2%, or contain when width-capped)`, bad.length ? JSON.stringify(bad) : `capped+contain: ${clamped.join(', ') || 'none'}`);
  ok(r.ratios.every((x) => Math.abs(x.h - expH) <= 1), `${w} logo height ${expH}px`, [...new Set(r.ratios.map((x) => x.h))].join(','));
  ok(!r.forbidden && r.footer && r.afterHero, `${w} no official/partner/needs-review wording; footer notice; placed after hero`);
  if ([375, 768, 1440].includes(w)) await pg.locator('[data-testid=university-logo-slider]').screenshot({ path: `${OUT}/slider-${w}.png`, animations: 'disabled' });
  // hover pauses
  if (!mobile) {
    await pg.hover('[data-logo-row=left]');
    ok(await pg.evaluate(() => getComputedStyle(document.querySelector('[data-logo-row=left] [data-logo-track]')).animationPlayState) === 'paused', `${w} hover pauses row`);
  }
  await ctx.close();
}
// keyboard: focus pauses + ring visible
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const pg = await ctx.newPage();
  await pg.goto(BASE + '/', { waitUntil: 'networkidle' });
  // real keyboard navigation so :focus-visible applies
  await pg.focus('[data-testid=university-logo-slider] a[href="/universities"]');
  let tabs = 0, onLogo = false;
  while (tabs++ < 5 && !onLogo) { await pg.keyboard.press('Tab'); onLogo = await pg.evaluate(() => !!document.activeElement?.dataset?.logoLink); }
  await pg.waitForTimeout(250);
  const f = await pg.evaluate(() => { const a = document.activeElement; return { slug: a.dataset.logoLink, paused: getComputedStyle(a.closest('[data-logo-track]')).animationPlayState, ring: getComputedStyle(a).boxShadow }; });
  ok(onLogo && f.paused === 'paused' && /rgb\(34, 211, 238\)|rgba\(34, 211, 238/.test(f.ring), '1440 keyboard Tab focus pauses row + cyan focus ring visible', JSON.stringify(f));
  // Tab order skips duplicates: tabbing through all real links leaves the slider
  for (let i = 1; i < EXPECTED; i++) await pg.keyboard.press('Tab');
  const seq = await pg.evaluate(() => ({ inDup: !!document.activeElement.closest('[aria-hidden=true]'), isLogo: !!document.activeElement.dataset.logoLink }));
  await pg.keyboard.press('Tab');
  const out = await pg.evaluate(() => !document.activeElement.closest('[data-testid=university-logo-slider]'));
  ok(!seq.inDup && seq.isLogo && out, `Tab visits exactly ${EXPECTED} logo links then leaves the slider`, JSON.stringify({ ...seq, out }));
  // light theme legibility (band is self-contained dark)
  await pg.evaluate(() => { document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light'); });
  const lt = await pg.evaluate(() => { const s = document.querySelector('[data-testid=university-logo-slider]'); return { h: getComputedStyle(s.querySelector('h2')).color, bg: getComputedStyle(s).backgroundImage.slice(0, 40) }; });
  ok(/rgb\(2[45]\d, 2[45]\d, 2[45]\d\)/.test(lt.h) && lt.bg.includes('gradient'), 'light theme: heading stays light on navy band', JSON.stringify(lt));
  await ctx.close();
}
// reduced motion
for (const w of [375, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce', isMobile: w < 768, hasTouch: w < 768 });
  const pg = await ctx.newPage();
  await pg.goto(BASE + '/', { waitUntil: 'networkidle' });
  await loadAll(pg);
  const r = await pg.evaluate(() => { const rows = [...document.querySelectorAll('[data-logo-row]')]; return rows.map((row) => ({ anim: getComputedStyle(row.querySelector('[data-logo-track]')).animationName, ox: getComputedStyle(row).overflowX, snap: getComputedStyle(row).scrollSnapType, dup: getComputedStyle(row.querySelector('[data-logo-copy=duplicate]')).display, scrollable: row.scrollWidth > row.clientWidth })); });
  ok(r.every((x) => x.anim === 'none' && x.ox === 'auto' && x.dup === 'none' && /x/.test(x.snap)), `${w} reduced-motion: no animation, scroll-snap, duplicates hidden`, JSON.stringify(r));
  ok(r.every((x) => x.scrollable) || w >= 1440, `${w} reduced-motion rows scrollable`, JSON.stringify(r.map((x) => x.scrollable)));
  if (w === 375) { const before = await pg.evaluate(() => document.querySelector('[data-logo-row]').scrollLeft); await pg.evaluate(() => document.querySelector('[data-logo-row]').scrollBy(400, 0)); await pg.waitForTimeout(400); const after = await pg.evaluate(() => document.querySelector('[data-logo-row]').scrollLeft); ok(after > before, '375 reduced-motion row actually scrolls', `${before}->${after}`); }
  if (w === 375) await pg.locator('[data-testid=university-logo-slider]').screenshot({ path: `${OUT}/slider-375-reduced-motion.png` });
  await ctx.close();
}
// every logo link 200 and image file served
{
  const ctx = await b.newContext(); const pg = await ctx.newPage();
  await pg.goto(BASE + '/', { waitUntil: 'networkidle' });
  const links = await pg.$$eval('[data-logo-link]', (as) => as.map((a) => a.getAttribute('href')));
  const srcs = [...src.matchAll(/src: "([^"]+)"/g)].map((m) => m[1]);
  const bad = [];
  for (const h of links) { const res = await pg.request.get(BASE + h); if (res.status() !== 200 || !(await res.text()).includes('<h1')) bad.push(`${h}:${res.status()}`); }
  ok(links.length === EXPECTED && bad.length === 0, `all ${links.length} logo links return 200`, bad.join(' '));
  const badImg = [];
  for (const s of srcs) { const res = await pg.request.get(BASE + s); if (res.status() !== 200) badImg.push(`${s}:${res.status()}`); }
  ok(badImg.length === 0, `all ${srcs.length} logo files served`, badImg.join(' '));
  await ctx.close();
}
await b.close();
console.log(`SUMMARY ${pass} pass, ${fail} fail`);
