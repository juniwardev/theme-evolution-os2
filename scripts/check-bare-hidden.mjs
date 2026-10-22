// Why: while assets/base.css loads, Dawn's `.hidden { display: none !important }`
// beats every utility, so `hidden md:flex` never shows. This finds the bare `hidden`
// class next to a variant-prefixed display utility in any quoted string, which covers
// class="…", class: '…' and assign x = '…'. Delete in phase T5.
// See docs/plans/theme-evolution-tailwind.md D11.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SCANNED_FOLDERS = ['layout', 'sections', 'blocks', 'snippets', 'templates'];
const QUOTED_STRING = /"[^"\n]*"|'[^'\n]*'/g;
// `hidden` as its own token: not `md:hidden`, `sr-hidden` or `[hidden]`.
const BARE_HIDDEN = /(?<![\w:[-])hidden(?![\w:-])/;
// Any variant (md:, aria-expanded:, [&.open]:, …) followed by a display value.
const VARIANT_DISPLAY =
  /[^\s"']+:(?:flex|block|grid|inline-flex|inline-block|inline-grid|inline-table|inline|table|contents|flow-root|list-item)(?![\w-])/;

function liquidFilesIn(folder) {
  return readdirSync(folder, { recursive: true })
    .filter((name) => name.endsWith('.liquid'))
    .map((name) => join(folder, name));
}

const findings = [];

for (const file of SCANNED_FOLDERS.flatMap(liquidFilesIn)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const [quoted] of line.matchAll(QUOTED_STRING)) {
      if (BARE_HIDDEN.test(quoted) && VARIANT_DISPLAY.test(quoted)) {
        findings.push(`${file}:${index + 1}: ${quoted}`);
      }
    }
  });
}

for (const finding of findings) {
  console.error(finding);
}
process.exit(findings.length > 0 ? 1 : 0);
