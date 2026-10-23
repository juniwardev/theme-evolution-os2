// T5a C5a.19 / Step 0 item 11: B_rb, render-blocking CSS transferred (compressed), fresh context, first resource entry per href (encodedBodySize);
// a 0-byte or missing entry falls back to curl --compressed size_download. Usage: node t5ac-brb.mjs <previewBase> <label>
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium, parseArgs, loginState, sleep } from './t5ac-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = [];
for (const p of ['/', '/products/the-3p-fulfilled-snowboard']) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(withTheme(p), { waitUntil: 'load' }); await sleep(2000);
  const r = await page.evaluate(() => {
    const hrefs = [...document.querySelectorAll('head link[rel=stylesheet]')].map((l) => l.href);
    const ent = performance.getEntriesByType('resource');
    return hrefs.map((h) => { const e = ent.find((x) => x.name === h); return { href: h, enc: e ? e.encodedBodySize : null, transfer: e ? e.transferSize : null }; });
  });
  const rows = r.map((x) => {
    let bytes = x.enc, how = 'resource-timing';
    if (!bytes) { try { bytes = Number(execFileSync('curl', ['-s', '--compressed', '-H', 'Accept-Encoding: gzip, deflate, br', '-o', '/dev/null', '-w', '%{size_download}', x.href.startsWith('//') ? 'https:' + x.href : x.href]).toString()); how = 'curl-fallback'; } catch { bytes = null; how = 'failed'; } }
    return { href: x.href.replace(/\?.*/, '').replace(/^https?:\/\/[^/]+/, ''), bytes, how };
  });
  const total = rows.reduce((s, x) => s + (x.bytes || 0), 0);
  out.push({ path: p, n: rows.length, total, valid: rows.every((x) => x.bytes), rows });
  console.log(p, 'B_rb', total, rows.map((x) => `${x.href.split('/').pop()}=${x.bytes}(${x.how})`).join(' '));
  await ctx.close();
}
writeFileSync(`docs/qa/evidence/t5ac-brb-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
