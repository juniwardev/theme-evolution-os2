// T3 Coder harness helpers (t3c-*). Reuses t0-lib.mjs for login (password read from docs/dev-fixtures.md, never printed).
// `measureFn` runs in the page and uses structural finders so the same code measures the pre-T3 (Dawn) markup and the T3 markup.
import { chromium, parseArgs, loginState } from './t0-lib.mjs';
import { scrollThrough, overflowFn } from './t2c-lib.mjs';

export { chromium, parseArgs, loginState, scrollThrough, overflowFn };

export const PAGES = {
  home: '/',
  land: '/products/the-complete-snowboard?view=landing-page',
  p3p: '/products/the-3p-fulfilled-snowboard',
  wax: '/products/selling-plans-ski-wax',
  snow: '/products/the-complete-snowboard',
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs in the page. Returns geometry + computed styles for the header edges, the hello-world section and the banner section.
export const measureFn = () => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const P = ['display', 'position', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'width', 'height', 'minHeight', 'maxWidth', 'minWidth', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign',
    'color', 'backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderBottomWidth', 'borderLeftWidth', 'opacity', 'clipPath', 'animationName',
    'flexDirection', 'flexWrap', 'flexGrow', 'justifyContent', 'alignItems', 'columnGap', 'order', 'gridTemplateColumns', 'textDecorationThickness', 'textUnderlineOffset'];
  const out = { named: {} };
  const secs = [...document.querySelectorAll('.shopify-section')].filter((s) => s.id.startsWith('shopify-section-template'));
  const rec = (name, el, root, pseudo) => {
    if (!el) return;
    const b = el.getBoundingClientRect();
    const rb = root.getBoundingClientRect();
    const s = getComputedStyle(el);
    const o = { x: r1(b.left), y: r1(b.top - rb.top), w: r1(b.width), h: r1(b.height), right: r1(b.right), tag: el.tagName.toLowerCase() };
    for (const p of P) o[p] = s[p];
    if (pseudo) for (const ps of ['::before', '::after']) { const q = getComputedStyle(el, ps); o[ps] = { display: q.display, paddingBottom: q.paddingBottom, opacity: q.opacity, content: q.content, w: q.width, h: q.height }; }
    out.named[name] = o;
  };
  // header edges
  const logo = document.querySelector('header a[href="/"]');
  const cart = document.querySelector('[data-header-cart-icon]');
  if (logo) { const b = logo.getBoundingClientRect(); out.L = r1(b.left); }
  if (cart) { const b = cart.getBoundingClientRect(); out.R = r1(b.right); }
  out.vw = innerWidth;
  out.ih = innerHeight;
  const resolve = (v) => { const e = document.createElement('i'); e.style.color = getComputedStyle(document.documentElement).getPropertyValue(v).trim(); document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; };
  out.bodyBg = getComputedStyle(document.body).backgroundColor;
  out.bgVar = resolve('--color-background');
  out.accentVar = resolve('--color-accent');
  out.fgVar = resolve('--color-foreground');
  // hello-world
  const hello = secs.find((s) => s.querySelector('.welcome, [data-hello-band]'));
  if (hello) {
    const band = hello.querySelector('.welcome, [data-hello-band]');
    rec('hello.section', hello, hello); rec('hello.band', band, hello);
    const row = band.firstElementChild; rec('hello.row', row, hello);
    const h1 = band.querySelector('h1'); rec('hello.h1', h1, hello);
    const ps = [...band.querySelectorAll('p')]; ps.forEach((p, i) => rec('hello.p' + i, p, hello));
    const img = band.querySelector('img'); rec('hello.img', img, hello); rec('hello.illus', img && img.parentElement, hello);
    out.helloImgAttrs = img ? { alt: img.getAttribute('alt'), width: img.getAttribute('width'), height: img.getAttribute('height') } : null;
    const cards = hello.querySelector('.highlights, [data-hello-cards]');
    rec('hello.cards', cards, hello);
    [...(cards ? cards.children : [])].forEach((c, i) => {
      rec(`hello.card${i}`, c, hello);
      const t = c.querySelector('h2,h3'); rec(`hello.card${i}.title`, t, hello); out.named[`hello.card${i}.titleTag`] = t && t.tagName; out.named[`hello.card${i}.titleText`] = t && t.textContent.trim();
      const cp = [...c.querySelectorAll('p')]; rec(`hello.card${i}.desc`, cp[0], hello); rec(`hello.card${i}.linkp`, cp[1], hello);
      const a = c.querySelector('a'); rec(`hello.card${i}.link`, a, hello);
      out.named[`hello.card${i}.linkAttrs`] = a && [...a.attributes].filter((x) => x.name !== 'class').map((x) => `${x.name}=${x.value}`);
    });
    out.helloH1Text = h1 && h1.textContent.trim();
  }
  // banner
  const bsec = secs.find((s) => s.querySelector('[id^="Banner-"]'));
  if (bsec) {
    const root = bsec.querySelector('[id^="Banner-"]');
    rec('ban.section', bsec, bsec); rec('ban.root', root, bsec, true);
    const kids = [...root.children];
    const content = kids[kids.length - 1];
    const medias = kids.slice(0, -1);
    medias.forEach((m, i) => { rec('ban.media' + i, m, bsec, true); const im = m.querySelector('img, svg'); rec('ban.media' + i + '.img', im, bsec); if (im && im.tagName === 'IMG') out.named['ban.media' + i + '.imgAttrs'] = { fp: im.getAttribute('fetchpriority'), w: im.getAttribute('width'), h: im.getAttribute('height'), loading: im.getAttribute('loading') }; });
    rec('ban.content', content, bsec, true);
    const box = content.firstElementChild; rec('ban.box', box, bsec);
    if (box) {
      const bcs = getComputedStyle(box);
      out.boxContent = { left: r1(box.getBoundingClientRect().left + parseFloat(bcs.paddingLeft) + parseFloat(bcs.borderLeftWidth)), right: r1(box.getBoundingClientRect().right - parseFloat(bcs.paddingRight) - parseFloat(bcs.borderRightWidth)) };
      [...box.children].forEach((c, i) => {
        const wrapper = c.tagName === 'DIV' && c.querySelector(':scope > a') && ![...c.children].some((k) => k.tagName !== 'A');
        rec(`ban.block${i}${wrapper ? '.buttons' : ''}`, c, bsec);
        if (wrapper) { out.btnWrapper = `ban.block${i}.buttons`; [...c.querySelectorAll(':scope > a')].forEach((a, j) => { rec(`ban.btn${j}`, a, bsec); out.named[`ban.btn${j}.cls`] = a.className; out.named[`ban.btn${j}.attrs`] = [...a.attributes].filter((x) => x.name !== 'class').map((x) => `${x.name}=${x.value}`); }); }
        if (c.tagName === 'H2') { out.bannerH2Text = c.textContent.trim(); }
      });
    }
    out.btnLefts = [...root.querySelectorAll('a')].filter((a) => a.parentElement.tagName === 'DIV' && ![...a.parentElement.children].some((k) => k.tagName !== 'A')).map((a) => { const b = a.getBoundingClientRect(); return [r1(b.left), r1(b.right)]; });
  }
  out.h1 = document.querySelectorAll('h1').length;
  out.headings = [...document.querySelectorAll('[id^="shopify-section-template"] h1, [id^="shopify-section-template"] h2, [id^="shopify-section-template"] h3, [id^="shopify-section-template"] h4')].map((h) => h.tagName.toLowerCase());
  return out;
};

export async function openBrowser(withTheme) {
  const browser = await chromium.launch();
  const { state, loggedIn } = await loginState(browser, withTheme);
  if (!loggedIn) throw new Error('login failed');
  return { browser, state };
}
