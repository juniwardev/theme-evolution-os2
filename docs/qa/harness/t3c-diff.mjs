// T3 Coder: C3.12 geometry diff (base vs head dumps from t3c-dump.mjs). Prints every named element whose x/y/w/h moved > 1 px.
// Usage: node t3c-diff.mjs <dumpDir> [pagesCsv=home,land] [widthsCsv=375,1440]
import { readFileSync, existsSync } from 'node:fs';
const [dir, pagesArg, widthsArg] = process.argv.slice(2);
const pages = (pagesArg || 'home,land').split(','); const widths = (widthsArg || '375,1440').split(',');
for (const p of pages) for (const w of widths) {
  const fa = `${dir}/base-${p}-${w}.json`, fb = `${dir}/head-${p}-${w}.json`;
  if (!existsSync(fa) || !existsSync(fb)) { console.log(`== ${p} @${w}: missing dump`); continue; }
  const a = JSON.parse(readFileSync(fa, 'utf8')).m.named, b = JSON.parse(readFileSync(fb, 'utf8')).m.named;
  console.log(`== ${p} @${w}`);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => (a[k] && a[k].w !== undefined) || (b[k] && b[k].w !== undefined));
  for (const k of keys) {
    const x = a[k], y = b[k];
    if (!x || !y) { console.log(`  ${k.padEnd(26)} ${x ? 'base only' : 'head only'}`); continue; }
    const moved = ['x', 'y', 'w', 'h'].some((f) => Math.abs(x[f] - y[f]) > 1);
    const row = `${k.padEnd(26)} base ${x.x},${x.y},${x.w},${x.h} -> head ${y.x},${y.y},${y.w},${y.h}`;
    console.log(`  ${moved ? 'MOVED ' : 'same  '}${row}`);
  }
}
