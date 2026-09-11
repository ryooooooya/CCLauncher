import { mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync, readdirSync, lstatSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { digest, sectionsOf } from '../src/cli/knowledge.js';
import { choices } from '../src/cli/config.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries) || !manifest.contexts) throw new Error('Invalid manifest');
const approved = JSON.parse(readFileSync(resolve(root, 'distribution-files.json'), 'utf8'));
if (!Array.isArray(approved) || new Set(approved).size !== approved.length || approved.some(path => typeof path !== 'string' || !/^[a-zA-Z0-9_.\/\[\]-]+$/.test(path) || path.startsWith('/') || path.split('/').some(part => !part || part === '.' || part === '..'))) throw new Error('Invalid distribution allowlist');
const allowed = new Set(approved);
function source(path) {
  if (!allowed.has(path)) throw new Error(`Unapproved distribution source: ${path}`);
  const name = path.split('/').at(-1);
  if ((name.startsWith('.env') && name !== '.env.example') || /\.(pem|key|p12|log)$/i.test(name)) throw new Error(`Private distribution source: ${path}`);
  const absolute = resolve(root, path);
  if (!lstatSync(absolute).isFile() || lstatSync(absolute).isSymbolicLink()) throw new Error('Distribution source must be a regular file');
  return readFileSync(absolute);
}
const files = new Map([['LICENSE', source('LICENSE')]]);
const ids = new Set();
for (const entry of manifest.entries) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || ids.has(entry.id)) throw new Error('Invalid or duplicate entry ID');
  ids.add(entry.id);
  if (!['recipe', 'standard'].includes(entry.kind) || entry.path !== `${entry.kind === 'recipe' ? 'recipes' : 'standards'}/${entry.id}.md`) throw new Error('Invalid entry path');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.verified) || !Number.isFinite(Date.parse(entry.verified)) || new Date(entry.verified).toISOString().slice(0, 10) !== entry.verified) throw new Error('Invalid verification date');
  const path = resolve(root, entry.path);
  if (!lstatSync(path).isFile()) throw new Error('Knowledge must be a regular file');
  const bytes = source(entry.path);
  if (entry.kind === 'recipe') {
    const source = bytes.toString('utf8');
    const metadata = /^---\n([\s\S]+?)\n---\n/.exec(source)?.[1];
    if (!metadata || !metadata.split('\n').includes(`id: ${entry.id}`) || !metadata.split('\n').includes(`verified: ${entry.verified}`)) throw new Error('Recipe metadata mismatch');
    for (const field of ['applies', 'topics']) {
      if (!Array.isArray(entry[field]) || !entry[field].length || entry[field].some(v => typeof v !== 'string')) throw new Error('Invalid recipe metadata list');
      const values = new RegExp(`^${field}:\\n((?:  - [a-z0-9-]+(?:\\n|$))+)`, 'm').exec(metadata)?.[1].trim().split('\n').map(v => v.trim().slice(2));
      if (JSON.stringify(values) !== JSON.stringify(entry[field])) throw new Error('Recipe metadata list mismatch');
    }
  }
  files.set(entry.path, bytes);
}
for (const [topic, rules] of Object.entries(manifest.contexts)) {
  if (!/^[a-z][a-z0-9-]*$/.test(topic) || !Array.isArray(rules)) throw new Error('Invalid topic');
  for (const rule of rules) {
    const entry = manifest.entries.find(e => e.id === rule.id);
    if (!entry || (rule.sections && (!Array.isArray(rule.sections) || !rule.sections.length))) throw new Error('Invalid context rule');
    for (const [key, values] of Object.entries(rule.when ?? {})) {
      if (!choices[key] || !Array.isArray(values) || !values.length || values.some(v => !choices[key].includes(v))) throw new Error('Invalid config selector');
    }
    sectionsOf(files.get(entry.path).toString('utf8'), rule.sections);
  }
}
function collect(dir, prefix) {
  for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    if (['node_modules', '.next', '.temp', '.branches', 'test-results', 'playwright-report'].includes(item.name)) continue;
    const path = resolve(dir, item.name);
    if (item.isSymbolicLink()) throw new Error('Package sources must not be symlinks');
    if (item.isDirectory()) collect(path, prefix);
    else if (item.isFile()) {
      const name = relative(prefix, path).replaceAll('\\', '/');
      const bytes = source(relative(root, path).replaceAll('\\', '/'));
      if (path.endsWith('.js') || path.endsWith('.mjs')) execFileSync(process.execPath, ['--check', path]);
      files.set(name, bytes);
    }
  }
}
collect(resolve(root, 'src/cli'), resolve(root, 'src'));
for (const adapter of ['claude', 'codex', 'generic']) collect(resolve(root, 'adapters', adapter), root);
collect(resolve(root, 'methods/blueprint-printer'), root);
collect(resolve(root, 'templates/webapp'), root);
collect(resolve(root, 'templates/examples/nextjs-supabase'), root);
files.set('templates/webapp/scripts/config.mjs', source('src/cli/config.js'));
for (const path of approved) source(path);
rmSync(resolve(root, 'dist'), { recursive: true, force: true });
const hashes = {};
for (const [name, bytes] of [...files].sort(([a], [b]) => a < b ? -1 : 1)) {
  const path = resolve(root, 'dist', name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
  hashes[name] = digest(bytes);
}
chmodSync(resolve(root, 'dist/cli/index.js'), 0o755);
writeFileSync(resolve(root, 'dist/manifest.json'), JSON.stringify({ ...manifest, packageName: pkg.name, packageVersion: pkg.version, files: hashes }, null, 2) + '\n');
