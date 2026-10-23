// T4c Step 0 items 3, 5, 6: fixtures, tag outlines, the privacy widget investigation, the policy chain.
// Usage: node t4cc-facts.mjs <previewBase> <label>   Output: docs/qa/evidence/t4cc-facts-<label>.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4cc-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme, origin } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
const out = { label };
const { ctx, page } = await newPage(browser, state, 375, 812);

// Item 3: sitemap and policy handles.
const sm = await ctx.request.get(withTheme('/sitemap.xml'));
out.sitemap = sm.status();
out.policies = {};
for (const h of ['refund-policy', 'privacy-policy', 'terms-of-service', 'shipping-policy', 'contact-information', 'legal-notice', 'subscription-policy']) {
  const r = await page.goto(withTheme('/policies/' + h), { waitUntil: 'load' });
  const body = await page.evaluate(() => ({ cls: [...document.querySelectorAll('[class*="shopify-policy"]')].map((e) => e.className), n: document.querySelectorAll('ul,ol,a').length }));
  out.policies[h] = { status: r.status(), url: page.url().replace(/\?.*/, ''), ...body };
}

const outline = (root) => {
  const c = {};
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('.pc--show-email-field')) continue;
    c[el.tagName.toLowerCase()] = (c[el.tagName.toLowerCase()] || 0) + 1;
  }
  return c;
};
out.outlines = {};
for (const p of ['/pages/data-sharing-opt-out', '/pages/the-balanced-face-test-page', '/pages/the-material-archive', '/pages/contact', '/products/the-3p-fulfilled-snowboard', '/products/selling-plans-ski-wax', '/products/the-complete-snowboard']) {
  await page.goto(withTheme(p), { waitUntil: 'load' });
  await sleep(1500);
  out.outlines[p] = await page.evaluate((fn) => {
    const o = new Function('return ' + fn)();
    return [...document.querySelectorAll('[data-rich-text]')].map((e) => ({ cls: e.className, outline: o(e), len: e.textContent.trim().length, materials: ['Mycelium Bio-Fabric', 'Organic Cotton', 'Recycled Polyester'].filter((m) => e.textContent.includes(m)) }));
  }, outline.toString());
}

// Item 5: the widget.
out.widget = {};
for (const vw of [375, 1440]) {
  await page.setViewportSize({ width: vw, height: 812 });
  await page.goto(withTheme('/pages/data-sharing-opt-out'), { waitUntil: 'load' });
  await sleep(2500);
  out.widget[vw] = await page.evaluate(() => {
    const r1 = (n) => Math.round(n * 10) / 10;
    const w = document.querySelector('.pc--show-email-field');
    if (!w) return { found: false };
    const chain = [];
    for (let e = w; e && e !== document.documentElement; e = e.parentElement) {
      const b = e.getBoundingClientRect();
      chain.push({ tag: e.tagName.toLowerCase(), id: e.id, cls: String(e.className).slice(0, 80), l: r1(b.left), r: r1(b.right), ox: getComputedStyle(e).overflowX, rich: e.hasAttribute('data-rich-text') });
    }
    const box = w.closest('[data-rich-text]');
    // Rules setting width-ish properties on the widget and its descendants.
    const rules = [];
    const unreadable = [];
    for (const sh of document.styleSheets) {
      let list;
      try { list = sh.cssRules; } catch { unreadable.push(sh.href); continue; }
      const walk = (rs, layer) => {
        for (const r of rs) {
          if (r.cssRules && r.constructor.name === 'CSSLayerBlockRule') walk(r.cssRules, r.name);
          else if (r.cssRules && r.constructor.name === 'CSSMediaRule') walk(r.cssRules, layer);
          else if (r.selectorText) {
            let m = false;
            try { m = w.matches(r.selectorText) || !!w.querySelector(r.selectorText); } catch {}
            if (m && /^(width|min-width|max-width)$/.test([...r.style].find((p) => /^(width|min-width|max-width)$/.test(p)) || '')) {
              rules.push({ sheet: sh.href || 'inline', layer: layer || 'unlayered', sel: r.selectorText.slice(0, 80), decl: ['width', 'min-width', 'max-width'].map((p) => r.style.getPropertyValue(p) && `${p}:${r.style.getPropertyValue(p)}`).filter(Boolean).join(';') });
            }
          }
        }
      };
      walk(list, '');
    }
    const desc = [...w.querySelectorAll('*')].map((e) => {
      const cs = getComputedStyle(e); const b = e.getBoundingClientRect();
      return { tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 40), type: e.type || '', inline: e.getAttribute('style') || '', w: r1(b.width), r: r1(b.right), fs: cs.fontSize, lh: cs.lineHeight, mt: cs.marginTop, mb: cs.marginBottom, fw: cs.fontWeight, ff: cs.fontFamily.slice(0, 24) };
    });
    const wb = w.getBoundingClientRect();
    const furthest = Math.max(...[w, ...w.querySelectorAll('*')].map((e) => e.getBoundingClientRect().right));
    const boxCS = getComputedStyle(box);
    const boxLeft = box.getBoundingClientRect().left + parseFloat(boxCS.paddingLeft) + parseFloat(boxCS.borderLeftWidth);
    return { found: true, chain, inlineStyle: w.getAttribute('style'), rules, unreadable: unreadable.slice(0, 5), widgetBorderBox: [r1(wb.left), r1(wb.right), r1(wb.width)], furthestRight: r1(furthest), boxContentLeft: r1(boxLeft), W_pc: r1(furthest - boxLeft), descendants: desc.slice(0, 60), insideBox: !!box, xPage: document.documentElement.scrollWidth - innerWidth };
  });
}
const html = await (await ctx.request.get(withTheme('/pages/data-sharing-opt-out'))).text();
out.widget.inServerHtml = html.includes('pc--');
out.widget.serverHtmlSnippet = (html.match(/.{0,80}pc--show-email-field.{0,80}/s) || [''])[0].slice(0, 300);

// Item 6: policy chain.
out.policyChain = {};
for (const h of Object.keys(out.policies).filter((k) => out.policies[k].status === 200 && out.policies[k].cls.length)) {
  await page.goto(withTheme('/policies/' + h), { waitUntil: 'load' });
  out.policyChain[h] = await page.evaluate(() => {
    const items = [...document.querySelectorAll('main ul, main ol, main a, .shopify-policy__container ul, .shopify-policy__container ol, .shopify-policy__container a, body > * ul, body > * ol')];
    const seen = new Set();
    const rows = [];
    for (const e of document.querySelectorAll('ul, ol, a')) {
      if (e.closest('footer, header, [id^="shopify-section-header"], [id^="shopify-section-footer"]')) continue;
      const chain = [];
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) chain.push(p.tagName.toLowerCase() + (p.className ? '.' + String(p.className).trim().split(/\s+/).join('.') : ''));
      const cs = getComputedStyle(e);
      rows.push({ tag: e.tagName.toLowerCase(), text: e.textContent.trim().slice(0, 30), chain: chain.slice(0, 6).join(' < '), lst: cs.listStyleType, lsp: cs.listStylePosition, pl: cs.paddingLeft, td: cs.textDecorationLine });
    }
    const styles = [...document.querySelectorAll('style')].map((s) => s.textContent).filter((t) => /shopify-policy/.test(t)).map((t) => t.slice(0, 500));
    const counts = { ul: document.querySelectorAll('.shopify-policy__container ul').length, ol: document.querySelectorAll('.shopify-policy__container ol').length, a: document.querySelectorAll('.shopify-policy__container a').length };
    return { rows: rows.slice(0, 40), styles, counts, total: { ul: rows.filter((r) => r.tag === 'ul').length, ol: rows.filter((r) => r.tag === 'ol').length, a: rows.filter((r) => r.tag === 'a').length } };
  });
}
await ctx.close();
await browser.close();
mkdirSync('docs/qa/evidence', { recursive: true });
writeFileSync(`docs/qa/evidence/t4cc-facts-${label}.json`, JSON.stringify(out, null, 1));
console.log('wrote', label, JSON.stringify({ policies: Object.fromEntries(Object.entries(out.policies).map(([k, v]) => [k, v.status])), widgetFound: out.widget[375]?.found, inServerHtml: out.widget.inServerHtml }));
