/* global console, process */
// Guards the browser baseline documented in README.md:
// Chrome 61+ / Firefox 60+ / Safari 11.1+ (ES2017, no flex `gap`, no color-mix).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'acorn';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const STYLE = join(ROOT, 'src', 'style.scss');

const failures = [];

function walkJavaScript (dir) {
  let files = [];
  for (let entry of readdirSync(dir, { withFileTypes: true })) {
    let path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkJavaScript(path));
    } else if (entry.name.endsWith('.js')) {
      files.push(path);
    }
  }
  return files;
}

let jsFiles;
try {
  jsFiles = walkJavaScript(DIST);
} catch {
  console.error('check:legacy needs a build first; run `npm run build:js`.');
  process.exit(1);
}

const forbiddenApis = [
  [/\bnew DOMMatrix\b/, 'DOMMatrix is not available in Firefox 60'],
  [/\.getAnimations\s*\(/, 'Element.getAnimations is not available in Safari 11.1'],
  [/\bObject\.fromEntries\b/, 'Object.fromEntries is ES2019'],
  [/\bstructuredClone\b/, 'structuredClone is not available in the target browsers'],
  [/\.replaceAll\s*\(/, 'String.prototype.replaceAll is ES2021'],
  [/\.flatMap\s*\(/, 'Array.prototype.flatMap is ES2019'],
  [/\.at\s*\(/, 'Array.prototype.at is ES2022']
];

for (let file of jsFiles) {
  let source = readFileSync(file, 'utf8');
  try {
    parse(source, { ecmaVersion: 2017, sourceType: 'module' });
  } catch (error) {
    failures.push(`${file}: syntax newer than ES2017 (${error.message})`);
  }

  for (let [pattern, reason] of forbiddenApis) {
    if (pattern.test(source)) {
      failures.push(`${file}: ${reason}`);
    }
  }
}

let css = readFileSync(STYLE, 'utf8');
if (/\bgap\s*:/.test(css)) {
  failures.push(`${STYLE}: flex gap is not supported by Chrome 61 / Firefox 60 / Safari 11.1`);
}
if (/color-mix\s*\(/.test(css)) {
  failures.push(`${STYLE}: color-mix() is not supported by the target browsers`);
}
if (/rgb\(\s*\d+\s+\d+\s+\d+\s*\/\s*[^)]+\)/.test(css)) {
  failures.push(`${STYLE}: space-separated rgb() with alpha needs rgba() for the target browsers`);
}

if (failures.length > 0) {
  console.error('Legacy compatibility check failed:');
  for (let failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`Legacy compatibility ok: ${jsFiles.length} ES2017 modules, CSS fallbacks clean.`);
