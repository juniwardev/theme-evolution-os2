// T3 Coder: Step 0 facts. styles.css size and selectors (items 2), label natural widths (item 11), preload Link headers, r1.
// Usage: node t3c-facts.mjs <previewBase>
import { parseArgs, openBrowser, PAGES, scrollThrough } from './t3c-lib.mjs';
import { gzipSync } from 'node:zlib';

const { withTheme } = parseArgs();
const { browser, state } = await openBrowser(withTheme);
const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
for (const key of ['home', 'p3p']) {
  const links = [];
  page.on('response', (r) => { if (r.url().includes('compiled_assets/styles.css')) links.push(r); });
  const resp = await page.goto(withTheme(PAGES[key]), { waitUntil: 'load' });
  const hdrs = resp.headers();
  const linkHdr = hdrs.link || '';
  const preloads = linkHdr.split(',').filter((x) => /rel="?preload/.test(x)).length;
  const css = await page.evaluate(async () => {
    const l = document.querySelector('link[href*="compiled_assets/styles.css"]');
    if (!l) return null;
    const t = await (await fetch(l.href)).text();
    return t;
  });
  if (css) console.log(key, 'styles.css bytes', Buffer.byteLength(css), 'gzip', gzipSync(css).length, 'has .welcome', /\.welcome/.test(css), '.text', /\.text[,{ ]/.test(css), '.group:is(', css.includes('.group:is('), 'theme-banner-ambient', css.includes('theme-banner-ambient'));
  else console.log(key, 'no styles.css link');
  console.log(key, 'preload Link headers', preloads);
  page.removeAllListeners('response');
}
// item 11: natural widths
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(withTheme('/'), { waitUntil: 'load' });
const w = await page.evaluate(() => {
  const out = {};
  for (const label of ['Shop all', 'Button label', 'Shop now']) for (const cls of ['btn-primary', 'btn-secondary']) {
    const a = document.createElement('a'); a.className = cls; a.textContent = label; a.style.whiteSpace = 'nowrap'; a.style.position = 'absolute'; a.style.left = '0'; a.style.top = '0';
    document.body.appendChild(a); out[`${label}|${cls}`] = Math.round(a.getBoundingClientRect().width * 10) / 10; a.remove();
  }
  return out;
});
console.log('label natural widths', JSON.stringify(w));
await browser.close();
