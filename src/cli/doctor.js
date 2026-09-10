import { existsSync, readdirSync, lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { readConfig, readJson } from './config.js';
import { readPackaged } from './knowledge.js';

function regularFile(path) { try { return lstatSync(path).isFile(); } catch { return false; } }
function hasTests(dir, pattern) {
  if (!existsSync(dir) || !lstatSync(dir).isDirectory()) return false;
  return readdirSync(dir, { withFileTypes: true }).some(e => e.isDirectory() ? hasTests(resolve(dir, e.name), pattern) : e.isFile() && pattern.test(e.name));
}
export function doctor(dist, manifest, dir, now = new Date()) {
  const checks = [];
  const add = (status, label, detail) => checks.push({ status, label, detail });
  add('PASS', 'version', `${manifest.packageName}@${manifest.packageVersion}`);
  try {
    for (const path of Object.keys(manifest.files)) readPackaged(dist, manifest, path);
    add('PASS', 'package integrity', 'All packaged files match the manifest.');
  } catch (error) { add('FAIL', 'package integrity', error.message); }
  let config;
  try { config = readConfig(dir); add('PASS', 'config', '.cclauncher.json'); }
  catch (error) { add('FAIL', 'config', error.message); }
  for (const file of ['AGENTS.md', 'docs/SECURITY.md', 'scripts/verify.sh', 'scripts/security-check.sh', 'scripts/verify.mjs', 'pnpm-lock.yaml']) {
    add(regularFile(resolve(dir, file)) ? 'PASS' : 'FAIL', file, regularFile(resolve(dir, file)) ? 'Present.' : 'Missing regular file.');
  }
  if (config?.scope === 'production') add(regularFile(resolve(dir, '.github/workflows/cclauncher-verify.yml')) ? 'PASS' : 'WARN', 'CI', 'Review the project verification workflow and required test services.');
  let pkg;
  const require = createRequire(resolve(dir, 'package.json'));
  try {
    pkg = readJson(resolve(dir, 'package.json'));
    const installed = readJson(require.resolve(`${manifest.packageName}/package.json`));
    const spec = pkg.devDependencies?.[manifest.packageName] ?? pkg.dependencies?.[manifest.packageName];
    if (installed.version !== manifest.packageVersion || !(spec === installed.version || /^file:.*\.tgz$/.test(spec ?? ''))) throw new Error('Install this exact CCLauncher version locally and commit its lockfile.');
    add('PASS', 'local install', `${installed.name}@${installed.version}`);
  } catch (error) { add('FAIL', 'local install', error.message); }
  if (pkg) {
    add(/^pnpm@\d+\.\d+\.\d+(?:\+.*)?$/.test(pkg.packageManager ?? '') ? 'PASS' : 'FAIL', 'package manager', 'Declare an exact pnpm version in packageManager.');
    for (const script of ['lint', 'typecheck', 'test', 'test:security', 'test:e2e', 'build']) add(typeof pkg.scripts?.[script] === 'string' && pkg.scripts[script].trim() ? 'PASS' : 'FAIL', `script ${script}`, 'Must run the actual application check.');
  }
  add(hasTests(resolve(dir, 'tests/security'), /\.(test|spec)\.[cm]?[jt]sx?$/) ? 'PASS' : 'FAIL', 'security tests', 'Expected executable application boundary tests in tests/security/.');
  if (config?.database === 'supabase') add(hasTests(resolve(dir, 'supabase/tests'), /\.sql$/) ? 'PASS' : 'FAIL', 'DB security tests', 'Expected pgTAP SQL tests in supabase/tests/.');
  const stale = manifest.entries.filter(e => (now.getTime() - Date.parse(e.verified)) / 86400000 > 180 || Date.parse(e.verified) > now.getTime());
  add(stale.length ? 'WARN' : 'PASS', 'recipe freshness', stale.length ? `Review verification dates: ${stale.map(e => e.id).join(', ')}` : 'Knowledge verification dates are within 180 days.');
  for (const check of manifest.compatibility ?? []) {
    if (check.dependency === 'next' && config?.framework !== 'nextjs') continue;
    let version;
    try { version = readJson(require.resolve(`${check.dependency}/package.json`)).version; } catch {}
    add(version && Number(version.split('.')[0]) === check.major ? 'PASS' : 'WARN', `compatibility ${check.dependency}`, `${version ?? 'Not installed'}. ${check.message}`);
  }
  if (regularFile(resolve(dir, 'docs/SECURITY.md')) && /TODO/.test(readFileSync(resolve(dir, 'docs/SECURITY.md'), 'utf8'))) add('WARN', 'security decisions', 'Complete the project-specific TODOs before deployment.');
  return { checks, failed: checks.some(c => c.status === 'FAIL') };
}
