// T3 Coder: dump (plan section 10 measurement protocol). Output: <outDir>/<label>-<page>-<w>.json
// Usage: node t3c-dump.mjs <previewBase> <label> <outDir> [pagesCsv=home,land] [widthsCsv=375,1440] [shots=1]
import { writeFileSync, mkdirSync } from 'node:fs';
import { parseArgs, openBrowser, PAGES, measureFn, overflowFn, scrollThrough } from './t3c-lib.mjs';

const [, label, outDir, pagesArg, widthsArg, shotsArg] = process.argv.slice(2);
const { withTheme } = parseArgs();
mkdirSync(outDir, { recursive: true });
const pages = (pagesArg || 'home,land').split(',');
const widths = (widthsArg || '375,1440').split(',').map(Number);
const SHOTS = 'docs/qa/screenshots';
mkdirSync(SHOTS, { recursive: true });
const { browser, state } = await openBrowser(withTheme);
for (const vw of widths) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw >= 1000 ? 900 : 800 } });
  const page = await ctx.newPage();
  for (const key of pages) {
    const resp = await page.goto(withTheme(PAGES[key]), { waitUntil: 'load' });
    await scrollThrough(page, { waitCards: false });
    const m = await page.evaluate(measureFn);
    const ov = await page.evaluate(overflowFn);
    const xbtn = m.btnLefts && m.btnLefts.length ? { maxRight: Math.max(...m.btnLefts.map((b) => b[1])) - vw, minLeft: Math.min(...m.btnLefts.map((b) => b[0])) } : null;
    const data = { status: resp.status(), vw, m, xPage: ov.xPage, offs: ov.offs, xbtn };
    writeFileSync(`${outDir}/${label}-${key}-${vw}.json`, JSON.stringify(data));
    if (shotsArg !== '0') await page.screenshot({ path: `${SHOTS}/t3-${label}-${key}-${vw}.png`, fullPage: true });
    console.log(label, key, vw, resp.status(), 'xPage', ov.xPage, 'h1', m.h1, 'xbtn', JSON.stringify(xbtn), 'offs', ov.offs.slice(0, 4).map((o) => o.tag + '.' + o.cls.split(' ')[0] + '@' + o.right).join(','));
  }
  await ctx.close();
}
await browser.close();
