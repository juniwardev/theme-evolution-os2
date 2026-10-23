// T4c page-center QA: opt-out widget alignment (1440) and phone overflow containment, dev vs staging.
import { writeFileSync } from 'node:fs';
import { chromium, loginState } from './t0-lib.mjs';

const ORIGIN = 'https://theme-evolution-os2.myshopify.com';
const THEMES = { dev: '187953938528', stg: '187953643616' };
const out = {};
const browser = await chromium.launch();
for (const [tn, tid] of Object.entries(THEMES)) {
  const withTheme = (p) => `${ORIGIN}${p}?preview_theme_id=${tid}`;
  const { state } = await loginState(browser, withTheme);
  const ctx = await browser.newContext({ storageState: state });
  const page = await ctx.newPage();
  for (const w of [375, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(withTheme('/pages/data-sharing-opt-out'), { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2500);
    const m = await page.evaluate(() => {
      const r = (n) => Math.round(n * 10) / 10;
      const prose = document.querySelector('.prose');
      const pl = prose.getBoundingClientRect().left;
      const els = [...prose.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().width > 0);
      const wide = els.map((e) => ({ tag: e.tagName, id: e.id.slice(0, 30), cls: String(e.className).slice(0, 40), x: r(e.getBoundingClientRect().left), w: r(e.getBoundingClientRect().width), sw: e.scrollWidth, cw: e.clientWidth, ox: getComputedStyle(e).overflowX }));
      const ctrl = els.filter((e) => /^(BUTTON|INPUT|LABEL|A)$/.test(e.tagName) || e.getAttribute('role') === 'checkbox' || e.getAttribute('role') === 'button').map((e) => ({ t: e.tagName + ':' + (e.textContent || e.type || '').trim().slice(0, 25), x: r(e.getBoundingClientRect().left) }));
      return { themeId: window.Shopify.theme.id, proseX: r(pl), proseW: r(prose.getBoundingClientRect().width), n: els.length, ctrl, overflowing: wide.filter((e) => e.sw > e.cw + 1 || e.ox !== 'visible').slice(0, 8), docW: document.documentElement.scrollWidth, winW: innerWidth, iframes: document.querySelectorAll('.prose iframe').length };
    });
    out[`${tn}|${w}`] = m;
    await page.screenshot({ path: `docs/qa/screenshots/t4cpq-optout-${tn}-${w}.png`, fullPage: false });
  }
  await ctx.close();
}
await browser.close();
writeFileSync('docs/qa/t4cpq/widget.json', JSON.stringify(out, null, 1));
