// T5b QA sweep: line height 1.5 site-wide, clipping, overflow, headings, policy wrapper.
// usage: T5BC_STATE=<cache> node t5bq-sweep.mjs "<preview url>" <outdir> [pagekeys]
import { chromium, parseArgs, loginState, newPage, PAGES, assertTheme, sleep } from './t5bc-lib.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const { themeId, withTheme } = parseArgs();
const out = process.argv[3];
mkdirSync(out, { recursive: true });
const keys = (process.argv[4] || 'home,p3p,wax,rental,collection,search,contact,blog,policy,optout,cart,archive').split(',');
const pages = { ...PAGES, policy2: '/policies/terms-of-service', refund: '/policies/refund-policy', shipping: '/policies/shipping-policy' };

const probe = () => {
  const de = document.documentElement;
  const res = { html_lh: getComputedStyle(de).lineHeight, body_lh: getComputedStyle(document.body).lineHeight,
    sw: de.scrollWidth, cw: de.clientWidth, h1: document.querySelectorAll('h1').length,
    policyWrap: document.querySelectorAll('[data-policy-prose]').length, pageType: window.Shopify?.theme && (document.querySelector('meta[name=page-type]')?.content || null) };
  const hdr = document.querySelector('header, .header, [id*=header]');
  res.header_h = hdr ? Math.round(hdr.getBoundingClientRect().height) : null;
  const clipped = [];
  const all = document.querySelectorAll('body *');
  for (const el of all) {
    if (clipped.length > 25) break;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (el.closest('.sr-only') || /sr-only/.test(el.className?.toString?.() || '')) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const ox = cs.overflowX !== 'visible', oy = cs.overflowY !== 'visible';
    const clipY = oy && el.scrollHeight > el.clientHeight + 1 && el.clientHeight > 0;
    const clipX = ox && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && cs.textOverflow !== 'ellipsis';
    if (clipY || clipX) clipped.push({ tag: el.tagName, cls: (el.className?.toString?.() || '').slice(0, 60), txt: el.textContent.trim().slice(0, 30), sh: el.scrollHeight, ch: el.clientHeight, sw: el.scrollWidth, cw: el.clientWidth });
  }
  res.clipped = clipped;
  const hf = [];
  for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
    hf.push({ t: h.tagName, hf: /font-heading/.test(h.className?.toString?.() || ''), ff: getComputedStyle(h).fontFamily.slice(0, 30), inProse: !!h.closest('.prose') });
  }
  res.headings = hf.length; res.headFam = [...new Set(hf.map((h) => `${h.t}|${h.hf}|${h.inProse}|${h.ff}`))];
  return res;
};

const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) { console.log('login failed'); process.exit(1); }
const results = [];
for (const vw of [375, 1440]) {
  const vh = vw === 375 ? 667 : 900;
  for (const k of keys) {
    const { ctx, page } = await newPage(browser, state, vw, vh);
    try {
      const resp = await page.goto(withTheme(pages[k]), { waitUntil: 'load' });
      await sleep(2500);
      await assertTheme(page, themeId, 'development');
      const r = await page.evaluate(probe);
      r.status = resp?.status(); r.page = k; r.vw = vw; r.logs = page.__logs.slice(0, 5);
      await page.screenshot({ path: `${out}/${k}-${vw}.png`, fullPage: true });
      results.push(r);
      console.log(k, vw, r.status, 'lh', r.html_lh, 'h1', r.h1, 'wrap', r.policyWrap, 'sw/cw', r.sw, r.cw, 'hdr', r.header_h, 'clipped', r.clipped.length, 'logs', r.logs.length);
    } catch (e) { console.log(k, vw, 'ERR', String(e.message).slice(0, 120)); results.push({ page: k, vw, err: String(e.message).slice(0, 200) }); }
    await ctx.close();
    await sleep(2500);
  }
}
writeFileSync(`${out}/sweep.json`, JSON.stringify(results, null, 1));
await browser.close();
