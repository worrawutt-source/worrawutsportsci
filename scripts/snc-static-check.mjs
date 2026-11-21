import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const base = path.join(root, 'sport-nutrition-classroom');
const failures = [];
let checked = 0;

function checkSource(label, source) {
  checked += 1;
  const result = spawnSync(process.execPath, ['--check'], { input: source, encoding: 'utf8' });
  if (result.status !== 0) failures.push({ file: label, error: (result.stderr || result.stdout || 'Syntax check failed').trim() });
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) {
      const rel = path.relative(root, full);
      if (/\.(gs|js)$/.test(entry.name)) checkSource(rel, fs.readFileSync(full, 'utf8'));
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
