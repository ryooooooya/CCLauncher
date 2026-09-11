import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync, chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaults } from '../src/cli/config.js';

const root = fileURLToPath(new URL('../', import.meta.url));
function temporary(t) { const dir = mkdtempSync(resolve(tmpdir(), 'cc-regression-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return dir; }
function node(args, cwd, env = process.env) { return spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env }); }
function init(dir) { assert.equal(node([resolve(root, 'dist/cli/index.js'), 'init', '--yes'], dir).status, 0); }

test('build rejects unapproved local files before adding them to distribution', t => {
  const dir = temporary(t);
  for (const name of ['LICENSE', 'package.json', 'manifest.json', 'distribution-files.json', 'src', 'scripts', 'standards', 'recipes', 'adapters', 'methods', 'templates']) cpSync(resolve(root, name), resolve(dir, name), { recursive: true });
  for (const path of ['templates/examples/nextjs-supabase/.env.local', 'templates/webapp/.env.test', 'adapters/claude/secret.pem', 'methods/blueprint-printer/unapproved.md']) {
    writeFileSync(resolve(dir, path), 'SYNTHETIC-NOT-A-CREDENTIAL');
    const result = node(['scripts/build.mjs'], dir);
    assert.notEqual(result.status, 0, path);
    assert.match(result.stderr, /Unapproved distribution source/);
    assert.doesNotMatch(result.stderr, /SYNTHETIC-NOT-A-CREDENTIAL/);
    const pack = spawnSync('npm', ['pack', '--dry-run', '--json'], { cwd: dir, encoding: 'utf8', env: { ...process.env, npm_config_offline: 'true' } });
    assert.notEqual(pack.status, 0, 'normal pack must fail its prepack gate');
    rmSync(resolve(dir, path));
  }
  // A broadening of the reviewed list must still not admit private file classes.
  const privatePath = 'templates/webapp/.env.test';
  writeFileSync(resolve(dir, privatePath), 'SYNTHETIC');
  const list = JSON.parse(readFileSync(resolve(dir, 'distribution-files.json')));
  writeFileSync(resolve(dir, 'distribution-files.json'), JSON.stringify([...list, privatePath]));
  assert.match(node(['scripts/build.mjs'], dir).stderr, /Private distribution source/);
});

test('both verifier modes reject invalid config before dispatch and require test reports', t => {
  const dir = temporary(t); init(dir);
  const bin = resolve(dir, 'bin'); mkdirSync(bin);
  const log = resolve(dir, 'commands.log');
  const runner = resolve(bin, 'pnpm');
  writeFileSync(runner, `#!${process.execPath}\nimport { appendFileSync } from 'node:fs';\nappendFileSync(process.env.CC_PROBE_LOG, process.argv.slice(2).join(' ') + '\\n');\n`);
  writeFileSync(resolve(bin, 'package.json'), '{"type":"module"}'); chmodSync(runner, 0o755);
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, CC_PROBE_LOG: log };
  const pkg = { scripts: Object.fromEntries(['lint', 'typecheck', 'test', 'build', 'test:security', 'test:e2e'].map(name => [name, 'fixture'])) };
  writeFileSync(resolve(dir, 'package.json'), JSON.stringify(pkg));
  for (const config of [{}, [], { ...defaults(), database: 'supbase' }, { ...defaults(), database: undefined }, { ...defaults(), schemaVersion: 2 }]) {
    writeFileSync(resolve(dir, '.cclauncher.json'), JSON.stringify(config));
    for (const mode of ['all', 'security']) {
      assert.notEqual(node(['scripts/verify.mjs', mode], dir, env).status, 0);
      assert.ok(!readdirSync(dir).includes('commands.log'));
    }
  }
  writeFileSync(resolve(dir, '.cclauncher.json'), JSON.stringify(defaults()));
  for (const mode of ['all', 'security']) {
    assert.notEqual(node(['scripts/verify.mjs', mode], dir, env).status, 0, 'exit zero without a report is not verification');
  }
  writeFileSync(resolve(dir, '.cclauncher.json'), JSON.stringify({ ...defaults(), database: 'supabase' }));
  rmSync(log);
  assert.notEqual(node(['scripts/verify.mjs', 'security'], dir, env).status, 0);
  assert.ok(!readdirSync(dir).includes('commands.log'));
  mkdirSync(resolve(dir, 'supabase/tests/database'), { recursive: true });
  writeFileSync(resolve(dir, 'supabase/tests/database/fixture.sql'), '-- Dispatch fixture, not an RLS test.');
  writeFileSync(runner, `#!${process.execPath}\nimport { appendFileSync, writeFileSync } from 'node:fs';\nappendFileSync(process.env.CC_PROBE_LOG, process.argv.slice(2).join(' ') + '\\n');\nif (process.env.CCLAUNCHER_TEST_REPORT) writeFileSync(process.env.CCLAUNCHER_TEST_REPORT, JSON.stringify({schemaVersion:1,states:['passed'],success:true}));\nif (process.argv.includes('db')) process.exit(7);\n`);
  assert.notEqual(node(['scripts/verify.mjs', 'security'], dir, env).status, 0);
  assert.match(readFileSync(log, 'utf8'), /exec supabase test db/);
  assert.equal(readFileSync(resolve(dir, 'scripts/config.mjs'), 'utf8'), readFileSync(resolve(root, 'src/cli/config.js'), 'utf8'));
});

test('init rolls back files after open and partial writes without deleting existing files', t => {
  for (const failAt of [0, 1, 3]) {
    const dir = temporary(t);
    const target = resolve(dir, 'target'); mkdirSync(target);
    writeFileSync(resolve(target, 'keep.txt'), 'existing');
    const script = resolve(dir, 'fault.mjs');
    writeFileSync(script, `import fs from 'node:fs';\nimport { syncBuiltinESMExports } from 'node:module';\nconst original = fs.writeFileSync;\nlet writes = 0;\nfs.writeFileSync = (file, data, ...args) => { if (typeof file === 'number' && writes++ === ${failAt}) { original(file, data.slice(0, 5), ...args); throw Object.assign(new Error('synthetic ENOSPC'), {code:'ENOSPC'}); } return original(file, data, ...args); };\nsyncBuiltinESMExports();\nconst { initialize } = await import(${JSON.stringify(new URL('../src/cli/init.js', import.meta.url).href)});\ntry { initialize(${JSON.stringify(resolve(root, 'dist'))}, JSON.parse(fs.readFileSync(${JSON.stringify(resolve(root, 'dist/manifest.json'))})), ${JSON.stringify(target)}, ${JSON.stringify(defaults())}); } catch { process.exitCode = 1; }\n`);
    assert.equal(node([script], dir).status, 1);
    assert.deepEqual(readdirSync(target), ['keep.txt']);
    assert.equal(readFileSync(resolve(target, 'keep.txt'), 'utf8'), 'existing');
    init(target);
  }
});
