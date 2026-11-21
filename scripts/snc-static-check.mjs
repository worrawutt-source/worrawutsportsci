import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const base = path.join(root, 'sport-nutrition-classroom');
const failures = [];
let checked = 0;

function checkSource(label, source, isModule = false) {
  checked += 1;
  const args = isModule ? ['--check', '--input-type=module'] : ['--check'];
  const result = spawnSync(process.execPath, args, { input: source, encoding: 'utf8' });
  if (result.status !== 0) failures.push({ file: label, error: (result.stderr || result.stdout || 'Syntax check failed').trim() });
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) {
      const rel = path.relative(root, full);
      if (/\.(gs|js)$/.test(entry.name)) { const source = fs.readFileSync(full, 'utf8'); checkSource(rel, source, /\.(mjs)$/.test(entry.name) || /^\s*(?:import|export)\s/m.test(source)); }
      if (/\.html$/.test(entry.name)) {
        const html = fs.readFileSync(full, 'utf8');
        const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
        scripts.forEach((match, index) => {
          if (!/\bsrc\s*=/.test(match[1]) && match[2].trim()) checkSource(rel + '#inline-script-' + (index + 1), match[2]);
        });
      }
    }
  }
}
walk(base);
if (failures.length) {
  for (const failure of failures) console.error('\n' + failure.file + '\n' + failure.error);
  console.error('\nSyntax checks: ' + checked + ' checked, ' + failures.length + ' failed');
  process.exit(1);
}
console.log('Syntax checks: ' + checked + ' checked, 0 failed');
