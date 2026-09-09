import { mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)) throw new Error('Invalid manifest');
// Knowledge is introduced in Phase 2. Do not silently publish unhandled entries.
if (manifest.entries.length !== 0) throw new Error('Knowledge packaging must be implemented before adding manifest entries');
const source = resolve(root, 'src/cli/index.js');
execFileSync(process.execPath, ['--check', source]);
const cli = readFileSync(source);
rmSync(resolve(root, 'dist'), { recursive: true, force: true });
const target = resolve(root, 'dist/cli/index.js');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, cli);
chmodSync(target, 0o755);
writeFileSync(resolve(root, 'dist/manifest.json'), JSON.stringify({
  ...manifest,
  packageName: pkg.name,
  packageVersion: pkg.version,
  files: { 'cli/index.js': createHash('sha256').update(cli).digest('hex') }
}, null, 2) + '\n');
