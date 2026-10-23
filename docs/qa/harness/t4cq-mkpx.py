"""Build a scratch proxy tree from a git-archive copy of HEAD (never the repo tree).
usage: python3 -I t4cq-mkpx.py <head_copy_dir> <out_dir> [palette|wide]
Adds: templates/page.qa-rt.liquid (RT fixtures with the head files' own class strings),
PXP (fixture description in product.liquid), PXS (footer about_text, banner heading and text block,
related-products heading), optional palette (#ee1188 on #112233) or wide (max_page_width 110rem).
"""
import json, re, shutil, sys, os

src, out = sys.argv[1], sys.argv[2]
mode = sys.argv[3] if len(sys.argv) > 3 else ''
if os.path.exists(out):
    shutil.rmtree(out)
shutil.copytree(src, out, symlinks=True)

FIX = ('<h2>Heading two</h2><p>First paragraph with <a href="#rt">a link</a>, <strong>bold Organic Cotton</strong>, <em>italic</em> and <code>code</code>.</p>'
       '<p>Second paragraph about Recycled Polyester.</p><ul><li>One</li><li>Two<ul><li>Nested</li></ul></li></ul><ol><li>First</li><li>Second</li></ol>'
       '<blockquote><p>A quote.</p></blockquote><hr><h3>Heading three</h3><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'
       '<pre><code>pre code</code></pre>')

def rd(p):
    return open(os.path.join(out, p)).read()

def wr(p, s):
    open(os.path.join(out, p), 'w').write(s)

shell = re.search(r'<div class="(flex flex-col gap-8[^"]*)" data-page-shell>', rd('sections/page.liquid')).group(1)
archive = rd('sections/main-material-archive.liquid')
a_outer = re.search(r'<div class="([^"]*)">\n\s*<div class="prose prose-tokens max-w-none" data-rich-text>', archive).group(1)
a_head = re.search(r'<div class="(mx-auto mb-16 max-w-\[37.5rem\] text-center)">', archive).group(1)
pdp = rd('sections/product.liquid')
form_cls = re.findall(r"class: '([^']*\[&_ul\][^']*)'", rd('sections/article.liquid') + rd('sections/password.liquid'))
err = '<div class="errors"><ul><li>zz</li></ul></div>'

def sec(inner):
    return '<div class="shopify-section">' + inner + '</div>'

tpl = '<div data-qa="rt">\n'
tpl += sec(f'<div class="{shell}" data-page-shell><div class="prose prose-tokens overflow-x-auto" data-rich-text data-qa="page">{FIX}</div></div>') + '\n'
tpl += sec(f'<div class="{shell}" data-page-shell><div class="prose prose-tokens" data-rich-text data-qa="article">{FIX}</div></div>') + '\n'
tpl += sec(f'<div class="{shell}" data-page-shell><div class="prose prose-tokens" data-rich-text data-qa="comment">{FIX}</div></div>') + '\n'
tpl += sec(f'<div class="{shell}" data-page-shell><div class="prose prose-tokens" data-rich-text data-qa="excerpt">{FIX}</div></div>') + '\n'
tpl += sec(f'<div class="{a_head}"><div class="{a_outer}"><div class="prose prose-tokens max-w-none" data-rich-text data-qa="archive">{FIX}</div></div></div>') + '\n'
for i, c in enumerate(form_cls):
    tpl += sec(f'<form class="{c}" data-qa="form{i}">{err}</form>') + '\n'
tpl += '</div>\n'
wr('templates/page.qa-rt.liquid', tpl)

if mode != 'nopdp':
    cap = '{%- capture qa_fix -%}' + FIX + '{%- endcapture -%}\n            '
    s = rd('sections/product.liquid')
    s = s.replace('{%- assign description_with_tooltips = product.description -%}', cap + '{%- assign description_with_tooltips = qa_fix -%}', 1)
    assert 'qa_fix' in s
    wr('sections/product.liquid', s)

# PXS
fg = json.loads(re.sub(r'^/\*.*?\*/', '', rd('sections/footer-group.json'), flags=re.S))
fg['sections']['footer']['settings']['about_text'] = '<p>About <a href="#f">us</a></p><ul><li>One</li><li>Two</li></ul>'
wr('sections/footer-group.json', json.dumps(fg, indent=2))
ix = json.loads(re.sub(r'^/\*.*?\*/', '', rd('templates/index.json'), flags=re.S))
ib = ix['sections']['image-banner']
ib['blocks']['heading']['settings']['heading'] = 'Shop <a href="#b">now</a>'
ib['blocks']['t4cq_text'] = dict(type='text', settings=dict(text='Read <a href="#t">more</a>', text_style='body'))
ib['block_order'].insert(1, 't4cq_text')
wr('templates/index.json', json.dumps(ix, indent=2))
pj = json.loads(re.sub(r'^/\*.*?\*/', '', rd('templates/product.json'), flags=re.S))
pj['sections']['related-products']['settings']['heading'] = 'You may <a href="#r">also</a> like'
wr('templates/product.json', json.dumps(pj, indent=2))

sd = json.loads(re.sub(r'^/\*.*?\*/', '', rd('config/settings_data.json'), flags=re.S))
if mode == 'palette':
    sd['current'].update(foreground_color='#ee1188', background_color='#112233')
if mode == 'wide':
    sd['current'].update(max_page_width='110rem')
wr('config/settings_data.json', json.dumps(sd, indent=2))
print('built', out, 'forms', len(form_cls), mode)
