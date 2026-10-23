// C4b.22: class selector set diff between two compiled CSS files. Usage: node t4bc-selset.mjs <prev.css> <new.css>
import { readFileSync } from 'node:fs';
const set = (f) => new Set([...readFileSync(f, 'utf8').matchAll(/\.((?:\\.|[\w-])+)/g)].map((m) => m[1].replace(/\\(.)/g, '$1')).filter((c) => !/^\d/.test(c)));
const [a, b] = [set(process.argv[2]), set(process.argv[3])];
console.log('added  :', [...b].filter((x) => !a.has(x)).sort().join(' ') || '-');
console.log('removed:', [...a].filter((x) => !b.has(x)).sort().join(' ') || '-');
