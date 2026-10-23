// T4c proxies. `gen <dir>` writes templates/page.tw-rt.liquid (PXR) into a SCRATCH copy, generated from that copy's own section files
// (class strings extracted by regex, so the proxy cannot drift). View at /pages/contact?view=tw-rt. Never run against the repo tree.
// The scratch copy must not be rebuilt afterwards (every class must already be compiled).
// Usage: node t4cc-proxy.mjs gen <scratchDir>
import { readFileSync, writeFileSync } from 'node:fs';

export const RT_FIX = '<h2 data-t4cc-fixture="rt-first">Heading two</h2><p>First paragraph with <a href="#rt">a link</a>, <strong>bold Organic Cotton</strong>, <em>italic</em> and <code>code</code>.</p><p>Second paragraph about Recycled Polyester.</p><ul><li>One</li><li>Two<ul><li>Nested</li></ul></li></ul><ol><li>First</li><li>Second</li></ol><blockquote><p>A quote.</p></blockquote><hr><h3>Heading three</h3><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table><pre><code>pre code</code></pre>';

const must = (m, what) => { if (!m) throw new Error('extract failed: ' + what); return m; };
const cls = (c) => (c ? ` class="${c}"` : '');

export function extract(dir) {
  const rd = (f) => readFileSync(`${dir}/sections/${f}`, 'utf8');
  const page = rd('page.liquid'), article = rd('article.liquid'), blog = rd('blog.liquid'), arch = rd('main-material-archive.liquid'), prod = rd('product.liquid'), pw = rd('password.liquid');
  const rich = (src, expr) => {
    const m = must(src.match(new RegExp(`<div(?: class="([^"]*)")? data-rich-text[^>]*>\\{\\{ ${expr.replace(/\./g, '\\.')} \\}\\}`)), expr);
    return m[1] || '';
  };
  const lines = arch.split('\n');
  const i = must(lines.findIndex((l) => l.includes('{{ page.content }}')) + 1, 'archive line');
  const inner = must(lines[i - 1].match(/<div(?: class="([^"]*)")? data-rich-text/), 'archive inner')[1] || '';
  const prev = lines[i - 2].match(/<div class="([^"]*)">\s*$/);
  const outer = prev && !lines[i - 2].includes('data-rich-text') && lines[i - 2].includes('<div') && !lines[i - 2].includes('{%') ? prev[1] : null;
  const prodLines = prod.split('\n');
  const dIdx = prodLines.findIndex((l) => l.includes('description_with_tooltips') && l.includes('assign'));
  const wrap = prodLines.slice(0, dIdx).reverse().find((l) => /<div[^>]*block\.shopify_attributes/.test(l));
  return {
    shell: must(page.match(/<div class="([^"]*)" data-page-shell>/), 'shell')[1],
    page: rich(page, 'page.content'), article: rich(article, 'article.content'), comment: rich(article, 'comment.content'), excerpt: rich(blog, 'article.excerpt'),
    archHeader: must(arch.match(/<div class="(mx-auto mb-16[^"]*)">/), 'archive header')[1], archOuter: outer, archInner: inner,
    prodOuter: must(prod.match(/<div class="(mx-auto flex w-full max-w-page[^"]*)">/), 'prod outer')[1],
    prodImg: must(prod.match(/<div class="(md:max-w-\[50%\][^"]*)">/), 'prod img col')[1],
    prodCol: must(prod.match(/<div class="(flex min-w-0 flex-col gap-4[^"]*)">/), 'prod col')[1],
    prodDesc: must(wrap.match(/<div(?: class="([^"]*)")?[^>]*block\.shopify_attributes/), 'prod wrapper')[1] || '',
    formComment: must(article.match(/\{% form 'new_comment', article, class: '([^']*)'/), 'comment form')[1],
    formPassword: must(pw.match(/\{% form 'storefront_password', class: '([^']*)'/), 'password form')[1],
  };
}

export function template(c) {
  const sec = (inner, label) => `<div class="shopify-section" data-t4cc-copy="${label}">${inner}</div>`;
  const rt = (klass, label) => `<div${cls(klass)} data-rich-text data-t4cc-fixture="rt-content">${RT_FIX}</div>`;
  const parts = [
    sec(`<div class="${c.shell}" data-page-shell>${rt(c.page)}</div>`, 'page'),
    sec(`<div class="${c.shell}" data-page-shell>${rt(c.article)}</div>`, 'article'),
    sec(`<div class="${c.shell}" data-page-shell>${rt(c.comment)}</div>`, 'comment'),
    sec(`<div class="${c.shell}" data-page-shell>${rt(c.excerpt)}</div>`, 'excerpt'),
    sec(`<div class="${c.archHeader}">${c.archOuter ? `<div class="${c.archOuter}">${rt(c.archInner)}</div>` : rt(c.archInner)}</div>`, 'archive'),
    sec(`<div class="${c.prodOuter}"><div class="${c.prodImg}">&nbsp;</div><div class="${c.prodCol}">${rt(c.prodDesc)}</div></div>`, 'product'),
    sec(`<div class="${c.shell}" data-page-shell><form class="${c.formComment}" data-t4cc-fixture="rt-content" data-t4cc-copy="form-comment"><div class="errors"><ul><li>zz</li></ul></div></form></div>`, 'form-comment'),
    sec(`<div class="${c.shell}" data-page-shell><form class="${c.formPassword}" data-t4cc-fixture="rt-content" data-t4cc-copy="form-password"><div class="errors"><ul><li>zz</li></ul></div></form></div>`, 'form-password'),
  ];
  return `<div data-t4cc-fixture="rt">${parts.join('\n')}</div>\n`;
}

if (process.argv[2] === 'gen') {
  const dir = process.argv[3];
  const c = extract(dir);
  writeFileSync(`${dir}/templates/page.tw-rt.liquid`, template(c));
  console.log(JSON.stringify(c, null, 1));
}

// PXS: scratch-copy edits for the non-prose sinks. `pxs <dir> [palette]`; PX6 palette via `px6 <dir>`; PXW via `pxw <dir>`.
function editJson(path, fn) {
  const src = readFileSync(path, 'utf8');
  const cut = src.indexOf('*/') >= 0 && src.trimStart().startsWith('/*') ? src.indexOf('*/') + 2 : 0;
  const head = src.slice(0, cut); const j = JSON.parse(src.slice(cut));
  fn(j);
  writeFileSync(path, head + '\n' + JSON.stringify(j, null, 2) + '\n');
}
if (process.argv[2] === 'pxs') {
  const dir = process.argv[3];
  editJson(`${dir}/sections/footer-group.json`, (j) => {
    j.sections.footer.settings.about_text = '<p>About <a href="#f">us</a></p><ul><li>One</li><li>Two</li></ul>';
    if (process.argv[4] === 'palette') j.sections.footer.settings.footer_text = '#ee1188';
  });
  editJson(`${dir}/templates/index.json`, (j) => {
    const b = j.sections['image-banner'];
    b.blocks.heading.settings.heading = 'Shop <a href="#b">now</a>';
    b.blocks.t4cc_text = { type: 'text', settings: { text: 'Read <a href="#t">more</a>', text_style: 'body' } };
    const i = b.block_order.indexOf('heading');
    b.block_order.splice(i + 1, 0, 't4cc_text');
  });
  editJson(`${dir}/templates/product.json`, (j) => {
    j.sections['related-products'].settings.heading = 'You may <a href="#r">also</a> like';
  });
  console.log('pxs edits applied to', dir);
}
if (process.argv[2] === 'px6' || process.argv[2] === 'pxw') {
  const dir = process.argv[3];
  editJson(`${dir}/config/settings_data.json`, (j) => {
    if (process.argv[2] === 'px6') { j.current.foreground_color = '#ee1188'; j.current.background_color = '#112233'; }
    else j.current.max_page_width = '110rem';
  });
  console.log(process.argv[2], 'applied to', dir);
}
