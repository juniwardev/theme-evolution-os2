// T3 Coder (from t2c-mcss): method M_css (plan section 0). B_head, B_body, B_doc (compressed transfer bytes, unique URLs) and N_dawn.
// Fresh context per page, empty cache, 1440x900, resource timing buffer 1000, scroll in 600px steps, wait for related cards.
// Usage: node t2c-mcss.mjs <previewBase> [pagesCsv=p3p,snow,home,wax]
import { parseArgs, openBrowser, PAGES as PRODUCTS, scrollThrough } from './t3c-lib.mjs';

const { withTheme } = parseArgs();
const pages = (process.argv[3] || 'p3p,snow,home,wax').split(',');
const DAWN = ['component-card.css', 'component-price.css', 'section-related-products.css', 'mask-blobs.css', 'component-rating.css', 'component-volume-pricing.css', 'quick-order-list.css', 'quantity-popover.css', 'eco-tooltip.css', 'section-image-banner.css'];
const { browser, state } = await openBrowser(withTheme);
for (const key of pages) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => performance.setResourceTimingBufferSize(1000));
  const page = await ctx.newPage();
  await page.goto(withTheme(PRODUCTS[key]), { waitUntil: 'load' });
  const cards = await scrollThrough(page, { waitCards: key !== 'home' });
  await page.waitForTimeout(2000);
  const r = await page.evaluate((DAWN) => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => ({ href: new URL(l.getAttribute('href'), location.href).href, inHead: !!l.closest('head') }));
    const res = performance.getEntriesByType('resource');
    const seen = new Map();
    let bHead = 0, bBody = 0, invalid = [], cross = [];
    const rows = [];
    for (const l of links) {
      if (seen.has(l.href)) continue;
      seen.set(l.href, true);
      const u = new URL(l.href);
      if (u.origin !== location.origin) { cross.push(l.href); continue; }
      const e = res.find((x) => x.name === l.href);
      if (!e || e.encodedBodySize === 0) { invalid.push(l.href.replace(location.origin, '')); continue; }
      rows.push([l.inHead ? 'head' : 'body', u.pathname.split('/').pop() || u.pathname, e.encodedBodySize]);
      if (l.inHead) bHead += e.encodedBodySize; else bBody += e.encodedBodySize;
    }
    const nDawn = links.filter((l) => DAWN.some((n) => new URL(l.href).pathname.endsWith(n))).length;
    return { nLinks: links.length, bHead, bBody, bDoc: bHead + bBody, nDawn, invalid, cross: cross.length, rows };
  }, DAWN);
  console.log(key, 'cards', cards, JSON.stringify({ ...r, rows: undefined }));
  console.log('   ', r.rows.map((x) => x.join(':')).join(' | '));
  await ctx.close();
  await new Promise((s) => setTimeout(s, 1500));
}
await browser.close();
