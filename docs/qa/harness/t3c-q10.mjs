// T3 Coder: applies the three plan 5.6 deletions (color_scheme setting objects) under a root dir. Deletion only.
// Usage: node t3c-q10.mjs <rootDir>
import { readFileSync, writeFileSync } from 'node:fs';
const root = process.argv[2];
for (const f of ['image-banner', 'material-spotlight', 'related-products']) {
  const p = `${root}/sections/${f}.liquid`;
  const src = readFileSync(p, 'utf8');
  const re = / {4}\{\n {6}"type": "color_scheme",\n(?: {6}"[^\n]*\n)*? {4}\},\n/;
  if (!re.test(src)) throw new Error('no match in ' + f);
  const out = src.replace(re, '');
  console.log(f, 'removed lines', src.split('\n').length - out.split('\n').length);
  writeFileSync(p, out);
}
