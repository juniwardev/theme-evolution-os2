// T5a proxies (PXZ zoo, PXE empty sinks, PXA announcement, PXP tooltip, PXR rich-text shells, PXG gift card) written into a SCRATCH copy only.
// Never run against the repo tree. The scratch copy must not be rebuilt afterwards (every class is already compiled): `cmp` its assets/tailwind.css with the build's.
// Usage: node t5ac-proxy.mjs gen <scratchDir>   (a `git archive` copy of the build under test)
import { readFileSync, writeFileSync } from 'node:fs';

const dir = process.argv[3];
if (process.argv[2] !== 'gen' || !dir || /theme-evolution-os2\/?$/.test(dir)) throw new Error('usage: gen <scratchDir> (never the repo)');
if (!/scratch|tmp/.test(dir)) throw new Error('refusing: dir does not look like a scratch path');

const rd = (f) => readFileSync(`${dir}/${f}`, 'utf8');
function editJson(path, fn) {
  const src = readFileSync(path, 'utf8');
  const cut = src.indexOf('*/') >= 0 && src.trimStart().startsWith('/*') ? src.indexOf('*/') + 2 : 0;
  const head = src.slice(0, cut); const j = JSON.parse(src.slice(cut));
  fn(j);
  writeFileSync(path, head + '\n' + JSON.stringify(j, null, 2) + '\n');
}

// ---- PXZ ----
const vendorLine = rd('snippets/card-product.liquid').match(/<div class="([^"]*)">\{\{ card_product\.vendor \}\}<\/div>/);
if (!vendorLine) throw new Error('vendor line not found');
const ZOO_FIX = '<h1 data-t5-zoo="h1">Heading one</h1><h2 data-t5-zoo="h2">Heading two</h2><h3>Heading three</h3><h4>Heading four</h4><h5>Heading five</h5><h6 data-t5-zoo="h6">Heading six</h6><p>Paragraph with <a href="#z">a link</a> and <a data-t5-zoo="nohref">an anchor without href</a>.</p><blockquote data-t5-zoo="quote"><p>A quote.</p></blockquote><hr data-t5-zoo="hr"><table data-t5-zoo="table"><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table><ul><li>One</li></ul><ol><li>One</li></ol><details data-t5-zoo="details"><summary>Summary</summary><p>Body</p></details><label data-t5-zoo="checkbox"><input type="checkbox"> Check</label><input type="text" placeholder="Text"><select><option>A</option></select><textarea></textarea><button type="button" data-t5-zoo="button">Bare button</button><div data-t5-zoo="empty-div"></div><a href="#e" data-t5-zoo="empty-a"></a><ul data-t5-zoo="empty-ul"></ul><h3 data-t5-zoo="empty-h"></h3><div class="flex flex-col gap-4" data-t5-zoo="gap"><div>One</div><div></div><div>Two</div></div><div class="flex w-20" data-t5-zoo="longword"><h2>Supercalifragilisticexpialidocious12345</h2></div>';
const ZOO_SHOP = '<span class="visually-hidden" data-t5-zoo="vh">Hidden text</span><div class="shopify-challenge__container" data-t5-zoo="challenge"><p class="shopify-challenge__message">Message</p><button type="submit" class="shopify-challenge__button">Submit</button></div><div class="shopify-payment-button" data-t5-zoo="pay"><button type="button" class="shopify-payment-button__button shopify-payment-button__button--unbranded">Buy it now</button></div>';
const vendorCopy = `<div class="flex flex-col gap-[0.4375rem]" data-t5-zoo="vendor"><div>Title</div><div class="${vendorLine[1]}"></div><div>Price</div></div>`;
const proseCopy = ZOO_FIX.replace('<h1 data-t5-zoo="h1">Heading one</h1>', '<h2 data-t5-zoo="h1">Heading one</h2>').replace(/ data-t5-zoo="(longword|gap)"/g, ' data-t5-zoo="p-$1"').replace(/data-t5-zoo="(?!p-)([^"]*)"/g, 'data-t5-zoo="p-$1"');
writeFileSync(`${dir}/templates/page.t5-zoo.liquid`,
  `<div class="shopify-section" data-t5-fixture="zoo"><div data-t5-fixture="zoo-bare">${ZOO_FIX}</div><div class="prose prose-tokens" data-rich-text data-t5-fixture="zoo-prose">${proseCopy}</div>${ZOO_SHOP}${vendorCopy}</div>\n`);

// ---- PXR (copied from T4c's generator; class strings extracted from this copy's own files) ----
const RT_FIX = '<h2 data-t5-fixture="rt-first">Heading two</h2><p>First paragraph with <a href="#rt">a link</a>, <strong>bold Organic Cotton</strong>, <em>italic</em> and <code>code</code>.</p><p>Second paragraph about Recycled Polyester.</p><ul><li>One</li><li>Two<ul><li>Nested</li></ul></li></ul><ol><li>First</li><li>Second</li></ol><blockquote><p>A quote.</p></blockquote><hr><h3>Heading three</h3><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table><pre><code>pre code</code></pre>';
const must = (m, what) => { if (!m) throw new Error('extract failed: ' + what); return m; };
const cls = (c) => (c ? ` class="${c}"` : '');
{
  const page = rd('sections/page.liquid'), article = rd('sections/article.liquid'), blog = rd('sections/blog.liquid'), arch = rd('sections/main-material-archive.liquid'), prod = rd('sections/product.liquid'), pw = rd('sections/password.liquid');
  const rich = (src, expr) => must(src.match(new RegExp(`<div(?: class="([^"]*)")? data-rich-text[^>]*>\\{\\{ ${expr.replace(/\./g, '\\.')} \\}\\}`)), expr)[1] || '';
  const lines = arch.split('\n');
  const i = must(lines.findIndex((l) => l.includes('{{ page.content }}')) + 1, 'archive line');
  const inner = must(lines[i - 1].match(/<div(?: class="([^"]*)")? data-rich-text/), 'archive inner')[1] || '';
  const prev = lines[i - 2].match(/<div class="([^"]*)">\s*$/);
  const outer = prev && !lines[i - 2].includes('data-rich-text') && lines[i - 2].includes('<div') && !lines[i - 2].includes('{%') ? prev[1] : null;
  const prodLines = prod.split('\n');
  const dIdx = prodLines.findIndex((l) => l.includes('description_with_tooltips') && l.includes('assign'));
  const wrap = prodLines.slice(0, dIdx).reverse().find((l) => /<div[^>]*block\.shopify_attributes/.test(l));
  const c = {
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
  const sec = (inner2, label) => `<div class="shopify-section" data-t5-copy="${label}">${inner2}</div>`;
  const rt = (klass) => `<div${cls(klass)} data-rich-text data-t5-fixture="rt-content">${RT_FIX}</div>`;
  const parts = [
    sec(`<div class="${c.shell}" data-page-shell>${rt(c.page)}</div>`, 'page'),
    sec(`<div class="${c.shell}" data-page-shell>${rt(c.article)}</div>`, 'article'),
    sec(`<div class="${c.shell}" data-page-shell>${rt(c.comment)}</div>`, 'comment'),
    sec(`<div class="${c.shell}" data-page-shell>${rt(c.excerpt)}</div>`, 'excerpt'),
    sec(`<div class="${c.archHeader}">${c.archOuter ? `<div class="${c.archOuter}">${rt(c.archInner)}</div>` : rt(c.archInner)}</div>`, 'archive'),
    sec(`<div class="${c.prodOuter}"><div class="${c.prodImg}">&nbsp;</div><div class="${c.prodCol}">${rt(c.prodDesc)}</div></div>`, 'product'),
    sec(`<div class="${c.shell}" data-page-shell><form class="${c.formComment}" data-t5-fixture="rt-content" data-t5-copy="form-comment"><div class="errors"><ul><li>zz</li></ul></div></form></div>`, 'form-comment'),
    sec(`<div class="${c.shell}" data-page-shell><form class="${c.formPassword}" data-t5-fixture="rt-content" data-t5-copy="form-password"><div class="errors"><ul><li>zz</li></ul></div></form></div>`, 'form-password'),
  ];
  writeFileSync(`${dir}/templates/page.t5-rt.liquid`, `<div data-t5-fixture="rt">${parts.join('\n')}</div>\n`);
}

// ---- PXG ----
{
  let g = rd('templates/gift_card.liquid');
  const n0 = g.length;
  g = g.replace('<h1>{{ gift_card.balance | money }}</h1>', '<h1>$50.00</h1>');
  g = g.replace(/\{% if gift_card\.enabled == false or gift_card\.expired %\}[\s\S]*?\{% endif %\}/, '');
  g = g.replace(/\{% if gift_card\.expires_on %\}[\s\S]*?\{% endif %\}/, '<p>Expires on January 1, 2030</p>');
  g = g.replace('{{ gift_card.code | format_code }}', 'ABCD EFGH IJKL MNOP');
  g = g.replace('{% if gift_card.pass_url %}', '{% if true %}').replace('href="{{ gift_card.pass_url }}"', 'href="#"');
  g = g.replace('<main class="text-center">', '<main class="text-center" data-t5-fixture="gift">');
  if (!g.includes('data-t5-fixture="gift"') || /\{\{\s*gift_card\.|\{%[^%]*gift_card\./.test(g)) throw new Error('PXG replacements incomplete');
  writeFileSync(`${dir}/templates/page.t5-gift.liquid`, g);
}

// ---- PXE ----
editJson(`${dir}/templates/index.json`, (j) => { const s = j.sections['image-banner'].blocks.button.settings; s.button_label_1 = ''; s.button_label_2 = ''; });
// ---- PXA ----
editJson(`${dir}/sections/header-group.json`, (j) => { Object.assign(j.sections.header.settings, { show_announcement: true, announcement_text: 'T5 announcement probe' }); });
// ---- PXP ----
{
  const p = `${dir}/sections/product.liquid`;
  const s = readFileSync(p, 'utf8');
  const n = s.replace('{%- assign description_with_tooltips = product.description -%}', `{%- assign description_with_tooltips = '<p data-t5-fixture="pxp">Organic Cotton and Recycled Polyester.</p>' -%}`);
  if (n === s) throw new Error('PXP replacement failed');
  writeFileSync(p, n);
}
console.log('proxies written to', dir);
