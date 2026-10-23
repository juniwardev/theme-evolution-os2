// T2 Coder: settings proxy for C2.25, C2.16 (hero), C2.27 (palette). Edits a scratch copy of the theme (git archive, outside
// the repo) that `shopify theme dev --path <scratch>` syncs to the private development theme; never touches the repo.
// Usage: node t2c-proxy.mjs <previewBase> <scratchDir> [tests=all]
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, PRODUCTS, scrollThrough } from './t2c-lib.mjs';

const [, scratch, testsArg] = process.argv.slice(2);
const { withTheme } = parseArgs();
const tests = (testsArg || 'all').split(',');
const run = (t) => tests.includes('all') || tests.includes(t);
const tplPath = `${scratch}/templates/product.json`;
const rawTpl = readFileSync(tplPath, 'utf8');
const header = rawTpl.slice(0, rawTpl.indexOf('{\n'));
const baseTpl = JSON.parse(rawTpl.slice(rawTpl.indexOf('{\n')));
const setTpl = (fn) => { const t = JSON.parse(JSON.stringify(baseTpl)); fn(t.sections); writeFileSync(tplPath, header + JSON.stringify(t, null, 2)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const load = async (key, vw = 1440) => {
  await page.setViewportSize({ width: vw, height: vw >= 1000 ? 900 : 800 });
  await page.goto(withTheme(PRODUCTS[key]), { waitUntil: 'load' });
  await scrollThrough(page, { waitCards: key !== 'home' });
};
// poll until the predicate (run in page) is true, reloading to wait for the dev sync; returns last value
const settle = async (key, vw, pred, probe) => {
  let v;
  for (let i = 0; i < 5; i++) {
    await sleep(i === 0 ? 7000 : 6000);
    await load(key, vw);
    v = await page.evaluate(probe);
    if (pred(v)) return { v, valid: true };
  }
  return { v, valid: false };
};
const out = (name, r) => console.log(name.padEnd(34), r.valid ? 'ok ' : 'INVALID ', JSON.stringify(r.v));

const relProbe = () => {
  const pr = document.querySelector('product-recommendations');
  const h2 = pr && pr.querySelector('h2'); const ul = pr && pr.querySelector('ul');
  const lis = ul ? [...ul.children] : [];
  const tops = new Set(lis.map((l) => Math.round(l.getBoundingClientRect().top)));
  const first = [...lis].filter((l) => Math.round(l.getBoundingClientRect().top) === Math.min(...tops));
  const media = lis[0] && lis[0].querySelector('[data-card-media]');
  return {
    h2: h2 && Math.round(parseFloat(getComputedStyle(h2).fontSize) * 10) / 10, cards: lis.length, perRow: first.length,
    tracks: ul ? getComputedStyle(ul).gridTemplateColumns.split(' ').length : 0,
    ratio: media && Math.round((media.getBoundingClientRect().width / media.getBoundingClientRect().height) * 100) / 100,
    vendor: pr ? pr.querySelectorAll('.uppercase.opacity-70').length : 0,
    pt: pr && getComputedStyle(pr).paddingTop, pb: pr && getComputedStyle(pr).paddingBottom,
    clips: lis.map((l) => { const b = l.querySelector('[data-card-image-box]'); return b && getComputedStyle(b).clipPath.slice(0, 30); }),
  };
};
const badgeProbe = () => {
  const res = [];
  for (const b of document.querySelectorAll('[data-card-badge]')) {
    const card = b.closest('[data-related-card]'); const media = b.closest('[data-card-media]');
    let clipped = false;
    for (let e = b; e && e !== card; e = e.parentElement) if (getComputedStyle(e).clipPath !== 'none') clipped = true;
    b.scrollIntoView({ block: 'center' });
    const bb = b.getBoundingClientRect(), mb = media.getBoundingClientRect();
    const inside = bb.left >= mb.left - 0.5 && bb.right <= mb.right + 0.5 && bb.top >= mb.top - 0.5 && bb.bottom <= mb.bottom + 0.5;
    const els = document.elementsFromPoint(bb.left + bb.width / 2, bb.top + bb.height / 2);
    const bi = els.indexOf(b); const imgs = els.map((e, i) => (e.tagName === 'IMG' && card.contains(e) ? i : -1)).filter((i) => i >= 0);
    const ancestorClip = clipped;
    res.push({ ancestorClip, inside, bi, imgs, paintOk: bi >= 0 && imgs.every((i) => bi < i), bg: getComputedStyle(b).backgroundColor, txt: b.textContent.trim() });
  }
  return res;
};

// force the sale-badge condition in the scratch card (scratch-only proxy, C2.25)
const cardPath = `${scratch}/snippets/card-product.liquid`;
const cardOrig = readFileSync(cardPath, 'utf8');
const forceSale = () => writeFileSync(cardPath, cardOrig.replace('elsif card_product.compare_at_price > card_product.price and card_product.available', 'elsif card_product.available'));
const unforce = () => writeFileSync(cardPath, cardOrig);

if (run('heading')) for (const v of ['h2', 'h1', 'h0', 'hxl', 'hxxl']) {
  setTpl((s) => { s['related-products'].settings.heading_size = v; });
  for (const vw of [1440, 375]) { const want = { h2: [24, 20], h1: [40, 30], h0: [52, 40], hxl: [62, 50], hxxl: [72, 56] }[v][vw === 1440 ? 0 : 1]; const r = await settle('snow', vw, (x) => x.h2 === want, relProbe); r.v = { h2: r.v.h2, expected: want }; out(`heading_size=${v} @${vw}`, r); }
}
if (run('columns')) {
  for (const n of [1, 2, 3, 4, 5, 6]) { setTpl((s) => { s['related-products'].settings.columns_desktop = n; s['related-products'].settings.products_to_show = 10; }); const r = await settle('snow', 1440, (x) => x.tracks === n, relProbe); r.v = { tracks: r.v.tracks, perRow: r.v.perRow, cards: r.v.cards }; out(`columns_desktop=${n}`, r); }
  setTpl((s) => { s['related-products'].settings.columns_mobile = '1'; }); { const r = await settle('snow', 375, (x) => x.tracks === 1, relProbe); r.v = { tracks: r.v.tracks, perRow: r.v.perRow }; out('columns_mobile=1 @375', r); }
  setTpl((s) => { s['related-products'].settings.products_to_show = 2; }); { const r = await settle('snow', 1440, (x) => x.cards === 2, relProbe); r.v = { cards: r.v.cards }; out('products_to_show=2', r); }
}
if (run('ratio')) for (const v of ['portrait', 'adapt', 'square']) {
  setTpl((s) => { s['related-products'].settings.image_ratio = v; });
  const want = { portrait: 0.8, adapt: null, square: 1 }[v];
  const r = await settle('snow', 1440, (x) => (want ? x.ratio === want : (x.ratio > 0 && x.ratio !== 0.8 && x.ratio !== 1)), relProbe); r.v = { ratio: r.v.ratio }; out(`image_ratio=${v}`, r);
}
if (run('misc')) {
  setTpl((s) => { s['related-products'].settings.show_vendor = true; s['related-products'].settings.show_secondary_image = false; }); { const r = await settle('snow', 1440, (x) => x.vendor > 0, relProbe); r.v = { vendorEls: r.v.vendor }; out('show_vendor=true', r); }
  for (const p of [0, 100]) { setTpl((s) => { s['related-products'].settings.padding_top = p; s['related-products'].settings.padding_bottom = p; }); const r = await settle('snow', 1440, (x) => x.pt === `${p}px`, relProbe); r.v = { pt: r.v.pt, pb: r.v.pb }; out(`related padding=${p}`, r); }
  for (const p of [0, 100]) {
    setTpl((s) => { s['material-spotlight'].settings.padding_top = p; s['material-spotlight'].settings.padding_bottom = p; });
    const r = await settle('snow', 1440, (x) => x && x.pt === `${p}px`, () => { const e = document.querySelector('[data-material-spotlight]'); return e && { pt: getComputedStyle(e).paddingTop, pb: getComputedStyle(e).paddingBottom }; }); out(`spotlight padding=${p} @1440`, r);
    const r2 = await settle('snow', 375, (x) => x && x.pt === `${Math.round(p * 0.75)}px`, () => { const e = document.querySelector('[data-material-spotlight]'); return e && { pt: getComputedStyle(e).paddingTop }; }); out(`spotlight padding=${p} @375`, r2);
  }
}
if (run('shape')) {
  forceSale();
  for (const shape of ['default', 'arch', 'blob', 'chevronleft', 'chevronright', 'diamond', 'parallelogram', 'round']) {
    setTpl((s) => { s['related-products'].settings.image_shape = shape; });
    const r = await settle('snow', 1440, (x) => x.cards === 4 && x.badges.length === 4 && x.clips.slice(0, shape === 'blob' ? 1 : 4).every((c) => (c || '').startsWith({ default: 'none', arch: 'url(', blob: 'polygon(97.686%', chevronleft: 'polygon(100% 0%, 85% 50%', chevronright: 'polygon(85% 0%, 100% 50%', diamond: 'polygon(50% 0%', parallelogram: 'polygon(15%', round: 'ellipse' }[shape])), `({...(${relProbe})(), badges: (${badgeProbe})()})`);
    const bad = r.v.badges.filter((b) => b.ancestorClip || !b.inside || !b.paintOk).length;
    r.v = { clips: [...new Set(r.v.clips)], blobDistinct: shape === 'blob' ? new Set(r.v.clips.slice(0, 4)).size : undefined, cards: r.v.cards, badges: r.v.badges.length, badgeProblems: bad, firstBadge: { clip: r.v.badges[0].ancestorClip, inside: r.v.badges[0].inside, bi: r.v.badges[0].bi, imgs: r.v.badges[0].imgs }, bg: r.v.badges[0] && r.v.badges[0].bg };
    out(`image_shape=${shape}`, r);
    await page.locator('[data-related-card]').first().screenshot({ path: `docs/qa/screenshots/t2c-shape-${shape}.png` });
  }
  unforce();
  setTpl((s) => { s['related-products'].settings.image_shape = 'default'; });
}
if (run('spotlight')) {
  for (const tag of ['h2', 'h3', 'h4']) { setTpl((s) => { s['material-spotlight'].settings.heading_tag = tag; }); const r = await settle('snow', 1440, (x) => x === tag.toUpperCase(), () => (document.querySelector('[data-material-spotlight] h2,[data-material-spotlight] h3,[data-material-spotlight] h4') || {}).tagName); out(`heading_tag=${tag}`, r); }
  for (const pre of [true, false]) {
    setTpl((s) => { s['material-spotlight'].settings.icon_style = 'hero'; s['material-spotlight'].settings.preload_icon = pre; });
    const resp = []; page.on('response', (x) => { if (x.url().includes('preview_theme_id') && x.request().resourceType() === 'document') resp.push(x.headers()['link'] || ''); });
    const r = await settle('snow', 1440, (x) => x && x.aspect > 1.5 && (pre ? x.fetchpriority === 'high' : x.fetchpriority === null && x.loading === 'lazy'), () => { const w = document.querySelector('[data-material-spotlight] img'); const b = w.parentElement.getBoundingClientRect(); return { aspect: Math.round((b.width / b.height) * 100) / 100, fetchpriority: w.getAttribute('fetchpriority'), loading: w.getAttribute('loading'), w: w.getAttribute('width'), h: w.getAttribute('height'), preloadLink: !!document.querySelector('link[rel=preload][as=image]') }; });
    { const rr = await ctx.request.get(withTheme(PRODUCTS.snow)); const lk = rr.headers()['link'] || ''; r.v.preloadHeaders = (lk.match(/rel="?preload/g) || []).length; r.v.heroUrlInHeader = lk.includes('/files/') && /preload/.test(lk) ? (lk.split(',').filter((x) => x.includes('preload')).length) : 0; } out(`icon_style=hero preload_icon=${pre}`, r);
  }
  setTpl((s) => { s['material-spotlight'].settings.show_rating = false; }); { const r = await settle('snow', 1440, (x) => x.spot === 0, () => ({ spot: document.querySelectorAll('[data-material-spotlight] [role=meter]').length, all: document.querySelectorAll('[role=meter]').length })); out('spotlight show_rating=false', r); }
}
if (run('custom')) {
  for (const style of ['minimal', 'pill', 'underline']) {
    setTpl((s) => { const b = s.custom_section_jxpfJF.blocks.trust_badge_9mJ3Em.settings; b.style = style; b.text_color = '#cc0033'; });
    const r = await settle('snow', 1440, (x) => x && x.color === 'rgb(204, 0, 51)' && (style === 'pill' ? x.radius === '30px' : style === 'underline' ? x.bb === '2px' : (x.radius === '0px' && x.bb === '0px' && x.bg === 'rgba(0, 0, 0, 0)')), () => { const e = document.querySelector('[id^=TrustBadge]'); const s = getComputedStyle(e); return { color: s.color, bt: s.borderTopWidth, bb: s.borderBottomWidth, bc: s.borderBottomColor, bg: s.backgroundColor, radius: s.borderTopLeftRadius, px: s.paddingLeft, fs: s.fontSize }; });
    out(`trust style=${style}`, r);
  }
  // specs table: force data in the scratch copy (no fixture has technical_specs)
  const sp = `${scratch}/snippets/specs-table.liquid`; const spOrig = readFileSync(sp, 'utf8');
  writeFileSync(sp, spOrig.replaceAll('product.metafields.custom.technical_specs.value', "specs_fixture").replace('{%- if specs_fixture != blank -%}', "{%- assign specs_fixture = 'Weight: 3 kg|Length: 150 cm' | split: '|' -%}\n{%- if specs_fixture != blank -%}"));
  setTpl((s) => { const c = s.custom_section_jxpfJF; c.blocks.specs_a = { type: 'specs_table', settings: { text_color: '#0044cc' } }; c.blocks.specs_b = { type: 'specs_table', settings: { text_color: '#aa5500' } }; c.block_order = ['specs_a', 'specs_b', ...c.block_order]; });
  const r = await settle('snow', 1440, (x) => x && x.n === 2, () => { const t = [...document.querySelectorAll('[class*="border-(--specs-color)"]')].filter((e) => e.getAttribute('style')); const lab = t.map((e) => getComputedStyle(e.children[0].children[0]).color); return { n: t.length, labelColors: lab, rows: t.map((e) => e.children.length), rowGrid: t[0] && getComputedStyle(t[0].children[0]).gridTemplateColumns }; });
  out('specs_table x2 (forced data)', r); writeFileSync(sp, spOrig);
}
if (run('product')) {
  setTpl((s) => { s.main.blocks.buy_buttons.settings.show_dynamic_checkout = false; s.main.blocks.share.settings.share_label = 'Pass it on'; });
  const r = await settle('snow', 1440, (x) => x.share === 'Pass it on', () => ({ share: [...document.querySelectorAll('button.btn-secondary')][0]?.textContent.trim(), payment: document.querySelectorAll('.shopify-payment-button').length })); out('show_dynamic_checkout=false, share_label', r);
}
if (run('palette')) {
  const sd = `${scratch}/config/settings_data.json`; const sdOrig = readFileSync(sd, 'utf8');
  const probe = () => {
    const root = getComputedStyle(document.documentElement); const q = (s) => document.querySelector(s); const c = (e, p) => (e ? getComputedStyle(e)[p] : null);
    const sp = q('[data-material-spotlight]'); const mi = (() => { const h = [...document.querySelectorAll('[id*=custom] h3')][0]; return h && h.parentElement.parentElement.parentElement; })();
    const spt = sp && sp.querySelector('h2,h3,h4'); const card = sp && sp.querySelector('[class*="rounded-2xl"]');
    const sub = sp && sp.querySelector('span.uppercase'); const lab = sp && sp.querySelector('[role=meter]')?.parentElement.querySelector('span');
    const det = q('#MaterialAccordion'); const sel = q('select[name=id]'); const add = q('button[name=add]');
    const share = q('button.btn-secondary'); const bar = [...document.querySelectorAll('[data-sustainability-bar][data-active]')].pop(); const track = [...document.querySelectorAll('[data-sustainability-bar]')].pop();
    return {
      fg: root.getPropertyValue('--color-foreground').trim(), bg: root.getPropertyValue('--color-background').trim(),
      spTitle: c(spt, 'color'), spSub: c(sub, 'color'), spCardBorder: c(card, 'borderTopColor'), spLabel: c(lab, 'color'), accBorder: c(det, 'borderTopColor'), accSummary: c(det && det.querySelector('summary'), 'color'),
      select: c(sel, 'backgroundColor'), share: c(share, 'color'),
      miColor: c(mi, 'color'), miBg: c(mi, 'backgroundColor'), miLabel: c(mi && mi.querySelector('[role=meter]')?.parentElement.querySelector('span'), 'color'),
      barAfter: bar ? getComputedStyle(bar, '::after').backgroundColor : null, track: c(track, 'backgroundColor'), add: c(add, 'backgroundColor'),
    };
  };
  const results = {};
  for (const [name, fg, bgc] of [['default', null, null], ['palette', '#ee1188', '#112233']]) {
    writeFileSync(sd, name === 'default' ? sdOrig : JSON.stringify({ current: { foreground_color: fg, background_color: bgc } }));
    const want = name === 'default' ? '#333333' : '#ee1188';
    const r = await settle('snow', 1440, (x) => x.fg === want, probe); out(`palette ${name} (snow)`, r); results[name] = r.v;
    await page.screenshot({ path: `docs/qa/screenshots/t2c-palette-${name}-snow-1440.png`, fullPage: true });
    // tooltip on the palette run
    const trig = page.locator('.eco-tooltip-trigger').first();
    if (await trig.count()) { await trig.hover(); await sleep(1500); const t = await page.evaluate(() => { const t = document.querySelector('div.eco-tooltip'); const h = t && t.querySelector('h3'); return t && { bg: getComputedStyle(t).backgroundColor, title: getComputedStyle(h).color, trigger: getComputedStyle(document.querySelector('.eco-tooltip-trigger')).color }; }); results[name].tooltip = t; await page.mouse.move(2, 2); }
    // sold-out/other data not available; 3p for spotlight values already on snow (snow has a spotlight and material-info)
  }
  const diffs = {};
  for (const k of Object.keys(results.default)) if (JSON.stringify(results.default[k]) !== JSON.stringify(results.palette[k])) diffs[k] = [results.default[k], results.palette[k]];
  console.log('PALETTE CHANGED KEYS:', JSON.stringify(diffs));
  writeFileSync(sd, sdOrig);
}
await browser.close();
