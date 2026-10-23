// T3 Coder: C3.2(b): Step 0 schema JSON with color_scheme objects filtered out deep-equals HEAD's schema.
// Usage: node t3c-schema.mjs <step0Dir with <name>.schema.json files> (compares with the working tree's sections/<name>.liquid)
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
const dir = process.argv[2];
const extract = (t) => JSON.parse(t.slice(t.indexOf('{% schema %}') + 12, t.indexOf('{% endschema %}')));
const filt = (arr) => arr.filter((o) => o.type !== 'color_scheme');
for (const n of ['image-banner', 'material-spotlight', 'related-products']) {
  const a = JSON.parse(readFileSync(`${dir}/${n}.schema.json`, 'utf8'));
  const b = extract(readFileSync(`sections/${n}.liquid`, 'utf8'));
  const { settings: as, ...ar } = a; const { settings: bs, ...br } = b;
  const hasCs = a.settings.filter((o) => o.type === 'color_scheme').length;
  console.log(n, 'step0 color_scheme objects', hasCs, 'head', b.settings.filter((o) => o.type === 'color_scheme').length, 'settings equal after filter', isDeepStrictEqual(filt(as), bs), 'other keys equal', isDeepStrictEqual(ar, br));
}
