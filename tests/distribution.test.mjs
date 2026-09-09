import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json')));
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, {
  cwd, encoding: 'utf8', env: { ...process.env, npm_config_offline: 'true', npm_config_audit: 'false', npm_config_fund: 'false' }
});
test('built CLI works outside repository and rejects unsupported commands', () => {
  const cli = resolve(root, 'dist/cli/index.js');
  assert.equal(run(process.execPath, [cli, '--version'], tmpdir()).trim(), pkg.version);
  assert.match(run(process.execPath, [cli, '--help']), /Phase 3/);
  assert.equal(spawnSync(process.execPath, [cli, 'init']).status, 1);
  assert.equal(spawnSync(process.execPath, [cli, '--version', 'extra']).status, 1);
});
test('build is deterministic and manifest matches packaged CLI', () => {
  const before = readFileSync(resolve(root, 'dist/manifest.json'), 'utf8');
  run(process.execPath, ['scripts/build.mjs']);
  assert.equal(readFileSync(resolve(root, 'dist/manifest.json'), 'utf8'), before);
  const manifest = JSON.parse(before);
  assert.equal(manifest.packageVersion, pkg.version);
  assert.equal(manifest.files['cli/index.js'], createHash('sha256').update(readFileSync(resolve(root, 'dist/cli/index.js'))).digest('hex'));
});
test('real tarball installs offline, locks integrity, and runs without source or install scripts', () => {
  const temp = mkdtempSync(resolve(tmpdir(), 'cclauncher-'));
  try {
    const [pack] = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temp]));
    assert.deepEqual(pack.files.map(f => f.path).sort(), ['README.md', 'dist/cli/index.js', 'dist/manifest.json', 'package.json']);
    const archive = resolve(temp, pack.filename);
    writeFileSync(resolve(temp, 'package.json'), JSON.stringify({ name: 'consumer', private: true }));
    run('pnpm', ['add', '--offline', '--save-dev', '--save-exact', '--ignore-scripts', archive], temp);
    const lock = readFileSync(resolve(temp, 'pnpm-lock.yaml'), 'utf8');
    assert.match(lock, /integrity: sha512-/);
    run('pnpm', ['install', '--offline', '--frozen-lockfile', '--ignore-scripts'], temp);
    assert.equal(run('pnpm', ['exec', 'cclauncher', '--version'], temp).trim(), pkg.version);
    const installed = JSON.parse(readFileSync(resolve(temp, 'node_modules', pkg.name, 'package.json')));
    assert.equal(installed.version, pkg.version);
    for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(installed.scripts[hook], undefined);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
