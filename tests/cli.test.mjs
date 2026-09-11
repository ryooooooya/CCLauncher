import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync, symlinkSync, cpSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaults } from '../src/cli/config.js';
import { doctor } from '../src/cli/doctor.js';
import { sectionsOf } from '../src/cli/knowledge.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = resolve(root, 'dist/cli/index.js');
function temp(t) { const dir = mkdtempSync(resolve(tmpdir(), 'cc-cli-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return dir; }
function run(dir, args, entry = cli) { return spawnSync(process.execPath, [entry, ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, HTTP_PROXY: 'http://127.0.0.1:1', HTTPS_PROXY: 'http://127.0.0.1:1', npm_config_offline: 'true' } }); }
function ok(result) { assert.equal(result.status, 0, result.stderr); return result.stdout; }
function config(dir, value = defaults()) { writeFileSync(resolve(dir, '.cclauncher.json'), JSON.stringify(value)); }
function listing(dir, prefix = '') { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? listing(resolve(dir, e.name), prefix + e.name + '/') : [prefix + e.name]).sort(); }

test('init generates only project scaffolding and preserves package.json', t => {
  const dir = temp(t);
  const pkg = '{"name":"consumer","private":true}\n';
  writeFileSync(resolve(dir, 'package.json'), pkg);
  ok(run(dir, ['init', '--yes', '--auth', 'supabase', '--database', 'supabase', '--pii', 'true', '--external-api', 'true']));
  for (const p of ['AGENTS.md', '.cclauncher.json', 'docs/PRODUCT.md', 'docs/ARCHITECTURE.md', 'docs/SECURITY.md', 'tests/security/README.md', 'scripts/verify.sh', 'scripts/security-check.sh', '.github/workflows/cclauncher-verify.yml', 'supabase/tests/database/README.md']) assert.ok(existsSync(resolve(dir, p)), p);
  assert.equal(readFileSync(resolve(dir, 'package.json'), 'utf8'), pkg);
  assert.ok(listing(dir).every(p => !p.startsWith('recipes/') && !p.startsWith('standards/') && !p.startsWith('node_modules/')));
  assert.match(readFileSync(resolve(dir, 'docs/SECURITY.md'), 'utf8'), /Provider: supabase/);
  assert.match(readFileSync(resolve(dir, 'docs/SECURITY.md'), 'utf8'), /PII\n\nEnabled: true/);
  const c = JSON.parse(readFileSync(resolve(dir, '.cclauncher.json')));
  assert.equal(c.features.externalApi, true);
  assert.equal(c.auth, 'supabase');
  const verify = spawnSync('sh', ['scripts/verify.sh'], { cwd: dir, encoding: 'utf8' });
  assert.equal(verify.status, 1);
  assert.match(verify.stderr, /Missing package script/);
});

test('init preflights conflicts, repeats safely, and rejects symlink parents and leaf files', t => {
  const dir = temp(t), outside = temp(t);
  mkdirSync(resolve(dir, 'docs'));
  writeFileSync(resolve(dir, 'docs/SECURITY.md'), 'existing decisions');
  const before = listing(dir);
  assert.equal(run(dir, ['init', '--yes']).status, 1);
  assert.deepEqual(listing(dir), before);
  assert.equal(readFileSync(resolve(dir, 'docs/SECURITY.md'), 'utf8'), 'existing decisions');
  rmSync(resolve(dir, 'docs'), { recursive: true });
  symlinkSync(outside, resolve(dir, 'docs'));
  assert.equal(run(dir, ['init', '--yes']).status, 1);
  assert.deepEqual(listing(outside), []);
  rmSync(resolve(dir, 'docs'));
  symlinkSync(resolve(outside, 'missing'), resolve(dir, 'AGENTS.md'));
  assert.equal(run(dir, ['init', '--yes']).status, 1);
  assert.deepEqual(listing(outside), []);
  rmSync(resolve(dir, 'AGENTS.md'));
  ok(run(dir, ['init', '--yes']));
  const generated = listing(dir);
  assert.equal(run(dir, ['init', '--yes']).status, 1);
  assert.deepEqual(listing(dir), generated);
});

test('prototype omits production CI, and init can target a new directory', t => {
  const dir = temp(t), target = resolve(dir, 'new app');
  ok(run(dir, ['init', '--yes', '--dir', target, '--scope', 'prototype', '--framework', 'none']));
  assert.ok(existsSync(resolve(target, 'AGENTS.md')));
  assert.ok(!existsSync(resolve(target, '.github')));
  assert.ok(!existsSync(resolve(target, 'supabase')));
  assert.equal(JSON.parse(readFileSync(resolve(target, '.cclauncher.json'))).scope, 'prototype');
});

test('CLI rejects malformed options and config without writing files or exposing content', t => {
  const dir = temp(t);
  for (const args of [['init'], ['init', '--yes', '--auth', 'invented'], ['init', '--yes', '--pii', 'yes'], ['init', '--yes', '--model', 'anything'], ['init', '--yes', '--dir'], ['init', '--yes', '--yes'], ['recipe', '../../package.json'], ['recipe', '__proto__'], ['recipe', 'supabase', '--dir', dir]]) assert.notEqual(run(dir, args).status, 0, args.join(' '));
  assert.deepEqual(listing(dir), []);
  for (const bad of [{ ...defaults(), implementer: 'model' }, { ...defaults(), schemaVersion: 2 }, { ...defaults(), features: { ...defaults().features, model: 'x' } }, { ...defaults(), features: { ...defaults().features, pii: 'false' } }, []]) {
    config(dir, bad);
    const result = run(dir, ['context', 'auth']);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
  }
  writeFileSync(resolve(dir, '.cclauncher.json'), 'not-json secret-value');
  assert.doesNotMatch(run(dir, ['doctor']).stdout, /secret-value/);
});

test('recipe is exact offline content, context selects sections and is deterministic', t => {
  const dir = temp(t);
  assert.equal(ok(run(dir, ['recipe', 'supabase'])), readFileSync(resolve(root, 'recipes/supabase.md'), 'utf8'));
  const c = { ...defaults(), auth: 'supabase', database: 'supabase' };
  config(dir, c);
  const first = ok(run(dir, ['context', 'auth']));
  assert.match(first, /Authorization — 最優先/);
  assert.match(first, /IdentityとSSR/);
  assert.doesNotMatch(first, /Postgresの境界|Storageを使う場合だけ|# Auth.js/);
  config(dir, Object.fromEntries(Object.entries(c).reverse()));
  assert.equal(ok(run(dir, ['context', 'auth'])), first);
  assert.equal(ok(run(dir, ['context', 'auth', '--dir', dir])), first);
  const db = ok(run(dir, ['context', 'database']));
  assert.match(db, /Postgresの境界/);
  assert.doesNotMatch(db, /IdentityとSSR|Storageを使う場合だけ/);
  config(dir, { ...defaults(), auth: 'authjs' });
  assert.match(ok(run(dir, ['context', 'auth'])), /# Auth.js/);
  assert.doesNotMatch(ok(run(dir, ['context', 'auth'])), /IdentityとSSR/);
  config(dir);
  assert.doesNotMatch(ok(run(dir, ['context', 'auth'])), /supabase.md|authjs.md/);
  for (const topic of ['nonexistent', '__proto__', '../../package.json']) assert.equal(run(dir, ['context', topic]).status, 1);
});

test('section extraction ignores headings inside fenced examples and rejects missing sections', () => {
  const source = '# Doc\n\n## A\n```md\n## B\n```\n\n## C\ncontent\n';
  assert.match(sectionsOf(source, ['A']), /## B/);
  assert.doesNotMatch(sectionsOf(source, ['A']), /## C/);
  assert.throws(() => sectionsOf(source, ['B']), /Missing/);
});

test('doctor reports missing project requirements, freshness and compatibility without mutation', t => {
  const dir = temp(t);
  ok(run(dir, ['init', '--yes', '--database', 'supabase']));
  const before = listing(dir).map(p => [p, readFileSync(resolve(dir, p), 'utf8')]);
  const report = run(dir, ['doctor']);
  assert.equal(report.status, 1);
  assert.match(report.stdout, /PASS security tests/);
  assert.match(report.stdout, /FAIL DB security tests/);
  assert.match(report.stdout, /FAIL local install/);
  assert.deepEqual(listing(dir).map(p => [p, readFileSync(resolve(dir, p), 'utf8')]), before);
  rmSync(resolve(dir, 'AGENTS.md'));
  rmSync(resolve(dir, 'docs/SECURITY.md'));
  const missing = run(dir, ['doctor']).stdout;
  assert.match(missing, /FAIL AGENTS.md/);
  assert.match(missing, /FAIL docs\/SECURITY.md/);
  const manifest = JSON.parse(readFileSync(resolve(root, 'dist/manifest.json')));
  const later = doctor(resolve(root, 'dist'), manifest, dir, new Date('2027-09-09T00:00:00Z'));
  assert.equal(later.checks.find(c => c.label === 'recipe freshness').status, 'WARN');
  assert.equal(later.checks.find(c => c.label === 'compatibility next').status, 'WARN');
});

test('tampered packaged content fails before any partial context output', t => {
  const dir = temp(t), packed = resolve(dir, 'package');
  mkdirSync(packed);
  cpSync(resolve(root, 'dist'), resolve(packed, 'dist'), { recursive: true });
  cpSync(resolve(root, 'package.json'), resolve(packed, 'package.json'));
  writeFileSync(resolve(packed, 'dist/recipes/supabase.md'), 'tampered');
  config(dir, { ...defaults(), auth: 'supabase' });
  const result = run(dir, ['context', 'auth'], resolve(packed, 'dist/cli/index.js'));
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /integrity mismatch/);
});

test('verification scaffold refuses missing tests and propagates runner failure before E2E', t => {
  const dir = temp(t);
  ok(run(dir, ['init', '--yes', '--framework', 'none', '--scope', 'prototype']));
  writeFileSync(resolve(dir, 'package.json'), JSON.stringify({ scripts: Object.fromEntries(['lint', 'typecheck', 'test', 'test:security', 'test:e2e', 'build'].map(s => [s, 'application-check'])) }));
  for (const name of ['authentication.spec.ts', 'authorization.spec.ts']) rmSync(resolve(dir, 'tests/security', name));
  let result = spawnSync('sh', ['scripts/verify.sh'], { cwd: dir, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No executable application security tests/);
  writeFileSync(resolve(dir, 'tests/security/boundary.test.mjs'), '// Runner fixture only; not an application security test.\n');
  const bin = resolve(dir, 'bin'); mkdirSync(bin);
  const executable = resolve(bin, 'pnpm');
  writeFileSync(executable, `#!${process.execPath}\nimport { appendFileSync } from 'node:fs';\nappendFileSync(process.env.CC_TEST_LOG, process.argv.slice(2).join(' ') + '\\n');\nprocess.exit(process.argv.includes('test:security') ? 7 : 0);\n`);
  // Make the fake runner an ESM script without changing the application's package.
  writeFileSync(resolve(bin, 'package.json'), '{"type":"module"}');
  chmodSync(executable, 0o755);
  const log = resolve(dir, 'runner.log');
  result = spawnSync('sh', ['scripts/verify.sh'], { cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CC_TEST_LOG: log } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Verification failed: pnpm run test:security/);
  assert.equal(readFileSync(log, 'utf8'), 'run lint\nrun typecheck\nrun test\nrun build\nrun test:security\n');
});

test('doctor can pass complete metadata but never runs declared application commands', t => {
  const dir = temp(t);
  ok(run(dir, ['init', '--yes', '--framework', 'none', '--scope', 'prototype']));
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json')));
  const installed = resolve(dir, 'node_modules', pkg.name);
  mkdirSync(installed, { recursive: true });
  writeFileSync(resolve(installed, 'package.json'), JSON.stringify({ name: pkg.name, version: pkg.version }));
  writeFileSync(resolve(dir, 'package.json'), JSON.stringify({ packageManager: 'pnpm@11.19.0', devDependencies: { [pkg.name]: pkg.version }, scripts: Object.fromEntries(['lint', 'typecheck', 'test', 'test:security', 'test:e2e', 'build'].map(s => [s, 'exit 91'])) }));
  writeFileSync(resolve(dir, 'pnpm-lock.yaml'), '# Metadata fixture; doctor does not validate lockfile integrity.\n');
  writeFileSync(resolve(dir, 'tests/security/boundary.test.mjs'), 'throw new Error("must not execute")');
  const result = run(dir, ['doctor']);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /PASS local install/);
  assert.match(result.stdout, /does not execute tests or certify security/);
  assert.doesNotMatch(result.stdout, /FAIL/);
});

test('optional example generates real application, DB policies and tests only for the matching stack', t => {
  const dir = temp(t);
  const target = resolve(dir, 'app');
  const args = ['init', '--yes', '--auth', 'supabase', '--database', 'supabase', '--example', 'nextjs-supabase', '--dir', target];
  ok(run(dir, args));
  for (const path of ['src/app/api/documents/[id]/route.ts', 'supabase/migrations/20260909000000_documents.sql', 'supabase/tests/database/documents.test.sql', 'tests/security/authentication.spec.ts', 'tests/security/authorization.spec.ts', 'tests/e2e/session.spec.ts', 'pnpm-lock.yaml']) assert.ok(existsSync(resolve(target, path)), path);
  const pkg = JSON.parse(readFileSync(resolve(target, 'package.json')));
  assert.equal(pkg.scripts.verify, 'sh scripts/verify.sh');
  assert.equal(pkg.scripts.build, 'next build');
  assert.ok(pkg.dependencies['@supabase/ssr']);
  assert.ok(!existsSync(resolve(target, 'recipes')));
  assert.equal(run(dir, ['init', '--yes', '--example', 'nextjs-supabase', '--dir', resolve(dir, 'invalid')]).status, 1);
  assert.ok(!existsSync(resolve(dir, 'invalid')));
  assert.equal(run(dir, args).status, 1);
});

test('adapters preserve one shared index and reject conflicts before writing', t => {
  const generic = temp(t), claude = temp(t), codex = temp(t);
  ok(run(generic, ['init', '--yes']));
  ok(run(claude, ['init', '--yes', '--adapter', 'claude']));
  ok(run(codex, ['init', '--yes', '--adapter', 'codex']));
  assert.equal(readFileSync(resolve(claude, 'CLAUDE.md'), 'utf8'), '@AGENTS.md\n');
  for (const dir of [generic, codex]) assert.ok(!existsSync(resolve(dir, 'CLAUDE.md')));
  for (const dir of [claude, codex]) {
    assert.equal(readFileSync(resolve(dir, 'AGENTS.md'), 'utf8'), readFileSync(resolve(generic, 'AGENTS.md'), 'utf8'));
    assert.equal(readFileSync(resolve(dir, '.cclauncher.json'), 'utf8'), readFileSync(resolve(generic, '.cclauncher.json'), 'utf8'));
    assert.ok(!existsSync(resolve(dir, 'adapters')));
  }
  const conflict = temp(t);
  writeFileSync(resolve(conflict, 'CLAUDE.md'), 'Existing project instructions\n');
  assert.equal(run(conflict, ['init', '--yes', '--adapter', 'claude']).status, 1);
  assert.deepEqual(listing(conflict), ['CLAUDE.md']);
  assert.equal(readFileSync(resolve(conflict, 'CLAUDE.md'), 'utf8'), 'Existing project instructions\n');
  const invalid = temp(t);
  assert.equal(run(invalid, ['init', '--yes', '--adapter', 'unknown']).status, 1);
  assert.deepEqual(listing(invalid), []);
  const workflow = ok(run(generic, ['context', 'workflow']));
  assert.equal(workflow, ok(run(codex, ['context', 'workflow'])));
  assert.match(workflow, /High-risk gate/);
  assert.match(workflow, /Verifier/);
});

test('method opt-in is isolated, complete and preflights existing design decisions', t => {
  const plain = temp(t), method = temp(t), conflict = temp(t), invalid = temp(t);
  ok(run(plain, ['init', '--yes']));
  ok(run(method, ['init', '--yes', '--method', 'blueprint-printer']));
  for (const path of ['docs/product', 'docs/design', 'src/prototypes', 'docs/BLUEPRINT-PRINTER.md']) {
    assert.ok(!existsSync(resolve(plain, path)), path);
    assert.ok(existsSync(resolve(method, path)), path);
  }
  for (const path of ['AGENTS.md', '.cclauncher.json', 'package.json']) {
    assert.equal(readFileSync(resolve(method, path), 'utf8'), readFileSync(resolve(plain, path), 'utf8'));
  }
  const mapping = JSON.parse(readFileSync(resolve(root, 'methods/blueprint-printer/scaffold.json')));
  for (const [source, target] of Object.entries(mapping)) {
    const expected = readFileSync(resolve(root, 'methods/blueprint-printer', source), 'utf8').replaceAll('{{version}}', JSON.parse(readFileSync(resolve(root, 'package.json'))).version);
    assert.equal(readFileSync(resolve(method, target), 'utf8'), expected);
  }
  assert.ok(!existsSync(resolve(method, 'recipes')));
  assert.ok(!existsSync(resolve(method, 'standards')));
  mkdirSync(resolve(conflict, 'docs/design'), { recursive: true });
  writeFileSync(resolve(conflict, 'docs/design/_rules.md'), 'Reviewed project decisions');
  const before = listing(conflict);
  assert.equal(run(conflict, ['init', '--yes', '--method', 'blueprint-printer']).status, 1);
  assert.deepEqual(listing(conflict), before);
  assert.equal(readFileSync(resolve(conflict, 'docs/design/_rules.md'), 'utf8'), 'Reviewed project decisions');
  assert.equal(run(invalid, ['init', '--yes', '--method', '../unknown']).status, 1);
  assert.deepEqual(listing(invalid), []);
});
