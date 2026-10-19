// Responsive viewport QA: overflow, clipped content, tap targets across widths/pages.
// Usage: node scripts/qa-viewports.mjs <tag> [--shots]
// Note: logo-slider marquee rows ([data-logo-row]) clip their track by design; page overflow is still checked for them.
import { chromium } from 'playwright';
import fs from 'node:fs';
const TAG = process.argv[2] || 'run', SHOTS = process.argv.includes('--shots');
const BASE = 'http://127.0.0.1:3000', OUT = 'qa-viewports';
fs.mkdirSync(OUT, { recursive: true });
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1440, 1920];
const PAGES = [
  ['home', '/'], ['universities', '/universities'], ['slug', '/universities/fast-nuces-karachi'],
  ['slug-b3', '/universities/shu'], ['reviews', '/universities/fast-nuces-karachi/reviews'],
  ['compare', '/compare?u=fast-nuces-karachi,neduet-karachi,shu'], ['compare-fields', '/compare/fields'],
  ['fields', '/fields'], ['field', '/fields/computer-science'], ['quiz', '/quiz'], ['predictor', '/predictor'],
  ['scholarships', '/scholarships'], ['counselor', '/counselor'], ['login', '/auth/login'], ['signup', '/auth/signup'], ['admin', '/admin'],
];
const SHOT_PAGES = ['home', 'slug', 'compare', 'scholarships', 'counselor'], SHOT_W = [375, 768, 1440];
const b = await chromium.launch({ channel: 'chrome' });
let fails = 0; const rows = [];
for (const w of WIDTHS) {
  const mobile = w < 768;
  const ctx = await b.newContext({ viewport: { width: w, height: mobile ? 800 : 900 }, isMobile: mobile, hasTouch: mobile, colorScheme: 'dark', deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  for (const [n, u] of PAGES) {
    let status = 0;
    try { const r = await pg.goto(BASE + u, { waitUntil: 'networkidle', timeout: 120000 }); status = r ? r.status() : 0; } catch (e) { status = -1; }
    await pg.waitForTimeout(600);
    const info = await pg.evaluate((mobile) => {
      const W = innerWidth, overflow = [], clipped = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect(); if (!r.width) continue;
        const s = getComputedStyle(el);
        if (r.right > W + 1 && s.position !== 'fixed') {
          let a = el.parentElement, clip = false;
          while (a && a !== document.body) { if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(a).overflowX)) { clip = true; break; } a = a.parentElement; }
          if (!clip) overflow.push(el.tagName + '.' + String(el.className).slice(0, 50));
        }
        if (/(hidden|clip)/.test(s.overflowX) && s.textOverflow !== 'ellipsis' && !/sr-only|line-clamp|truncate/.test(String(el.className)) && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && el.children.length + (el.textContent||'').trim().length > 0 && !el.matches('svg,svg *,img') && !el.matches('[data-logo-row]'))
          clipped.push(el.tagName + '.' + String(el.className).slice(0, 50) + ` ${el.clientWidth}<${el.scrollWidth}`);
      }
      const taps = mobile ? [...document.querySelectorAll('a,button,select,input:not([type=hidden]),textarea,[role=button]')].filter(e => {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false;
        if (e.closest('footer') || getComputedStyle(e).display === 'inline' || getComputedStyle(e).visibility === 'hidden') return false;
        if (e.type === 'checkbox' || e.type === 'radio') return false;
        return r.height < 40 || r.width < 24;
      }).map(e => e.tagName + ':' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 18) + ':' + Math.round(e.getBoundingClientRect().height)) : [];
      return { sw: document.documentElement.scrollWidth, W, overflow: overflow.slice(0, 5), nOverflow: overflow.length, clipped: clipped.slice(0, 5), nClipped: clipped.length, taps: taps.slice(0, 5), nTaps: taps.length };
    }, mobile);
    const bad = status >= 400 && n !== 'admin' || status < 0 || info.sw > info.W + 1 || info.nOverflow || info.nClipped || info.nTaps;
    if (bad) fails++;
    rows.push({ w, n, status, ...info });
    console.log(`${bad ? 'FAIL' : 'PASS'} ${w} ${n} status=${status} url=${new URL(pg.url()).pathname} sw=${info.sw} overflow=${info.nOverflow} clipped=${info.nClipped} smallTaps=${info.nTaps}` + (bad ? ' ' + JSON.stringify({ o: info.overflow, c: info.clipped, t: info.taps }) : ''));
    if (SHOTS && SHOT_PAGES.includes(n) && SHOT_W.includes(w)) await pg.screenshot({ path: `${OUT}/${n}-${w}-${TAG}.png`, fullPage: false });
  }
  await ctx.close();
}
await b.close();
fs.writeFileSync(`${OUT}/results-${TAG}.json`, JSON.stringify(rows, null, 1));
console.log(`SUMMARY ${rows.length - fails} pass, ${fails} fail (${rows.length} checks)`);
