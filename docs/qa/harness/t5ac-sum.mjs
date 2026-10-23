// Group TOG raw entries: node t5ac-sum.mjs <rawDir> <glob-regex> [--sz]
import { readdirSync, readFileSync } from 'node:fs';
const [dir, re = '.', flag] = process.argv.slice(2);
const g = new Map(); let runs = 0, invalid = 0;
for (const f of readdirSync(dir).filter((f) => f.startsWith('tog-') && new RegExp(re).test(f))) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); runs++;
  if (!j.valid) { invalid++; console.log('INVALID', f, j.why); continue; }
  for (const e of j.entries) {
    if (e.sz && flag !== '--sz') continue;
    const k = [e.owner, e.tag, e.pseudo, e.prop, e.on, e.off].join(' | ');
    const x = g.get(k) || { n: 0, runs: new Set(), ex: [] };
    x.n++; x.runs.add(`${j.key}@${j.w}`); if (x.ex.length < 2) x.ex.push(`${e.cls}|${e.t}|${e.path.slice(-50)}`); g.set(k, x);
  }
}
console.log(`runs=${runs} invalid=${invalid} groups=${g.size}`);
for (const [k, x] of [...g].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`${x.n}x [${x.runs.size} runs] ${k}\n     ${x.ex.join(' ;; ')}`);
