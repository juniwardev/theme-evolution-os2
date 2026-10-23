// T3 Coder: settings proxy (plan section 10). Edits a scratch copy of the theme (git archive, outside the repo) that
// `shopify theme dev --path <scratch>` syncs to the private development theme; never touches the repo.
// Every variant renames the banner section key to image-banner-<id> so the rendered section id is a sync marker.
// Usage: node t3c-proxy.mjs <previewBase> <scratchDir> <label> <outDir> [variantsCsv=all]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseArgs, openBrowser, measureFn, overflowFn, sleep } from './t3c-lib.mjs';

const [, scratch, label, outDir, varArg] = process.argv.slice(2);
const { withTheme } = parseArgs();
mkdirSync(outDir, { recursive: true });
mkdirSync('docs/qa/screenshots', { recursive: true });
const tplPath = `${scratch}/templates/index.json`;
// pristine copy kept next to the scratch dir (not inside it, so it is never synced); a previous run leaves index.json renamed
import { existsSync, copyFileSync } from 'node:fs';
if (!existsSync(`${scratch}.index.orig`)) copyFileSync(tplPath, `${scratch}.index.orig`);
const raw = readFileSync(`${scratch}.index.orig`, 'utf8');
const header = raw.slice(0, raw.indexOf('{\n'));
const baseTpl = JSON.parse(raw.slice(raw.indexOf('{\n')));
const sdPath = `${scratch}/config/settings_data.json`;
const sdOrig = readFileSync(sdPath, 'utf8');

const POS = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
const set = (kv) => (s) => Object.assign(s['image-banner'].settings, kv);
const delImg2 = (s) => { delete s['image-banner'].settings.image_2; };
const V = {};
const add = (id, fn) => { V[id] = fn; };
add('B0', () => {});
add('V1-adapt', (s) => { delImg2(s); s['image-banner'].settings.image_height = 'adapt'; });
add('V1-small', set({ image_height: 'small' }));
add('V1-medium', set({ image_height: 'medium' }));
add('V1-large-single', delImg2);
for (const b of ['ambient', 'fixed', 'zoom-in']) add('V2-' + b, set({ image_behavior: b }));
for (const p of POS) add('V3-' + p, set({ desktop_content_position: p }));
for (const a of ['left', 'right']) add('V4-' + a, set({ desktop_content_alignment: a }));
add('V5', set({ show_text_box: true }));
add('V6', set({ stack_images_on_mobile: true }));
for (const a of ['left', 'right']) add('V7-' + a, set({ mobile_content_alignment: a }));
add('V8', set({ show_text_below: true }));
for (const o of [50, 100]) add('V9-' + o, set({ image_overlay_opacity: o }));
for (const h of ['h2', 'h0', 'hxl', 'hxxl']) add('V10-' + h, (s) => { s['image-banner'].blocks.heading.settings.heading_size = h; });
for (const t of ['body', 'subtitle', 'caption-with-letter-spacing']) add('V11-' + t, (s) => {
  const b = s['image-banner'];
  b.blocks.text = { type: 'text', settings: { text: 'Some supporting text', text_style: t } };
  b.block_order = ['heading', 'text', 'button'];
});
add('V12-swap', (s) => { const st = s['image-banner'].blocks.button.settings; st.button_style_secondary_1 = false; st.button_style_secondary_2 = true; });
add('V12-links', (s) => { const st = s['image-banner'].blocks.button.settings; st.button_link_1 = '/collections/all'; st.button_link_2 = '/collections/all'; });
add('V12-label2blank', (s) => { s['image-banner'].blocks.button.settings.button_label_2 = ''; });
add('V13-img2only', (s) => { delete s['image-banner'].settings.image; });
add('V13-noimg', (s) => { delete s['image-banner'].settings.image; delete s['image-banner'].settings.image_2; });
add('C1', set({ stack_images_on_mobile: true, show_text_below: true }));
add('C2', set({ stack_images_on_mobile: true, image_height: 'adapt' }));
add('C3', (s) => { delImg2(s); Object.assign(s['image-banner'].settings, { show_text_below: true, image_height: 'adapt' }); });
add('C4', set({ image_behavior: 'fixed', stack_images_on_mobile: true }));
add('C5', set({ show_text_box: true, desktop_content_position: 'top-left', desktop_content_alignment: 'left' }));
add('C6', () => {});
add('C6s', delImg2);
add('P', (s) => {
  const mk = (n, style, al) => [`t${n}`, { type: 'text', settings: { text: `Text ${style}`, text_style: style, alignment: al } }];
  const blocks = {}; const order = [];
  const put = ([k, v]) => { blocks[k] = v; order.push(k); };
  [['text--title', 'left'], ['text--title', 'center'], ['text--title', 'right'], ['text--subtitle', 'left'], ['text--subtitle', 'center'], ['text--subtitle', 'right'], ['text--normal', 'left'], ['text--normal', 'center'], ['text--normal', 'right']].forEach(([st, al], i) => put(mk(i, st, al)));
  const grp = (id, dir, al, pad) => put([id, { type: 'group', settings: { layout_direction: dir, alignment: al, padding: pad }, blocks: { gt: { type: 'text', settings: { text: 'Inside', text_style: 'text--normal', alignment: 'left' } } }, block_order: ['gt'] }]);
  grp('gh', 'group--horizontal', 'flex-start', 100);
  grp('gv0', 'group--vertical', 'flex-start', 0); grp('gv1', 'group--vertical', 'center', 0); grp('gv2', 'group--vertical', 'flex-end', 0);
  grp('gv3', 'group--vertical', 'flex-start', 200); grp('gv4', 'group--vertical', 'center', 200); grp('gv5', 'group--vertical', 'flex-end', 200);
  s['t3-proxy'] = { type: 't3-proxy', blocks, block_order: order, settings: {} };
});

const sel = (varArg || 'all') === 'all' ? Object.keys(V) : varArg === 'PALETTE' ? [] : varArg.split(',');
const writeVariant = (id) => {
  const t = JSON.parse(JSON.stringify(baseTpl));
  V[id](t.sections);
  const key = 'image-banner-' + id.toLowerCase().replace(/[^a-z0-9]/g, '');
  t.sections[key] = t.sections['image-banner']; delete t.sections['image-banner'];
  // keep apply functions' key assumptions: they ran before the rename
  t.order = t.order.map((k) => (k === 'image-banner' ? key : k));
  if (id === 'C6' || id === 'C6s') t.order = [key, 'main', 'custom-section'];
  if (id === 'P') t.order.push('t3-proxy');
  writeFileSync(tplPath, header + JSON.stringify(t, null, 2));
  return key;
};

const { browser, state } = await openBrowser(withTheme);
const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const WIDTHS = [320, 375, 430, 767, 768, 1024, 1440];
const pmeasure = () => {
  const root = document.querySelector('[data-t3-proxy]');
  if (!root) return null;
  const P = ['display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'overflow', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'textAlign', 'width'];
  const rd = (el) => { const s = getComputedStyle(el); const o = { cls: String(el.className).slice(0, 80), txt: el.children.length ? '' : el.textContent.trim().slice(0, 20), w: Math.round(el.getBoundingClientRect().width * 10) / 10 }; for (const p of P) o[p] = s[p]; return o; };
  return { container: Math.round(root.getBoundingClientRect().width * 10) / 10, blocks: [...root.children].map((c) => ({ ...rd(c), kids: [...c.children].map(rd) })) };
};
let n = 0;
for (const id of sel) {
  n++;
  const key = writeVariant(id);
  const marker = key.replace('image-banner-', '');
  let ok = false; let resp;
  await page.setViewportSize({ width: 1440, height: 900 });
  for (let i = 0; i < 12; i++) {
    await sleep(i === 0 ? 5000 : 4000);
    resp = await page.goto(withTheme('/'), { waitUntil: 'load' });
    ok = await page.evaluate((m) => { const b = document.querySelector('[id^="Banner-"]'); return !!b && b.id.endsWith('__image-banner-' + m); }, marker);
    if (ok) break;
  }
  if (!ok) { console.log(id, 'SYNC TIMEOUT'); continue; }
  const rec = { variant: id, valid: true, status: resp.status(), link: resp.headers().link || '', widths: {} };
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: w >= 1000 ? 900 : 800 });
    await sleep(250);
    const m = await page.evaluate(measureFn);
    const ov = await page.evaluate(overflowFn);
    rec.widths[w] = { m, xPage: ov.xPage, offs: ov.offs.slice(0, 6) };
    if (label === 'head' && (w === 375 || w === 1440)) await page.screenshot({ path: `docs/qa/screenshots/t3-proxy-${id}-${w}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  rec.reduce1440 = await page.evaluate(measureFn);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  if (id === 'P') { for (const w of [375, 1440]) { await page.setViewportSize({ width: w, height: 800 }); await sleep(200); rec['p' + w] = await page.evaluate(pmeasure); } }
  if (id === 'V2-fixed' || id === 'V2-zoom-in' || id === 'C4') { rec.innerHeight = 900; }
  writeFileSync(`${outDir}/${label}-${id}.json`, JSON.stringify(rec));
  const w375 = rec.widths[375], w1440 = rec.widths[1440];
  console.log(`[${n}/${sel.length}] ${id}`.padEnd(26), 'x375', w375.xPage, 'x1440', w1440.xPage, 'rootH1440', w1440.m.named['ban.root']?.h, 'h375', w375.m.named['ban.root']?.h);
}
// palette (head only): C3.23
if (label === 'head' && ((varArg || 'all') === 'all' || varArg === 'PALETTE')) {
  const pal = {};
  for (const [name, cfg] of [['default', null], ['palette', { foreground_color: '#ee1188', background_color: '#112233' }]]) {
    writeFileSync(sdPath, name === 'default' ? sdOrig : JSON.stringify({ current: cfg }));
    const pkey = writeVariant('V5');
    const want = name === 'default' ? '#333333' : '#ee1188';
    let fg = '';
    for (let i = 0; i < 12; i++) { await sleep(5000); await page.goto(withTheme('/'), { waitUntil: 'load' }); fg = await page.evaluate((k) => { const b = document.querySelector('[id^="Banner-"]'); return b && b.id.endsWith('__' + k) ? getComputedStyle(document.documentElement).getPropertyValue('--color-foreground').trim() : 'template-not-synced'; }, pkey); if (fg === want) break; }
    const c = await page.evaluate(() => {
      const q = (e, p) => (e ? getComputedStyle(e)[p] : null);
      const band = document.querySelector('.welcome, [data-hello-band]'); const h1 = band && band.querySelector('h1');
      const card = document.querySelector('.highlight, [data-hello-card]'); const ct = card && card.querySelector('h2,h3'); const cl = card && card.querySelector('a');
      const bs = document.querySelector('[id^="Banner-"]'); const box = bs.lastElementChild.firstElementChild; const hd = box.querySelector('h2'); const btns = [...box.querySelectorAll(':scope a')].filter((a) => !a.closest('h2'));
      return { fg: getComputedStyle(document.documentElement).getPropertyValue('--color-foreground').trim(), bandBg: q(band, 'backgroundColor'), h1: q(h1, 'color'), cardBg: q(card, 'backgroundColor'), cardColor: q(card, 'color'), cardTitle: q(ct, 'color'), linkBg: q(cl, 'backgroundColor'), heading: q(hd, 'color'), shopAll: q(btns[0], 'color'), shopAllBorder: q(btns[0], 'borderTopColor'), btn2Bg: q(btns[1], 'backgroundColor'), boxBg: q(box, 'backgroundColor') };
    });
    pal[name] = { valid: fg === want, ...c };
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: `docs/qa/screenshots/t3-palette-${name}-home-1440.png`, fullPage: true });
  }
  writeFileSync(`${outDir}/head-palette.json`, JSON.stringify(pal));
  writeFileSync(sdPath, sdOrig);
  console.log('PALETTE', JSON.stringify(pal));
}
await browser.close();
