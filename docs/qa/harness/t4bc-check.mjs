// T4b head checks: C4b.5 (overflow), C4b.6 (shell alignment, headings), C4b.7(a) (grid tracks), C4b.13 (img dimensions, H1, heading order).
// Usage: node t4bc-check.mjs <previewBase> <label> <path>[,<path>...] [widths=320,375,...]  Output: docs/qa/evidence/t4bc-check-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, overflowFn, sleep } from './t4bc-lib.mjs';
const [, label, pathsArg, widthsArg] = process.argv.slice(2);
const paths = pathsArg.split(',');
const WIDTHS = (widthsArg || '320,375,390,430,768,1440,1920').split(',').map(Number);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = {};
const infoFn = () => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const shell = document.querySelector('[data-page-shell]');
  const root = document.querySelector('[id^="shopify-section-template"][id$="__main"]') || document.body;
  const h1s = [...root.querySelectorAll('h1')];
  const h1 = shell ? shell.querySelector('h1') : h1s[0];
  const header = document.querySelector('header a, header .header__heading-link, header nav a, header a[href="/"]');
  const o = { h1Count: document.querySelectorAll('h1').length };
  if (h1) { const s = getComputedStyle(h1); o.h1 = { left: r1(h1.getBoundingClientRect().left), ff: s.fontFamily.slice(0, 12), fs: s.fontSize, fw: s.fontWeight, tt: s.textTransform, lh: s.lineHeight, color: s.color }; }
  if (shell) {
    const s = getComputedStyle(shell);
    const sb = shell.getBoundingClientRect();
    o.shell = { padTop: s.paddingTop, padBottom: s.paddingBottom, padL: s.paddingLeft, left: r1(sb.left), right: r1(sb.right), gap: s.rowGap, kids: [...shell.children].map((c) => { const b = c.getBoundingClientRect(); return [c.tagName.toLowerCase(), r1(b.left), r1(b.right), r1(b.top - sb.top), r1(b.height)]; }) };
  }
  const logo = document.querySelector('[data-header-logo], header a');
  o.logoLeft = logo ? r1(logo.getBoundingClientRect().left) : null;
  o.grids = [...root.querySelectorAll('*')].filter((e) => getComputedStyle(e).display === 'grid' && e.children.length > 1 && !e.matches('.shopify-section')).slice(0, 3).map((e) => { const s = getComputedStyle(e); return { cls: String(e.className).slice(0, 50), cols: s.gridTemplateColumns, cg: s.columnGap, rg: s.rowGap, n: e.children.length, gridMin: e.style.getPropertyValue('--grid-min') }; });
  o.imgsNoDims = [...root.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length;
  o.imgs = root.querySelectorAll('img').length;
  o.headings = [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => h.tagName.toLowerCase());
  o.emptyDivs = [...root.querySelectorAll('div')].filter((d) => d.childNodes.length === 0).length;
  return o;
};
for (const path of paths) {
  out[path] = {};
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  const resp = await page.goto(withTheme(path), { waitUntil: 'load' });
  const pre = (resp.headers().link || '').split(',').filter((x) => x.trim()).length;
  for (const vw of WIDTHS) {
    await page.setViewportSize({ width: vw, height: vw >= 1000 ? 900 : 812 });
    await sleep(300);
    const o = await page.evaluate(overflowFn);
    out[path][vw] = { status: resp.status(), nPre: pre, xPage: o.sw - o.vw, offs: o.off.length, ...(await page.evaluate(infoFn)) };
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`docs/qa/evidence/t4bc-check-${label}.json`, JSON.stringify(out, null, 1));
for (const [p, d] of Object.entries(out)) for (const [vw, v] of Object.entries(d)) {
  const sh = v.shell;
  console.log(p, vw, `st${v.status} pre${v.nPre} x${v.xPage}/${v.offs} h1x${v.h1Count}`, v.h1 ? `h1 L${v.h1.left} ${v.h1.ff}|${v.h1.fs}|${v.h1.fw}|${v.h1.tt}` : 'no-h1', 'logoL', v.logoLeft, sh ? `shell pad ${sh.padTop}/${sh.padBottom} L${sh.left} R${sh.right} gap ${sh.gap} kidsMaxR ${Math.max(...sh.kids.map((k) => k[2]))}` : 'no-shell', 'grids', JSON.stringify(v.grids.map((g) => `${g.cols} g${g.cg}`)), 'imgs', v.imgs, 'noDims', v.imgsNoDims, 'hd', v.headings.join(''), 'emptyDivs', v.emptyDivs);
}
